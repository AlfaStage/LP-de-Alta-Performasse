
"use client";

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Wand2, Loader2, AlertTriangle } from 'lucide-react';
import { generateQuizSectionAction } from '@/app/config/dashboard/quiz/actions';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertTitle, AlertDescription as AlertDesc } from '@/components/ui/alert';

export type GenerationType = 'details' | 'questions' | 'messages' | 'results';
export type GenerationMode = 'overwrite' | 'improve' | 'complete';

interface AiGenerationDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  generationType: GenerationType;
  onGenerate: (data: any) => void;
  existingData: any; // Used for 'improve' or 'complete' modes in the future
}

export default function AiGenerationDialog({
  isOpen,
  setIsOpen,
  generationType,
  onGenerate,
  existingData,
}: AiGenerationDialogProps) {
  const [topic, setTopic] = useState('');
  const [mode, setMode] = useState<GenerationMode>('overwrite');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleGenerateClick = async () => {
    if (!topic.trim()) {
      setError("Por favor, forneça um tópico ou instrução.");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const result = await generateQuizSectionAction({
        topic,
        generationType,
        generationMode: mode,
        existingData: JSON.stringify(existingData),
      });

      if (result.success && result.data) {
        onGenerate(result.data);
        toast({
          title: "Conteúdo Gerado!",
          description: `A seção foi preenchida com base no seu tópico.`,
          variant: 'default',
        });
        setIsOpen(false);
      } else {
        setError(result.message || 'Falha ao gerar conteúdo com IA.');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Ocorreu um erro inesperado.";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const getTitle = () => {
    switch (generationType) {
      case 'details': return 'Gerar Detalhes do Quiz';
      case 'questions': return 'Gerar Perguntas do Quiz';
      case 'messages': return 'Gerar Mensagens Pós-Quiz';
      case 'results': return 'Gerar Textos de Resultado';
      default: return 'Gerar com IA';
    }
  };

  const getDescription = () => {
     switch (generationType) {
      case 'details': return 'Descreva o público-alvo ou objetivo do quiz para a IA criar título, slug e descrição.';
      case 'questions': return 'Descreva o tema do quiz, e a IA criará um conjunto de perguntas relevantes.';
      case 'messages': return 'Dê à IA um tom de voz (ex: "amigável e informal") para gerar as mensagens pós-quiz.';
      case 'results': return 'Informe o contexto do quiz para a IA criar os textos das páginas de sucesso e desqualificação.';
      default: return 'Forneça um tópico ou instrução para a IA gerar o conteúdo.';
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-primary" />
            {getTitle()}
          </DialogTitle>
          <DialogDescription>
            {getDescription()}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid w-full gap-1.5">
            <Label htmlFor="topic">Tópico ou Instrução</Label>
            <Textarea
              id="topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Ex: um quiz para uma clínica de estética que quer qualificar leads para depilação a laser"
            />
          </div>
          <div className="grid w-full gap-1.5">
            <Label>Modo de Geração</Label>
             <RadioGroup
                value={mode}
                onValueChange={(value: GenerationMode) => setMode(value)}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="overwrite" id="overwrite" />
                  <Label htmlFor="overwrite" className="font-normal">Gerar do Zero (sobrescrever)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="improve" id="improve" disabled />
                  <Label htmlFor="improve" className="font-normal text-muted-foreground">Melhorar (em breve)</Label>
                </div>
              </RadioGroup>
          </div>
          {error && (
            <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Erro na Geração</AlertTitle>
                <AlertDesc>{error}</AlertDesc>
            </Alert>
          )}
        </div>
        <DialogFooter>
          <Button type="button" variant="secondary" onClick={() => setIsOpen(false)}>Cancelar</Button>
          <Button type="button" onClick={handleGenerateClick} disabled={isLoading}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4"/>}
            {isLoading ? 'Gerando...' : 'Gerar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
