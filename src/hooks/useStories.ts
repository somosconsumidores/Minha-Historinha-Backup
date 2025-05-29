// src/hooks/useStories.ts
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Story {
  id: string;
  title: string;
  character_id: string;
  user_id: string;
  chapters: string[];
  created_at: string;
}

type GenerateChaptersInput = {
  characterId: string;
  storyTitle: string;
};

type GenerateStoryHookResult = {
  chapters: string[];
  storyId: string;
  message?: string; 
};

export const useStories = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const getCharacterStory = async (characterId: string): Promise<Story | null> => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.from('generated_stories').select('*').eq('character_id', characterId).single();
      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }
      const chapters = [data.chapter_1, data.chapter_2, data.chapter_3, data.chapter_4, data.chapter_5, data.chapter_6, data.chapter_7, data.chapter_8, data.chapter_9, data.chapter_10].filter(Boolean);
      return { id: data.id, title: data.title, character_id: data.character_id, user_id: data.user_id, chapters, created_at: data.created_at };
    } catch (err: any) {
      console.error('Erro ao buscar história:', err);
      toast({ title: '⚠️ Aviso', description: 'Não foi possível carregar a história.' });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const getUserStories = async (): Promise<Story[]> => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase.from('generated_stories').select('*').eq('user_id', user?.id || '').order('created_at', { ascending: false });
      if (error) throw error;
      return data.map((s) => ({ id: s.id, title: s.title, character_id: s.character_id, user_id: s.user_id, chapters: [s.chapter_1, s.chapter_2, s.chapter_3, s.chapter_4, s.chapter_5, s.chapter_6, s.chapter_7, s.chapter_8, s.chapter_9, s.chapter_10].filter(Boolean), created_at: s.created_at }));
    } catch (err: any) {
      console.error('Erro ao buscar todas as histórias:', err);
      toast({ title: '❌ Erro', description: 'Não foi possível carregar suas histórias.' });
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const generateStory = useMutation<GenerateStoryHookResult, Error, GenerateChaptersInput>(
    async ({ characterId, storyTitle }) => {
      try {
        const { data: charData, error: charError } = await supabase
          .from('characters')
          .select('id, nome, idade, sexo, cor_pele, cor_cabelo, cor_olhos, estilo_cabelo') // Corrected to snake_case
          .eq('id', characterId)
          .single();

        if (charError || !charData) {
          throw new Error(charError?.message || 'Personagem não encontrado em useStories.');
        }

        // console.log("useStories charData (for generate-story-chapters):", JSON.stringify(charData)); 

        const sessionData = await supabase.auth.getSession();
        const accessToken = sessionData.data.session?.access_token;

        if (!accessToken) {
            toast({title: 'Erro de Autenticação', description: 'Sessão não encontrada, faça login novamente.', variant: 'destructive'});
            throw new Error("Usuário não autenticado. Não foi possível gerar a história.");
        }

        const res = await fetch(`${import.meta.env.VITE_SUPABASE_FUNCTIONS_URL}/generate-story-chapters`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({ storyTitle, characterId, character: charData })
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: 'Request failed with status ' + res.status }));
          throw new Error(err.details || err.error || `Erro ${res.status}`);
        }

        const responseData = await res.json();
        if (!responseData.chapters || !responseData.storyId) {
          console.error('Invalid response from generate-story-chapters:', responseData);
          throw new Error('Resposta inválida da função de gerar capítulos.');
        }

        return {
          chapters: responseData.chapters,
          storyId: responseData.storyId,
          message: responseData.message 
        };

      } catch (error: any) {
        toast({title: 'Erro ao Gerar História', description: error.message || 'Falha na comunicação com o servidor.', variant: 'destructive'});
        throw error;
      }
    }
  );

  return {
    getCharacterStory,
    getUserStories,
    generateStory,
    isLoading,
  };
};