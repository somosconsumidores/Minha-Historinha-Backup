// src/hooks/useStories.ts
import { useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

// Input type for the generateStory mutation
type GenerateChaptersInput = {
  characterId: string;
  storyTitle: string;
};

// Result type expected
type GenerateStoryHookResult = {
  chapters: string[];
  storyId: string;
  message?: string;
};

export const useStories = () => {
  const { toast } = useToast(); // Assuming useToast itself is stable

  const generateStory = useMutation<GenerateStoryHookResult, Error, GenerateChaptersInput>(
    async ({ characterId, storyTitle }: GenerateChaptersInput) => {
      console.log('(Ultra-Simplified) Mock mutationFn in useStories called with:', { characterId, storyTitle });
      await new Promise(resolve => setTimeout(resolve, 100)); // Simulate minimal async work
      return {
        chapters: [`Mock Chapter 1 for ${storyTitle}`],
        storyId: `mock-id-${characterId}`,
        message: "Mock story from ultra-simplified function!"
      };
    },
    {
      onError: (error: Error) => {
        toast({
          title: 'Erro (Ultra-Simplified)',
          description: error.message || 'Falha na mutação mock.',
          variant: 'destructive',
        });
      },
      onSuccess: (data) => {
        console.log('Ultra-Simplified mutationFn onSuccess:', data);
        // toast({ title: 'Mock História Gerada!', description: data.message || 'Dados mock retornados.' });
      },
    }
  );

  return {
    generateStory,
    // Other functions (getCharacterStory, getUserStories) and isLoading state are removed for this test
  };
};