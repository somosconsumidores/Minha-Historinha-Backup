// src/hooks/useStories.ts
import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client'; // Although not used by simplified function, keep for other functions
import { useToast } from '@/hooks/use-toast';

export interface Story { // Keep if getCharacterStory/getUserStories are used elsewhere
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
  const queryClient = useQueryClient(); 
  const [isLoading, setIsLoading] = useState(false); 
  const { toast } = useToast();

  // getCharacterStory and getUserStories functions (assuming they are unchanged and correct)
  // For brevity, I'm omitting them here but they should be present in your actual file if needed.
  // Make sure they are wrapped in useCallback if you use them.
  const getCharacterStory = useCallback(async (characterId: string): Promise<Story | null> => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.from('generated_stories').select('*').eq('character_id', characterId).single();
      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }
      const chapters = Array.from({ length: 10 }, (_, i) => data[`chapter_${i + 1}`]).filter(Boolean) as string[];
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
      if(authError || !user) {
        console.warn('getUserStories: User not authenticated.');
        return []; 
      }
      const { data, error } = await supabase.from('generated_stories').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      if (error) throw error;
      return data.map((s: any) => ({ id: s.id, title: s.title, character_id: s.character_id, user_id: s.user_id, chapters: Array.from({ length: 10 }, (_, i) => s[`chapter_${i + 1}`]).filter(Boolean) as string[], created_at: s.created_at }));
    } catch (err: any) {
      console.error('Erro ao buscar todas as histórias:', err);
      toast({ title: '❌ Erro', description: 'Não foi possível carregar suas histórias.' });
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [toast]);
  // End of getCharacterStory and getUserStories

  const generateStory = useMutation<GenerateStoryHookResult, Error, GenerateChaptersInput>(
    async ({ characterId, storyTitle }: GenerateChaptersInput) => {
      console.log('(Ultra-Simplified with options) Mock mutationFn in useStories called with:', { characterId, storyTitle });
      await new Promise(resolve => setTimeout(resolve, 100)); 
      return {
        chapters: [`Mock Chapter 1 for ${storyTitle} (options test)`],
        storyId: `mock-id-for-${characterId}-(options-test)`,
        message: "Mock story from ultra-simplified function (with options)!"
      };
    },
    { // Options object IS present
      onError: (error: Error) => {
        toast({
          title: '❌ Erro (Ultra-Simplified with options)',
          description: error.message || 'Falha na mutação mock.',
          variant: 'destructive',
        });
      },
      onSuccess: (data) => { 
        console.log('Ultra-Simplified mutationFn (with options) onSuccess:', data);
        toast({
          title: '✅ Mock (com opções) Gerada!',
          description: data.message || 'Dados mock retornados com sucesso.',
        });
        // queryClient.invalidateQueries({ queryKey: ['userStories'] });
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