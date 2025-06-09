import { Progress } from "@/components/ui/progress";

interface QuizProgressBarProps {
  currentStep: number;
  totalSteps: number;
}

export default function QuizProgressBar({ currentStep, totalSteps }: QuizProgressBarProps) {
  const progressPercentage = totalSteps > 0 ? ((currentStep + 1) / totalSteps) * 100 : 0;

  return (
    <div className="w-full px-2 mb-6">
      <Progress value={progressPercentage} className="w-full h-3 bg-primary/20" />
      <p className="text-sm text-center mt-2 text-foreground/80">
        Passo {currentStep + 1} de {totalSteps}
      </p>
    </div>
  );
}
