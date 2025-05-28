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
        const { data: charData, error: charError } = await supabase
          .from('characters')
          .select('image_url')
          .eq
