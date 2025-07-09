
"use client";

import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Save, Loader2, BrainCircuit, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { fetchAiPrompts, savePromptsAction } from './actions';
import type { AiPromptsConfig } from '@/types/quiz';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const promptsSchema = z.object({
  generateQuizDetails: z.string().min(50, "O prompt deve ter pelo menos 50 caracteres."),
  generateQuizQuestions: z.string().min(50, "O prompt deve ter pelo menos 50 caracteres."),
  generateQuizMessages: z.string().min(50, "O prompt deve ter pelo menos 50 caracteres."),
  generateQuizResultsPages: z.string().min(50, "O prompt deve ter pelo menos 50 caracteres."),
});

export default function PromptsSettingsPage() {
  const [isSaving, setIsSaving] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const { toast } = useToast();

  const { control, handleSubmit, reset, formState: { errors, isDirty } } = useForm<AiPromptsConfig>({
    resolver: zodResolver(promptsSchema),
    defaultValues: async () => {
      setIsFetching(true);
      const prompts = await fetchAiPrompts();
      setIsFetching(false);
      return prompts;
    }
  });

  useEffect(() => {
    async function loadPrompts() {
      setIsFetching(true);
      const prompts = await fetchAiPrompts();
      reset(prompts);
      setIsFetching(false);
    }
    loadPrompts();
  }, [reset]);

  const onSubmit = async (data: AiPromptsConfig) => {
    setIsSaving(true);
    const result = await savePromptsAction(data);

    if (result.success) {
      toast({
        title: "Sucesso!",
        description: "Prompts de IA salvos com sucesso.",
        variant: "default",
      });
      reset(data, { keepDirty: false });
    } else {
      toast({
        title: "Erro ao Salvar",
        description: result.message || "Não foi possível salvar os prompts.",
        variant: "destructive",
      });
    }
    setIsSaving(false);
  };

  if (isFetching) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Carregando prompts...</p>
      </div>
    );
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl text-foreground">
          <BrainCircuit className="h-6 w-6" />
          Prompts da Inteligência Artificial
        </CardTitle>
        <CardDescription>
          Edite os modelos (prompts) que a IA usa para gerar conteúdo. Isso permite customizar o tom, estilo e estrutura do que é gerado.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Atenção ao Editar</AlertTitle>
            <AlertDescription>
              A IA espera receber um JSON válido como resposta. Mudanças drásticas na estrutura do prompt podem quebrar a funcionalidade de geração. Use as variáveis como `{"{{topic}}"}` para inserir dados dinâmicos.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="generateQuizDetails" className="text-lg font-semibold">
              Prompt para Detalhes do Quiz (Título, Slug, etc.)
            </Label>
            <Controller
              name="generateQuizDetails"
              control={control}
              render={({ field }) => (
                <Textarea id="generateQuizDetails" {...field} rows={8} className="font-mono text-xs"/>
              )}
            />
            {errors.generateQuizDetails && <p className="text-sm text-destructive">{errors.generateQuizDetails.message}</p>}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="generateQuizQuestions" className="text-lg font-semibold">
              Prompt para Perguntas do Quiz
            </Label>
            <Controller
              name="generateQuizQuestions"
              control={control}
              render={({ field }) => (
                <Textarea id="generateQuizQuestions" {...field} rows={8} className="font-mono text-xs"/>
              )}
            />
            {errors.generateQuizQuestions && <p className="text-sm text-destructive">{errors.generateQuizQuestions.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="generateQuizMessages" className="text-lg font-semibold">
              Prompt para Mensagens Pós-Quiz
            </Label>
            <Controller
              name="generateQuizMessages"
              control={control}
              render={({ field }) => (
                <Textarea id="generateQuizMessages" {...field} rows={8} className="font-mono text-xs"/>
              )}
            />
            {errors.generateQuizMessages && <p className="text-sm text-destructive">{errors.generateQuizMessages.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="generateQuizResultsPages" className="text-lg font-semibold">
              Prompt para Páginas de Resultado (Sucesso/Desqualificado)
            </Label>
            <Controller
              name="generateQuizResultsPages"
              control={control}
              render={({ field }) => (
                <Textarea id="generateQuizResultsPages" {...field} rows={8} className="font-mono text-xs"/>
              )}
            />
            {errors.generateQuizResultsPages && <p className="text-sm text-destructive">{errors.generateQuizResultsPages.message}</p>}
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" size="lg" disabled={isSaving || isFetching || !isDirty}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Salvando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-5 w-5" /> Salvar Prompts
              </>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
