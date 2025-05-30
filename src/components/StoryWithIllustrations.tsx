// src/components/StoryWithIllustrations.tsx
import React, { useState, useEffect, useCallback } from 'react'; // Added useCallback
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
// import { useStories } from '@/hooks/useStories'; // Commented out for testing
import { Character } from '@/types/Character';
import { useMutation, useQueryClient } from '@tanstack/react-query'; // Ensure useMutation and useQueryClient are imported

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
  // const { generateStory } = useStories(); // Commented out for testing

  const minimalTestMutation = useMutation<any, Error, { testInput: string }>(
    async (variables) => {
      console.log("Minimal test mutation CALLED with:", variables);
      await new Promise(resolve => setTimeout(resolve, 100));
      return { success: true, received: variables };
    },
    {
      onError: (error) => {
        console.error("Minimal test mutation ERROR:", error);
        toast({ title: 'Minimal Test Error', description: error.message, variant: 'destructive' });
      },
      onSuccess: (data) => {
        console.log("Minimal test mutation SUCCESS:", data);
        toast({ title: 'Minimal Test Success', description: `Received: ${data.received.testInput}` });
      }
    }
  );

  console.log("StoryWithIllustrations: minimalTestMutation object:", minimalTestMutation);
  console.log("StoryWithIllustrations: Type of minimalTestMutation.mutateAsync:", typeof minimalTestMutation?.mutateAsync);

  const queryClientFromHook = useQueryClient(); // New log for queryClientFromHook
  console.log("StoryWithIllustrations: queryClient from useQueryClient():", queryClientFromHook);

  const [chapters, setChapters] = useState<string[]>([]);
  const [chapterIllustrations, setChapterIllustrations] = useState<Record<number, string>>({});
  const [storyId, setStoryId] = useState<string | null>(null);
  const [characterDetails, setCharacterDetails] = useState<CharacterDetails | null>(null);
  const [isLoadingCharacter, setIsLoadingCharacter] = useState(false);
  const [isLoadingStory, setIsLoadingStory] = useState(false);
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

  const handleGenerateAllChapterIllustrations = useCallback(async (
    storyIdParam: string,
    chaptersParam: string[],
    charDetailsParam: CharacterDetails | null
  ) => {
    if (!storyIdParam || !chaptersParam.length || !charDetailsParam) {
      console.error('handleGenerateAllChapterIllustrations: Missing data.', { storyIdParam, chaptersLength: chaptersParam.length, charDetailsParam });
      toast({ title: 'Erro Interno', description: 'Dados insuficientes para gerar ilustrações.' });
      setIsLoadingIllustrations(false);
      return;
    }
    setIsLoadingIllustrations(true);
    toast({ title: '🎨 Iniciando Ilustrações', description: `Preparando ${chaptersParam.length} ilustrações.` });
    const appearanceParts = [];
    if (charDetailsParam.cor_pele) appearanceParts.push(`Pele ${charDetailsParam.cor_pele}`);
    if (charDetailsParam.cor_cabelo) appearanceParts.push(`cabelo ${charDetailsParam.cor_cabelo}`);
    if (charDetailsParam.estilo_cabelo) appearanceParts.push(charDetailsParam.estilo_cabelo);
    if (charDetailsParam.cor_olhos) appearanceParts.push(`olhos ${charDetailsParam.cor_olhos}`);
    if (charDetailsParam.sexo) appearanceParts.push(charDetailsParam.sexo);
    if (charDetailsParam.idade) appearanceParts.push(`${charDetailsParam.idade} anos`);
    const characterAppearance = appearanceParts.filter(Boolean).join(', ') || 'Aparência não especificada';
    try {
      for (let i = 0; i < chaptersParam.length; i++) {
        const chapterText = chaptersParam[i];
        const chapterIndex = i;
        if (chapterIllustrations[chapterIndex]) continue;
        const { data: illusData, error: illusError } = await supabase.functions.invoke('generate-chapter-illustration', {
          body: { chapterText, characterImageUrl: charDetailsParam.image_url, characterName: charDetailsParam.nome, characterAppearance, storyId: storyIdParam, chapterIndex },
        });
        if (illusError) {
          console.error(`Falha ao gerar ilustração para cap. ${chapterIndex}:`, illusError);
          toast({ title: `❌ Erro Cap. ${chapterIndex + 1}`, description: (illusError as Error).message || "Tente novamente.", variant: 'destructive' });
        } else if (illusData && illusData.illustrationUrl) {
          setChapterIllustrations(prev => ({ ...prev, [chapterIndex]: illusData.illustrationUrl }));
        }
      }
    } catch (e: any) {
      console.error('Erro no loop de geração de ilustrações:', e);
    } finally {
      setIsLoadingIllustrations(false);
      toast({ title: '✨ Ilustrações Finalizadas', description: 'Processo concluído.' });
    }
  }, [chapterIllustrations, toast]);

  const handleGenerateStory = async () => {
    console.log("handleGenerateStory called. CharacterDetails:", characterDetails);
    if (!characterDetails) {
      toast({ title: 'Aguarde', description: 'Detalhes do personagem ainda carregando ou não encontrados.' });
      return;
    }
    // setIsLoadingStory(true); // Using minimalTestMutation.isPending now

    try {
      console.log("Inside handleGenerateStory, trying minimalTestMutation. Type:", typeof minimalTestMutation?.mutateAsync);
      if (minimalTestMutation && typeof minimalTestMutation.mutateAsync === 'function') {
        const result = await minimalTestMutation.mutateAsync({ testInput: "hello from StoryWithIllustrations" });
        console.log("Result from minimalTestMutation.mutateAsync:", result);
        toast({title: "Minimal Test Triggered", description: "Check console for logs."});
      } else {
        console.error("minimalTestMutation.mutateAsync is not a function inside handleGenerateStory");
        toast({title: "Debug Error", description: "minimalTestMutation.mutateAsync is not a function here.", variant: "destructive"});
      }
    } catch (err: any) {
      console.error('Erro ao chamar minimalTestMutation (em handleGenerateStory):', err);
    } finally {
      // setIsLoadingStory(false); // Not using this specific state for minimalTestMutation's loading state
    }
  };

  const mainButtonDisabled = isLoadingCharacter || minimalTestMutation.isPending || !characterDetails;
  let buttonText = '✨ Testar Geração (Minimal)';
  if (isLoadingCharacter) buttonText = '🔍 Carregando Personagem...';
  else if (minimalTestMutation.isPending) buttonText = '🧪 Testando Mutação...';
  // else if (chapters.length > 0 && Object.keys(chapterIllustrations).length === chapters.length && chapters.length > 0) buttonText = '✅ Tudo Pronto!';
  // else if (chapters.length > 0) buttonText = '🎨 Gerar Ilustrações Pendentes';

  return (
    // JSX remains the same as the last full version I provided
    <div className="p-4">
      <button onClick={handleGenerateStory} disabled={mainButtonDisabled} className="px-4 py-2 bg-yellow-500 text-black rounded disabled:opacity-50 mb-4">
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
      {minimalTestMutation.isError && <p className="text-red-500 text-center">Minimal Test Mutation Error: {minimalTestMutation.error?.message}</p>}
      {/* Chapter display logic can remain but won't be populated by this test button */}
      {chapters.length > 0 && (
        <div className="mt-6 space-y-8">
          <h2 className="text-2xl font-bold text-center mb-4">{storyTitle} (ID: {storyId})</h2>
          {chapters.map((text, idx) => (
            <div key={idx} className="border rounded-lg p-4 shadow-lg bg-white">
              <h4 className="text-lg font-semibold mb-2 font-fredoka">Capítulo {idx + 1}</h4>
              {chapterIllustrations[idx] ? (
                <img src={chapterIllustrations[idx]} alt={`Ilustração para o capítulo ${idx + 1}`} className="w-full h-auto rounded-md my-2 shadow" />
              ) : (isLoadingIllustrations || isLoadingStory) && !chapterIllustrations[idx] ? (
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