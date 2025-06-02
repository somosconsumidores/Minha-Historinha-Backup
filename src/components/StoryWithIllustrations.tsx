// src/components/StoryWithIllustrations.tsx
import React, { useState, useEffect, useCallback } from 'react'; // Added useCallback
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
// import { useStories } from '@/hooks/useStories'; // Commented out for this test
import { useSimpleMutationTest } from '@/hooks/useSimpleMutationTest'; // Using the new simple test hook
import { Character } from '@/types/Character';
import { useQueryClient } from '@tanstack/react-query'; // Keep useQueryClient

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
  const { simpleTestMutation } = useSimpleMutationTest(); // Using the new simple test hook

  console.log("StoryWithIllustrations: simpleTestMutation object:", simpleTestMutation);
  console.log("StoryWithIllustrations: Type of simpleTestMutation.mutateAsync:", typeof simpleTestMutation?.mutateAsync);

  const queryClientFromHook = useQueryClient();
  console.log("StoryWithIllustrations: queryClient from useQueryClient():", queryClientFromHook);

  const [chapters, setChapters] = useState<string[]>([]);
  const [chapterIllustrations, setChapterIllustrations] = useState<Record<number, string>>({});
  const [storyId, setStoryId] = useState<string | null>(null);
  const [characterDetails, setCharacterDetails] = useState<CharacterDetails | null>(null);
  const [isLoadingCharacter, setIsLoadingCharacter] = useState(false);
  // isLoadingStory will now be driven by simpleTestMutation.isPending
  // const [isLoadingStory, setIsLoadingStory] = useState(false);
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

  // This function will not be actively called by the main button in this test version
  const handleGenerateAllChapterIllustrations = useCallback(async (
    storyIdParam: string,
    chaptersParam: string[],
    charDetailsParam: CharacterDetails | null
  ) => {
    console.log('handleGenerateAllChapterIllustrations called with:', { storyIdParam, chaptersParam, charDetailsParam });
    // ... (Full implementation can remain for when we switch back) ...
  }, [toast]); // Removed chapterIllustrations from deps for this test as it's not directly used by this stub

  const handleTestMutation = async () => {
    console.log("handleTestMutation called. CharacterDetails:", characterDetails);
    if (!characterDetails) {
      toast({ title: 'Aguarde', description: 'Detalhes do personagem ainda carregando.' });
      return;
    }

    try {
      console.log("Inside handleTestMutation, typeof simpleTestMutation?.mutateAsync:", typeof simpleTestMutation?.mutateAsync);
      if (simpleTestMutation && typeof simpleTestMutation.mutateAsync === 'function') {
        await simpleTestMutation.mutateAsync({ testInput: "Test from StoryWithIllustrations" });
        // onSuccess is handled within the useSimpleMutationTest hook
      } else {
        console.error("simpleTestMutation.mutateAsync is not a function or simpleTestMutation is undefined.");
        toast({title: "Debug Error", description: "simpleTestMutation.mutateAsync not available.", variant: "destructive"});
      }
    } catch (err: any) {
      console.error('Error calling simpleTestMutation from handleTestMutation:', err);
      // onError is handled within the useSimpleMutationTest hook
    }
  };

  const mainButtonDisabled = isLoadingCharacter || simpleTestMutation.isPending || !characterDetails;
  let buttonText = '✨ Testar Mutação Simples (Hook)';
  if (isLoadingCharacter) buttonText = '🔍 Carregando Personagem...';
  else if (simpleTestMutation.isPending) buttonText = '🧪 Testando Mutação...';

  return (
    <div className="p-4">
      <button onClick={handleTestMutation} disabled={mainButtonDisabled} className="px-4 py-2 bg-green-600 text-white rounded disabled:opacity-50 mb-4">
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

      {/* Display mutation status for the test mutation */}
      {simpleTestMutation.isError && <p className="text-red-500 text-center">Simple Test Mutation Error: {simpleTestMutation.error?.message}</p>}
      {simpleTestMutation.isSuccess && <p className="text-green-500 text-center">Simple Test Mutation Success: {JSON.stringify(simpleTestMutation.data)}</p>}

      {/* Chapter display logic remains but won't be populated by this test button */}
      {chapters.length > 0 && (
        <div className="mt-6 space-y-8">
          <h2 className="text-2xl font-bold text-center mb-4">{storyTitle} (ID: {storyId})</h2>
          {chapters.map((text, idx) => (
            <div key={idx} className="border rounded-lg p-4 shadow-lg bg-white">
              <h4 className="text-lg font-semibold mb-2 font-fredoka">Capítulo {idx + 1}</h4>
              {chapterIllustrations[idx] ? (
                <img src={chapterIllustrations[idx]} alt={`Ilustração para o capítulo ${idx + 1}`} className="w-full h-auto rounded-md my-2 shadow" />
              ) : (isLoadingIllustrations) && !chapterIllustrations[idx] ? (
                 <div className="w-full h-64 bg-gray-200 rounded-md flex items-center justify-center my-2"><p className="text-gray-500">🎨 Ilustração sendo preparada...</p></div>
              ) : (
                 <div className="w-full h-64 bg-gray-200 rounded-md flex items-center justify-center my-2"><p className="text-gray-500">Aguardando ilustração para capítulo {idx + 1}</p></div>
              )}
              <p className="mt-2 text-lg font-comic text-gray-700 leading-relaxed">{text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};