
"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, ListPlus, PlusCircle, Edit, Trash2, Loader2, ShieldAlert, Eye, Lock, Users, CheckCircle2, TrendingUp, Target, RefreshCcw, RotateCcw, ExternalLink, Copy, BarChart3 } from 'lucide-react';
import { getQuizzesList, deleteQuizAction, getOverallQuizAnalytics, resetAllQuizAnalyticsAction, getQuizConfigForPreview } from './quiz/actions';
import type { QuizListItem, OverallQuizStats, QuizConfig, WhitelabelConfig } from '@/types/quiz';
import { useEffect, useState, useCallback } from 'react';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { APP_BASE_URL } from '@/config/appConfig'; // Import APP_BASE_URL
import dynamic from 'next/dynamic';
import QuizFormLoading from '@/components/quiz/QuizFormLoading';
import { fetchWhitelabelSettings } from './settings/actions';

const QuizForm = dynamic(() => import('@/components/quiz/QuizForm'), {
  ssr: false,
  loading: () => <div className="p-4"><QuizFormLoading/></div>,
});

const DEFAULT_QUIZ_SLUG = "default";

function StatCard({ title, value, icon: Icon, description, trendValue, trendUnit = "%" }: { title: string, value: string | number, icon: React.ElementType, description?: string, trendValue?: string, trendUnit?: string }) {
  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow bg-card">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-5 w-5 text-primary" />
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-card-foreground">{value}</div>
        {description && <p className="text-xs text-muted-foreground pt-1">{description}</p>}
      </CardContent>
       {trendValue && (
        <CardFooter className="text-xs text-muted-foreground">
          <TrendingUp className="h-4 w-4 mr-1 text-green-500" />
          {trendValue}{trendUnit} que o mês passado
        </CardFooter>
      )}
    </Card>
  );
}


export default function DashboardPage() {
  const [quizzes, setQuizzes] = useState<QuizListItem[]>([]);
  const [overallStats, setOverallStats] = useState<OverallQuizStats | null>(null);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [isFetchingData, setIsFetchingData] = useState(true);
  const [quizToDelete, setQuizToDelete] = useState<QuizListItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showResetStatsDialog, setShowResetStatsDialog] = useState(false);
  const [isResettingStats, setIsResettingStats] = useState(false);
  
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewQuizConfig, setPreviewQuizConfig] = useState<QuizConfig | null>(null);
  const [whitelabelSettingsForPreview, setWhitelabelSettingsForPreview] = useState<Partial<WhitelabelConfig> | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    setIsFetchingData(true);
    setIsLoadingList(true); 
    setIsLoadingStats(true);
    try {
      const [quizList, stats] = await Promise.all([
        getQuizzesList(),
        getOverallQuizAnalytics()
      ]);
      setQuizzes(quizList);
      setOverallStats(stats);
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
      toast({
        title: "Erro ao carregar dados",
        description: "Não foi possível buscar os quizzes ou as estatísticas.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingList(false);
      setIsLoadingStats(false);
      setIsFetchingData(false);
    }
  }, [toast]); 

  useEffect(() => {
    fetchData();
  }, [fetchData]);


  const handleDeleteQuiz = async () => {
    if (!quizToDelete || quizToDelete.slug === DEFAULT_QUIZ_SLUG) {
      toast({
        title: "Ação não permitida",
        description: "O quiz padrão não pode ser apagado.",
        variant: "destructive",
      });
      setQuizToDelete(null);
      return;
    }
    setIsDeleting(true);
    try {
      const result = await deleteQuizAction(quizToDelete.slug);
      if (result.success) {
        toast({
          title: "Quiz Apagado!",
          description: `O quiz "${quizToDelete.dashboardName || quizToDelete.title}" foi apagado com sucesso.`,
          variant: "default",
        });
        fetchData(); 
      } else {
        toast({
          title: "Erro ao Apagar",
          description: result.message || "Não foi possível apagar o quiz.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro Inesperado",
        description: "Ocorreu um erro ao tentar apagar o quiz.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setQuizToDelete(null);
    }
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
        fetchData(); 
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

  const handleOpenPreview = async (slug: string) => {
    setIsLoadingPreview(true);
    setIsPreviewModalOpen(true);
    try {
      const [config, wlSettings] = await Promise.all([
        getQuizConfigForPreview(slug),
        fetchWhitelabelSettings()
      ]);
      setPreviewQuizConfig(config);
      setWhitelabelSettingsForPreview(wlSettings);
    } catch (error) {
      console.error("Error fetching data for preview:", error);
      setPreviewQuizConfig(null);
      setWhitelabelSettingsForPreview(null);
      toast({
        title: "Erro ao Carregar Pré-visualização",
        description: "Não foi possível carregar os dados do quiz para pré-visualização.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const handleCopyLink = (slug: string) => {
    const url = `${APP_BASE_URL}/${slug}`;
    navigator.clipboard.writeText(url)
      .then(() => {
        toast({
          title: "Link Copiado!",
          description: `O link para "${slug}" foi copiado para a área de transferência. URL: ${url}`,
          variant: "default",
        });
      })
      .catch(err => {
        console.error("Failed to copy link:", err);
        toast({
          title: "Erro ao Copiar",
          description: "Não foi possível copiar o link.",
          variant: "destructive",
        });
      });
  };

  const overallConversionRate = overallStats && overallStats.totalStarted > 0 
    ? ((overallStats.totalCompleted / overallStats.totalStarted) * 100).toFixed(1) 
    : "0.0";

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
            <span className="font-display text-3xl font-bold text-sky-600">LP de Alta Performasse</span>
            <p className="text-muted-foreground">Gerencie seus quizzes e acompanhe o desempenho.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button 
            variant="outline" 
            size="lg" 
            onClick={fetchData} 
            disabled={isFetchingData}
            className="whitespace-nowrap w-full sm:w-auto"
          >
            {isFetchingData ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : <RefreshCcw className="h-5 w-5 mr-2" />}
            Atualizar Dados
          </Button>
          <Button 
            variant="outline" 
            size="lg" 
            onClick={() => setShowResetStatsDialog(true)} 
            disabled={isFetchingData || isResettingStats}
            className="whitespace-nowrap w-full sm:w-auto border-destructive/50 text-destructive hover:bg-destructive/5 hover:text-destructive"
          >
            <RotateCcw className="h-5 w-5 mr-2" />
            Resetar Estatísticas
          </Button>
          <Link href="/config/dashboard/quiz/create" className="w-full sm:w-auto">
            <Button size="lg" className="flex items-center gap-2 shadow-sm whitespace-nowrap w-full">
              <PlusCircle className="h-5 w-5" />
              Criar Novo Quiz
            </Button>
          </Link>
        </div>
      </div>

      {isLoadingStats ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3].map(i => (
            <Card key={i} className="shadow-md bg-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-5 w-5" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mt-1 mb-2" />
                <Skeleton className="h-4 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : overallStats && (
        <>
          <h2 className="text-2xl font-semibold text-foreground tracking-tight -mb-4">Resumo de Desempenho</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <StatCard title="Total de Quizzes Iniciados" value={overallStats.totalStarted} icon={Users} description="Pessoas que começaram qualquer quiz." />
            <StatCard title="Total de Quizzes Finalizados" value={overallStats.totalCompleted} icon={CheckCircle2} description="Pessoas que completaram qualquer quiz." />
            <StatCard 
              title="Taxa de Conclusão Geral" 
              value={`${overallConversionRate}%`} 
              icon={Target} 
              description="Percentual de quizzes iniciados que foram concluídos." 
            />
          </div>
          {overallStats.mostEngagingQuiz && (
            <Card className="shadow-lg bg-card overflow-hidden">
              <CardHeader>
                <div className="flex items-center gap-2">
                   <TrendingUp className="h-6 w-6 text-primary" />
                   <CardTitle className="text-xl">Quiz em Destaque: {overallStats.mostEngagingQuiz.dashboardName || overallStats.mostEngagingQuiz.title}</CardTitle>
                </div>
                <CardDescription>Com a maior taxa de conclusão ({overallStats.mostEngagingQuiz.conversionRate}%).</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Iniciados</p>
                  <p className="text-2xl font-bold">{overallStats.mostEngagingQuiz.startedCount}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Finalizados</p>
                  <p className="text-2xl font-bold">{overallStats.mostEngagingQuiz.completedCount}</p>
                </div>
                 <div>
                  <p className="text-sm font-medium text-muted-foreground">Conversão</p>
                  <p className="text-2xl font-bold">{overallStats.mostEngagingQuiz.conversionRate}%</p>
                </div>
              </CardContent>
              <CardFooter className="border-t pt-4 flex gap-2">
                <Link href={`/config/dashboard/quiz/edit/${overallStats.mostEngagingQuiz.slug}`}>
                  <Button variant="outline" size="sm"><Edit className="h-4 w-4 mr-2" /> Editar Quiz</Button>
                </Link>
                 <Link href={`/config/dashboard/quiz/stats/${overallStats.mostEngagingQuiz.slug}`}>
                  <Button variant="outline" size="sm"><BarChart3 className="h-4 w-4 mr-2" /> Ver Estatísticas</Button>
                </Link>
              </CardFooter>
            </Card>
          )}
        </>
      )}

      <h2 className="text-2xl font-semibold text-foreground tracking-tight -mb-4">Seus Quizzes</h2>
      {isLoadingList ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-lg">Carregando seus quizzes...</p>
        </div>
      ) : quizzes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quizzes.map((quiz) => {
            const conversionRate = quiz.startedCount && quiz.startedCount > 0 ? ((quiz.completedCount || 0) / quiz.startedCount) * 100 : 0;
            const displayTitle = quiz.dashboardName || quiz.title;
            return (
            <Card key={quiz.slug} className="shadow-lg hover:shadow-xl transition-shadow bg-card flex flex-col">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                    <FileText className="h-8 w-8 text-primary mt-1" />
                    {quiz.slug === DEFAULT_QUIZ_SLUG && (
                        <Badge variant="secondary" className="flex items-center gap-1">
                            <Lock className="h-3 w-3" /> Padrão
                        </Badge>
                    )}
                </div>
                <CardTitle className="text-xl font-semibold pt-2 text-card-foreground">{displayTitle}</CardTitle>
                <CardDescription className="mt-1">
                    <Badge variant="outline">/{quiz.slug}</Badge>
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center"><Users className="h-4 w-4 mr-1.5"/> Iniciados:</span>
                  <span className="font-semibold">{quiz.startedCount || 0}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center"><CheckCircle2 className="h-4 w-4 mr-1.5"/> Finalizados:</span>
                  <span className="font-semibold">{quiz.completedCount || 0}</span>
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-muted-foreground flex items-center"><Target className="h-4 w-4 mr-1.5"/> Conversão:</span>
                    <span className="font-semibold">{conversionRate.toFixed(1)}%</span>
                  </div>
                  <Progress value={conversionRate} className="h-2" />
                </div>
              </CardContent>
              <CardFooter className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-4 border-t">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full flex items-center gap-1"
                  onClick={() => handleOpenPreview(quiz.slug)}
                >
                  <Eye className="h-4 w-4" /> Pré-visualizar
                </Button>
                <Link href={`${APP_BASE_URL}/${quiz.slug}`} target="_blank" rel="noopener noreferrer" className="w-full">
                   <Button variant="outline" size="sm" className="w-full flex items-center gap-1">
                     <ExternalLink className="h-4 w-4" /> Abrir Quiz
                   </Button>
                </Link>
                <Link href={`/config/dashboard/quiz/stats/${quiz.slug}`} className="w-full">
                   <Button variant="outline" size="sm" className="w-full flex items-center gap-1">
                     <BarChart3 className="h-4 w-4" /> Estatísticas
                   </Button>
                </Link>
                <Link href={`/config/dashboard/quiz/edit/${quiz.slug}`} className="w-full">
                   <Button variant="outline" size="sm" className="w-full flex items-center gap-1">
                     <Edit className="h-4 w-4" /> Editar
                   </Button>
                </Link>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full flex items-center gap-1"
                  onClick={() => handleCopyLink(quiz.slug)}
                >
                  <Copy className="h-4 w-4" /> Copiar Link
                </Button>
                <Button 
                  variant="destructive" 
                  size="sm" 
                  className="w-full flex items-center gap-1"
                  onClick={() => setQuizToDelete(quiz)}
                  disabled={isDeleting || quiz.slug === DEFAULT_QUIZ_SLUG}
                >
                  <Trash2 className="h-4 w-4" /> Apagar
                </Button>
              </CardFooter>
            </Card>
          )})}
        </div>
      ) : (
        <Card className="col-span-full shadow-lg">
            <CardContent className="text-center py-16 text-muted-foreground flex flex-col items-center gap-4">
              <ListPlus className="h-16 w-16 text-primary/50" />
              <h2 className="text-2xl font-semibold text-card-foreground">Nenhum quiz personalizado encontrado.</h2>
              <p className="max-w-md">
                Você ainda não criou nenhum quiz. Que tal começar agora e engajar seus leads?
                O quiz padrão já está ativo na sua página inicial.
              </p>
              <Link href="/config/dashboard/quiz/create">
                <Button size="lg" className="mt-4 shadow-sm">
                  <PlusCircle className="mr-2 h-5 w-5" /> Criar seu primeiro quiz personalizado
                </Button>
              </Link>
            </CardContent>
        </Card>
      )}

      <AlertDialog open={!!quizToDelete} onOpenChange={(open) => !open && setQuizToDelete(null)}>
        <AlertDialogContent className="bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-xl text-foreground">
              <ShieldAlert className="h-7 w-7 text-destructive" />
              Confirmar Exclusão
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base text-muted-foreground">
              Você tem certeza que deseja apagar o quiz "<strong>{quizToDelete?.dashboardName || quizToDelete?.title}</strong>"? Esta ação não pode ser desfeita e o arquivo do quiz será removido permanentemente, assim como suas estatísticas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setQuizToDelete(null)} disabled={isDeleting} className="px-4 py-2">Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteQuiz} 
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground px-4 py-2"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Apagando...
                </>
              ) : "Sim, Apagar Quiz"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showResetStatsDialog} onOpenChange={setShowResetStatsDialog}>
        <AlertDialogContent className="bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-xl text-foreground">
              <ShieldAlert className="h-7 w-7 text-destructive" />
              Confirmar Reset de Estatísticas
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base text-muted-foreground">
              Você tem certeza que deseja resetar todas as estatísticas dos quizzes? 
              Isso zerará as contagens de quizzes iniciados e finalizados para todos os quizzes.
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
              ) : "Sim, Resetar Estatísticas"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isPreviewModalOpen} onOpenChange={(open) => {
        if (!open) {
          setPreviewQuizConfig(null); 
          setWhitelabelSettingsForPreview(null);
        }
        setIsPreviewModalOpen(open);
      }}>
        <DialogContent className="max-w-2xl w-[95vw] h-[90vh] flex flex-col p-0 bg-transparent border-0 shadow-none">
          <DialogHeader className="p-4 border-b bg-card rounded-t-lg">
            <DialogTitle>Pré-visualização: {isLoadingPreview ? "Carregando..." : previewQuizConfig?.title || 'Quiz'}</DialogTitle>
          </DialogHeader>
          <div className="flex-grow overflow-y-auto bg-background">
            {isLoadingPreview ? (
              <div className="flex items-center justify-center h-full"><QuizFormLoading/></div>
            ) : previewQuizConfig && whitelabelSettingsForPreview ? (
              <QuizForm
                quizQuestions={previewQuizConfig.questions}
                quizSlug={previewQuizConfig.slug}
                quizTitle={previewQuizConfig.title}
                quizDescription={previewQuizConfig.description}
                logoUrl={whitelabelSettingsForPreview.logoUrl || "https://placehold.co/150x50.png?text=Logo"}
                footerCopyrightText={whitelabelSettingsForPreview.footerCopyrightText || `© ${new Date().getFullYear()} Preview`}
                facebookPixelId="" 
                googleAnalyticsId="" 
                onSubmitOverride={async (data) => {
                  console.log("Preview Submit:", data);
                  toast({ title: "Simulação de Envio", description: "Dados do quiz simulados no console." });
                  setIsPreviewModalOpen(false); 
                }}
                onAbandonmentOverride={async () => {
                  console.log("Preview Abandonment for quiz:", previewQuizConfig?.slug);
                  toast({ title: "Simulação de Abandono", description: "Abandono simulado no console." });
                }}
                isPreview={true}
              />
            ) : (
              <div className="p-4 text-center text-muted-foreground">Não foi possível carregar a pré-visualização do quiz.</div>
            )}
          </div>
          <DialogFooter className="p-4 border-t bg-card rounded-b-lg">
            <DialogClose asChild>
              <Button variant="outline">Fechar Pré-visualização</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
    
