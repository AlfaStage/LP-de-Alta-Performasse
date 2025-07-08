
"use client";

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import { resetAllQuizAnalyticsAction } from '@/app/config/dashboard/quiz/actions';
import { BarChart3, Loader2, RotateCcw, ShieldAlert, Save, SlidersHorizontal, Ratio } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { WhitelabelConfig } from '@/types/quiz';
import { fetchWhitelabelSettings, saveWhitelabelSettings } from '../actions';

const analyticsSettingsSchema = z.object({
  dashboardDefaultFilter: z.enum(['today', 'yesterday', 'last7', 'last30']).optional(),
  conversionMetric: z.enum(['start_vs_complete', 'first_answer_vs_complete']).optional(),
});

const fullWhitelabelSchema = z.object({}).passthrough();

export default function AnalyticsSettingsPage() {
  const [showResetStatsDialog, setShowResetStatsDialog] = useState(false);
  const [isResettingStats, setIsResettingStats] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [fullConfig, setFullConfig] = useState<Partial<WhitelabelConfig>>({});
  const { toast } = useToast();
  
  const { control, handleSubmit, reset, formState: { errors, isDirty } } = useForm<WhitelabelConfig>({
    resolver: zodResolver(analyticsSettingsSchema),
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
    setIsSaving(true);
    const updatedConfig = { ...fullConfig, ...data };
    const validatedConfig = fullWhitelabelSchema.parse(updatedConfig);
    const result = await saveWhitelabelSettings(validatedConfig);

    if (result.success) {
      toast({
        title: "Sucesso!",
        description: "Configurações de estatísticas salvas.",
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
    setIsSaving(false);
  };

  const handleResetStats = async () => {
    setIsResettingStats(true);
    try {
      const result = await resetAllQuizAnalyticsAction();
      if (result.success) {
        toast({
          title: "Estatísticas Resetadas!",
          description: "As estatísticas de todos os quizzes foram resetadas.",
          variant: "default",
        });
      } else {
        toast({
          title: "Erro ao Resetar",
          description: result.message || "Não foi possível resetar as estatísticas.",
          variant: "destructive",
        });
      }
    } catch (error) {
       toast({
        title: "Erro Inesperado",
        description: "Ocorreu um erro ao tentar resetar as estatísticas.",
        variant: "destructive",
      });
    } finally {
      setIsResettingStats(false);
      setShowResetStatsDialog(false);
    }
  }

  if (isFetching) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Carregando configurações...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <form onSubmit={handleSubmit(onSubmit)}>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl text-foreground">
              <BarChart3 className="h-6 w-6" />
              Estatísticas e Dashboard
            </CardTitle>
            <CardDescription>
              Configure como os dados de estatísticas e o dashboard são exibidos e calculados.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
              <Label htmlFor="dashboardDefaultFilter" className="flex items-center gap-2 text-base font-semibold">
                <SlidersHorizontal className="h-5 w-5 text-primary"/>
                Filtro de Período Padrão
              </Label>
              <p className="text-sm text-muted-foreground">Escolha o período padrão a ser exibido ao carregar as páginas de estatísticas.</p>
              <Controller
                name="dashboardDefaultFilter"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} defaultValue={field.value || 'last7'}>
                    <SelectTrigger id="dashboardDefaultFilter" className="w-full md:w-[250px]">
                      <SelectValue placeholder="Selecione um período" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="today">Hoje</SelectItem>
                      <SelectItem value="yesterday">Ontem</SelectItem>
                      <SelectItem value="last7">Últimos 7 dias</SelectItem>
                      <SelectItem value="last30">Últimos 30 dias</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
               {errors.dashboardDefaultFilter && <p className="text-sm text-destructive">{errors.dashboardDefaultFilter.message}</p>}
            </div>
            
            <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
                <Label className="flex items-center gap-2 text-base font-semibold">
                  <Ratio className="h-5 w-5 text-primary"/>
                  Cálculo da Taxa de Conversão
                </Label>
                <p className="text-sm text-muted-foreground">Escolha como a taxa de conversão geral é calculada no dashboard.</p>
                 <Controller
                    name="conversionMetric"
                    control={control}
                    render={({ field }) => (
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value || 'start_vs_complete'}
                        className="space-y-2 pt-1"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="start_vs_complete" id="r1" />
                          <Label htmlFor="r1" className="font-normal">Quizzes Iniciados vs. Finalizados</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="first_answer_vs_complete" id="r2" />
                          <Label htmlFor="r2" className="font-normal">Quizzes Engajados (1ª resposta) vs. Finalizados</Label>
                        </div>
                      </RadioGroup>
                    )}
                 />
                 {errors.conversionMetric && <p className="text-sm text-destructive">{errors.conversionMetric.message}</p>}
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
                    <Save className="mr-2 h-5 w-5" /> Salvar Configurações
                  </>
                )}
              </Button>
          </CardFooter>
        </Card>
      </form>
      
      <Card className="border-destructive/30 bg-destructive/5">
        <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2"><ShieldAlert className="h-5 w-5" />Ações de Risco</CardTitle>
            <CardDescription className="text-destructive/80">
                Esta ação é permanente e não pode ser desfeita. Use com cuidado.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <Button 
              variant="destructive" 
              onClick={() => setShowResetStatsDialog(true)} 
              disabled={isResettingStats}
            >
                <RotateCcw className="h-5 w-5 mr-2" />
                Resetar Todas as Estatísticas
            </Button>
        </CardContent>
      </Card>

      <AlertDialog open={showResetStatsDialog} onOpenChange={setShowResetStatsDialog}>
        <AlertDialogContent className="bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-xl text-foreground">
              <ShieldAlert className="h-7 w-7 text-destructive" />
              Confirmar Reset de Todas as Estatísticas
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base text-muted-foreground">
              Você tem certeza que deseja resetar TODAS as estatísticas? 
              Isso apagará permanentemente todos os registros de quizzes iniciados, finalizados e respostas por pergunta para TODOS os quizzes.
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowResetStatsDialog(false)} disabled={isResettingStats} className="px-4 py-2">Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleResetStats} 
              disabled={isResettingStats}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground px-4 py-2"
            >
              {isResettingStats ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Resetando...
                </>
              ) : "Sim, Resetar Tudo"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
