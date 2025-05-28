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

  /** Gera capítulos + ilustrações chamando a Edge Function */
  const generateStory = useMutation<GenerateChaptersResult, Error, GenerateChaptersInput>(
    async ({ characterId, storyTitle }) => {
      setIsLoading(true);
      try {
        // 1️⃣ busca URL da imagem de referência
        const { data: charData, error: charError } = await supabase
          .from('characters')
          .select('image_url')
          .eq('id', characterId)
          .single();
        if (charError || !charData) {
          throw new Error(charError?.message || 'Personagem não encontrado');
        }

        // 2️⃣ invoca a Edge Function corretamente
        const { data, error: fnError } = await supabase.functions.invoke(
          'generate-story-chapters',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              storyTitle,
              characterId,
              characterImageUrl: charData.image_url,
            }),
          }
        );
        if (fnError) throw fnError;

        // 3️⃣ retorna o payload
        return data as GenerateChaptersResult;
      } finally {
        setIsLoading(false);
      }
    }
  );

  return {
    generateStory,
    isLoading,
  };
};
