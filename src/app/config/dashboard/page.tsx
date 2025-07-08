
"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, ListPlus, PlusCircle, Edit, Trash2, Loader2, ShieldAlert, Eye, Lock, Users, CheckCircle2, TrendingUp, Target, RefreshCcw, ExternalLink, Copy, BarChart3, MousePointerClick } from 'lucide-react';
import { getQuizzesList, deleteQuizAction, getOverallQuizAnalytics, getQuizConfigForPreview } from './quiz/actions';
import type { QuizListItem, OverallQuizStats, QuizConfig, WhitelabelConfig, DateRange } from '@/types/quiz';
import { useEffect, useState, useCallback } from 'react';
import { addDays } from "date-fns";
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
import dynamic from 'next/dynamic';
import QuizFormLoading from '@/components/quiz/QuizFormLoading';
import { fetchWhitelabelSettings } from './settings/actions';
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


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
  
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewQuizConfig, setPreviewQuizConfig] = useState<QuizConfig | null>(null);
  const [whitelabelSettings, setWhitelabelSettings] = useState<Partial<WhitelabelConfig> | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [baseUrl, setBaseUrl] = useState('');

  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  const { toast } = useToast();

   useEffect(() => {
    if (typeof window !== 'undefined') {
      setBaseUrl(window.location.origin);
    }
  }, []);
  
  const handleDatePresetChange = (value: string) => {
    const now = new Date();
    let newRange: DateRange | undefined;
    switch (value) {
      case 'today':
        newRange = { from: now, to: now };
        break;
      case 'yesterday':
        const yesterday = addDays(now, -1);
        newRange = { from: yesterday, to: yesterday };
        break;
      case 'last7':
        newRange = { from: addDays(now, -7), to: now };
        break;
      case 'last30':
        newRange = { from: addDays(now, -30), to: now };
        break;
      default:
        newRange = undefined;
    }
    setDateRange(newRange);
  };
  
  useEffect(() => {
    async function loadInitialSettings() {
      const settings = await fetchWhitelabelSettings();
      setWhitelabelSettings(settings);
      handleDatePresetChange(settings.dashboardDefaultFilter || 'last7');
    }
    loadInitialSettings();
    // Eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const fetchData = useCallback(async () => {
    if (!dateRange) return; 

    setIsFetchingData(true);
    setIsLoadingList(true); 
    setIsLoadingStats(true);
    try {
      const [quizList, stats] = await Promise.all([
        getQuizzesList(dateRange),
        getOverallQuizAnalytics(dateRange)
      ]);
      setQuizzes(quizList);
      setOverallStats(stats);
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
      toast({
        title: "Erro ao carregar dados",
        description: "Não foi possível buscar os quizzes ou as estatísticas para o período selecionado.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingList(false);
      setIsLoadingStats(false);
      setIsFetchingData(false);
    }
  }, [toast, dateRange]); 

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

  const handleOpenPreview = async (slug: string) => {
    setIsLoadingPreview(true);
    setIsPreviewModalOpen(true);
    try {
      const [config, wlSettings] = await Promise.all([
        getQuizConfigForPreview(slug),
        fetchWhitelabelSettings()
      ]);
      setPreviewQuizConfig(config);
      setWhitelabelSettings(wlSettings);
    } catch (error) {
      console.error("Error fetching data for preview:", error);
      setPreviewQuizConfig(null);
      setWhitelabelSettings(null);
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
    if(!baseUrl) return;
    const url = `${baseUrl}/${slug}`;
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

  const conversionMetric = whitelabelSettings?.conversionMetric || 'start_vs_complete';
  const conversionDenominator = conversionMetric === 'first_answer_vs_complete' 
    ? (overallStats?.totalFirstAnswers || 0)
    : (overallStats?.totalStarted || 0);

  const overallConversionRate = overallStats && conversionDenominator > 0 
    ? ((overallStats.totalCompleted / conversionDenominator) * 100).toFixed(1) 
    : "0.0";
    
  const conversionDescription = conversionMetric === 'first_answer_vs_complete'
    ? 'Finalizados / Engajados'
    : 'Finalizados / Iniciados';

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
            <h1 className="font-display text-3xl font-bold text-primary">LP de Alta Performasse</h1>
            <p className="text-muted-foreground">Gerencie seus quizzes e acompanhe o desempenho.</p>
        </div>
        <div className="flex items-center justify-end gap-2 flex-wrap">
          <DateRangePicker date={dateRange} onDateChange={setDateRange} />
          <Select onValueChange={handleDatePresetChange} defaultValue={whitelabelSettings?.dashboardDefaultFilter || 'last7'}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Período pré-definido" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Hoje</SelectItem>
              <SelectItem value="yesterday">Ontem</SelectItem>
              <SelectItem value="last7">Últimos 7 dias</SelectItem>
              <SelectItem value="last30">Últimos 30 dias</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            variant="outline" 
            size="icon"
            onClick={fetchData} 
            disabled={isFetchingData}
            title="Recarregar dados"
          >
            {isFetchingData ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
            <span className="sr-only">Recarregar</span>
          </Button>
          <Link href="/config/dashboard/quiz/create">
            <Button size="lg" className="flex items-center gap-2 shadow-sm whitespace-nowrap">
              <PlusCircle className="h-5 w-5" />
              Criar Quiz
            </Button>
          </Link>
        </div>
      </div>

      {isLoadingStats ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1,2,3,4].map(i => (
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
      ) : overallStats ? (
        <>
          <h2 className="text-2xl font-semibold text-foreground tracking-tight -mb-4">Resumo de Desempenho</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard title="Quizzes Iniciados" value={overallStats.totalStarted} icon={Users} description="No período selecionado." />
            <StatCard title="Quizzes Engajados" value={overallStats.totalFirstAnswers || 0} icon={MousePointerClick} description="Responderam a 1ª pergunta." />
            <StatCard title="Quizzes Finalizados" value={overallStats.totalCompleted} icon={CheckCircle2} description="No período selecionado." />
            <StatCard 
              title="Taxa de Conclusão Geral" 
              value={`${overallConversionRate}%`} 
              icon={Target} 
              description={conversionDescription} 
            />
          </div>
          {overallStats.mostEngagingQuiz && (
            <Card className="shadow-lg bg-card overflow-hidden">
              <CardHeader>
                <div className="flex items-center gap-2">
                   <TrendingUp className="h-6 w-6 text-primary" />
                   <CardTitle className="text-xl">Quiz em Destaque: {overallStats.mostEngagingQuiz.dashboardName || overallStats.mostEngagingQuiz.title}</CardTitle>
                </div>
                <CardDescription>Com a maior taxa de conclusão ({overallStats.mostEngagingQuiz.conversionRate}%) no período selecionado.</CardDescription>
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
      ) : <p>Nenhum dado de estatística encontrado para o período selecionado.</p>}

      <h2 className="text-2xl font-semibold text-foreground tracking-tight -mb-4">Seus Quizzes</h2>
      {isLoadingList ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-lg">Carregando seus quizzes...</p>
        </div>
      ) : quizzes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quizzes.map((quiz) => {
             const conversionDenominatorCard = conversionMetric === 'first_answer_vs_complete' 
                ? (quiz.firstAnswerCount || 0)
                : (quiz.startedCount || 0);

            const conversionRate = conversionDenominatorCard > 0 ? ((quiz.completedCount || 0) / conversionDenominatorCard) * 100 : 0;
            const displayTitle = quiz.dashboardName || quiz.title;
            const isActive = quiz.isActive ?? true;
            return (
            <Card key={quiz.slug} className={`shadow-lg hover:shadow-xl transition-shadow bg-card flex flex-col ${!isActive ? 'opacity-60' : ''}`}>
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                    <FileText className="h-8 w-8 text-primary mt-1" />
                    <div className='flex items-center gap-2'>
                        <Badge variant={isActive ? 'default' : 'secondary'} className={`${isActive ? 'bg-green-100 text-green-800 border-green-200' : 'bg-gray-100 text-gray-800 border-gray-200'}`}>
                           {isActive ? 'Ativo' : 'Inativo'}
                        </Badge>
                        {quiz.slug === DEFAULT_QUIZ_SLUG && (
                            <Badge variant="secondary" className="flex items-center gap-1">
                                <Lock className="h-3 w-3" /> Padrão
                            </Badge>
                        )}
                    </div>
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
                  <span className="text-muted-foreground flex items-center"><MousePointerClick className="h-4 w-4 mr-1.5"/> Engajados:</span>
                  <span className="font-semibold">{quiz.firstAnswerCount || 0}</span>
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
                   <p className="text-xs text-muted-foreground mt-1">{conversionDescription}</p>
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
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full flex items-center gap-1"
                  onClick={() => {
                      if (baseUrl) {
                          window.open(`${baseUrl}/${quiz.slug}`, '_blank');
                      }
                  }}
                  disabled={!baseUrl}
                >
                  <ExternalLink className="h-4 w-4" /> Abrir Quiz
                </Button>
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
                  disabled={!baseUrl}
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
                O quiz padrão já está ativo na sua página inicial, se configurado.
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

      <Dialog open={isPreviewModalOpen} onOpenChange={(open) => {
        if (!open) {
          setPreviewQuizConfig(null); 
          setWhitelabelSettings(null);
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
            ) : previewQuizConfig && whitelabelSettings ? (
              <QuizForm
                quizQuestions={previewQuizConfig.questions}
                quizSlug={previewQuizConfig.slug}
                quizTitle={previewQuizConfig.title}
                quizDescription={previewQuizConfig.description}
                logoUrl={whitelabelSettings.logoUrl || "https://placehold.co/150x50.png?text=Logo"}
                footerCopyrightText={whitelabelSettings.footerCopyrightText || `© ${new Date().getFullYear()} Preview`}
                websiteUrl={whitelabelSettings.websiteUrl}
                instagramUrl={whitelabelSettings.instagramUrl}
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
                useCustomTheme={previewQuizConfig.useCustomTheme}
                customTheme={previewQuizConfig.customTheme}
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
