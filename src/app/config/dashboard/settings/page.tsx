
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
import { Save, Loader2, AlertTriangle, Palette, Link2, Facebook, Settings2, TextQuote, Image as ImageIcon, HelpCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { fetchWhitelabelSettings, saveWhitelabelSettings } from './actions';
import type { WhitelabelConfig } from '@/types/quiz';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";


const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
const optionalHexColorRegex = /^$|^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/; // Permite string vazia ou HEX válido

const whitelabelSettingsSchema = z.object({
  projectName: z.string().min(1, "Nome do projeto é obrigatório."),
  logoUrl: z.string().url({ message: "URL do logo inválida." }).min(1, "URL do logo é obrigatória."),
  primaryColorHex: z.string().regex(hexColorRegex, { message: "Cor primária do tema: Formato HEX inválido. Use #RRGGBB ou #RGB." }),
  secondaryColorHex: z.string().regex(hexColorRegex, { message: "Cor secundária: Formato HEX inválido. Use #RRGGBB ou #RGB." }),
  buttonPrimaryBgColorHex: z.string().regex(optionalHexColorRegex, { message: "Cor de fundo do botão: Formato HEX inválido ou deixe vazio." }).optional(),
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

  const { control, handleSubmit, reset, formState: { errors, dirtyFields }, watch } = useForm<WhitelabelConfig>({
    resolver: zodResolver(whitelabelSettingsSchema),
    defaultValues: async () => {
      setIsFetching(true);
      const settings = await fetchWhitelabelSettings();
      setIsFetching(false);
      return settings;
    }
  });

  const primaryColorHex = watch("primaryColorHex");
  const secondaryColorHex = watch("secondaryColorHex");
  const buttonPrimaryBgColorHex = watch("buttonPrimaryBgColorHex");
  const pageBackgroundColorHex = watch("pageBackgroundColorHex");
  const quizBackgroundColorHex = watch("quizBackgroundColorHex");

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
      reset(data, { keepDirty: false }); 
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
    <TooltipProvider>
    <div className="flex flex-col gap-6">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Settings2 className="h-6 w-6 text-primary" />
            Configurações Whitelabel
          </CardTitle>
          <CardDescription>
            Personalize a aparência, nome, integrações e webhooks do sistema de quizzes.
            Para cores, use o formato HEX (Ex: #FF5733) ou o seletor de cores.
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

            {/* Primary Theme Color HEX */}
            <div className="space-y-2">
              <Label htmlFor="primaryColorHex" className="flex items-center gap-1">
                <Palette className="h-4 w-4" />Cor Primária do Tema (HEX)
                <Tooltip>
                    <TooltipTrigger type="button"><HelpCircle className="h-3 w-3 text-muted-foreground hover:text-foreground" /></TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                        <p>Define a cor principal para elementos do tema como anéis de foco, ícones e textos destacados.</p>
                    </TooltipContent>
                </Tooltip>
              </Label>
              <div className="flex items-center gap-2">
                <Controller
                  name="primaryColorHex"
                  control={control}
                  render={({ field }) => (
                    <Input 
                      id="primaryColorHexText" 
                      {...field} 
                      placeholder="#E09677" 
                      className="flex-grow"
                      onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                    />
                  )}
                />
                <Controller
                  name="primaryColorHex"
                  control={control}
                  render={({ field }) => (
                    <Input 
                      id="primaryColorHexPicker"
                      type="color"
                      value={field.value || "#E09677"}
                      onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                      className="h-10 w-12 p-1 rounded-md border cursor-pointer min-w-[3rem]"
                    />
                  )}
                />
              </div>
              {errors.primaryColorHex && <p className="text-sm text-destructive">{errors.primaryColorHex.message}</p>}
            </div>
            
            {/* Secondary Color HEX */}
            <div className="space-y-2">
              <Label htmlFor="secondaryColorHex" className="flex items-center gap-1">
                <Palette className="h-4 w-4" />Cor Secundária do Tema (HEX)
                 <Tooltip>
                    <TooltipTrigger type="button"><HelpCircle className="h-3 w-3 text-muted-foreground hover:text-foreground" /></TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                        <p>Usada para elementos secundários, como fundos de destaque sutil ou botões secundários.</p>
                    </TooltipContent>
                </Tooltip>
              </Label>
               <div className="flex items-center gap-2">
                <Controller
                  name="secondaryColorHex"
                  control={control}
                  render={({ field }) => (
                    <Input 
                      id="secondaryColorHexText" 
                      {...field} 
                      placeholder="#F5D4C6" 
                      className="flex-grow"
                      onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                    />
                  )}
                />
                <Controller
                  name="secondaryColorHex"
                  control={control}
                  render={({ field }) => (
                    <Input 
                      id="secondaryColorHexPicker"
                      type="color"
                      value={field.value || "#F5D4C6"}
                      onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                      className="h-10 w-12 p-1 rounded-md border cursor-pointer min-w-[3rem]"
                    />
                  )}
                />
              </div>
              {errors.secondaryColorHex && <p className="text-sm text-destructive">{errors.secondaryColorHex.message}</p>}
            </div>

            {/* Button Primary Background Color HEX */}
            <div className="space-y-2">
              <Label htmlFor="buttonPrimaryBgColorHex" className="flex items-center gap-1">
                <Palette className="h-4 w-4" />Cor de Fundo do Botão Principal (HEX)
                <Tooltip>
                    <TooltipTrigger type="button"><HelpCircle className="h-3 w-3 text-muted-foreground hover:text-foreground" /></TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                        <p>Define a cor de fundo dos botões de ação primária (ex: 'Próximo', 'Salvar'). Se vazio, usará a 'Cor Primária do Tema'.</p>
                    </TooltipContent>
                </Tooltip>
              </Label>
              <div className="flex items-center gap-2">
                <Controller
                  name="buttonPrimaryBgColorHex"
                  control={control}
                  render={({ field }) => (
                    <Input
                      id="buttonPrimaryBgColorHexText"
                      {...field}
                      value={field.value || ""}
                      placeholder="#FF5733 (Opcional)"
                      className="flex-grow"
                      onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                    />
                  )}
                />
                <Controller
                  name="buttonPrimaryBgColorHex"
                  control={control}
                  render={({ field }) => (
                    <Input
                      id="buttonPrimaryBgColorHexPicker"
                      type="color"
                      value={field.value || watch("primaryColorHex") || "#E09677"} // Fallback to primary theme if button color is empty
                      onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                      className="h-10 w-12 p-1 rounded-md border cursor-pointer min-w-[3rem]"
                    />
                  )}
                />
              </div>
              {errors.buttonPrimaryBgColorHex && <p className="text-sm text-destructive">{errors.buttonPrimaryBgColorHex.message}</p>}
            </div>


            {/* Page Background Color HEX */}
            <div className="space-y-2">
              <Label htmlFor="pageBackgroundColorHex" className="flex items-center gap-1"><Palette className="h-4 w-4" />Cor Fundo da Página (HEX)</Label>
              <div className="flex items-center gap-2">
                <Controller
                  name="pageBackgroundColorHex"
                  control={control}
                  render={({ field }) => (
                    <Input 
                      id="pageBackgroundColorHexText" 
                      {...field} 
                      placeholder="#FCEFEA" 
                      className="flex-grow"
                      onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                    />
                  )}
                />
                <Controller
                  name="pageBackgroundColorHex"
                  control={control}
                  render={({ field }) => (
                    <Input 
                      id="pageBackgroundColorHexPicker"
                      type="color"
                      value={field.value || "#FCEFEA"}
                      onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                      className="h-10 w-12 p-1 rounded-md border cursor-pointer min-w-[3rem]"
                    />
                  )}
                />
              </div>
              {errors.pageBackgroundColorHex && <p className="text-sm text-destructive">{errors.pageBackgroundColorHex.message}</p>}
            </div>

            {/* Quiz Background Color HEX */}
            <div className="space-y-2">
              <Label htmlFor="quizBackgroundColorHex" className="flex items-center gap-1"><Palette className="h-4 w-4" />Cor Fundo do Quiz (Card) (HEX)</Label>
              <div className="flex items-center gap-2">
                <Controller
                  name="quizBackgroundColorHex"
                  control={control}
                  render={({ field }) => (
                    <Input 
                      id="quizBackgroundColorHexText" 
                      {...field} 
                      placeholder="#FFFFFF" 
                      className="flex-grow"
                      onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                    />
                  )}
                />
                <Controller
                  name="quizBackgroundColorHex"
                  control={control}
                  render={({ field }) => (
                    <Input 
                      id="quizBackgroundColorHexPicker"
                      type="color"
                      value={field.value || "#FFFFFF"}
                      onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                      className="h-10 w-12 p-1 rounded-md border cursor-pointer min-w-[3rem]"
                    />
                  )}
                />
              </div>
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
                render={({ field }) => <Input id="facebookPixelId" {...field} value={field.value || ""} placeholder="Seu ID do Pixel do Facebook" />}
              />
              {errors.facebookPixelId && <p className="text-sm text-destructive">{errors.facebookPixelId.message}</p>}
            </div>

            {/* Facebook Pixel ID Secondary */}
            <div className="space-y-2">
              <Label htmlFor="facebookPixelIdSecondary" className="flex items-center gap-1"><Facebook className="h-4 w-4" />Facebook Pixel ID (Secundário)</Label>
              <Controller
                name="facebookPixelIdSecondary"
                control={control}
                render={({ field }) => <Input id="facebookPixelIdSecondary" {...field} value={field.value || ""} placeholder="Seu ID do Pixel secundário (opcional)" />}
              />
              {errors.facebookPixelIdSecondary && <p className="text-sm text-destructive">{errors.facebookPixelIdSecondary.message}</p>}
            </div>

            {/* Google Analytics ID */}
            <div className="space-y-2">
              <Label htmlFor="googleAnalyticsId">Google Analytics ID (Tag do Google)</Label>
              <Controller
                name="googleAnalyticsId"
                control={control}
                render={({ field }) => <Input id="googleAnalyticsId" {...field} value={field.value || ""} placeholder="Ex: G-XXXXXXXXXX" />}
              />
              {errors.googleAnalyticsId && <p className="text-sm text-destructive">{errors.googleAnalyticsId.message}</p>}
            </div>

          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isLoading || isFetching || !Object.keys(dirtyFields).length} className="text-base py-3">
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
    </TooltipProvider>
  );
}
