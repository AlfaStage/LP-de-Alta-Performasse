
"use client";
import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Save, AlertTriangle, Info, Loader2, ArrowLeft, Wand2, FileJson, Eye, MessageSquareText, ListChecks, Edit3, Text, Phone, Mail, PlusCircle, Trash2, Users, CheckCircle2, Target, BarChart3, Percent } from 'lucide-react';
import { getQuizForEdit, updateQuizAction, type QuizEditData, getQuizAnalyticsBySlug, getQuizQuestionAnalytics } from '@/app/config/dashboard/quiz/actions';
import type { QuizQuestion, QuizOption, FormFieldConfig, QuizAnalyticsData, QuizQuestionAnalytics, QuestionSpecificAnalytics } from '@/types/quiz';
import { defaultContactStep } from '@/config/quizConfig';
import { APP_BASE_URL } from '@/config/appConfig';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import QuizFormLoading from '@/components/quiz/QuizFormLoading';
import { fetchWhitelabelSettings } from '@/app/config/dashboard/settings/actions';
import type { WhitelabelConfig } from '@/types/quiz';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';


const QuizForm = dynamic(() => import('@/components/quiz/QuizForm'), {
  ssr: false,
  loading: () => <div className="p-4"><QuizFormLoading/></div>,
});

const exampleQuestion: QuizQuestion = {
  id: "q_example_edit",
  name: "exampleQuestionEdit",
  icon: "HelpCircle",
  text: "Esta é uma pergunta de exemplo para edição?",
  explanation: "Explicação adicional para a pergunta de exemplo editada.",
  type: "radio",
  options: [
    { value: "yes_edit", label: "Sim (editado)", icon: "ThumbsUp", explanation:"Explicação para sim." },
    { value: "no_edit", label: "Não (editado)", icon: "ThumbsDown", explanation:"Explicação para não." }
  ]
};
const exampleQuizJson = JSON.stringify([exampleQuestion], null, 2);


export default function EditQuizPage() {
  const router = useRouter();
  const params = useParams();
  const quizSlugFromParams = typeof params.quizSlug === 'string' ? params.quizSlug : '';

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState(quizSlugFromParams);
  const [questionsJson, setQuestionsJson] = useState('');
  const [interactiveQuestions, setInteractiveQuestions] = useState<QuizQuestion[]>([]);
  const [currentTab, setCurrentTab] = useState<'interactive' | 'json' | 'stats'>('interactive');
  const [originalQuizData, setOriginalQuizData] = useState<QuizEditData | null>(null);
  const [quizAggregatedAnalytics, setQuizAggregatedAnalytics] = useState<QuizAnalyticsData | null>(null);
  const [quizQuestionLevelAnalytics, setQuizQuestionLevelAnalytics] = useState<QuizQuestionAnalytics | null>(null);
  
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [isFetchingAnalytics, setIsFetchingAnalytics] = useState(true);

  const [previewQuizData, setPreviewQuizData] = useState<QuizQuestion[] | null>(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [whitelabelSettings, setWhitelabelSettings] = useState<Partial<WhitelabelConfig>>({});


  useEffect(() => {
    async function fetchPreviewConfig() {
      const config = await fetchWhitelabelSettings();
      setWhitelabelSettings(config);
    }
    fetchPreviewConfig();
  }, []);

  const fetchQuizData = useCallback(async () => {
    if (!quizSlugFromParams) {
        setError("Slug do quiz não encontrado na URL.");
        setIsFetching(false);
        setIsFetchingAnalytics(false);
        return;
    }
    setIsFetching(true);
    setIsFetchingAnalytics(true);
    setError(null);
    setSuccess(null);

    try {
      const [data, aggAnalyticsData, questionAnalyticsData] = await Promise.all([
        getQuizForEdit(quizSlugFromParams),
        getQuizAnalyticsBySlug(quizSlugFromParams),
        getQuizQuestionAnalytics(quizSlugFromParams)
      ]);

      if (data) {
        setOriginalQuizData(data);
        setTitle(data.title);
        setSlug(data.slug);
        setQuestionsJson(data.questionsJson);
        try {
            const parsedForInteractive = JSON.parse(data.questionsJson);
            if (Array.isArray(parsedForInteractive)) {
                setInteractiveQuestions(parsedForInteractive);
            } else {
                setInteractiveQuestions([]);
            }
        } catch (e) {
            console.error("Failed to parse existing questions for interactive builder:", e);
            setInteractiveQuestions([]);
        }
      } else {
        setError(`Quiz com slug "${quizSlugFromParams}" não encontrado ou falha ao carregar.`);
      }

      if (aggAnalyticsData) {
        setQuizAggregatedAnalytics(aggAnalyticsData);
      } else {
        console.warn(`Aggregate analytics data for quiz "${quizSlugFromParams}" not found.`);
      }
      
      if (questionAnalyticsData) {
        setQuizQuestionLevelAnalytics(questionAnalyticsData);
      } else {
        console.warn(`Question level analytics data for quiz "${quizSlugFromParams}" not found.`);
      }


    } catch (err) {
      setError("Erro ao buscar dados do quiz para edição.");
      console.error(err);
    } finally {
      setIsFetching(false);
      setIsFetchingAnalytics(false);
    }
  }, [quizSlugFromParams]);

  useEffect(() => {
    fetchQuizData();
  }, [fetchQuizData]);

    const addQuestion = () => {
    setInteractiveQuestions([
      ...interactiveQuestions,
      { 
        id: `q_${interactiveQuestions.length + 1}_${Date.now().toString(36)}`, 
        name: `question${interactiveQuestions.length + 1}`, 
        text: '', 
        explanation: '',
        type: 'radio', 
        icon: 'HelpCircle', 
        options: [], 
        fields: [] 
      }
    ]);
  };

  const updateQuestion = (index: number, field: keyof QuizQuestion, value: any) => {
    const newQuestions = [...interactiveQuestions];
    newQuestions[index] = { ...newQuestions[index], [field]: value };
    if (field === 'type') { 
        newQuestions[index].options = [];
        newQuestions[index].fields = [];
    }
    setInteractiveQuestions(newQuestions);
  };

  const removeQuestion = (index: number) => {
    setInteractiveQuestions(interactiveQuestions.filter((_, i) => i !== index));
  };

  const addOption = (qIndex: number) => {
    const newQuestions = [...interactiveQuestions];
    const question = newQuestions[qIndex];
    question.options = [...(question.options || []), { value: `opt${(question.options?.length || 0) + 1}_${Date.now().toString(36)}`, label: '', icon: undefined, explanation: '', imageUrl: '', dataAiHint: '' }];
    setInteractiveQuestions(newQuestions);
  };

  const updateOption = (qIndex: number, oIndex: number, field: keyof QuizOption, value: string) => {
    const newQuestions = [...interactiveQuestions];
    const question = newQuestions[qIndex];
    if (question.options) {
      question.options[oIndex] = { ...question.options[oIndex], [field]: value };
      setInteractiveQuestions(newQuestions);
    }
  };

  const removeOption = (qIndex: number, oIndex: number) => {
    const newQuestions = [...interactiveQuestions];
    const question = newQuestions[qIndex];
    if (question.options) {
      question.options = question.options.filter((_, i) => i !== oIndex);
      setInteractiveQuestions(newQuestions);
    }
  };
  
  const addFormField = (qIndex: number) => {
    const newQuestions = [...interactiveQuestions];
    const question = newQuestions[qIndex];
    question.fields = [...(question.fields || []), { name: `field${(question.fields?.length || 0) + 1}_${Date.now().toString(36)}`, label: '', type: 'text', placeholder: '', icon: 'Type' }];
    setInteractiveQuestions(newQuestions);
  };

  const updateFormField = (qIndex: number, fIndex: number, field: keyof FormFieldConfig, value: string) => {
    const newQuestions = [...interactiveQuestions];
    const question = newQuestions[qIndex];
    if (question.fields) {
      question.fields[fIndex] = { ...question.fields[fIndex], [field]: value };
      setInteractiveQuestions(newQuestions);
    }
  };

  const removeFormField = (qIndex: number, fIndex: number) => {
    const newQuestions = [...interactiveQuestions];
    const question = newQuestions[qIndex];
    if (question.fields) {
      question.fields = question.fields.filter((_, i) => i !== fIndex);
      setInteractiveQuestions(newQuestions);
    }
  };

  const handleTabChange = (newTab: 'interactive' | 'json' | 'stats') => {
    if (newTab === 'json' && currentTab === 'interactive') {
      setQuestionsJson(JSON.stringify(interactiveQuestions, null, 2));
    } else if (newTab === 'interactive' && currentTab === 'json') {
      try {
        if (questionsJson.trim()) {
          const parsed = JSON.parse(questionsJson);
          if (Array.isArray(parsed)) {
            setInteractiveQuestions(parsed);
          } else {
            alert("JSON inválido: deve ser um array de perguntas.");
          }
        } else {
           setInteractiveQuestions([]); 
        }
      } catch (e) {
        alert("Erro ao parsear JSON. Verifique a sintaxe.");
      }
    }
    setCurrentTab(newTab);
  };

  const handleOpenPreview = () => {
    let questionsForPreview: QuizQuestion[];
    if (currentTab === 'interactive') {
      questionsForPreview = interactiveQuestions;
    } else if (currentTab === 'json') {
      try {
        questionsForPreview = questionsJson.trim() ? JSON.parse(questionsJson) : [];
         if (!Array.isArray(questionsForPreview)) {
          alert("JSON inválido para pré-visualização.");
          return;
        }
      } catch (e) {
        alert("JSON inválido para pré-visualização.");
        return;
      }
    } else { // currentTab is 'stats'
        // Use interactiveQuestions for preview from stats tab, or parsed JSON if interactive is empty
        if (interactiveQuestions.length > 0) {
            questionsForPreview = interactiveQuestions;
        } else {
            try {
                questionsForPreview = questionsJson.trim() ? JSON.parse(questionsJson) : [];
                if (!Array.isArray(questionsForPreview)) {
                    alert("JSON de perguntas (da aba JSON) inválido para pré-visualização.");
                    return;
                }
            } catch (e) {
                 alert("JSON de perguntas (da aba JSON) inválido para pré-visualização.");
                return;
            }
        }
    }
    setPreviewQuizData([...questionsForPreview, defaultContactStep]);
    setIsPreviewModalOpen(true);
  };
  
  const mockSubmitOverride = async (data: Record<string, any>) => {
    console.log("Preview Submit:", data);
    alert("Submissão simulada! Verifique o console para os dados.");
  };


  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    if (!title.trim() || !slug.trim()) {
      setError("Título e slug são obrigatórios.");
      setIsLoading(false);
      return;
    }
    
    let parsedQuestions: QuizQuestion[];
    if (currentTab === 'json') {
        if (!questionsJson.trim()) {
            parsedQuestions = []; 
        } else {
            try {
                parsedQuestions = JSON.parse(questionsJson);
                if (!Array.isArray(parsedQuestions)) {
                    setError("O JSON das perguntas deve ser um array.");
                    setIsLoading(false);
                    return;
                }
            } catch (jsonError) {
                setError("JSON das perguntas inválido. Verifique a sintaxe.");
                setIsLoading(false);
                return;
            }
        }
    } else { // 'interactive' or 'stats' tab, use interactiveQuestions
      parsedQuestions = interactiveQuestions;
    }

    try {
      const result = await updateQuizAction({ title, slug, questions: parsedQuestions });
      if (result.success) {
        setSuccess(`Quiz "${title}" atualizado com sucesso!`);
        fetchQuizData(); 
      } else {
        setError(result.message || 'Falha ao atualizar o quiz.');
      }
    } catch (err) {
      setError('Ocorreu um erro ao tentar atualizar o quiz.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };
  
  const quizConversionRate = quizAggregatedAnalytics && quizAggregatedAnalytics.startedCount && quizAggregatedAnalytics.startedCount > 0 
    ? ((quizAggregatedAnalytics.completedCount || 0) / quizAggregatedAnalytics.startedCount * 100) 
    : 0;

  if (isFetching) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Carregando dados do quiz...</p>
      </div>
    );
  }

  if (!originalQuizData && !isFetching && error) {
     return (
        <div className="flex flex-col items-center justify-center py-10">
            <Alert variant="destructive" className="max-w-lg">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Erro ao Carregar Quiz</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
            <Button variant="outline" asChild className="mt-4">
                <Link href="/config/dashboard">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para o Dashboard
                </Link>
            </Button>
        </div>
     )
  }


  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
            <h1 className="text-2xl font-semibold md:text-3xl text-foreground">Editar Quiz: {originalQuizData?.title || slug}</h1>
            <p className="text-muted-foreground">Modifique os detalhes, perguntas e veja estatísticas do seu quiz.</p>
        </div>
         <div className="flex flex-wrap gap-2">
            <Button onClick={handleOpenPreview} variant="outline" disabled={!title.trim()}>
                <Eye className="mr-2 h-4 w-4" /> Pré-visualizar
            </Button>
            <Button variant="outline" asChild>
                <Link href="/config/dashboard">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Dashboard
                </Link>
            </Button>
        </div>
      </div>

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-xl">Estatísticas Agregadas deste Quiz</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {isFetchingAnalytics ? (
            <>
              <div><Skeleton className="h-6 w-24 mb-1" /><Skeleton className="h-8 w-12" /></div>
              <div><Skeleton className="h-6 w-24 mb-1" /><Skeleton className="h-8 w-12" /></div>
              <div><Skeleton className="h-6 w-24 mb-1" /><Skeleton className="h-8 w-12" /></div>
            </>
          ) : quizAggregatedAnalytics ? (
            <>
              <div className="flex flex-col p-3 rounded-md border bg-muted/50">
                <span className="text-sm text-muted-foreground flex items-center"><Users className="h-4 w-4 mr-2" />Iniciados</span>
                <span className="text-2xl font-bold text-card-foreground">{quizAggregatedAnalytics.startedCount || 0}</span>
              </div>
              <div className="flex flex-col p-3 rounded-md border bg-muted/50">
                <span className="text-sm text-muted-foreground flex items-center"><CheckCircle2 className="h-4 w-4 mr-2" />Finalizados</span>
                <span className="text-2xl font-bold text-card-foreground">{quizAggregatedAnalytics.completedCount || 0}</span>
              </div>
              <div className="flex flex-col p-3 rounded-md border bg-muted/50">
                <span className="text-sm text-muted-foreground flex items-center"><Target className="h-4 w-4 mr-2" />Taxa de Conversão</span>
                 <span className="text-2xl font-bold text-card-foreground">{quizConversionRate.toFixed(1)}%</span>
                 <Progress value={quizConversionRate} className="h-1.5 mt-1" />
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground col-span-full">Não foi possível carregar as estatísticas agregadas deste quiz.</p>
          )}
        </CardContent>
      </Card>

      <Tabs value={currentTab} onValueChange={(value) => handleTabChange(value as 'interactive' | 'json' | 'stats')} className="mb-6">
          <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="interactive"><Wand2 className="mr-2 h-4 w-4" />Construtor</TabsTrigger>
              <TabsTrigger value="json"><FileJson className="mr-2 h-4 w-4" />JSON</TabsTrigger>
              <TabsTrigger value="stats"><BarChart3 className="mr-2 h-4 w-4" />Estatísticas</TabsTrigger>
          </TabsList>
          
          <TabsContent value="interactive">
            <form onSubmit={handleSubmit}>
              <Card className="shadow-lg mb-6">
                  <CardHeader>
                  <CardTitle>Detalhes do Quiz</CardTitle>
                  <CardDescription>
                      Modifique o título e as perguntas do quiz. O slug não pode ser alterado.
                      A etapa de contato é gerenciada automaticamente.
                  </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                      <div className="space-y-2">
                      <Label htmlFor="title">Título do Quiz</Label>
                      <Input
                          id="title"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          placeholder="Ex: Quiz de Qualificação Capilar"
                          required
                      />
                      </div>
                      <div className="space-y-2">
                      <Label htmlFor="slug">Slug do Quiz (URL)</Label>
                      <Input
                          id="slug"
                          value={slug}
                          readOnly
                          disabled
                          className="bg-muted/50 cursor-not-allowed"
                      />
                      <p className="text-xs text-muted-foreground">
                          Acessível em: {APP_BASE_URL}/{slug || "seu-slug"} (Slug não é editável)
                      </p>
                      </div>
                  </CardContent>
              </Card>
              <Card className="shadow-lg">
                  <CardHeader>
                      <CardTitle>Construtor Interativo de Perguntas</CardTitle>
                      <CardDescription>
                      Adicione e configure as perguntas do seu quiz. A etapa de contato será adicionada automaticamente no final.
                      </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                      {interactiveQuestions.map((q, qIndex) => (
                      <Card key={q.id || `q_interactive_edit_${qIndex}`} className="p-4 space-y-3 bg-muted/30 shadow-md">
                          <div className="flex justify-between items-center mb-3">
                              <Label className="text-lg font-semibold text-foreground">Pergunta {qIndex + 1}</Label>
                              <Button variant="ghost" size="icon" onClick={() => removeQuestion(qIndex)} className="text-destructive hover:text-destructive/80">
                                  <Trash2 className="h-5 w-5" /> <span className="sr-only">Remover Pergunta</span>
                              </Button>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div><Label htmlFor={`q-${qIndex}-id`}>ID da Pergunta</Label><Input id={`q-${qIndex}-id`} placeholder="Ex: q1_pele (único)" value={q.id} onChange={(e) => updateQuestion(qIndex, 'id', e.target.value)} /></div>
                              <div><Label htmlFor={`q-${qIndex}-name`}>Nome/Chave (form)</Label><Input id={`q-${qIndex}-name`} placeholder="Ex: tipoPele" value={q.name} onChange={(e) => updateQuestion(qIndex, 'name', e.target.value)} /></div>
                          </div>

                          <div><Label htmlFor={`q-${qIndex}-text`}>Texto da Pergunta</Label><Textarea id={`q-${qIndex}-text`} placeholder="Qual o seu tipo de pele?" value={q.text} onChange={(e) => updateQuestion(qIndex, 'text', e.target.value)} /></div>
                          <div><Label htmlFor={`q-${qIndex}-explanation`}>Explicação (Opcional)</Label><Textarea id={`q-${qIndex}-explanation`} placeholder="Ajude o usuário a entender a pergunta." value={q.explanation || ''} onChange={(e) => updateQuestion(qIndex, 'explanation', e.target.value)} /></div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                  <Label htmlFor={`q-${qIndex}-icon`}>Ícone da Pergunta (Lucide)</Label>
                                  <Input id={`q-${qIndex}-icon`} placeholder="Ex: UserCircle" value={q.icon || ''} onChange={(e) => updateQuestion(qIndex, 'icon', e.target.value)} />
                              </div>
                              <div>
                                  <Label htmlFor={`q-${qIndex}-type`}>Tipo de Pergunta</Label>
                                  <Select value={q.type} onValueChange={(value) => updateQuestion(qIndex, 'type', value)}>
                                      <SelectTrigger id={`q-${qIndex}-type`}><SelectValue placeholder="Selecione o tipo" /></SelectTrigger>
                                      <SelectContent>
                                          <SelectItem value="radio"><ListChecks className="mr-2 h-4 w-4 inline-block" />Radio (Escolha Única)</SelectItem>
                                          <SelectItem value="checkbox"><MessageSquareText className="mr-2 h-4 w-4 inline-block" />Checkbox (Múltipla Escolha)</SelectItem>
                                          <SelectItem value="textFields"><Edit3 className="mr-2 h-4 w-4 inline-block" />Campos de Texto</SelectItem>
                                      </SelectContent>
                                  </Select>
                              </div>
                          </div>

                          {(q.type === 'radio' || q.type === 'checkbox') && (
                          <Card className="p-3 mt-2 bg-background/70">
                              <CardHeader className="p-2"><CardTitle className="text-md">Opções da Pergunta</CardTitle></CardHeader>
                              <CardContent className="space-y-3 p-2">
                                  {(q.options || []).map((opt, oIndex) => (
                                  <Card key={`q-${qIndex}-opt_edit_${oIndex}`} className="p-3 space-y-2 bg-muted/40">
                                      <div className="flex justify-between items-center">
                                          <Label className="text-sm font-medium">Opção {oIndex + 1}</Label>
                                          <Button variant="ghost" size="sm" onClick={() => removeOption(qIndex, oIndex)} className="text-destructive hover:text-destructive/80 -mr-2">
                                              <Trash2 className="h-4 w-4" />
                                          </Button>
                                      </div>
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                          <div><Label htmlFor={`q-${qIndex}-opt-${oIndex}-value`} className="text-xs">Valor</Label><Input id={`q-${qIndex}-opt-${oIndex}-value`} placeholder="Ex: opcao_a" value={opt.value} onChange={(e) => updateOption(qIndex, oIndex, 'value', e.target.value)} /></div>
                                          <div><Label htmlFor={`q-${qIndex}-opt-${oIndex}-label`} className="text-xs">Label Visível</Label><Input id={`q-${qIndex}-opt-${oIndex}-label`} placeholder="Ex: Opção A" value={opt.label} onChange={(e) => updateOption(qIndex, oIndex, 'label', e.target.value)} /></div>
                                      </div>
                                      <div><Label htmlFor={`q-${qIndex}-opt-${oIndex}-icon`} className="text-xs">Ícone (Lucide)</Label><Input id={`q-${qIndex}-opt-${oIndex}-icon`} placeholder="Ex: Smile (Opcional)" value={opt.icon || ''} onChange={(e) => updateOption(qIndex, oIndex, 'icon', e.target.value)} /></div>
                                      <div><Label htmlFor={`q-${qIndex}-opt-${oIndex}-explanation`} className="text-xs">Explicação (Opcional)</Label><Textarea id={`q-${qIndex}-opt-${oIndex}-explanation`} placeholder="Detalhe esta opção" value={opt.explanation || ''} onChange={(e) => updateOption(qIndex, oIndex, 'explanation', e.target.value)} rows={2}/></div>
                                      <div><Label htmlFor={`q-${qIndex}-opt-${oIndex}-imageUrl`} className="text-xs">URL da Imagem (Opcional)</Label><Input id={`q-${qIndex}-opt-${oIndex}-imageUrl`} placeholder="https://exemplo.com/imagem.png" value={opt.imageUrl || ''} onChange={(e) => updateOption(qIndex, oIndex, 'imageUrl', e.target.value)} /></div>
                                      <div><Label htmlFor={`q-${qIndex}-opt-${oIndex}-dataAiHint`} className="text-xs">Dica IA Imagem (Opcional)</Label><Input id={`q-${qIndex}-opt-${oIndex}-dataAiHint`} placeholder="Ex: pele clara" value={opt.dataAiHint || ''} onChange={(e) => updateOption(qIndex, oIndex, 'dataAiHint', e.target.value)} /></div>
                                  </Card>
                                  ))}
                                  <Button type="button" variant="outline" size="sm" onClick={() => addOption(qIndex)} className="mt-2 w-full">
                                      <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Opção
                                  </Button>
                              </CardContent>
                          </Card>
                          )}

                          {q.type === 'textFields' && (
                          <Card className="p-3 mt-2 bg-background/70">
                              <CardHeader className="p-2"><CardTitle className="text-md">Campos de Entrada</CardTitle></CardHeader>
                              <CardContent className="space-y-3 p-2">
                                  {(q.fields || []).map((field, fIndex) => (
                                  <Card key={`q-${qIndex}-field_edit_${fIndex}`} className="p-3 space-y-2 bg-muted/40">
                                      <div className="flex justify-between items-center">
                                           <Label className="text-sm font-medium">Campo {fIndex + 1}</Label>
                                          <Button variant="ghost" size="sm" onClick={() => removeFormField(qIndex, fIndex)} className="text-destructive hover:text-destructive/80 -mr-2">
                                              <Trash2 className="h-4 w-4" />
                                          </Button>
                                      </div>
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                          <div><Label htmlFor={`q-${qIndex}-field-${fIndex}-name`} className="text-xs">Nome/Chave (form)</Label><Input id={`q-${qIndex}-field-${fIndex}-name`} placeholder="Ex: nomeCompleto" value={field.name} onChange={(e) => updateFormField(qIndex, fIndex, 'name', e.target.value)} /></div>
                                          <div><Label htmlFor={`q-${qIndex}-field-${fIndex}-label`} className="text-xs">Label Visível</Label><Input id={`q-${qIndex}-field-${fIndex}-label`} placeholder="Ex: Nome Completo" value={field.label} onChange={(e) => updateFormField(qIndex, fIndex, 'label', e.target.value)} /></div>
                                      </div>
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                          <div>
                                              <Label htmlFor={`q-${qIndex}-field-${fIndex}-type`} className="text-xs">Tipo do Campo</Label>
                                              <Select value={field.type} onValueChange={(val) => updateFormField(qIndex, fIndex, 'type', val as 'text'|'tel'|'email')}>
                                                  <SelectTrigger id={`q-${qIndex}-field-${fIndex}-type`}><SelectValue placeholder="Tipo do Campo" /></SelectTrigger>
                                                  <SelectContent>
                                                      <SelectItem value="text"><Text className="mr-2 h-4 w-4 inline-block" />Texto</SelectItem>
                                                      <SelectItem value="tel"><Phone className="mr-2 h-4 w-4 inline-block" />Telefone</SelectItem>
                                                      <SelectItem value="email"><Mail className="mr-2 h-4 w-4 inline-block" />Email</SelectItem>
                                                  </SelectContent>
                                              </Select>
                                          </div>
                                          <div><Label htmlFor={`q-${qIndex}-field-${fIndex}-icon`} className="text-xs">Ícone (Lucide)</Label><Input id={`q-${qIndex}-field-${fIndex}-icon`} placeholder="Ex: User (Opcional)" value={field.icon || ''} onChange={(e) => updateFormField(qIndex, fIndex, 'icon', e.target.value)} /></div>
                                      </div>
                                      <div><Label htmlFor={`q-${qIndex}-field-${fIndex}-placeholder`} className="text-xs">Placeholder (Opcional)</Label><Input id={`q-${qIndex}-field-${fIndex}-placeholder`} placeholder="Ex: Digite seu nome" value={field.placeholder || ''} onChange={(e) => updateFormField(qIndex, fIndex, 'placeholder', e.target.value)} /></div>
                                  </Card>
                                  ))}
                                  <Button type="button" variant="outline" size="sm" onClick={() => addFormField(qIndex)} className="mt-2 w-full">
                                      <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Campo de Entrada
                                  </Button>
                              </CardContent>
                          </Card>
                          )}
                      </Card>
                      ))}
                      <Button type="button" onClick={addQuestion} variant="outline" className="w-full mt-6 py-3 text-base shadow-sm">
                          <PlusCircle className="mr-2 h-5 w-5" /> Adicionar Nova Pergunta
                      </Button>
                  </CardContent>
                  <CardFooter className="flex flex-col items-start gap-4 p-6">
                      {error && !success && ( 
                      <Alert variant="destructive" className="w-full">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertTitle>Erro</AlertTitle>
                          <AlertDescription>{error}</AlertDescription>
                      </Alert>
                      )}
                      {success && (
                      <Alert variant="default" className="w-full bg-green-50 border-green-300 text-green-700 dark:bg-green-900/30 dark:border-green-700 dark:text-green-400">
                          <Save className="h-4 w-4 text-green-600 dark:text-green-400" />
                          <AlertTitle>Sucesso!</AlertTitle>
                          <AlertDescription>{success}</AlertDescription>
                      </Alert>
                      )}
                      <Button type="submit" className="text-base py-3 px-6 shadow-md" disabled={isLoading || isFetching}>
                      {isLoading ? (
                          <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Salvando Alterações...
                          </>
                      ) : (
                          <>
                          <Save className="mr-2 h-5 w-5" />
                          Salvar Alterações
                          </>
                      )}
                      </Button>
                  </CardFooter>
              </Card>
            </form>
          </TabsContent>
          <TabsContent value="json">
            <form onSubmit={handleSubmit}>
              <Card className="shadow-lg mb-6">
                    <CardHeader>
                    <CardTitle>Detalhes do Quiz (JSON)</CardTitle>
                    <CardDescription>
                        Modifique o título. O slug não pode ser alterado.
                    </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                        <Label htmlFor="title-json">Título do Quiz</Label>
                        <Input
                            id="title-json"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Ex: Quiz de Qualificação Capilar"
                            required
                        />
                        </div>
                        <div className="space-y-2">
                        <Label htmlFor="slug-json">Slug do Quiz (URL)</Label>
                        <Input
                            id="slug-json"
                            value={slug}
                            readOnly
                            disabled
                            className="bg-muted/50 cursor-not-allowed"
                        />
                        <p className="text-xs text-muted-foreground">
                            Acessível em: {APP_BASE_URL}/{slug || "seu-slug"} (Slug não é editável)
                        </p>
                        </div>
                    </CardContent>
              </Card>
              <Card className="shadow-lg">
                  <CardHeader>
                      <CardTitle>Perguntas do Quiz (Formato JSON)</CardTitle>
                      <CardDescription>
                      Edite o array de objetos das perguntas. Não inclua a etapa de contato aqui; ela é adicionada automaticamente.
                      </CardDescription>
                  </CardHeader>
                  <CardContent>
                      <Textarea
                          id="questionsJson"
                          value={questionsJson}
                          onChange={(e) => setQuestionsJson(e.target.value)}
                          placeholder="Cole aqui o array de objetos das perguntas em formato JSON."
                          rows={15}
                          required
                          className="font-mono text-xs bg-muted/20"
                      />
                      <Alert variant="default" className="mt-2">
                          <Info className="h-4 w-4" />
                          <AlertTitle>Estrutura JSON para Perguntas</AlertTitle>
                          <AlertDescription>
                          <p className="mb-2">Edite o array de objetos das perguntas. Nomes de ícones devem ser de `lucide-react`.</p>
                          <details>
                              <summary className="cursor-pointer text-primary hover:underline">Ver exemplo JSON (apenas perguntas de conteúdo)</summary>
                              <pre className="mt-2 p-2 bg-muted rounded-md text-xs overflow-x-auto">
                              {exampleQuizJson}
                              </pre>
                          </details>
                          </AlertDescription>
                      </Alert>
                  </CardContent>
                  <CardFooter className="flex flex-col items-start gap-4 p-6">
                      {error && !success && ( 
                      <Alert variant="destructive" className="w-full">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertTitle>Erro</AlertTitle>
                          <AlertDescription>{error}</AlertDescription>
                      </Alert>
                      )}
                      {success && (
                      <Alert variant="default" className="w-full bg-green-50 border-green-300 text-green-700 dark:bg-green-900/30 dark:border-green-700 dark:text-green-400">
                          <Save className="h-4 w-4 text-green-600 dark:text-green-400" />
                          <AlertTitle>Sucesso!</AlertTitle>
                          <AlertDescription>{success}</AlertDescription>
                      </Alert>
                      )}
                      <Button type="submit" className="text-base py-3 px-6 shadow-md" disabled={isLoading || isFetching}>
                      {isLoading ? (
                          <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Salvando Alterações...
                          </>
                      ) : (
                          <>
                          <Save className="mr-2 h-5 w-5" />
                          Salvar Alterações (JSON)
                          </>
                      )}
                      </Button>
                  </CardFooter>
              </Card>
            </form>
          </TabsContent>
          <TabsContent value="stats">
             <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="text-xl">Estatísticas Detalhadas das Perguntas</CardTitle>
                    <CardDescription>Veja como os usuários estão respondendo a cada pergunta deste quiz.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {isFetchingAnalytics && <div className="flex items-center justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /> <p className="ml-2">Carregando estatísticas...</p></div>}
                    {!isFetchingAnalytics && (!quizQuestionLevelAnalytics || Object.keys(quizQuestionLevelAnalytics).length === 0) && (
                        <Alert variant="default">
                            <Info className="h-4 w-4" />
                            <AlertTitle>Sem dados de perguntas</AlertTitle>
                            <AlertDescription>Ainda não há estatísticas detalhadas para as perguntas deste quiz ou elas não puderam ser carregadas.</AlertDescription>
                        </Alert>
                    )}
                    {!isFetchingAnalytics && quizQuestionLevelAnalytics && originalQuizData && (
                        (JSON.parse(originalQuizData.questionsJson) as QuizQuestion[]).map((quizQ, index) => {
                            const qStats = quizQuestionLevelAnalytics[quizQ.id];
                            return (
                                <Card key={quizQ.id} className="bg-muted/30 p-4">
                                    <CardHeader className="p-0 pb-3">
                                        <CardTitle className="text-lg font-medium">Pergunta {index + 1}: {quizQ.text.substring(0, 50)}{quizQ.text.length > 50 ? "..." : ""}</CardTitle>
                                        <CardDescription>ID: {quizQ.id} | Tipo: {quizQ.type} | Respostas Totais: {qStats?.totalAnswers || 0}</CardDescription>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        {!qStats && <p className="text-sm text-muted-foreground">Nenhuma resposta registrada para esta pergunta.</p>}
                                        {qStats && (qStats.type === 'radio' || qStats.type === 'checkbox') && qStats.options && quizQ.options && (
                                            <div className="space-y-2">
                                                {quizQ.options.map(optionDef => {
                                                    const count = qStats.options?.[optionDef.value] || 0;
                                                    const percentage = qStats.totalAnswers > 0 ? (count / qStats.totalAnswers) * 100 : 0;
                                                    // If multiple checkboxes selected, totalAnswers might be less than sum of option counts.
                                                    // For checkboxes, percentage can be > 100 if sum of option counts > totalAnswers (people can select multiple)
                                                    // Let's adjust percentage for checkbox to be based on total responses to that question, where one response can have multiple options.
                                                    // For a better representation of checkbox selection rate, we might use a different denominator.
                                                    // For now, (count / totalAnswers for this question) * 100.
                                                    const displayPercentage = qStats.totalAnswers > 0 ? (count / qStats.totalAnswers) * 100 : 0;

                                                    return (
                                                        <div key={optionDef.value} className="text-sm">
                                                            <div className="flex justify-between mb-0.5">
                                                                <span>{optionDef.label} ({count} resps.)</span>
                                                                <span className="font-semibold">{displayPercentage.toFixed(1)}%</span>
                                                            </div>
                                                            <Progress value={displayPercentage} className="h-2" />
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                        {qStats && qStats.type === 'textFields' && (
                                            <p className="text-sm text-muted-foreground">Esta etapa de campos de texto foi submetida {qStats.totalAnswers} vezes.</p>
                                        )}
                                    </CardContent>
                                </Card>
                            );
                        })
                    )}
                     {!isFetchingAnalytics && quizQuestionLevelAnalytics && !originalQuizData && (
                        <Alert variant="destructive">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle>Erro ao Carregar Definições do Quiz</AlertTitle>
                            <AlertDescription>Não foi possível carregar as definições das perguntas para exibir os labels das estatísticas.</AlertDescription>
                        </Alert>
                     )}
                </CardContent>
             </Card>
          </TabsContent>
      </Tabs>

      <Dialog open={isPreviewModalOpen} onOpenChange={setIsPreviewModalOpen}>
        <DialogContent className="max-w-2xl w-[95vw] h-[90vh] flex flex-col p-0">
          <DialogHeader className="p-4 border-b">
            <DialogTitle>Pré-visualização do Quiz: {title || originalQuizData?.title || "Quiz"}</DialogTitle>
          </DialogHeader>
           <div className="flex-grow overflow-y-auto bg-background"> 
            {previewQuizData ? (
              <QuizForm
                quizQuestions={previewQuizData}
                quizSlug={slug} 
                quizTitle={title || originalQuizData?.title || "Pré-visualização"}
                logoUrl={whitelabelSettings.logoUrl || "https://placehold.co/150x50.png?text=Logo"}
                footerCopyrightText={whitelabelSettings.footerCopyrightText || `© ${new Date().getFullYear()} Preview. Todos os direitos reservados.`}
                facebookPixelId="" 
                googleAnalyticsId="" 
                onSubmitOverride={mockSubmitOverride}
                onAbandonmentOverride={async () => { console.log("Preview abandonment") }}
                isPreview={true}
              />
            ) : <div className="p-4"><QuizFormLoading /></div>}
          </div>
          <DialogFooter className="p-4 border-t">
            <DialogClose asChild>
              <Button variant="outline">Fechar Pré-visualização</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}

