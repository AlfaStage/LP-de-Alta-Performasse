
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
import { Save, Loader2, AlertTriangle, Palette, Link2, Facebook, Settings2, TextQuote, Image as ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { fetchWhitelabelSettings, saveWhitelabelSettings } from './actions';
import type { WhitelabelConfig } from '@/types/quiz';

const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;

const whitelabelSettingsSchema = z.object({
  projectName: z.string().min(1, "Nome do projeto é obrigatório."),
  logoUrl: z.string().url({ message: "URL do logo inválida." }).min(1, "URL do logo é obrigatória."),
  primaryColorHex: z.string().regex(hexColorRegex, { message: "Cor primária: Formato HEX inválido. Use #RRGGBB ou #RGB." }),
  secondaryColorHex: z.string().regex(hexColorRegex, { message: "Cor secundária: Formato HEX inválido. Use #RRGGBB ou #RGB." }),
  pageBackgroundColorHex: z.string().regex(hexColorRegex, { message: "Cor fundo página: Formato HEX inválido. Use #RRGGBB ou #RGB." }),
  quizBackgroundColorHex: z.string().regex(hexColorRegex, { message: "Cor fundo quiz: Formato HEX inválido. Use #RRGGBB ou #RGB." }),
  quizSubmissionWebhookUrl: z.string().url({ message: "URL do webhook de submissão inválida." }).min(1, "Webhook de submissão é obrigatório."),
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
      // Forçar um recarregamento da página para que o RootLayout pegue as novas cores.
      // Idealmente, o Next.js revalidaria o layout, mas para garantir a aplicação imediata dos estilos CSS
      // injetados, um reload é mais direto aqui.
      window.location.reload();
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
            Personalize a aparência, nome, integrações e webhooks do sistema de quizzes.
            Para cores, use o formato HEX (Ex: #FF5733).
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            {/* Project Name */}
            <div className="space-y-2">
              <Label htmlFor="projectName" className="flex items-center gap-1"><TextQuote className="h-4 w-4" />Nome do Projeto</Label>
              <Controller
                name="projectName"
                control={control}
                render={({ field }) => <Input id="projectName" {...field} placeholder="Ex: Ice Lazer Lead Quiz" />}
              />
              {errors.projectName && <p className="text-sm text-destructive">{errors.projectName.message}</p>}
            </div>

            {/* Logo URL */}
            <div className="space-y-2">
              <Label htmlFor="logoUrl" className="flex items-center gap-1"><ImageIcon className="h-4 w-4" />URL do Logo</Label>
              <Controller
                name="logoUrl"
                control={control}
                render={({ field }) => <Input id="logoUrl" {...field} placeholder="https://exemplo.com/logo.png" />}
              />
              {errors.logoUrl && <p className="text-sm text-destructive">{errors.logoUrl.message}</p>}
            </div>

            {/* Primary Color HEX */}
            <div className="space-y-2">
              <Label htmlFor="primaryColorHex" className="flex items-center gap-1"><Palette className="h-4 w-4" />Cor Primária (HEX)</Label>
              <Controller
                name="primaryColorHex"
                control={control}
                render={({ field }) => <Input id="primaryColorHex" {...field} placeholder="#E09677" />}
              />
              {errors.primaryColorHex && <p className="text-sm text-destructive">{errors.primaryColorHex.message}</p>}
            </div>

            {/* Secondary Color HEX */}
            <div className="space-y-2">
              <Label htmlFor="secondaryColorHex" className="flex items-center gap-1"><Palette className="h-4 w-4" />Cor Secundária (HEX)</Label>
              <Controller
                name="secondaryColorHex"
                control={control}
                render={({ field }) => <Input id="secondaryColorHex" {...field} placeholder="#F5D4C6" />}
              />
              {errors.secondaryColorHex && <p className="text-sm text-destructive">{errors.secondaryColorHex.message}</p>}
            </div>

            {/* Page Background Color HEX */}
            <div className="space-y-2">
              <Label htmlFor="pageBackgroundColorHex" className="flex items-center gap-1"><Palette className="h-4 w-4" />Cor Fundo da Página (HEX)</Label>
              <Controller
                name="pageBackgroundColorHex"
                control={control}
                render={({ field }) => <Input id="pageBackgroundColorHex" {...field} placeholder="#FCEFEA" />}
              />
              {errors.pageBackgroundColorHex && <p className="text-sm text-destructive">{errors.pageBackgroundColorHex.message}</p>}
            </div>

            {/* Quiz Background Color HEX */}
            <div className="space-y-2">
              <Label htmlFor="quizBackgroundColorHex" className="flex items-center gap-1"><Palette className="h-4 w-4" />Cor Fundo do Quiz (Card) (HEX)</Label>
              <Controller
                name="quizBackgroundColorHex"
                control={control}
                render={({ field }) => <Input id="quizBackgroundColorHex" {...field} placeholder="#FFFFFF" />}
              />
              {errors.quizBackgroundColorHex && <p className="text-sm text-destructive">{errors.quizBackgroundColorHex.message}</p>}
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
            <Button type="submit" disabled={isLoading || isFetching} className="text-base py-3">
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
