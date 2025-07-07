
"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { BarChart3, Loader2, RotateCcw, ShieldAlert } from "lucide-react";

export default function AnalyticsSettingsPage() {
  const [showResetStatsDialog, setShowResetStatsDialog] = useState(false);
  const [isResettingStats, setIsResettingStats] = useState(false);
  const { toast } = useToast();
  
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
        // You might want to trigger a data refetch on the main dashboard page
        // but since we are on a different page, this is harder.
        // The user will see the updated stats when they navigate back to the dashboard.
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

  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl text-foreground">
            <BarChart3 className="h-6 w-6" />
            Estatísticas
          </CardTitle>
          <CardDescription>
            Configure como os dados de estatísticas e o dashboard são exibidos e calculados.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
              <div>
                  <h3 className="font-semibold text-lg text-foreground">Filtro de Período Padrão</h3>
                  <p className="text-muted-foreground">Em breve: Opção para definir o período padrão do filtro de data (ex: últimos 7 dias, últimos 30 dias) a ser exibido ao carregar o dashboard.</p>
              </div>
              <div>
                  <h3 className="font-semibold text-lg text-foreground">Cálculo da Taxa de Conversão</h3>
                  <p className="text-muted-foreground">Em breve: Opção para escolher a base de cálculo da taxa de conversão: (quiz aberto vs. finalizado) ou (primeira pergunta respondida vs. finalizado).</p>
              </div>
          </div>
        </CardContent>
      </Card>
      
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
