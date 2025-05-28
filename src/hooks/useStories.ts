
import { useState } from 'react';
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

export const useStories = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const getCharacterStory = async (characterId: string): Promise<Story | null> => {
    console.log('🔍 Buscando história para personagem:', characterId);
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('generated_stories')
        .select('*')
        .eq('character_id', characterId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No story found - this is expected and not an error
          console.log('📖 Nenhuma história encontrada para este personagem (normal)');
          return null;
        }
        console.error('❌ Erro ao buscar história:', error);
        throw error;
      }

      // Converter os capítulos do formato de colunas para array
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
      ].filter(chapter => chapter); // Remove capítulos vazios

      const story: Story = {
        id: data.id,
        title: data.title,
        character_id: data.character_id,
        user_id: data.user_id,
        chapters: chapters,
        created_at: data.created_at,
      };

      console.log('✅ História encontrada:', story.title, `(${chapters.length} capítulos)`);
      return story;
    } catch (error) {
      console.error('❌ Erro ao buscar história:', error);
      // Não exibir toast de erro se for apenas que não encontrou história
      if (error.code !== 'PGRST116') {
        toast({
          title: "⚠️ Aviso",
          description: "Não foi possível carregar a história, mas o personagem foi criado com sucesso!",
          className: "text-black",
        });
      }
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const getUserStories = async (): Promise<Story[]> => {
    console.log('📚 Buscando todas as histórias do usuário');
    setIsLoading(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('generated_stories')
        .select('*')
        .eq('user_id', user?.id || null)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      // Converter cada história para o formato esperado
      const stories: Story[] = data.map(story => ({
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
        ].filter(chapter => chapter), // Remove capítulos vazios
        created_at: story.created_at,
      }));

      console.log('✅ Histórias carregadas:', stories.length);
      return stories;
    } catch (error) {
      console.error('❌ Erro ao buscar histórias:', error);
      toast({
        title: "❌ Erro ao carregar histórias",
        description: "Não foi possível carregar suas histórias.",
        className: "text-black",
      });
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  return {
    getCharacterStory,
    getUserStories,
    isLoading,
  };
};
