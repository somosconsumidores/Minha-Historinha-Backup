// src/components/StoryWithIllustrations.tsx

import React, { useState, useEffect, useCallback } from 'react'; // Ensured useCallback is imported
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
// import { useStories } from '@/hooks/useStories'; // Original useStories hook call remains commented out
import { Character } from '@/types/Character';
import { useQueryClient } from '@tanstack/react-query'; // Import useQueryClient, useMutation removed if not used

interface StoryWithIllustrationsProps {
  characterId: string;
  storyTitle: string;
}

type CharacterDetails = Character & {
  image_url: string;
  cor_pele?: string;
  cor_cabelo?: string;
  cor_olhos?: string;
  estilo_cabelo?: string;
};

export const StoryWithIllustrations: React.FC<StoryWithIllustrationsProps> = ({
  characterId,
  storyTitle,
}) => {
  const { toast } = useToast();
  // const { generateStory } = useStories(); // Original hook still commented out

  /* Minimal Test Mutation - Commented Out for this step
  const minimalTestMutation = useMutation<any, Error, { testInput: string }>( ... );
  */

  // console.log("StoryWithIllustrations: minimalTestMutation object:", minimalTestMutation); // Commented out
  // console.log("StoryWithIllustrations: Type of minimalTestMutation.mutateAsync:", typeof minimalTestMutation?.mutateAsync); // Commented out

  const queryClientFromHook = useQueryClient();
  console.log("StoryWithIllustrations: queryClient from useQueryClient():", queryClientFromHook);

  const [chapters, setChapters] = useState<string[]>([]); // Kept for UI structure
  const [chapterIllustrations, setChapterIllustrations] = useState<Record<number, string>>({}); // Kept for UI structure
  const [storyId, setStoryId] = useState<string | null>(null); // Kept for UI structure
  const [characterDetails, setCharacterDetails] = useState<CharacterDetails | null>(null);
  const [isLoadingCharacter, setIsLoadingCharacter] = useState(false);
  const [isLoadingStory, setIsLoadingStory] = useState(false); // Will be set by button click only
  const [isLoadingIllustrations, setIsLoadingIllustrations] = useState(false);

  useEffect(() => {
    if (!characterId) {
      setCharacterDetails(null);
      return;
    }
    const fetchCharacterDetails = async () => {
      setIsLoadingCharacter(true);
      console.log(`Fetching character details for ID: ${characterId}`);
      try {
        const { data, error } = await supabase
          .from('characters')
          .select('id, nome, image_url, idade, sexo, cor_pele, cor_cabelo, cor_olhos, estilo_cabelo')
          .eq('id', characterId)
          .single();
        if (error) throw error;
        if (data) {
          console.log('Character details fetched:', data);
          setCharacterDetails(data as CharacterDetails);
        } else {
          console.warn('No character data found for ID:', characterId);
          setCharacterDetails(null);
          toast({ title: 'Aviso', description: 'Detalhes do personagem não encontrados.' });
        }
      } catch (err: any) {
        console.error('Exception in fetchCharacterDetails:', err);
        toast({ title: 'Erro Detalhes Personagem', description: err.message || 'Não foi possível carregar os detalhes do personagem.' });
        setCharacterDetails(null);
      } finally {
        setIsLoadingCharacter(false);
      }
    };
    fetchCharacterDetails();
  }, [characterId, toast]);

  // This function remains but won't be called by the primary button in this test version
  const handleGenerateAllChapterIllustrations = useCallback(async (
    storyIdParam: string,
    chaptersParam: string[],
    charDetailsParam: CharacterDetails | null
  ) => {
    // ... (implementation as before, for brevity not repeating full logic here) ...
    // This function will not be actively used in the current test configuration
    // but keeping its structure for when we revert.
    console.log('handleGenerateAllChapterIllustrations would run if called.');
  }, [chapterIllustrations, toast]); // Adjusted dependencies

  const handleGenerateStory = async () => {
    console.log("handleGenerateStory called (minimalTestMutation logic commented out for this test).");
    toast({title: "Test Button Clicked", description: "Mutation call is currently commented out for this test."});
    setIsLoadingStory(true); // Simulate doing something
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate work
    setIsLoadingStory(false);
  };

  const mainButtonDisabled = isLoadingCharacter || !characterDetails;
  let buttonText = 'Test QueryClient Context'; // Button text for this specific test
  if (isLoadingCharacter) buttonText = '🔍 Carregando Personagem...';
  else if (isLoadingStory) buttonText = '🧪 Testando...'; // Text for when button is clicked in this test

  return (
    // JSX structure remains largely the same, but won't display chapters/illustrations from this test
    <div className="p-4">
      <button onClick={handleGenerateStory} disabled={mainButtonDisabled} className="px-4 py-2 bg-green-500 text-white rounded disabled:opacity-50 mb-4">
        {buttonText}
      </button>

      {isLoadingCharacter && <p className="text-center my-4">Carregando detalhes do personagem...</p>}
      {!isLoadingCharacter && !characterDetails && characterId && <p className="text-center my-4 text-red-500">Não foi possível carregar os detalhes do personagem.</p>}

      {characterDetails && !isLoadingCharacter && (
        <div className="mb-4 p-4 border rounded-lg bg-slate-50">
          <h3 className="text-xl font-semibold">{characterDetails.nome}</h3>
          {characterDetails.image_url && <img src={characterDetails.image_url} alt={characterDetails.nome} className="w-32 h-32 rounded-md my-2 object-cover" />}
        </div>
      )}

      {(isLoadingStory || isLoadingIllustrations) && chapters.length > 0 && <p className="text-center my-4 font-semibold">Processando...</p>}

      {/* Chapter display section will remain empty as chapters state won't be populated by this test */}
      {chapters.length > 0 && (
        <div className="mt-6 space-y-8">
          <h2 className="text-2xl font-bold text-center mb-4">{storyTitle} (ID: {storyId})</h2>
          {chapters.map((text, idx) => (
            <div key={idx} className="border rounded-lg p-4 shadow-lg bg-white">
              <h4 className="text-lg font-semibold mb-2 font-fredoka">Capítulo {idx + 1}</h4>
              {/* Illustration placeholders will show 'Aguardando ilustração' */}
              <div className="w-full h-64 bg-gray-200 rounded-md flex items-center justify-center my-2"><p className="text-gray-500">Aguardando ilustração para capítulo {idx + 1}</p></div>
              <p className="mt-2 text-lg font-comic text-gray-700 leading-relaxed">{text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};