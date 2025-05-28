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

type GenerateChaptersResult = {
  chapters: string[];
  illustrations: string[];
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

  const generateStory = useMutation<GenerateChaptersResult, Error, GenerateChaptersInput>(
    async ({ characterId, storyTitle }) => {
      setIsLoading(true);
      try {
        const { data: charData, error: charError } = await supabase.from('characters').select('nome, idade, sexo, corPele, corCabelo, corOlhos').eq('id', characterId).single();
        if (charError || !charData) {
          throw new Error(charError?.message || 'Personagem não encontrado');
        }
        console.log("useStories charData:", JSON.stringify(charData)); // <-- ADDED THIS LINE
        const res = await fetch(`${import.meta.env.VITE_SUPABASE_FUNCTIONS_URL}/generate-story-chapters`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', apikey: import.meta.env.VITE_SUPABASE_ANON_KEY, Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
          body: JSON.stringify({ storyTitle, characterId, character: charData })
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.details || `Erro ${res.status}`);
        }
        return (await res.json()) as GenerateChaptersResult;
      } finally {
        setIsLoading(false);
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
