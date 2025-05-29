// src/hooks/useStories.ts
import { useState, useCallback } from 'react'; // Added useCallback
import { useMutation, useQueryClient } from '@tanstack/react-query'; // Added useQueryClient
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Character } from '@/types/Character'; // Ensure Character type is imported if needed by other functions

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
  const [isLoading, setIsLoading] = useState(false); // For getCharacterStory & getUserStories
  const { toast } = useToast();
  const queryClient = useQueryClient(); // Example for cache invalidation

  // getCharacterStory and getUserStories remain unchanged from your last provided version
  // For brevity, I'm not re-listing them here but assume they are present and correct.
  // Make sure they are wrapped in useCallback if they weren't already.
  const getCharacterStory = useCallback(async (characterId: string): Promise<Story | null> => {
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
  }, [toast]);

  const getUserStories = useCallback(async (): Promise<Story[]> => {
    setIsLoading(true);
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if(authError || !user) throw authError || new Error('User not authenticated.');

      const { data, error } = await supabase.from('generated_stories').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      if (error) throw error;
      return data.map((s) => ({ id: s.id, title: s.title, character_id: s.character_id, user_id: s.user_id, chapters: [s.chapter_1, s.chapter_2, s.chapter_3, s.chapter_4, s.chapter_5, s.chapter_6, s.chapter_7, s.chapter_8, s.chapter_9, s.chapter_10].filter(Boolean), created_at: s.created_at }));
    } catch (err: any) {
      console.error('Erro ao buscar todas as histórias:', err);
      toast({ title: '❌ Erro', description: 'Não foi possível carregar suas histórias.' });
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const generateStory = useMutation<GenerateStoryHookResult, Error, GenerateChaptersInput>(
    async ({ characterId, storyTitle }: GenerateChaptersInput) => {
      console.log('Simplified mutationFn in useStories called with:', { characterId, storyTitle });
      // Simulate async work
      await new Promise(resolve => setTimeout(resolve, 500));
      // Return mock data that matches GenerateStoryHookResult
      return {
        chapters: [`Test Chapter 1 for ${storyTitle}`, `Test Chapter 2 for ${storyTitle}`],
        storyId: `mock-story-id-for-${characterId}`,
        message: "Mock story generated successfully by simplified function!"
      };
    },
    {
      onError: (error: Error) => {
        toast({
          title: 'Erro ao Gerar História (Simplified)',
          description: error.message || 'Falha na comunicação com o servidor.',
          variant: 'destructive',
        });
      },
      onSuccess: (data) => {
        console.log('Simplified mutationFn onSuccess:', data);
        toast({
          title: 'História Mock Gerada!',
          description: data.message || 'Dados mock retornados com sucesso.',
        });
        // Example: queryClient.invalidateQueries(['userStories']);
      },
    }
  );

  return {
    getCharacterStory,
    getUserStories,
    generateStory,
    isLoading,
  };
};