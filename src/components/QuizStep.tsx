
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { QuizStep as QuizStepType, Character } from '../types/Character';

interface QuizStepProps {
  step: QuizStepType;
  value: string | number;
  character?: Character;
  onChange: (value: string | number) => void;
  onNext: () => void;
  onPrevious: () => void;
  isFirstStep: boolean;
  isLastStep: boolean;
  currentStep: number;
  totalSteps: number;
}

export const QuizStep = ({
  step,
  value,
  character,
  onChange,
  onNext,
  onPrevious,
  isFirstStep,
  isLastStep,
  currentStep,
  totalSteps
}: QuizStepProps) => {

  const renderInput = () => {
    switch (step.type) {
      case 'text':
        return (
          <Input
            type="text"
            value={value as string}
            onChange={(e) => onChange(e.target.value)}
            placeholder={step.placeholder}
            className="text-center text-lg p-6 rounded-2xl border-2 border-fairy-purple/30 focus:border-fairy-purple shadow-lg bg-violet-500 text-black placeholder:text-white/70"
          />
        );
      case 'number':
        return (
          <Input
            type="number"
            value={value as number}
            onChange={(e) => onChange(parseInt(e.target.value) || 0)}
            placeholder={step.placeholder}
            min="1"
            max="100"
            className="text-center text-lg p-6 rounded-2xl border-2 border-fairy-purple/30 focus:border-fairy-purple shadow-lg bg-violet-500 text-black placeholder:text-black/70"
          />
        );
      case 'select':
        return (
          <Select value={value as string} onValueChange={onChange}>
            <SelectTrigger className="text-center text-lg p-6 rounded-2xl border-2 border-fairy-purple/30 focus:border-fairy-purple shadow-lg bg-purple-200 text-black">
              <SelectValue placeholder="Escolha uma opção..." className="text-black" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-2 border-fairy-purple/30 bg-purple-200 backdrop-blur-sm">
              {step.options?.map((option) => (
                <SelectItem key={option} value={option} className="text-center rounded-xl text-black">
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      default:
        return null;
    }
  };

  const isValid = () => {
    if (step.type === 'number') {
      return (value as number) > 0;
    }
    return value !== '' && value !== undefined;
  };

  return (
    <div className="story-card rounded-3xl p-8 shadow-2xl max-w-md mx-auto animate-fade-in">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between text-sm text-black font-fredoka font-medium mb-2">
          <span>Pergunta {currentStep}</span>
          <span>{currentStep} de {totalSteps}</span>
        </div>
        <div className="w-full bg-fairy-pink/20 rounded-full h-3">
          <div
            className="magic-gradient h-3 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      {/* Question */}
      <div className="text-center mb-8">
        <Label className="text-2xl font-fredoka font-semibold text-black leading-relaxed">
          {step.title}
        </Label>
        <div className="mt-2 text-6xl animate-bounce-gentle">
          {currentStep === 1 && '✨'}
          {currentStep === 2 && '🎂'}
          {currentStep === 3 && '👤'}
          {currentStep === 4 && '🎨'}
          {currentStep === 5 && '💇'}
          {currentStep === 6 && '👁️'}
          {currentStep === 7 && '💫'}
        </div>
      </div>

      {/* Input */}
      <div className="mb-8">
        {renderInput()}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between gap-4">
        <Button
          onClick={onPrevious}
          disabled={isFirstStep}
          variant="outline"
          className="px-6 py-3 rounded-2xl font-fredoka font-medium border-2 border-fairy-purple/30 disabled:opacity-50 bg-fairy-purple/20 hover:bg-fairy-purple/30 text-black"
        >
          ← Voltar
        </Button>

        <Button
          onClick={onNext}
          disabled={!isValid()}
          className="px-6 py-3 rounded-2xl font-fredoka font-medium bg-fairy-purple/20 hover:bg-fairy-purple/30 border-2 border-fairy-purple/30 shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 text-black"
        >
          {isLastStep ? 'Criar Personagem! 🎭' : 'Próximo →'}
        </Button>
      </div>
    </div>
  );
};
