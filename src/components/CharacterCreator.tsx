import { useState } from 'react';
import { Character } from '../types/Character';
import { quizSteps } from '../data/quizSteps';
import { QuizStep } from './QuizStep';
import { CharacterResult } from './CharacterResult';
import { StorySelectionStep } from './StorySelectionStep';
import { StoryWithIllustrations } from './StoryWithIllustrations';
import { useToast } from '@/hooks/use-toast';
import { useCharacters } from '@/hooks/useCharacters';
import { supabase } from '@/integrations/supabase/client';

type FlowStep = 'quiz' | 'result' | 'story-selection' | 'story-view';

export const CharacterCreator = () => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [flowStep, setFlowStep] = useState<FlowStep>('quiz');
  const [character, setCharacter] = useState<Character>({
    nome: '',
    idade: 0,
    sexo: 'Masculino',
    cor_pele: '',       // Corrected to snake_case
    cor_cabelo: '',     // Corrected to snake_case
    cor_olhos: '',      // Corrected to snake_case
    estilo_cabelo: ''   // Corrected to snake_case with 'i'
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string>('');
  const [savedCharacterId, setSavedCharacterId] = useState<string | null>(null);
  const [selectedStoryTitle, setSelectedStoryTitle] = useState<string>('');
  const { toast } = useToast();
  const { saveCharacter, updateCharacterImage } = useCharacters();

  const currentStep = quizSteps[currentStepIndex];

  const handleNext = async () => {
    console.log('🚀 Próximo step - Índice atual:', currentStepIndex, 'Total steps:', quizSteps.length);

    if (currentStepIndex < quizSteps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
      console.log('➡️ Avançando para step:', currentStepIndex + 1);
    } else {
      console.log('🎉 Quiz completo! Salvando personagem...');
      console.log('👤 Dados do personagem (antes de salvar):', JSON.stringify(character, null, 2)); 

      try {
        const characterId = await saveCharacter(character); 

        if (characterId) {
          setSavedCharacterId(characterId);
          setCharacter(prev => ({ ...prev, id: characterId }));
          console.log('✅ Personagem salvo com ID:', characterId);
          toast({ title: "🎉 Personagem criado!", description: `${character.nome} está pronto!` });
        } else {
          console.log('⚠️ Personagem criado mas sem ID retornado');
          toast({ title: "🎉 Personagem criado!", description: `${character.nome} está pronto!` });
        }
        setFlowStep('result');
      } catch (error) {
        console.error('❌ Erro ao salvar personagem:', error);
        toast({ title: "❌ Erro ao salvar", description: (error as Error).message || "Houve um problema ao salvar." });
      }
    }
  };

  const handlePrevious = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
      console.log('⬅️ Voltando para step:', currentStepIndex - 1);
    }
  };

  const handleValueChange = (value: string | number) => {
    const field = currentStep.field; 
    setCharacter(prev => ({
      ...prev,
      [field]: value
    }));
    console.log(`📝 Campo ${field} atualizado:`, value);
  };

  const handleRestart = () => {
    console.log('🔄 Reiniciando quiz...');
    setCurrentStepIndex(0);
    setFlowStep('quiz');
    setCharacter({
      nome: '',
      idade: 0,
      sexo: 'Masculino',
      cor_pele: '',
      cor_cabelo: '',
      cor_olhos: '',
      estilo_cabelo: ''
    });
    setIsGenerating(false);
    setGeneratedImageUrl('');
    setSavedCharacterId(null);
    setSelectedStoryTitle('');
  };

  const handleGenerateImage = async () => {
    setIsGenerating(true);
    toast({ title: "🎨 Gerando imagem...", description: "Criando seu personagem!" });
    
    console.log("Sending this character to generate-character-image:", JSON.stringify(character, null, 2));

    try {
      const { data, error } = await supabase.functions.invoke('generate-character-image', {
        body: { character } 
      });

      if (error) throw error;

      if (data.imageUrl) {
        setGeneratedImageUrl(data.imageUrl);
        if (savedCharacterId) {
          await updateCharacterImage(savedCharacterId, data.imageUrl);
        }
        toast({ title: "✨ Imagem gerada!", description: "Personagem pronto!" });
        console.log('Generated image URL:', data.imageUrl);
      } else {
        throw new Error("Image URL not returned from function");
      }
    } catch (error: any) {
      console.error('Error generating image:', error);
      toast({ title: "❌ Erro ao gerar imagem", description: error.message || "Tente novamente." });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCreateStory = () => {
    if (!savedCharacterId) {
        toast({title: "Aguarde!", description: "O personagem precisa ser salvo primeiro (geralmente acontece ao final do quiz)."});
        return;
    }
    if (!generatedImageUrl) {
        toast({title: "Aguarde!", description: "A imagem do personagem precisa ser gerada primeiro."}) ;
        return;
    }
    console.log('📚 Iniciando criação de história...');
    setFlowStep('story-selection');
  };

  const handleSelectStory = (storyTitle: string) => {
    console.log('✅ História selecionada:', storyTitle);
    setSelectedStoryTitle(storyTitle);
    setCharacter(prev => ({ ...prev, storyTitle }));
    setFlowStep('story-view');
    
    toast({
      title: "📖 História Pronta para Visualizar!",
      description: `Preparando para ver "${storyTitle}" com ${character.nome}!`, 
      className: "text-black",
    });
  };

  const handleBackToResult = () => {
    setFlowStep('result');
  };

  // console.log('🎭 CharacterCreator render - flowStep:', flowStep, 'currentStepIndex:', currentStepIndex);

  if (flowStep === 'story-selection') {
    console.log('📚 Renderizando StorySelectionStep');
    return (
      <StorySelectionStep
        character={character} 
        onSelectStory={handleSelectStory}
        onBack={handleBackToResult}
      />
    );
  }

  if (flowStep === 'story-view') {
    console.log('📖 Renderizando StoryWithIllustrations');
    if (!savedCharacterId || !selectedStoryTitle) {
      console.error("Character ID or Story Title missing for story view.");
      return <p>Error: Character ID or selected story title is missing. Cannot display story.</p>;
    }
    return (
      <StoryWithIllustrations
        characterId={savedCharacterId}
        storyTitle={selectedStoryTitle}
      />
    );
  }

  if (flowStep === 'result') {
    console.log('✅ Renderizando CharacterResult');
    return (
      <CharacterResult
        character={character} 
        onRestart={handleRestart}
        onGenerateImage={handleGenerateImage}
        onCreateStory={handleCreateStory}
        isGenerating={isGenerating}
        generatedImageUrl={generatedImageUrl}
        hasStory={!!selectedStoryTitle} 
      />
    );
  }

  console.log('📝 Renderizando QuizStep');
  return (
    <QuizStep
      step={currentStep}
      value={character[currentStep.field as keyof Character]} 
      character={character}
      onChange={handleValueChange}
      onNext={handleNext}
      onPrevious={handlePrevious}
      isFirstStep={currentStepIndex === 0}
      isLastStep={currentStepIndex === quizSteps.length - 1}
      currentStep={currentStepIndex + 1}
      totalSteps={quizSteps.length}
    />
  );
};