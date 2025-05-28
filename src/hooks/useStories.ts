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

  /** Busca uma história existente para um personagem */
  const getCharacterStory = async (characterId: string): Promise<Story | null> => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('generated_stories')
        .select('*')
        .eq('character_id', characterId)
        .single();

      if (error) {
        // Nenhuma história encontrada
        if (error.code === 'PGRST116') return null;
        throw error;
      }

      const chapters = [
        data.chapter_1, data.chapter_2, data.chapter_3, data.chapter_4, data.chapter_5,
        data.chapter_6, data.chapter_7, data.chapter_8, data.chapter_9, data.chapter_10,
      ].filter(Boolean);

      return {
        id: data.id,
        title: data.title,
        character_id: data.character_id,
        user_id: data.user_id,
        chapters,
        created_at: data.created_at,
      };
    } catch (err: any) {
      console.error('Erro ao buscar história:', err);
      toast({
        title: '⚠️ Aviso',
        description: 'Não foi possível carregar a história.',
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  /** Busca todas as histórias do usuário autenticado */
  const getUserStories = async (): Promise<Story[]> => {
    setIsLoading(true);
    try {
      const {
        data: { user }
      } = await supabase.auth.getUser();

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
          story.chapter_1, story.chapter_2, story.chapter_3, story.chapter_4, story.chapter_5,
          story.chapter_6, story.chapter_7, story.chapter_8, story.chapter_9, story.chapter_10,
        ].filter(Boolean),
        created_at: story.created_at,
      }));
    } catch (err: any) {
      console.error('Erro ao buscar todas as histórias:', err);
      toast({
        title: '❌ Erro',
        description: 'Não foi possível carregar suas histórias.',
      });
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  /** Gera capítulos + ilustrações chamando a Edge Function */
  const generateStory = useMutation<GenerateChaptersResult, Error, GenerateChaptersInput>(
    async ({ characterId, storyTitle }) => {
      setIsLoading(true);
      try {
        // 1️⃣ Busca a URL de referência do personagem
        const { data: charData, error: charError } = await supabase
          .from('characters')
          .select('image_url')
          .eq('id', characterId)
          .single();
        if (charError || !charData) {
          throw new Error(charError?.message || 'Personagem não encontrado');
        }

        // 2️⃣ Invoca a Edge Function com corpo como objeto — auto-serializado
        const { data, error: fnError } = await supabase.functions.invoke(
          'generate-story-chapters',
          {
            body: {
              storyTitle,
              characterId,
              characterImageUrl: charData.image_url,
            }
          }
        );
        if (fnError) {
          throw fnError;
        }

        // 3️⃣ Retorna os capítulos e as URLs das ilustrações
        return data as GenerateChaptersResult;
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
