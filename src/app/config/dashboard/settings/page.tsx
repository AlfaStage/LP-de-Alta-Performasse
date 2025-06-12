
"use client";

import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Save, Loader2, AlertTriangle, Palette, Link2, Facebook, Settings2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { fetchWhitelabelSettings, saveWhitelabelSettings } from './actions';
import type { WhitelabelConfig } from '@/types/quiz';

const hslColorRegex = /^\d{1,3}\s\d{1,3}%\s\d{1,3}%$/;

const whitelabelSettingsSchema = z.object({
  logoUrl: z.string().url({ message: "URL do logo inválida." }).min(1, "URL do logo é obrigatória."),
  primaryColorHsl: z.string().regex(hslColorRegex, { message: "Formato HSL inválido. Use 'H S% L%' (ex: 210 40% 96%)." }),
  secondaryColorHsl: z.string().regex(hslColorRegex, { message: "Formato HSL inválido. Use 'H S% L%'." }),
  quizSubmissionWebhookUrl: z.string().url({ message: "URL do webhook inválida." }).min(1, "Webhook é obrigatório."),
  facebookPixelId: z.string().optional(),
  facebookPixelIdSecondary: z.string().optional(),
  googleAnalyticsId: z.string().optional(),
});

export default function WhitelabelSettingsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const { toast } = useToast();

  const { control, handleSubmit, reset, formState: { errors } } = useForm<WhitelabelConfig>({
    resolver: zodResolver(whitelabelSettingsSchema),
    defaultValues: async () => {
      setIsFetching(true);
      const settings = await fetchWhitelabelSettings();
      setIsFetching(false);
      return settings;
    }
  });

  useEffect(() => {
    async function loadSettings() {
      setIsFetching(true);
      const settings = await fetchWhitelabelSettings();
      reset(settings);
      setIsFetching(false);
    }
    loadSettings();
  }, [reset]);

  const onSubmit = async (data: WhitelabelConfig) => {
    setIsLoading(true);
    const result = await saveWhitelabelSettings(data);
    if (result.success) {
      toast({
        title: "Sucesso!",
        description: result.message || "Configurações Whitelabel salvas.",
        variant: "default",
      });
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
    <div className="flex flex-col gap-6">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Settings2 className="h-6 w-6 text-primary" />
            Configurações Whitelabel
          </CardTitle>
          <CardDescription>
            Personalize a aparência e as integrações do sistema de quizzes.
            Para cores, use o formato HSL (Ex: Matiz Saturação% Luminosidade% -> 25 80% 50%).
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            {/* Logo URL */}
            <div className="space-y-2">
              <Label htmlFor="logoUrl" className="flex items-center gap-1"><Link2 className="h-4 w-4" />URL do Logo</Label>
              <Controller
                name="logoUrl"
                control={control}
                render={({ field }) => <Input id="logoUrl" {...field} placeholder="https://exemplo.com/logo.png" />}
              />
              {errors.logoUrl && <p className="text-sm text-destructive">{errors.logoUrl.message}</p>}
            </div>

            {/* Primary Color HSL */}
            <div className="space-y-2">
              <Label htmlFor="primaryColorHsl" className="flex items-center gap-1"><Palette className="h-4 w-4" />Cor Primária (HSL)</Label>
              <Controller
                name="primaryColorHsl"
                control={control}
                render={({ field }) => <Input id="primaryColorHsl" {...field} placeholder="e.g., 19 60% 70%" />}
              />
              {errors.primaryColorHsl && <p className="text-sm text-destructive">{errors.primaryColorHsl.message}</p>}
            </div>

            {/* Secondary Color HSL */}
            <div className="space-y-2">
              <Label htmlFor="secondaryColorHsl" className="flex items-center gap-1"><Palette className="h-4 w-4" />Cor Secundária (HSL)</Label>
              <Controller
                name="secondaryColorHsl"
                control={control}
                render={({ field }) => <Input id="secondaryColorHsl" {...field} placeholder="e.g., 15 60% 90%" />}
              />
              {errors.secondaryColorHsl && <p className="text-sm text-destructive">{errors.secondaryColorHsl.message}</p>}
            </div>
            
            {/* Quiz Submission Webhook URL */}
            <div className="space-y-2">
              <Label htmlFor="quizSubmissionWebhookUrl" className="flex items-center gap-1"><Link2 className="h-4 w-4" />Webhook de Submissão do Quiz</Label>
              <Controller
                name="quizSubmissionWebhookUrl"
                control={control}
                render={({ field }) => <Input id="quizSubmissionWebhookUrl" {...field} placeholder="https://webhook.exemplo.com/..." />}
              />
              {errors.quizSubmissionWebhookUrl && <p className="text-sm text-destructive">{errors.quizSubmissionWebhookUrl.message}</p>}
            </div>

            {/* Facebook Pixel ID */}
            <div className="space-y-2">
              <Label htmlFor="facebookPixelId" className="flex items-center gap-1"><Facebook className="h-4 w-4" />Facebook Pixel ID (Primário)</Label>
              <Controller
                name="facebookPixelId"
                control={control}
                render={({ field }) => <Input id="facebookPixelId" {...field} placeholder="Seu ID do Pixel do Facebook" />}
              />
              {errors.facebookPixelId && <p className="text-sm text-destructive">{errors.facebookPixelId.message}</p>}
            </div>

            {/* Facebook Pixel ID Secondary */}
            <div className="space-y-2">
              <Label htmlFor="facebookPixelIdSecondary" className="flex items-center gap-1"><Facebook className="h-4 w-4" />Facebook Pixel ID (Secundário)</Label>
              <Controller
                name="facebookPixelIdSecondary"
                control={control}
                render={({ field }) => <Input id="facebookPixelIdSecondary" {...field} placeholder="Seu ID do Pixel secundário (opcional)" />}
              />
              {errors.facebookPixelIdSecondary && <p className="text-sm text-destructive">{errors.facebookPixelIdSecondary.message}</p>}
            </div>

            {/* Google Analytics ID */}
            <div className="space-y-2">
              <Label htmlFor="googleAnalyticsId">Google Analytics ID (Tag do Google)</Label>
              <Controller
                name="googleAnalyticsId"
                control={control}
                render={({ field }) => <Input id="googleAnalyticsId" {...field} placeholder="Ex: G-XXXXXXXXXX" />}
              />
              {errors.googleAnalyticsId && <p className="text-sm text-destructive">{errors.googleAnalyticsId.message}</p>}
            </div>

          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isLoading} className="text-base py-3">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-5 w-5" />
                  Salvar Configurações
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
