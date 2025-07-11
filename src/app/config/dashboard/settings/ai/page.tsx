
"use client";

import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Save, Loader2, BrainCircuit, Key, Info, BookOpen } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { fetchWhitelabelSettings, saveWhitelabelSettings, listAvailableAiModelsAction, fetchAiPrompts, savePromptsAction } from '../actions';
import type { WhitelabelConfig, AiPromptsConfig } from '@/types/quiz';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Combined schema for AI settings and prompts
const aiSettingsSchema = z.object({
  googleApiKey: z.string().optional(),
  aiModel: z.string().optional(),
  generateQuizDetails: z.string().min(50, "O prompt deve ter pelo menos 50 caracteres."),
  generateQuizQuestions: z.string().min(50, "O prompt deve ter pelo menos 50 caracteres."),
  generateQuizMessages: z.string().min(50, "O prompt deve ter pelo menos 50 caracteres."),
  generateQuizResultsPages: z.string().min(50, "O prompt deve ter pelo menos 50 caracteres."),
});

type CombinedFormData = WhitelabelConfig & AiPromptsConfig;

const fullConfigSchema = z.object({}).passthrough();

export default function AiSettingsPage() {
  const [isSaving, setIsSaving] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [isFetchingModels, setIsFetchingModels] = useState(false);
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [fullConfig, setFullConfig] = useState<Partial<CombinedFormData>>({});
  const { toast } = useToast();

  const { control, handleSubmit, reset, formState: { errors, isDirty }, watch } = useForm<CombinedFormData>({
    resolver: zodResolver(aiSettingsSchema),
    defaultValues: async () => {
      setIsFetching(true);
      const [settings, prompts] = await Promise.all([fetchWhitelabelSettings(), fetchAiPrompts()]);
      const combinedData = { ...settings, ...prompts };
      setFullConfig(combinedData);
      setIsFetching(false);
      return combinedData;
    }
  });

  const googleApiKey = watch('googleApiKey');

  useEffect(() => {
    async function fetchModels() {
      if (googleApiKey && googleApiKey.trim() !== '') {
        setIsFetchingModels(true);
        const result = await listAvailableAiModelsAction();
        if (result.success && result.models) {
          setAvailableModels(result.models);
        } else {
          toast({
            title: "Erro ao buscar modelos de IA",
            description: result.message || "Não foi possível carregar a lista de modelos disponíveis.",
            variant: "destructive",
          });
          setAvailableModels([]);
        }
        setIsFetchingModels(false);
      } else {
        setAvailableModels([]);
      }
    }
    fetchModels();
  }, [googleApiKey, toast]);

  const onSubmit = async (data: CombinedFormData) => {
    setIsSaving(true);
    
    // Separate settings from prompts
    const whitelabelData: Partial<WhitelabelConfig> = {
      googleApiKey: data.googleApiKey,
      aiModel: data.aiModel,
    };

    const promptsData: AiPromptsConfig = {
      generateQuizDetails: data.generateQuizDetails,
      generateQuizQuestions: data.generateQuizQuestions,
      generateQuizMessages: data.generateQuizMessages,
      generateQuizResultsPages: data.generateQuizResultsPages,
    };
    
    // Merge with existing full config
    const updatedConfig = { ...fullConfig, ...whitelabelData };
    const validatedConfig = fullConfigSchema.parse(updatedConfig);

    const [settingsResult, promptsResult] = await Promise.all([
      saveWhitelabelSettings(validatedConfig as WhitelabelConfig),
      savePromptsAction(promptsData)
    ]);

    if (settingsResult.success && promptsResult.success) {
      toast({
        title: "Sucesso!",
        description: "Configurações de IA e prompts salvos.",
        variant: "default",
      });
      reset({ ...validatedConfig, ...promptsData }, { keepDirty: false });
      setFullConfig({ ...validatedConfig, ...promptsData });
    } else {
      toast({
        title: "Erro ao Salvar",
        description: settingsResult.message || promptsResult.message || "Não foi possível salvar as configurações.",
        variant: "destructive",
      });
    }
    setIsSaving(false);
  };

  if (isFetching) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Carregando configurações de IA...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="space-y-8">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl text-foreground">
              <BrainCircuit className="h-6 w-6" />
              Configurações de Inteligência Artificial
            </CardTitle>
            <CardDescription>
              Configure a chave de API e o modelo de linguagem para as funcionalidades de IA.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="googleApiKey" className="flex items-center gap-1">
                <Key className="h-4 w-4 text-muted-foreground" />
                Chave de API do Google (Gemini)
              </Label>
              <Controller
                name="googleApiKey"
                control={control}
                render={({ field }) => (
                  <Input
                    id="googleApiKey"
                    type="password"
                    {...field}
                    value={field.value || ""}
                    placeholder="Cole sua chave de API aqui"
                  />
                )}
              />
              {errors.googleApiKey && <p className="text-sm text-destructive">{errors.googleApiKey.message}</p>}
              <p className="text-xs text-muted-foreground">
                Sua chave é armazenada de forma segura. Em ambientes de produção, pode ser necessário reiniciar o servidor para que uma nova chave entre em vigor.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="aiModel">Modelo de Geração</Label>
              {isFetchingModels ? (
                <Skeleton className="h-10 w-full md:w-[280px]" />
              ) : (
                <Controller
                  name="aiModel"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value || 'googleai/gemini-1.5-flash'} disabled={!googleApiKey || availableModels.length === 0}>
                      <SelectTrigger id="aiModel" className="w-full md:w-[380px]">
                        <SelectValue placeholder="Selecione um modelo" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableModels.map(model => (
                          <SelectItem key={model} value={`googleai/${model}`}>{model}</SelectItem>
                        ))}
                        {availableModels.length === 0 && <SelectItem value="googleai/gemini-1.5-flash" disabled>Nenhum modelo disponível</SelectItem>}
                      </SelectContent>
                    </Select>
                  )}
                />
              )}
              {errors.aiModel && <p className="text-sm text-destructive">{errors.aiModel.message}</p>}
              <p className="text-xs text-muted-foreground">Escolha qual modelo da família Gemini será usado para gerar conteúdo.</p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl text-foreground">
                    <BookOpen className="h-5 w-5" />
                    Prompts da Inteligência Artificial
                </CardTitle>
                <CardDescription>
                    Edite os modelos (prompts) que a IA usa para gerar conteúdo. Isso permite customizar o tom, estilo e estrutura do que é gerado.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Alert variant="default" className="bg-blue-50 border-blue-200 text-blue-800 mb-6">
                    <Info className="h-4 w-4 !text-blue-600" />
                    <AlertTitle>Como Funciona</AlertTitle>
                    <AlertDescription>
                    Você pode editar a personalidade e as instruções da IA (seções 1-6). A seção 7 (Formato de Resposta) é fixa para garantir a compatibilidade e não precisa ser editada.
                    </AlertDescription>
                </Alert>

                <Accordion type="single" collapsible className="w-full" defaultValue="item-1">
                    <AccordionItem value="item-1">
                    <AccordionTrigger className="text-lg font-semibold">Prompt para Detalhes do Quiz</AccordionTrigger>
                    <AccordionContent className="pt-4">
                        <Controller
                        name="generateQuizDetails"
                        control={control}
                        render={({ field }) => (
                            <Textarea {...field} rows={12} className="font-mono text-xs"/>
                        )}
                        />
                        {errors.generateQuizDetails && <p className="text-sm text-destructive mt-2">{errors.generateQuizDetails.message}</p>}
                    </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="item-2">
                    <AccordionTrigger className="text-lg font-semibold">Prompt para Perguntas do Quiz</AccordionTrigger>
                    <AccordionContent className="pt-4">
                        <Controller
                        name="generateQuizQuestions"
                        control={control}
                        render={({ field }) => (
                            <Textarea {...field} rows={12} className="font-mono text-xs"/>
                        )}
                        />
                        {errors.generateQuizQuestions && <p className="text-sm text-destructive mt-2">{errors.generateQuizQuestions.message}</p>}
                    </AccordionContent>
                    </AccordionItem>
                    
                    <AccordionItem value="item-3">
                    <AccordionTrigger className="text-lg font-semibold">Prompt para Mensagens Pós-Quiz</AccordionTrigger>
                    <AccordionContent className="pt-4">
                        <Controller
                        name="generateQuizMessages"
                        control={control}
                        render={({ field }) => (
                            <Textarea {...field} rows={12} className="font-mono text-xs"/>
                        )}
                        />
                        {errors.generateQuizMessages && <p className="text-sm text-destructive mt-2">{errors.generateQuizMessages.message}</p>}
                    </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="item-4">
                    <AccordionTrigger className="text-lg font-semibold">Prompt para Páginas de Resultado</AccordionTrigger>
                    <AccordionContent className="pt-4">
                        <Controller
                        name="generateQuizResultsPages"
                        control={control}
                        render={({ field }) => (
                            <Textarea {...field} rows={12} className="font-mono text-xs"/>
                        )}
                        />
                        {errors.generateQuizResultsPages && <p className="text-sm text-destructive mt-2">{errors.generateQuizResultsPages.message}</p>}
                    </AccordionContent>
                    </AccordionItem>
                </Accordion>
            </CardContent>
        </Card>

        <CardFooter className="px-0 pt-0">
          <Button type="submit" size="lg" disabled={isSaving || isFetching || !isDirty}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-5 w-5" />
                Salvar Configurações de IA
              </>
            )}
          </Button>
        </CardFooter>
      </div>
    </form>
  );
}
