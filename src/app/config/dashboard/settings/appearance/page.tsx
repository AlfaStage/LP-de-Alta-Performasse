
"use client";

import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Save, Loader2, Palette, HelpCircle, Image as ImageIcon, Wind, Paintbrush } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { fetchWhitelabelSettings, saveWhitelabelSettings } from '../actions';
import type { WhitelabelConfig } from '@/types/quiz';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
const optionalHexColorRegex = /^$|^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;

const appearanceSettingsSchema = z.object({
  primaryColorHex: z.string().regex(hexColorRegex, { message: "Cor primária do tema: Formato HEX inválido. Use #RRGGBB ou #RGB." }),
  secondaryColorHex: z.string().regex(hexColorRegex, { message: "Cor secundária: Formato HEX inválido. Use #RRGGBB ou #RGB." }),
  buttonPrimaryBgColorHex: z.string().regex(optionalHexColorRegex, { message: "Cor de fundo do botão: Formato HEX inválido ou deixe vazio." }).optional(),
  quizBackgroundColorHex: z.string().regex(hexColorRegex, { message: "Cor fundo quiz: Formato HEX inválido. Use #RRGGBB ou #RGB." }),
  
  pageBackgroundType: z.enum(['color', 'image', 'gradient']),
  pageBackgroundColorHex: z.string().regex(hexColorRegex, { message: "Cor fundo página: Formato HEX inválido. Use #RRGGBB ou #RGB." }),
  pageBackgroundImageUrl: z.string().url({ message: "URL da imagem de fundo inválida." }).optional().or(z.literal('')),
  pageBackgroundGradient: z.string().optional(),
});

const fullWhitelabelSchema = z.object({}).passthrough();


export default function AppearanceSettingsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [fullConfig, setFullConfig] = useState<Partial<WhitelabelConfig>>({});
  const { toast } = useToast();

  const { control, handleSubmit, reset, formState: { errors, isDirty }, watch } = useForm<WhitelabelConfig>({
    resolver: zodResolver(appearanceSettingsSchema),
    defaultValues: async () => {
      setIsFetching(true);
      const settings = await fetchWhitelabelSettings();
      setFullConfig(settings);
      setIsFetching(false);
      return settings;
    }
  });
  
  const pageBackgroundType = watch('pageBackgroundType');

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
        description: "Configurações de aparência salvas. As alterações podem precisar de um recarregamento da página para serem totalmente aplicadas.",
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
            <Palette className="h-6 w-6" />
            Aparência
          </CardTitle>
          <CardDescription>
            Personalize a paleta de cores e o fundo dos quizzes. Para cores, use o formato HEX (Ex: #FF5733).
            As alterações visuais no fundo podem exigir que a página seja recarregada.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <h3 className="text-lg font-medium text-foreground pt-4 border-t">Paleta de Cores do Tema</h3>

            <div className="space-y-2">
              <Label htmlFor="primaryColorHex" className="flex items-center gap-1">
                <Palette className="h-4 w-4 text-muted-foreground" />Cor Primária do Tema (HEX)
                <Tooltip>
                    <TooltipTrigger type="button"><HelpCircle className="h-3 w-3 text-muted-foreground hover:text-foreground" /></TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                        <p>Define a cor principal para elementos do tema como anéis de foco, ícones e textos destacados. Usada como fallback para botões se a cor específica do botão não for definida.</p>
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
                      placeholder="#3B82F6" 
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
                      value={field.value || "#3B82F6"}
                      onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                      className="h-10 w-12 p-1 rounded-md border cursor-pointer min-w-[3rem]"
                    />
                  )}
                />
              </div>
              {errors.primaryColorHex && <p className="text-sm text-destructive">{errors.primaryColorHex.message}</p>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="secondaryColorHex" className="flex items-center gap-1">
                <Palette className="h-4 w-4 text-muted-foreground" />Cor Secundária do Tema (HEX)
                 <Tooltip>
                    <TooltipTrigger type="button"><HelpCircle className="h-3 w-3 text-muted-foreground hover:text-foreground" /></TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                        <p>Usada para elementos secundários, como fundos de destaque sutil ou botões secundários. Também influencia o hover de botões outline/ghost.</p>
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
                      placeholder="#BFDBFE" 
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
                      value={field.value || "#BFDBFE"}
                      onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                      className="h-10 w-12 p-1 rounded-md border cursor-pointer min-w-[3rem]"
                    />
                  )}
                />
              </div>
              {errors.secondaryColorHex && <p className="text-sm text-destructive">{errors.secondaryColorHex.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="buttonPrimaryBgColorHex" className="flex items-center gap-1">
                <Palette className="h-4 w-4 text-muted-foreground" />Cor de Fundo do Botão Principal (HEX)
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
                      placeholder="#2563EB (Opcional, fallback para Cor Primária Tema)"
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
                      value={field.value || watch("primaryColorHex") || "#2563EB"} 
                      onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                      className="h-10 w-12 p-1 rounded-md border cursor-pointer min-w-[3rem]"
                    />
                  )}
                />
              </div>
              {errors.buttonPrimaryBgColorHex && <p className="text-sm text-destructive">{errors.buttonPrimaryBgColorHex.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="quizBackgroundColorHex" className="flex items-center gap-1"><Palette className="h-4 w-4 text-muted-foreground" />Cor Fundo do Quiz (Card) (HEX)</Label>
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
            
            <h3 className="text-lg font-medium text-foreground pt-4 border-t">Fundo da Página do Quiz</h3>
            
            <div className="space-y-2">
              <Label>Tipo de Fundo</Label>
               <Controller
                name="pageBackgroundType"
                control={control}
                render={({ field }) => (
                  <RadioGroup
                    value={field.value}
                    onValueChange={field.onChange}
                    className="flex flex-col sm:flex-row gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="color" id="bg-color" />
                      <Label htmlFor="bg-color" className="font-normal flex items-center gap-1.5"><Paintbrush className="h-4 w-4" /> Cor Sólida</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="image" id="bg-image" />
                      <Label htmlFor="bg-image" className="font-normal flex items-center gap-1.5"><ImageIcon className="h-4 w-4" /> Imagem</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="gradient" id="bg-gradient" />
                      <Label htmlFor="bg-gradient" className="font-normal flex items-center gap-1.5"><Wind className="h-4 w-4" /> Degradê</Label>
                    </div>
                  </RadioGroup>
                )}
              />
            </div>
            
            {pageBackgroundType === 'color' && (
              <div className="space-y-2">
                <Label htmlFor="pageBackgroundColorHex" className="flex items-center gap-1"><Palette className="h-4 w-4 text-muted-foreground" />Cor Sólida de Fundo da Página (HEX)</Label>
                <div className="flex items-center gap-2">
                  <Controller
                    name="pageBackgroundColorHex"
                    control={control}
                    render={({ field }) => (
                      <Input 
                        id="pageBackgroundColorHexText" 
                        {...field} 
                        placeholder="#F3F4F6" 
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
                        value={field.value || "#F3F4F6"}
                        onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                        className="h-10 w-12 p-1 rounded-md border cursor-pointer min-w-[3rem]"
                      />
                    )}
                  />
                </div>
                {errors.pageBackgroundColorHex && <p className="text-sm text-destructive">{errors.pageBackgroundColorHex.message}</p>}
              </div>
            )}
            
            {pageBackgroundType === 'image' && (
              <div className="space-y-2">
                <Label htmlFor="pageBackgroundImageUrl" className="flex items-center gap-1">
                  <ImageIcon className="h-4 w-4 text-muted-foreground" />URL da Imagem de Fundo (Opcional)
                </Label>
                <Controller
                  name="pageBackgroundImageUrl"
                  control={control}
                  render={({ field }) => (
                    <Input 
                      id="pageBackgroundImageUrl"
                      {...field}
                      value={field.value || ""}
                      placeholder="https://exemplo.com/fundo.jpg"
                    />
                  )}
                />
                {errors.pageBackgroundImageUrl && <p className="text-sm text-destructive">{errors.pageBackgroundImageUrl.message}</p>}
              </div>
            )}

            {pageBackgroundType === 'gradient' && (
              <div className="space-y-2">
                <Label htmlFor="pageBackgroundGradient" className="flex items-center gap-1">
                  <Wind className="h-4 w-4 text-muted-foreground" />Degradê de Fundo (CSS - Opcional)
                  <Tooltip>
                      <TooltipTrigger type="button"><HelpCircle className="h-3 w-3 text-muted-foreground hover:text-foreground" /></TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                          <p>Cole o valor CSS completo.</p>
                          <p className="font-mono text-xs mt-1">Ex: linear-gradient(to right, #ff7e5f, #feb47b)</p>
                      </TooltipContent>
                  </Tooltip>
                </Label>
                <Controller
                  name="pageBackgroundGradient"
                  control={control}
                  render={({ field }) => (
                    <Textarea 
                      id="pageBackgroundGradient"
                      {...field}
                      value={field.value || ""}
                      placeholder="Ex: linear-gradient(to right, #8e2de2, #4a00e0)"
                      rows={2}
                    />
                  )}
                />
                {errors.pageBackgroundGradient && <p className="text-sm text-destructive">{errors.pageBackgroundGradient.message}</p>}
              </div>
            )}
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
                  Salvar Aparência
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </TooltipProvider>
  );
}
