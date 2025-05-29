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

// Input type for the generateStory mutation
type GenerateChaptersInput = {
  characterId: string;
  storyTitle: string;
};

// Result type expected by StoryWithIllustrations.tsx from this hook's mutation
// This should match what generate-story-chapters edge function effectively returns
// (chapters and storyId are key)
type GenerateStoryHookResult = {
  chapters: string[];
  storyId: string;
  message?: string; // Optional message from the edge function
};

export const useStories = () => {
  // General loading state for this hook, can be used by other components
  // StoryWithIllustrations.tsx has its own more granular loading states now.
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
      // setIsLoading(true); // useMutation handles its own loading state via result.isLoading
      try {
        // This part fetches character details again. 
        // StoryWithIllustrations.tsx also fetches character details.
        // Consider if this duplication is necessary or if character details can be passed to this mutateAsync function.
        // For now, keeping it as it was, but be mindful of potential redundant fetches.
        const { data: charData, error: charError } = await supabase
          .from('characters')
          .select('nome, idade, sexo, corPele, corCabelo, corOlhos') // Ensure this select is sufficient for the edge function
          .eq('id', characterId)
          .single();
        
        if (charError || !charData) {
          throw new Error(charError?.message || 'Personagem não encontrado em useStories.');
        }

        // The console.log for charData can be removed if not needed for debugging this hook specifically
        // console.log("useStories charData:", JSON.stringify(charData)); 

        const res = await fetch(`${import.meta.env.VITE_SUPABASE_FUNCTIONS_URL}/generate-story-chapters`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            // Pass the user's auth token for RLS in the edge function if needed for user-specific logic beyond just identifying the user
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY, // Usually for public client-side calls
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
          message: responseData.message // include if present and needed
        };

      } catch (error: any) {
        // Re-throw the error so that react-query can handle it (e.g. onError callback in useMutation)
        throw error;
      }
      // finally {
      //   setIsLoading(false); // useMutation handles its own loading state
      // }
    }
  );

  return {
    getCharacterStory,
    getUserStories,
    generateStory, // This now correctly aligns with the expected return type
    isLoading, // This is the hook's own general isLoading state, separate from mutation's loading state
  };
};