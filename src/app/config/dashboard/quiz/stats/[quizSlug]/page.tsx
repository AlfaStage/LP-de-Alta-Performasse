
"use client";

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ArrowLeft, Users, CheckCircle2, Target, BarChart3, Info, AlertTriangle, FileText, MessageSquare, ListChecks, Edit3 } from 'lucide-react';
import type { QuizConfig, QuizQuestion, QuizAnalyticsData, QuizQuestionAnalytics, QuestionSpecificAnalytics } from '@/types/quiz';
import { getQuizConfigForPreview, getQuizAnalyticsBySlug, getQuizQuestionAnalytics } from '@/app/config/dashboard/quiz/actions';
import { defaultContactStep } from '@/config/quizConfig';


function StatDisplayCard({ title, value, icon: Icon, subtext }: { title: string, value: string | number, icon: React.ElementType, subtext?: string }) {
  return (
    <Card className="shadow-md bg-card hover:shadow-lg transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-5 w-5 text-primary" />
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-card-foreground">{value}</div>
        {subtext && <p className="text-xs text-muted-foreground pt-1">{subtext}</p>}
      </CardContent>
    </Card>
  );
}

function getQuestionTypeIcon(type: QuizQuestion['type']) {
  switch (type) {
    case 'radio': return ListChecks;
    case 'checkbox': return MessageSquare;
    case 'textFields': return Edit3;
    default: return FileText;
  }
}


export default function QuizStatsPage() {
  const params = useParams();
  const router = useRouter();
  const quizSlug = typeof params.quizSlug === 'string' ? params.quizSlug : '';

  const [quizConfig, setQuizConfig] = useState<QuizConfig | null>(null);
  const [aggregateStats, setAggregateStats] = useState<QuizAnalyticsData | null>(null);
  const [questionStats, setQuestionStats] = useState<QuizQuestionAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatsData = useCallback(async () => {
    if (!quizSlug) {
      setError("Slug do quiz não encontrado na URL.");
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const [configData, aggData, qStatsData] = await Promise.all([
        getQuizConfigForPreview(quizSlug),
        getQuizAnalyticsBySlug(quizSlug),
        getQuizQuestionAnalytics(quizSlug)
      ]);

      if (!configData) {
        setError(`Não foi possível carregar a configuração do quiz "${quizSlug}". Ele pode não existir.`);
        setQuizConfig(null);
      } else {
        setQuizConfig(configData);
      }

      if (!aggData) {
        console.warn(`Estatísticas agregadas para o quiz "${quizSlug}" não encontradas.`);
        setAggregateStats(null); 
      } else {
        setAggregateStats(aggData);
      }
      
      setQuestionStats(qStatsData || {});

    } catch (err) {
      console.error("Erro ao buscar dados de estatísticas do quiz:", err);
      setError(err instanceof Error ? err.message : "Ocorreu um erro desconhecido ao buscar os dados.");
    } finally {
      setIsLoading(false);
    }
  }, [quizSlug]);

  useEffect(() => {
    fetchStatsData();
  }, [fetchStatsData]);

  const conversionRate = aggregateStats?.startedCount && aggregateStats.startedCount > 0
    ? ((aggregateStats.completedCount || 0) / aggregateStats.startedCount * 100).toFixed(1) + "%"
    : "0.0%";

  const contentQuestions = quizConfig?.questions.filter(q => q.id !== defaultContactStep.id) || [];
  const contactStepConfig = quizConfig?.questions.find(q => q.id === defaultContactStep.id);
  const contactStepStats = contactStepConfig && questionStats ? questionStats[contactStepConfig.id] : null;


  if (isLoading) {
    return (
      <div className="p-6 md:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="h-10 w-36" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
        <Skeleton className="h-8 w-1/3 mt-6 mb-4" />
        {[1, 2].map(i => (
          <Card key={i} className="shadow-sm">
            <CardHeader><Skeleton className="h-6 w-3/4" /></CardHeader>
            <CardContent><Skeleton className="h-20 w-full" /></CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 md:p-8">
        <Button variant="outline" onClick={() => router.push('/config/dashboard')} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para o Dashboard
        </Button>
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Erro ao Carregar Estatísticas</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }
  
  if (!quizConfig || !aggregateStats) {
     return (
      <div className="p-6 md:p-8">
        <Button variant="outline" onClick={() => router.push('/config/dashboard')} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para o Dashboard
        </Button>
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Dados Indisponíveis</AlertTitle>
          <AlertDescription>Não foi possível carregar todas as informações para o quiz "{quizSlug}". Verifique se o quiz existe e possui dados.</AlertDescription>
        </Alert>
      </div>
    );
  }


  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            Estatísticas: {aggregateStats.dashboardName || aggregateStats.title}
          </h1>
          <p className="text-muted-foreground">Análise detalhada do desempenho do quiz <code className="text-xs bg-muted px-1 py-0.5 rounded-sm">/{quizSlug}</code>.</p>
        </div>
        <Button variant="outline" onClick={() => router.push('/config/dashboard')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para o Dashboard
        </Button>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Resumo Geral do Quiz
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatDisplayCard title="Iniciados" value={aggregateStats.startedCount || 0} icon={Users} subtext="Total de vezes que o quiz foi iniciado."/>
          <StatDisplayCard title="Finalizados" value={aggregateStats.completedCount || 0} icon={CheckCircle2} subtext="Total de vezes que o quiz foi completado."/>
          <StatDisplayCard title="Taxa de Conversão" value={conversionRate} icon={Target} subtext="Percentual de finalizações sobre inícios."/>
        </CardContent>
      </Card>
      
      <h2 className="text-xl md:text-2xl font-semibold text-foreground pt-4">Detalhes por Pergunta</h2>
      
      {contentQuestions.length === 0 && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Nenhuma pergunta de conteúdo</AlertTitle>
          <AlertDescription>Este quiz não possui perguntas de conteúdo configuradas para exibir estatísticas detalhadas (além da etapa de contato).</AlertDescription>
        </Alert>
      )}

      {contentQuestions.map((question, index) => {
        const qStat: QuestionSpecificAnalytics | undefined = questionStats ? questionStats[question.id] : undefined;
        const QuestionTypeIcon = getQuestionTypeIcon(question.type);

        return (
          <Card key={question.id} className="shadow-md hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start gap-3">
                <QuestionTypeIcon className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                <div>
                  <CardTitle className="text-lg">Pergunta {index + 1}: {question.text}</CardTitle>
                  <CardDescription>ID: {question.id} | Respostas: {qStat?.totalAnswers || 0}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {!qStat || qStat.totalAnswers === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma resposta registrada para esta pergunta ainda.</p>
              ) : (
                (question.type === 'radio' || question.type === 'checkbox') && question.options ? (
                  <div className="space-y-3">
                    {question.options.map(option => {
                      const count = qStat.options?.[option.value] || 0;
                      const percentage = qStat.totalAnswers > 0 ? (count / qStat.totalAnswers) * 100 : 0;
                      return (
                        <div key={option.value}>
                          <div className="flex justify-between items-center text-sm mb-1">
                            <span className="text-muted-foreground">{option.label}</span>
                            <span className="font-semibold text-card-foreground">{count} ({percentage.toFixed(1)}%)</span>
                          </div>
                          <Progress value={percentage} className="h-2.5" />
                        </div>
                      );
                    })}
                  </div>
                ) : question.type === 'textFields' && qStat ? (
                  <p className="text-sm text-muted-foreground">Esta etapa de campos de texto foi submetida {qStat.totalAnswers} vez(es).</p>
                ) : (
                   <p className="text-sm text-muted-foreground">Não há opções visuais para este tipo de pergunta ou estatísticas detalhadas não disponíveis.</p>
                )
              )}
            </CardContent>
          </Card>
        );
      })}

      {contactStepConfig && contactStepStats && (
         <Card className="shadow-md hover:shadow-lg transition-shadow mt-4 border-dashed border-primary/50">
            <CardHeader>
              <div className="flex items-start gap-3">
                <getQuestionTypeIcon type={contactStepConfig.type} className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                <div>
                  <CardTitle className="text-lg">Etapa de Contato: {contactStepConfig.text.substring(0,60)}...</CardTitle>
                  <CardDescription>ID: {contactStepConfig.id} | Submissões: {contactStepStats.totalAnswers || 0}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground">A etapa de contato foi preenchida {contactStepStats.totalAnswers || 0} vez(es).</p>
            </CardContent>
          </Card>
      )}
       {!contactStepStats && contactStepConfig && (
         <Card className="shadow-md hover:shadow-lg transition-shadow mt-4 border-dashed border-primary/50">
            <CardHeader>
               <div className="flex items-start gap-3">
                 <getQuestionTypeIcon type={contactStepConfig.type} className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                 <div>
                    <CardTitle className="text-lg">Etapa de Contato: {contactStepConfig.text.substring(0,60)}...</CardTitle>
                    <CardDescription>ID: {contactStepConfig.id}</CardDescription>
                 </div>
               </div>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground">Nenhuma submissão registrada para a etapa de contato ainda.</p>
            </CardContent>
          </Card>
       )}


    </div>
  );
}
