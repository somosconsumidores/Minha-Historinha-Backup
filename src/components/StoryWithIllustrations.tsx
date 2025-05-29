// src/components/StoryWithIllustrations.tsx

import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useStories } from '@/hooks/useStories';
import { Character } from '@/types/Character'; // Assuming Character type includes snake_case fields

interface StoryWithIllustrationsProps {
  characterId: string;
  storyTitle: string;
}

type CharacterDetails = Character & { 
  image_url: string; 
  cor_pele?: string;
  cor_cabelo?: string;
  cor_olhos?: string;
  estilo_cabelo?: string; // Correct 'i'
};

export const StoryWithIllustrations: React.FC<StoryWithIllustrationsProps> = ({
  characterId,
  storyTitle,
}) => {
  const { toast } = useToast();
  const { generateStory } = useStories();

  const [chapters, setChapters] = useState<string[]>([]);
  const [chapterIllustrations, setChapterIllustrations] = useState<Record<number, string>>({});
  const [storyId, setStoryId] = useState<string | null>(null);
  const [characterDetails, setCharacterDetails] = useState<CharacterDetails | null>(null);
  const [isLoadingCharacter, setIsLoadingCharacter] = useState(false);
  const [isLoadingStory, setIsLoadingStory] = useState(false);
  const [isLoadingIllustrations, setIsLoadingIllustrations] = useState(false);

  useEffect(() => {
    if (!characterId) return;

    const fetchCharacterDetails = async () => {
      setIsLoadingCharacter(true);
      try {
        const { data, error } = await supabase
          .from('characters')
          .select('id, nome, image_url, idade, sexo, cor_pele, cor_cabelo, cor_olhos, estilo_cabelo') // Corrected: estilo_cabelo
          .eq('id', characterId)
          .single();

        if (error) throw error;
        if (data) {
          setCharacterDetails(data as CharacterDetails); 
        }
      } catch (err: any) {
        console.error('Erro ao buscar detalhes do personagem:', err);
        toast({ title: 'Erro Detalhes Personagem', description: 'Não foi possível carregar os detalhes do personagem.' });
        setCharacterDetails(null);
      } finally {
        setIsLoadingCharacter(false);
      }
    };

    fetchCharacterDetails();
  }, [characterId, toast]);

  const handleGenerateAllChapterIllustrations = async (
    storyIdParam: string, 
    chaptersParam: string[], 
    charDetailsParam: CharacterDetails
  ) => {
    if (!storyIdParam || !chaptersParam.length || !charDetailsParam) {
      console.error('Missing data for illustration generation:', { storyIdParam, chaptersParam, charDetailsParam });
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
    console.log("Constructed characterAppearance:", characterAppearance);

    try {
      for (let i = 0; i < chaptersParam.length; i++) {
        const chapterText = chaptersParam[i];
        const chapterIndex = i;

        if (chapterIllustrations[chapterIndex]) {
          console.log(`Ilustração para cap. ${chapterIndex} já existe. Pulando.`);
          continue;
        }
        
        console.log(`Gerando ilustração para cap. ${chapterIndex} da história ${storyIdParam}`);
        toast({ title: `🖼️ Ilustrando Cap. ${chapterIndex + 1}/${chaptersParam.length}` });

        const { data, error } = await supabase.functions.invoke('generate-chapter-illustration', {
          body: {
            chapterText,
            characterImageUrl: charDetailsParam.image_url,
            characterName: charDetailsParam.nome,
            characterAppearance,
            storyId: storyIdParam,
            chapterIndex,
          },
        });

        if (error) {
          console.error(`Falha ao gerar ilustração para cap. ${chapterIndex}:`, error);
          toast({ title: `❌ Erro Cap. ${chapterIndex + 1}`, description: error.message || "Tente novamente.", variant: 'destructive' });
        } else if (data && data.illustrationUrl) {
          setChapterIllustrations(prev => ({ ...prev, [chapterIndex]: data.illustrationUrl }));
          toast({ title: `✅ Ilustração Cap. ${chapterIndex + 1} Pronta!` });
        } else {
          console.error(`URL da ilustração não retornada para cap. ${chapterIndex}:`, data);
          toast({ title: `⚠️ Cap. ${chapterIndex + 1} Incompleto`, description: 'Não foi possível obter a URL.' });
        }
      }
    } catch (e: any) {
      console.error('Erro no loop de geração de ilustrações:', e);
      toast({ title: '💥 Erro Geral Ilustrações', description: e.message || "Ocorreu um problema.", variant: 'destructive' });
    } finally {
      setIsLoadingIllustrations(false);
      toast({ title: '✨ Ilustrações Finalizadas', description: 'Processo concluído.' });
    }
  };

  const handleGenerateStory = async () => {
    if (!characterDetails) {
      toast({ title: 'Aguarde', description: 'Detalhes do personagem ainda carregando.' });
      return;
    }
    setIsLoadingStory(true);
    setChapters([]);
    setChapterIllustrations({});
    setStoryId(null);

    try {
      const result = await generateStory.mutateAsync({
        characterId, 
        storyTitle,
      });
      
      if (result && result.chapters && result.storyId) {
        setChapters(result.chapters);
        setStoryId(result.storyId);
        toast({ title: '✅ História Gerada!', description: 'Iniciando geração de ilustrações...' });
        await handleGenerateAllChapterIllustrations(result.storyId, result.chapters, characterDetails); 
      } else {
        console.error('generateStory não retornou a estrutura esperada:', result);
        toast({ title: 'Erro Inesperado', description: 'Geração da história falhou em retornar dados válidos.' });
      }
    } catch (err: any) {
      console.error('Erro ao gerar história:', err);
      toast({ title: '❌ Erro ao Gerar História', description: err.message || "Falha ao gerar capítulos.", variant: 'destructive' });
    } finally {
      setIsLoadingStory(false);
    }
  };
  
  const mainButtonDisabled = isLoadingCharacter || isLoadingStory || isLoadingIllustrations || !characterDetails;
  let buttonText = '✨ Gerar História e Ilustrações';
  if (isLoadingCharacter) buttonText = '🔍 Carregando Personagem...';
  else if (isLoadingStory) buttonText = '📖 Gerando História...';
  else if (isLoadingIllustrations) buttonText = '🎨 Gerando Ilustrações...';
  else if (chapters.length > 0) buttonText = '🎉 Gerar Novamente?';

  return (
    <div className="p-4">
      <button onClick={handleGenerateStory} disabled={mainButtonDisabled} className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50 mb-4">
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

      {isLoadingIllustrations && chapters.length > 0 && <p className="text-center my-4 font-semibold">🎨 Gerando ilustrações para {chapters.length} capítulos, por favor aguarde...</p>}

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