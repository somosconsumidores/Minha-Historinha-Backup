
import { useState } from 'react';
import { Character } from '../types/Character';
import { quizSteps } from '../data/quizSteps';
import { QuizStep } from './QuizStep';
import { CharacterResult } from './CharacterResult';
import { StorySelectionStep } from './StorySelectionStep';
import { useToast } from '@/hooks/use-toast';
import { useCharacters } from '@/hooks/useCharacters';
import { supabase } from '@/integrations/supabase/client';

type FlowStep = 'quiz' | 'result' | 'story-selection';

export const CharacterCreator = () => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [flowStep, setFlowStep] = useState<FlowStep>('quiz');
  const [character, setCharacter] = useState<Character>({
    nome: '',
    idade: 0,
    sexo: 'Masculino',
    corPele: '',
    corCabelo: '',
    corOlhos: '',
    estiloCabelo: ''
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
      // Quiz completed - save character to database
      console.log('🎉 Quiz completo! Salvando personagem...');
      console.log('👤 Dados do personagem:', character);
      
      try {
        const characterId = await saveCharacter(character);
        
        if (characterId) {
          setSavedCharacterId(characterId);
          setCharacter(prev => ({ ...prev, id: characterId }));
          console.log('✅ Personagem salvo com ID:', characterId);
          
          toast({
            title: "🎉 Personagem criado!",
            description: `${character.nome} está pronto para ganhar vida!`,
            className: "text-black",
          });
        } else {
          console.log('⚠️ Personagem criado mas sem ID retornado');
          toast({
            title: "🎉 Personagem criado!",
            description: `${character.nome} está pronto para ganhar vida!`,
            className: "text-black",
          });
        }
        
        console.log('🎭 Mudando para flowStep = result');
        setFlowStep('result');
        
      } catch (error) {
        console.error('❌ Erro ao salvar personagem:', error);
        toast({
          title: "❌ Erro ao salvar",
          description: "Houve um problema ao salvar o personagem. Tente novamente.",
          className: "text-black",
        });
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
      corPele: '',
      corCabelo: '',
      corOlhos: '',
      estiloCabelo: ''
    });
    setIsGenerating(false);
    setGeneratedImageUrl('');
    setSavedCharacterId(null);
    setSelectedStoryTitle('');
  };

  const handleGenerateImage = async () => {
    setIsGenerating(true);
    toast({
      title: "🎨 Gerando imagem...",
      description: "Criando seu personagem no estilo Pixar 3D!",
      className: "text-black",
    });
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-character-image', {
        body: { character }
      });

      if (error) {
        throw error;
      }

      if (data.imageUrl) {
        setGeneratedImageUrl(data.imageUrl);
        
        if (savedCharacterId) {
          await updateCharacterImage(savedCharacterId, data.imageUrl);
        }
        
        toast({
          title: "✨ Imagem gerada com sucesso!",
          description: "Seu personagem Pixar 3D está pronto!",
          className: "text-black",
        });
        
        console.log('Generated image URL:', data.imageUrl);
      }
    } catch (error) {
      console.error('Error generating image:', error);
      toast({
        title: "❌ Erro ao gerar imagem",
        description: "Tente novamente em alguns instantes.",
        className: "text-black",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCreateStory = () => {
    console.log('📚 Iniciando criação de história...');
    setFlowStep('story-selection');
  };

  const handleSelectStory = (storyTitle: string) => {
    console.log('✅ História selecionada:', storyTitle);
    setSelectedStoryTitle(storyTitle);
    setCharacter(prev => ({ ...prev, storyTitle }));
    // Aqui podemos adicionar lógica para navegar para a visualização da história
    // Por enquanto, voltamos para o resultado do personagem
    setFlowStep('result');
    
    toast({
      title: "📖 História criada!",
      description: `"${storyTitle}" foi criada para ${character.nome}!`,
      className: "text-black",
    });
  };

  const handleBackToResult = () => {
    setFlowStep('result');
  };

  console.log('🎭 CharacterCreator render - flowStep:', flowStep, 'currentStepIndex:', currentStepIndex);

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
      value={character[currentStep.field]}
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
