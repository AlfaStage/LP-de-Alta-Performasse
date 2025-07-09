
"use client";

import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Save, Loader2, Link2, Facebook, HelpCircle, BrainCircuit, Key, UserX } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { fetchWhitelabelSettings, saveWhitelabelSettings } from '../actions';
import type { WhitelabelConfig } from '@/types/quiz';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Schema para os campos desta página
const integrationsSettingsSchema = z.object({
  quizSubmissionWebhookUrl: z.string().url({ message: "URL do webhook de submissão inválida." }).min(1, "Webhook de submissão é obrigatório."),
  disqualifiedSubmissionWebhookUrl: z.string().url({ message: "URL do webhook inválida." }).optional().or(z.literal('')),
  facebookDomainVerification: z.string().optional(),
  googleApiKey: z.string().optional(),
});

// Schema completo para manter a estrutura de dados ao salvar
const fullWhitelabelSchema = z.object({}).passthrough();


export default function IntegrationsSettingsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [fullConfig, setFullConfig] = useState<Partial<WhitelabelConfig>>({});
  const { toast } = useToast();

  const { control, handleSubmit, reset, formState: { errors, isDirty } } = useForm<WhitelabelConfig>({
    resolver: zodResolver(integrationsSettingsSchema),
    defaultValues: async () => {
      setIsFetching(true);
      const settings = await fetchWhitelabelSettings();
      setFullConfig(settings);
      setIsFetching(false);
      return settings;
    }
  });

  useEffect(() => {
    async function loadSettings() {
      setIsFetching(true);
      const settings = await fetchWhitelabelSettings();
      reset(settings);
      setFullConfig(settings);
      setIsFetching(false);
    }
    loadSettings();
  }, [reset]);

  const onSubmit = async (data: WhitelabelConfig) => {
    setIsLoading(true);
    const updatedConfig = { ...fullConfig, ...data };
    const validatedConfig = fullWhitelabelSchema.parse(updatedConfig);
    const result = await saveWhitelabelSettings(validatedConfig);

    if (result.success) {
      toast({
        title: "Sucesso!",
        description: "Configurações de integração salvas.",
        variant: "default",
      });
      reset(validatedConfig, { keepDirty: false });
      setFullConfig(validatedConfig);
    } else {
      toast({
        title: "Erro ao Salvar",
        description: result.message || "Não foi possível salvar as configurações.",
        variant: "destructive",
      });
    }
    setIsLoading(false);
  };
  
  if (isFetching) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Carregando configurações...</p>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-8">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl text-foreground">
                <Link2 className="h-6 w-6" />
                Integrações e Webhooks
              </CardTitle>
              <CardDescription>
                Gerencie webhooks e outras integrações externas.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="quizSubmissionWebhookUrl" className="flex items-center gap-1"><Link2 className="h-4 w-4 text-muted-foreground" />Webhook de Submissão (Leads Qualificados)</Label>
                  <Controller
                    name="quizSubmissionWebhookUrl"
                    control={control}
                    render={({ field }) => <Input id="quizSubmissionWebhookUrl" {...field} placeholder="https://webhook.exemplo.com/qualified" />}
                  />
                  {errors.quizSubmissionWebhookUrl && <p className="text-sm text-destructive">{errors.quizSubmissionWebhookUrl.message}</p>}
                </div>

                 <div className="space-y-2">
                  <Label htmlFor="disqualifiedSubmissionWebhookUrl" className="flex items-center gap-1"><UserX className="h-4 w-4 text-muted-foreground" />Webhook de Submissão (Leads Desqualificados)</Label>
                  <Controller
                    name="disqualifiedSubmissionWebhookUrl"
                    control={control}
                    render={({ field }) => <Input id="disqualifiedSubmissionWebhookUrl" {...field} value={field.value || ""} placeholder="https://webhook.exemplo.com/disqualified (opcional)" />}
                  />
                  <p className="text-xs text-muted-foreground">Se preenchido, os dados de leads desqualificados serão enviados para esta URL. Caso contrário, serão descartados.</p>
                  {errors.disqualifiedSubmissionWebhookUrl && <p className="text-sm text-destructive">{errors.disqualifiedSubmissionWebhookUrl.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="facebookDomainVerification" className="flex items-center gap-1">
                    <Facebook className="h-4 w-4 text-muted-foreground" />Código de Verificação de Domínio do Facebook
                    <Tooltip>
                        <TooltipTrigger type="button"><HelpCircle className="h-3 w-3 text-muted-foreground hover:text-foreground" /></TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                            <p>Insira o conteúdo da meta tag de verificação de domínio do Facebook. Ex: "abcdef123456xyz". (opcional)</p>
                        </TooltipContent>
                    </Tooltip>
                  </Label>
                  <Controller
                    name="facebookDomainVerification"
                    control={control}
                    render={({ field }) => <Input id="facebookDomainVerification" {...field} value={field.value || ""} placeholder="Conteúdo da meta tag (opcional)" />}
                  />
                  {errors.facebookDomainVerification && <p className="text-sm text-destructive">{errors.facebookDomainVerification.message}</p>}
                </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-lg">
              <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl text-foreground">
                      <BrainCircuit className="h-5 w-5" />
                      Configurações de IA (Genkit)
                  </CardTitle>
                   <CardDescription>
                      Configure a chave de API para funcionalidades de IA, como a geração de quizzes.
                  </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="googleApiKey" className="flex items-center gap-1">
                    <Key className="h-4 w-4 text-muted-foreground" />Chave de API do Google (Gemini)
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
              </CardContent>
          </Card>

          <CardFooter className="px-0">
              <Button type="submit" size="lg" disabled={isLoading || isFetching || !isDirty}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-5 w-5" />
                    Salvar Integrações
                  </>
                )}
              </Button>
            </CardFooter>
        </div>
      </form>
    </TooltipProvider>
  );
}
