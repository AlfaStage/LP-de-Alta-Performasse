"use client";

import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Save, Loader2, Fingerprint, Facebook, CheckSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { fetchWhitelabelSettings, saveWhitelabelSettings } from '../actions';
import type { WhitelabelConfig } from '@/types/quiz';
import { TooltipProvider } from "@/components/ui/tooltip";

// Schema para os campos desta página
const trackingSettingsSchema = z.object({
  facebookPixelId: z.string().optional(),
  facebookPixelIdSecondary: z.string().optional(),
  googleAnalyticsId: z.string().optional(),
});

// Schema completo para manter a estrutura de dados ao salvar
const fullWhitelabelSchema = z.object({}).passthrough();


export default function TrackingSettingsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [fullConfig, setFullConfig] = useState<Partial<WhitelabelConfig>>({});
  const { toast } = useToast();

  const { control, handleSubmit, reset, formState: { errors, isDirty } } = useForm<WhitelabelConfig>({
    resolver: zodResolver(trackingSettingsSchema),
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
        description: "Configurações de rastreamento salvas.",
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
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl text-foreground">
              <Fingerprint className="h-6 w-6" />
              Rastreadores (Pixels e Analytics)
            </CardTitle>
            <CardDescription>
              Configure os IDs de rastreamento para Facebook Pixel e Google Analytics.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="facebookPixelId" className="flex items-center gap-1"><Facebook className="h-4 w-4 text-muted-foreground" />Facebook Pixel ID (Primário)</Label>
                <Controller
                  name="facebookPixelId"
                  control={control}
                  render={({ field }) => <Input id="facebookPixelId" {...field} value={field.value || ""} placeholder="Seu ID do Pixel do Facebook (opcional)" />}
                />
                {errors.facebookPixelId && <p className="text-sm text-destructive">{errors.facebookPixelId.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="facebookPixelIdSecondary" className="flex items-center gap-1"><Facebook className="h-4 w-4 text-muted-foreground" />Facebook Pixel ID (Secundário)</Label>
                <Controller
                  name="facebookPixelIdSecondary"
                  control={control}
                  render={({ field }) => <Input id="facebookPixelIdSecondary" {...field} value={field.value || ""} placeholder="Seu ID do Pixel secundário (opcional)" />}
                />
                {errors.facebookPixelIdSecondary && <p className="text-sm text-destructive">{errors.facebookPixelIdSecondary.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="googleAnalyticsId" className="flex items-center gap-1">
                  <CheckSquare className="h-4 w-4 text-muted-foreground" />Google Analytics ID (Tag do Google)
                </Label>
                <Controller
                  name="googleAnalyticsId"
                  control={control}
                  render={({ field }) => <Input id="googleAnalyticsId" {...field} value={field.value || ""} placeholder="Ex: G-XXXXXXXXXX (opcional)" />}
                />
                {errors.googleAnalyticsId && <p className="text-sm text-destructive">{errors.googleAnalyticsId.message}</p>}
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isLoading || isFetching || !isDirty} className="text-base py-3">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-5 w-5" />
                    Salvar Rastreadores
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
    </TooltipProvider>
  );
}
