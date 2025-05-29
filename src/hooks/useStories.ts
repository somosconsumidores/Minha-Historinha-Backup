// src/hooks/useStories.ts
import { useState, useCallback } from 'react'; // Added useCallback for completeness, though not strictly needed for useMutation's function if defined inline
import { useMutation, useQueryClient } from '@tanstack/react-query'; // Added useQueryClient if you plan to use it for cache invalidation
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Character } from '@/types/Character'; // Ensure this type uses snake_case

export interface Story {
  id: string;
  title: string;
  character_id: string;
  user_id: string;
  chapters: string[];
  created_at: string;
  // You might want to add illustration URLs here if fetching them together later
  // chapter_illustrations?: { chapter_index: number; image_url: string }[]; 
}

type GenerateChaptersInput = {
  characterId: string;
  storyTitle: string;
};

// Result type expected by StoryWithIllustrations.tsx from this hook's mutation
type GenerateStoryHookResult = {
  chapters: string[];
  storyId: string;
  message?: string; 
};

export const useStories = () => {
  const [isLoading, setIsLoading] = useState(false); // For getCharacterStory & getUserStories
  const { toast } = useToast();
  const queryClient = useQueryClient(); // For potential cache invalidation

  const getCharacterStory = useCallback(async (characterId: string): Promise<Story | null> => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('generated_stories')
        .select('*')
        .eq('character_id', characterId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // No story found, not necessarily an error
        console.error('Erro ao buscar história específica:', error);
        throw error;
      }

      const chapters = Array.from({ length: 10 }, (_, i) => data[`chapter_${i + 1}`]).filter(Boolean) as string[];
      
      return {
        id: data.id,
        title: data.title,
        character_id: data.character_id,
        user_id: data.user_id,
        chapters,
        created_at: data.created_at,
      };
    } catch (err: any) {
      console.error('Exceção em getCharacterStory:', err);
      toast({ title: '⚠️ Aviso', description: err.message || 'Não foi possível carregar a história.' });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const getUserStories = useCallback(async (): Promise<Story[]> => {
    setIsLoading(true);
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw authError || new Error('Usuário não autenticado.');
      }
      
      const { data, error } = await supabase
        .from('generated_stories')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data.map((s) => ({
        id: s.id,
        title: s.title,
        character_id: s.character_id,
        user_id: s.user_id,
        chapters: Array.from({ length: 10 }, (_, i) => s[`chapter_${i + 1}`]).filter(Boolean) as string[],
        created_at: s.created_at,
      }));
    } catch (err: any) {
      console.error('Erro ao buscar todas as histórias:', err);
      toast({ title: '❌ Erro', description: err.message || 'Não foi possível carregar suas histórias.' });
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const generateStory = useMutation<GenerateStoryHookResult, Error, GenerateChaptersInput>(
    async ({ characterId, storyTitle }) => {
      // Fetch character details (ensure snake_case as per your Character type)
      const { data: charData, error: charError } = await supabase
        .from('characters')
        .select('id, nome, idade, sexo, cor_pele, cor_cabelo, cor_olhos, estilo_cabelo, image_url') // Fetch all needed, including image_url
        .eq('id', characterId)
        .single();

      if (charError || !charData) {
        throw new Error(charError?.message || 'Personagem não encontrado em useStories.');
      }

      const sessionData = await supabase.auth.getSession();
      const accessToken = sessionData.data.session?.access_token;

      if (!accessToken) {
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
        const errText = await res.text();
        let errorDetails = errText;
        try {
          const errJson = JSON.parse(errText);
          errorDetails = errJson.details || errJson.error || errText;
        } catch (e) { /* Ignore parsing error, use raw text */ }
        throw new Error(`Erro ${res.status}: ${errorDetails}`);
      }

      const responseData = await res.json();
      if (!responseData.chapters || !responseData.storyId) {
        console.error('Invalid response from generate-story-chapters:', responseData);
        throw new Error('Resposta inválida da função de gerar capítulos. Faltando `chapters` ou `storyId`.');
      }

      return {
        chapters: responseData.chapters,
        storyId: responseData.storyId,
        message: responseData.message 
      };
    },
    {
      onError: (error: Error) => {
        toast({
          title: '❌ Erro ao Gerar História',
          description: error.message || 'Falha na comunicação com o servidor.',
          variant: 'destructive',
        });
      },
      onSuccess: () => {
        // Example: Invalidate queries that fetch stories so UI updates if needed
        // queryClient.invalidateQueries(['userStories']); 
        // queryClient.invalidateQueries(['characterStory', relevantCharacterId]);
      }
    }
  );

  return {
    getCharacterStory,
    getUserStories,
    generateStory,
    isLoading, // General loading for get* functions
    // component will use generateStory.isLoading, generateStory.isError, etc. for mutation state
  };
};