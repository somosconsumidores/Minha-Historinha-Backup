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

  // Busca uma história existente para um personagem
  const getCharacterStory = async (characterId: string): Promise<Story | null> => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('generated_stories')
        .select('*')
        .eq('character_id', characterId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw error;
      }

      const chapters = [
        data.chapter_1,
        data.chapter_2,
        data.chapter_3,
        data.chapter_4,
        data.chapter_5,
        data.chapter_6,
        data.chapter_7,
        data.chapter_8,
        data.chapter_9,
        data.chapter_10,
      ].filter(Boolean);

      return {
        id: data.id,
        title: data.title,
        character_id: data.character_id,
        user_id: data.user_id,
        chapters,
        created_at: data.created_at,
      };
    } catch (error: any) {
      console.error('Erro ao buscar história:', error);
      toast({
        title: '⚠️ Aviso',
        description: 'Não foi possível carregar a história.',
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Busca todas as histórias do usuário autenticado
  const getUserStories = async (): Promise<Story[]> => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('generated_stories')
        .select('*')
        .eq('user_id', user?.id || '')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data.map((story) => ({
        id: story.id,
        title: story.title,
        character_id: story.character_id,
        user_id: story.user_id,
        chapters: [
          story.chapter_1,
          story.chapter_2,
          story.chapter_3,
          story.chapter_4,
          story.chapter_5,
          story.chapter_6,
          story.chapter_7,
          story.chapter_8,
          story.chapter_9,
          story.chapter_10,
        ].filter(Boolean),
        created_at: story.created_at,
      }));
    } catch (error: any) {
      console.error('Erro ao buscar todas as histórias:', error);
      toast({
        title: '❌ Erro',
        description: 'Não foi possível carregar suas histórias.',
      });
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  // Gera capítulos e ilustrações via Edge Function
  const generateStory = useMutation<GenerateChaptersResult, Error, GenerateChaptersInput>(
    async ({ characterId, storyTitle }) => {
      // Busca URL da imagem de referência do personagem
      const { data, error } = await supabase
        .from('characters')
        .select('image_url')
        .eq('id', characterId)
        .single();
      if (error || !data) throw new Error(error?.message || 'Personagem não encontrado');

      // Chama a Edge Function para gerar capítulos e ilustrações
      const res = await fetch('/supabase/functions/v1/generate-story-chapters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          characterId,
          storyTitle,
          characterImageUrl: data.image_url,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.details || 'Erro ao gerar história');
      }
      return res.json();
    }
  );

  return {
    getCharacterStory,
    getUserStories,
    generateStory,
    isLoading,
  };
};
