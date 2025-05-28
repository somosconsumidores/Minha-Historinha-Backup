// src/hooks/useStories.ts

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

type GenerateChaptersInput = { characterId: string; storyTitle: string; };
type GenerateChaptersResult = { chapters: string[]; illustrations: string[]; };

export const useStories = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const generateStory = useMutation<GenerateChaptersResult, Error, GenerateChaptersInput>(
    async ({ characterId, storyTitle }) => {
      setIsLoading(true);
      try {
        // Pega URL do personagem
        const { data: charData, error: charError } = await supabase
          .from('characters')
          .select('image_url')
          .eq('id', characterId)
          .single();
        if (charError || !charData) {
          throw new Error(charError?.message || 'Personagem não encontrado');
        }

        // --- fetch direto para a Edge Function ---
        const res = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/generate-story-chapters`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              // use anon key para autenticar
              'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
            },
            body: JSON.stringify({
              storyTitle,
              characterId,
              characterImageUrl: charData.image_url,
            }),
          }
        );

        if (!res.ok) {
          const err = await res.json().catch(() => null);
          throw new Error(err?.details || `Erro ${res.status}`);
        }

        return (await res.json()) as GenerateChaptersResult;
      } finally {
        setIsLoading(false);
      }
    }
  );

  return { generateStory, isLoading };
};
