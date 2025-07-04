"use client";

import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Save, Loader2, TextQuote, ImageIcon, CopyrightIcon, Globe, Instagram as InstagramIconLucide, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { fetchWhitelabelSettings, saveWhitelabelSettings } from '../actions';
import type { WhitelabelConfig } from '@/types/quiz';

// Schema para os campos desta página
const generalSettingsSchema = z.object({
  projectName: z.string().min(1, "Nome do projeto é obrigatório."),
  logoUrl: z.string().url({ message: "URL do logo inválida." }).min(1, "URL do logo é obrigatória."),
  footerCopyrightText: z.string().min(1, "Texto do rodapé é obrigatório.").optional(),
  websiteUrl: z.string().url({ message: "URL do site inválida." }).optional().or(z.literal('')),
  instagramUrl: z.string().url({ message: "URL do Instagram inválida." }).optional().or(z.literal('')),
});

// Schema completo para manter a estrutura de dados ao salvar
const fullWhitelabelSchema = z.object({}).passthrough();

export default function GeneralSettingsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [fullConfig, setFullConfig] = useState<Partial<WhitelabelConfig>>({});
  const { toast } = useToast();

  const { control, handleSubmit, reset, formState: { errors, isDirty } } = useForm<WhitelabelConfig>({
    resolver: zodResolver(generalSettingsSchema),
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
    // Mescla os dados do formulário atual com a configuração completa carregada
    const updatedConfig = { ...fullConfig, ...data };
    
    // Valida o objeto completo antes de salvar para garantir a integridade dos dados
    const validatedConfig = fullWhitelabelSchema.parse(updatedConfig);
    
    const result = await saveWhitelabelSettings(validatedConfig);

    if (result.success) {
      toast({
        title: "Sucesso!",
        description: "Configurações gerais salvas.",
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
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl text-foreground">
          <Settings className="h-6 w-6" />
          Configurações Gerais
        </CardTitle>
        <CardDescription>
          Personalize a identidade principal do seu sistema de quizzes.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="projectName" className="flex items-center gap-1"><TextQuote className="h-4 w-4 text-muted-foreground" />Nome do Projeto</Label>
            <Controller
              name="projectName"
              control={control}
              render={({ field }) => <Input id="projectName" {...field} placeholder="Ex: Sistema de Quiz XPTO" />}
            />
            {errors.projectName && <p className="text-sm text-destructive">{errors.projectName.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="logoUrl" className="flex items-center gap-1"><ImageIcon className="h-4 w-4 text-muted-foreground" />URL do Logo</Label>
            <Controller
              name="logoUrl"
              control={control}
              render={({ field }) => <Input id="logoUrl" {...field} placeholder="https://exemplo.com/logo.png" />}
            />
            {errors.logoUrl && <p className="text-sm text-destructive">{errors.logoUrl.message}</p>}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="footerCopyrightText" className="flex items-center gap-1"><CopyrightIcon className="h-4 w-4 text-muted-foreground" />Texto do Rodapé (Copyright)</Label>
            <Controller
              name="footerCopyrightText"
              control={control}
              render={({ field }) => <Input id="footerCopyrightText" {...field} placeholder="© {YEAR} Seu Nome/Empresa. Todos os direitos reservados." />}
            />
            {errors.footerCopyrightText && <p className="text-sm text-destructive">{errors.footerCopyrightText.message}</p>}
          </div>

           <div className="space-y-2">
            <Label htmlFor="websiteUrl" className="flex items-center gap-1"><Globe className="h-4 w-4 text-muted-foreground" />URL do Site (para página de obrigado)</Label>
            <Controller
              name="websiteUrl"
              control={control}
              render={({ field }) => <Input id="websiteUrl" {...field} value={field.value || ""} placeholder="https://exemplo.com (opcional)" />}
            />
            {errors.websiteUrl && <p className="text-sm text-destructive">{errors.websiteUrl.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="instagramUrl" className="flex items-center gap-1"><InstagramIconLucide className="h-4 w-4 text-muted-foreground" />URL do Instagram (para página de obrigado)</Label>
            <Controller
              name="instagramUrl"
              control={control}
              render={({ field }) => <Input id="instagramUrl" {...field} value={field.value || ""} placeholder="https://instagram.com/seu_perfil (opcional)" />}
            />
            {errors.instagramUrl && <p className="text-sm text-destructive">{errors.instagramUrl.message}</p>}
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
                Salvar Configurações Gerais
              </>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
