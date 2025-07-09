
"use client";
import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Save, AlertTriangle, Loader2, ArrowLeft, Wand2, FileJson, Eye, MessageSquareText, PlusCircle, Trash2, BadgeInfo, FileTextIcon, Link as LinkIconLucide, Palette, ToggleLeft, LayoutDashboard, BookOpen, ChevronsUpDown, Fingerprint, AudioWaveform, Image as ImageIconLucide, FileUp } from 'lucide-react';
import { getQuizForEdit, updateQuizAction, type QuizEditData } from '@/app/config/dashboard/quiz/actions';
import type { QuizQuestion, QuizOption, FormFieldConfig, WhitelabelConfig, QuizMessage } from '@/types/quiz';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import QuizFormLoading from '@/components/quiz/QuizFormLoading';
import { fetchWhitelabelSettings } from '@/app/config/dashboard/settings/actions';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import IconPicker from '@/components/dashboard/IconPicker';
import QuestionPreview from '@/components/dashboard/QuestionPreview';
import { cn } from '@/lib/utils';

const QuizForm = dynamic(() => import('@/components/quiz/QuizForm'), {
  ssr: false,
  loading: () => <div className="p-4"><QuizFormLoading/></div>,
});

const DEFAULT_QUIZ_DESCRIPTION = "Responda algumas perguntas para nos ajudar a entender suas preferências.";

export default function EditQuizPage() {
  const router = useRouter();
  const params = useParams();
  const quizSlugFromParams = typeof params.quizSlug === 'string' ? params.quizSlug : '';

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState(quizSlugFromParams);
  const [description, setDescription] = useState(DEFAULT_QUIZ_DESCRIPTION);
  const [dashboardName, setDashboardName] = useState('');
  const [questionsJson, setQuestionsJson] = useState('[\n  \n]');
  const [interactiveQuestions, setInteractiveQuestions] = useState<QuizQuestion[]>([]);
  const [messages, setMessages] = useState<QuizMessage[]>([]);
  const [isActive, setIsActive] = useState(true);
  const [useCustomTheme, setUseCustomTheme] = useState(false);
  const [customTheme, setCustomTheme] = useState<QuizEditData['customTheme']>({});
  const [displayMode, setDisplayMode] = useState<'step-by-step' | 'single-page'>('step-by-step');
  const [pixelSettings, setPixelSettings] = useState<QuizEditData['pixelSettings']>({});

  const [currentTab, setCurrentTab] = useState<'interactive' | 'json'>('interactive'); 
  const [originalQuizData, setOriginalQuizData] = useState<QuizEditData | null>(null);
  
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  const [previewQuizData, setPreviewQuizData] = useState<QuizQuestion[] | null>(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [whitelabelSettings, setWhitelabelSettings] = useState<Partial<WhitelabelConfig>>({});
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [baseUrl, setBaseUrl] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setBaseUrl(window.location.origin);
    }
    async function fetchPreviewConfig() {
      setIsLoadingPreview(true);
      const config = await fetchWhitelabelSettings();
      setWhitelabelSettings(config);
      setIsLoadingPreview(false);
    }
    fetchPreviewConfig();
  }, []);

  const fetchQuizData = useCallback(async () => {
    if (!quizSlugFromParams) {
        setError("Slug do quiz não encontrado na URL.");
        setIsFetching(false);
        return;
    }
    setIsFetching(true);
    setError(null);
    setSuccess(null);

    try {
      const data = await getQuizForEdit(quizSlugFromParams);

      if (data) {
        setOriginalQuizData(data);
        setTitle(data.title);
        setSlug(data.slug);
        setDescription(data.description || DEFAULT_QUIZ_DESCRIPTION);
        setDashboardName(data.dashboardName || data.title);
        setQuestionsJson(data.questionsJson);
        setMessages(data.messages || []);
        setIsActive(data.isActive ?? true);
        setUseCustomTheme(data.useCustomTheme ?? false);
        setCustomTheme(data.customTheme || {});
        setDisplayMode(data.displayMode || 'step-by-step');
        setPixelSettings(data.pixelSettings || {});
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
      
    } catch (err) {
      setError("Erro ao buscar dados do quiz para edição.");
      console.error(err);
    } finally {
      setIsFetching(false);
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
        newQuestions[index].options = (value === 'radio' || value === 'checkbox') ? [] : undefined;
        newQuestions[index].fields = value === 'textFields' ? [] : undefined;
    }
    setInteractiveQuestions(newQuestions);
  };

  const removeQuestion = (index: number) => {
    setInteractiveQuestions(interactiveQuestions.filter((_, i) => i !== index));
  };

  const addOption = (qIndex: number) => {
    const newQuestions = [...interactiveQuestions];
    const question = newQuestions[qIndex];
    if (!question.options) question.options = [];
    question.options.push({ value: `opt${(question.options.length || 0) + 1}_${Date.now().toString(36)}`, label: '', icon: undefined, explanation: '', imageUrl: '', dataAiHint: '' });
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
    if (!question.fields) question.fields = [];
    question.fields.push({ name: `field${(question.fields.length || 0) + 1}_${Date.now().toString(36)}`, label: '', type: 'text', placeholder: '', icon: 'Type' });
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

  const addMessage = () => {
    if (messages.length < 5) {
      setMessages([...messages, { id: `msg_${Date.now()}`, type: 'mensagem', content: '' }]);
    }
  };
  const removeMessage = (index: number) => {
    setMessages(messages.filter((_, i) => i !== index));
  };
  const updateMessage = (index: number, field: keyof QuizMessage, value: any) => {
    const newMessages = [...messages];
    newMessages[index] = { ...newMessages[index], [field]: value };
    if (field === 'type') {
      newMessages[index].content = '';
      newMessages[index].filename = '';
    }
    setMessages(newMessages);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, msgIndex: number) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (loadEvent) => {
        const base64Content = loadEvent.target?.result as string;
        const newMessages = [...messages];
        newMessages[msgIndex].content = base64Content;
        newMessages[msgIndex].filename = file.name;
        setMessages(newMessages);
      };
      reader.readAsDataURL(file);
    }
  };


  const handleTabChange = (newTab: 'interactive' | 'json') => {
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
    setIsLoadingPreview(true);
    setIsPreviewModalOpen(true);
    let questionsForPreview: QuizQuestion[];
    if (currentTab === 'interactive') {
      questionsForPreview = interactiveQuestions;
    } else {
      try {
        questionsForPreview = questionsJson.trim() ? JSON.parse(questionsJson) : [];
         if (!Array.isArray(questionsForPreview)) {
          alert("JSON inválido para pré-visualização.");
          setIsLoadingPreview(false);
          return;
        }
      } catch (e) {
        alert("JSON inválido para pré-visualização.");
        setIsLoadingPreview(false);
        return;
      }
    }
    setPreviewQuizData(questionsForPreview);
    setIsLoadingPreview(false);
  };
  
  const mockSubmitOverride = async (data: Record<string, any>) => {
    console.log("Preview Submit:", data);
    alert("Submissão simulada! Verifique o console para os dados.");
    setIsPreviewModalOpen(false);
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
        if (!questionsJson.trim() || questionsJson.trim() === '[]') {
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
    } else { 
      parsedQuestions = interactiveQuestions;
    }

    try {
      const result = await updateQuizAction({ 
        title, 
        slug, 
        description: description || DEFAULT_QUIZ_DESCRIPTION,
        dashboardName: dashboardName || title,
        questions: parsedQuestions,
        messages: messages,
        isActive: isActive,
        useCustomTheme: useCustomTheme,
        customTheme: customTheme,
        displayMode: displayMode,
        pixelSettings: pixelSettings,
      });
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
            <h1 className="text-2xl font-semibold md:text-3xl text-foreground">Editar Quiz: {originalQuizData?.dashboardName || originalQuizData?.title || slug}</h1>
            <p className="text-muted-foreground">Modifique os detalhes, perguntas e configurações do seu quiz.</p>
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
      
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-2 space-y-6">
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle>Perguntas do Quiz</CardTitle>
                </CardHeader>
                <CardContent>
                    <Tabs value={currentTab} onValueChange={(value) => handleTabChange(value as 'interactive' | 'json')}>
                        <TabsList className="grid w-full grid-cols-2 h-12">
                            <TabsTrigger value="interactive" className="text-base data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md">
                              <Wand2 className="mr-2 h-5 w-5" />Construtor Interativo
                            </TabsTrigger>
                            <TabsTrigger value="json" className="text-base data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md">
                              <FileJson className="mr-2 h-5 w-5" />Editor JSON
                            </TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="interactive" className="pt-4">
                          <Accordion type="single" collapsible className="w-full space-y-4">
                              {interactiveQuestions.map((q, qIndex) => (
                              <AccordionItem key={q.id || `q_interactive_edit_${qIndex}`} value={q.id || `item-${qIndex}`} className="border rounded-lg bg-muted/20 p-0">
                                  <AccordionTrigger className="px-4 py-3 text-lg font-medium hover:no-underline">
                                      <div className="flex items-center gap-3">
                                        <ChevronsUpDown className="h-5 w-5 text-muted-foreground" />
                                        <span>Pergunta {qIndex + 1}: {q.text || "Nova Pergunta"}</span>
                                      </div>
                                  </AccordionTrigger>
                                  <AccordionContent className="border-t">
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-4">
                                      {/* Coluna de Edição */}
                                      <div className="space-y-4">
                                          <Card>
                                            <CardContent className="p-4 space-y-4">
                                              <div className="space-y-2"><Label htmlFor={`q-${qIndex}-text`}>Texto da Pergunta</Label><Textarea id={`q-${qIndex}-text`} placeholder="Qual o seu tipo de pele?" value={q.text} onChange={(e) => updateQuestion(qIndex, 'text', e.target.value)} /></div>
                                              <div className="space-y-2"><Label htmlFor={`q-${qIndex}-explanation`}>Explicação (Opcional)</Label><Textarea id={`q-${qIndex}-explanation`} placeholder="Ajude o usuário a entender a pergunta." value={q.explanation || ''} onChange={(e) => updateQuestion(qIndex, 'explanation', e.target.value)} rows={2}/></div>
                                            </CardContent>
                                          </Card>
                                          <Card>
                                            <CardContent className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                              <div className="space-y-2"><Label htmlFor={`q-${qIndex}-id`}>ID da Pergunta</Label><Input id={`q-${qIndex}-id`} placeholder="Ex: q1_pele (único)" value={q.id} onChange={(e) => updateQuestion(qIndex, 'id', e.target.value)} /></div>
                                              <div className="space-y-2"><Label htmlFor={`q-${qIndex}-name`}>Nome/Chave (form)</Label><Input id={`q-${qIndex}-name`} placeholder="Ex: tipoPele" value={q.name} onChange={(e) => updateQuestion(qIndex, 'name', e.target.value)} /></div>
                                              <div className="space-y-2"><Label>Ícone da Pergunta</Label><IconPicker value={q.icon} onChange={(iconName) => updateQuestion(qIndex, 'icon', iconName)} /></div>
                                              <div className="space-y-2"><Label>Tipo</Label><Select value={q.type} onValueChange={(value) => updateQuestion(qIndex, 'type', value)}><SelectTrigger><SelectValue placeholder="Selecione o tipo" /></SelectTrigger><SelectContent><SelectItem value="radio">Escolha Única (Radio)</SelectItem><SelectItem value="checkbox">Múltipla Escolha (Checkbox)</SelectItem><SelectItem value="textFields">Campos de Texto</SelectItem></SelectContent></Select></div>
                                            </CardContent>
                                          </Card>

                                          {(q.type === 'radio' || q.type === 'checkbox') && (
                                          <Card>
                                              <CardHeader className="pb-2"><CardTitle className="text-md">Opções de Resposta</CardTitle></CardHeader>
                                              <CardContent className="space-y-3 p-4">
                                                  {(q.options || []).map((opt, oIndex) => (
                                                  <Card key={`q-${qIndex}-opt_edit_${oIndex}`} className="p-3 bg-background/50 relative">
                                                      <div className="space-y-3">
                                                        <Label className="text-sm font-medium">Opção {oIndex + 1}</Label>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2"><div className="space-y-1"><Label htmlFor={`q-${qIndex}-opt-${oIndex}-value`} className="text-xs">Valor (ID)</Label><Input id={`q-${qIndex}-opt-${oIndex}-value`} placeholder="Ex: opcao_a" value={opt.value} onChange={(e) => updateOption(qIndex, oIndex, 'value', e.target.value)} /></div><div className="space-y-1"><Label htmlFor={`q-${qIndex}-opt-${oIndex}-label`} className="text-xs">Label Visível</Label><Input id={`q-${qIndex}-opt-${oIndex}-label`} placeholder="Ex: Opção A" value={opt.label} onChange={(e) => updateOption(qIndex, oIndex, 'label', e.target.value)} /></div></div>
                                                        <div className="space-y-1"><Label className="text-xs">Ícone</Label><IconPicker value={opt.icon} onChange={(iconName) => updateOption(qIndex, oIndex, 'icon', iconName)} /></div>
                                                        <div className="space-y-1"><Label htmlFor={`q-${qIndex}-opt-${oIndex}-imageUrl`} className="text-xs">URL da Imagem (Opcional)</Label><Input id={`q-${qIndex}-opt-${oIndex}-imageUrl`} placeholder="https://placehold.co/300x200.png" value={opt.imageUrl || ''} onChange={(e) => updateOption(qIndex, oIndex, 'imageUrl', e.target.value)} /></div>
                                                        <div className="space-y-1"><Label htmlFor={`q-${qIndex}-opt-${oIndex}-dataAiHint`} className="text-xs">Dica IA para Imagem</Label><Input id={`q-${qIndex}-opt-${oIndex}-dataAiHint`} placeholder="Ex: abstract shape" value={opt.dataAiHint || ''} onChange={(e) => updateOption(qIndex, oIndex, 'dataAiHint', e.target.value)} /></div>
                                                      </div>
                                                      <Button variant="ghost" size="icon" onClick={() => removeOption(qIndex, oIndex)} className="absolute top-1 right-1 text-destructive hover:text-destructive/80 h-7 w-7"><Trash2 className="h-4 w-4" /></Button>
                                                  </Card>
                                                  ))}
                                                  <Button type="button" variant="outline" size="sm" onClick={() => addOption(qIndex)} className="mt-2 w-full"><PlusCircle className="mr-2 h-4 w-4" /> Adicionar Opção</Button>
                                              </CardContent>
                                          </Card>
                                          )}

                                          {q.type === 'textFields' && (
                                          <Card>
                                              <CardHeader className="pb-2"><CardTitle className="text-md">Campos de Entrada</CardTitle></CardHeader>
                                              <CardContent className="space-y-3 p-4">
                                                  {(q.fields || []).map((field, fIndex) => (
                                                  <Card key={`q-${qIndex}-field_edit_${fIndex}`} className="p-3 bg-background/50 relative">
                                                      <div className="space-y-3">
                                                        <Label className="text-sm font-medium">Campo {fIndex + 1}</Label>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2"><div className="space-y-1"><Label htmlFor={`q-${qIndex}-field-${fIndex}-name`} className="text-xs">Nome/Chave</Label><Input id={`q-${qIndex}-field-${fIndex}-name`} placeholder="Ex: nomeCompleto" value={field.name} onChange={(e) => updateFormField(qIndex, fIndex, 'name', e.target.value)} /></div><div className="space-y-1"><Label htmlFor={`q-${qIndex}-field-${fIndex}-label`} className="text-xs">Label Visível</Label><Input id={`q-${qIndex}-field-${fIndex}-label`} placeholder="Ex: Nome Completo" value={field.label} onChange={(e) => updateFormField(qIndex, fIndex, 'label', e.target.value)} /></div></div>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2"><div><Label className="text-xs">Tipo do Campo</Label><Select value={field.type} onValueChange={(val) => updateFormField(qIndex, fIndex, 'type', val as 'text'|'tel'|'email')}><SelectTrigger><SelectValue placeholder="Tipo" /></SelectTrigger><SelectContent><SelectItem value="text">Texto</SelectItem><SelectItem value="tel">Telefone</SelectItem><SelectItem value="email">Email</SelectItem></SelectContent></Select></div><div><Label className="text-xs">Ícone</Label><IconPicker value={field.icon} onChange={(val) => updateFormField(qIndex, fIndex, 'icon', val)} /></div></div>
                                                        <div className="space-y-1"><Label htmlFor={`q-${qIndex}-field-${fIndex}-placeholder`} className="text-xs">Placeholder</Label><Input id={`q-${qIndex}-field-${fIndex}-placeholder`} placeholder="Ex: Digite seu nome" value={field.placeholder || ''} onChange={(e) => updateFormField(qIndex, fIndex, 'placeholder', e.target.value)} /></div>
                                                      </div>
                                                      <Button variant="ghost" size="icon" onClick={() => removeFormField(qIndex, fIndex)} className="absolute top-1 right-1 text-destructive hover:text-destructive/80 h-7 w-7"><Trash2 className="h-4 w-4" /></Button>
                                                  </Card>
                                                  ))}
                                                  <Button type="button" variant="outline" size="sm" onClick={() => addFormField(qIndex)} className="mt-2 w-full"><PlusCircle className="mr-2 h-4 w-4" /> Adicionar Campo</Button>
                                              </CardContent>
                                          </Card>
                                          )}
                                          <div className="flex justify-end pt-2">
                                              <Button variant="ghost" size="sm" onClick={() => removeQuestion(qIndex)} className="text-destructive hover:text-destructive/80 hover:bg-destructive/10"><Trash2 className="mr-2 h-4 w-4" />Remover Pergunta</Button>
                                          </div>
                                      </div>
                                      {/* Coluna de Preview */}
                                      <div className="lg:sticky lg:top-4">
                                        <Card className="bg-background">
                                          <CardHeader><CardTitle className="text-md">Pré-visualização da Pergunta</CardTitle></CardHeader>
                                          <CardContent>
                                            <QuestionPreview question={q} />
                                          </CardContent>
                                        </Card>
                                      </div>
                                    </div>
                                  </AccordionContent>
                              </AccordionItem>
                              ))}
                          </Accordion>
                          <Button type="button" onClick={addQuestion} variant="outline" className="w-full mt-6 shadow-sm"><PlusCircle className="mr-2 h-4 w-4" /> Adicionar Nova Pergunta</Button>
                        </TabsContent>

                        <TabsContent value="json" className="pt-4">
                             <Textarea
                                id="questionsJson"
                                value={questionsJson}
                                onChange={(e) => setQuestionsJson(e.target.value)}
                                placeholder="[]"
                                rows={25}
                                className="font-mono text-xs bg-muted/20"
                            />
                            <Button asChild variant="outline" className="mt-4">
                                <Link href="/config/dashboard/documentation/quiz-json" target="_blank">
                                    <BookOpen className="mr-2 h-4 w-4" /> Abrir Guia de Criação JSON
                                </Link>
                            </Button>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
             <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="flex justify-between items-center">
                        <span>Mensagens Pós-Quiz</span>
                        <span className="text-sm font-medium text-muted-foreground">{messages.length} / 5</span>
                    </CardTitle>
                    <CardDescription>
                        Configure mensagens de texto, imagem ou áudio para serem enviadas via webhook.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {messages.map((msg, msgIndex) => {
                      const MessageIcon =
                        msg.type === 'imagem' ? ImageIconLucide :
                        msg.type === 'audio' ? AudioWaveform :
                        MessageSquareText;

                      return (
                        <Card key={msg.id} className="p-4 bg-muted/30 relative border-border/60">
                            <Button variant="ghost" size="icon" onClick={() => removeMessage(msgIndex)} className="absolute top-2 right-2 text-muted-foreground hover:text-destructive z-10 h-8 w-8">
                                <Trash2 className="h-4 w-4" />
                            </Button>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                                <div className="space-y-2 md:col-span-1">
                                    <Label>Tipo da Mensagem</Label>
                                    <Select value={msg.type} onValueChange={(value: QuizMessage['type']) => updateMessage(msgIndex, 'type', value)}>
                                        <SelectTrigger>
                                          <div className="flex items-center gap-2">
                                            <MessageIcon className="h-4 w-4 text-muted-foreground" />
                                            <SelectValue placeholder="Selecione o tipo" />
                                          </div>
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="mensagem">Texto</SelectItem>
                                            <SelectItem value="imagem">Imagem</SelectItem>
                                            <SelectItem value="audio">Áudio</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <Label>Conteúdo</Label>
                                    {msg.type === 'mensagem' && (
                                        <Textarea placeholder="Digite sua mensagem aqui..." value={msg.content} onChange={(e) => updateMessage(msgIndex, 'content', e.target.value)} rows={3} />
                                    )}
                                    {(msg.type === 'imagem' || msg.type === 'audio') && (
                                      <div className="flex items-center gap-2">
                                          <Label
                                              htmlFor={`file-upload-edit-${msg.id}`}
                                              className={cn(
                                                  buttonVariants({ variant: "outline" }),
                                                  "cursor-pointer"
                                              )}
                                          >
                                              <FileUp className="mr-2 h-4 w-4" />
                                              Escolher
                                          </Label>
                                          <Input
                                              id={`file-upload-edit-${msg.id}`}
                                              type="file"
                                              accept={msg.type === 'imagem' ? "image/*" : "audio/*"}
                                              onChange={(e) => handleFileChange(e, msgIndex)}
                                              className="hidden"
                                          />
                                          {msg.filename ? (
                                              <span className="text-sm text-muted-foreground truncate" title={msg.filename}>
                                                  {msg.filename}
                                              </span>
                                          ) : (
                                               <span className="text-sm text-muted-foreground">Nenhum arquivo</span>
                                          )}
                                      </div>
                                    )}
                                </div>
                            </div>
                        </Card>
                    )})}
                    <Button type="button" variant="outline" className="w-full mt-4" onClick={addMessage} disabled={messages.length >= 5}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Mensagem
                    </Button>
                </CardContent>
              </Card>
          </div>

          <div className="lg:col-span-1 space-y-6 lg:sticky lg:top-6">
              <Card className="shadow-lg">
                <CardHeader><CardTitle>Detalhes do Quiz</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2"><Label htmlFor="title" className="flex items-center gap-1.5"><FileTextIcon className="h-4 w-4 text-muted-foreground" />Título Público</Label><Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required /></div>
                    <div className="space-y-2"><Label htmlFor="dashboardName" className="flex items-center gap-1.5"><BadgeInfo className="h-4 w-4 text-muted-foreground" />Nome Interno</Label><Input id="dashboardName" value={dashboardName} onChange={(e) => setDashboardName(e.target.value)} /></div>
                    <div className="space-y-2"><Label htmlFor="description" className="flex items-center gap-1.5"><MessageSquareText className="h-4 w-4 text-muted-foreground" />Descrição</Label><Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} /></div>
                    <div className="space-y-2"><Label htmlFor="slug" className="flex items-center gap-1.5"><LinkIconLucide className="h-4 w-4 text-muted-foreground" />Slug (URL)</Label><Input id="slug" value={slug} readOnly disabled className="bg-muted/50 cursor-not-allowed" /><p className="text-xs text-muted-foreground">Acessível em: {baseUrl ? `${baseUrl}/${slug}`: '...'}</p></div>
                </CardContent>
              </Card>

               <Card className="shadow-lg">
                  <CardHeader><CardTitle>Configurações do Quiz</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                      <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
                        <div className='flex items-start gap-3'>
                          <ToggleLeft className="h-5 w-5 text-muted-foreground mt-1 flex-shrink-0" />
                          <div className='flex flex-col'>
                            <Label htmlFor="isActive-switch" className="font-medium">Status</Label>
                            <span className="text-xs font-normal text-muted-foreground">Quiz acessível ao público.</span>
                          </div>
                        </div>
                        <Switch id="isActive-switch" checked={isActive} onCheckedChange={setIsActive} />
                      </div>

                      <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
                        <div className='flex items-start gap-3'>
                          <LayoutDashboard className="h-5 w-5 text-muted-foreground mt-1 flex-shrink-0" />
                           <div className='flex flex-col'>
                            <p className="font-medium">Formato</p>
                            <span className="text-xs font-normal text-muted-foreground">Como as perguntas são exibidas.</span>
                          </div>
                        </div>
                        <RadioGroup value={displayMode} onValueChange={(value) => setDisplayMode(value as 'step-by-step' | 'single-page')} className="flex gap-4">
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="step-by-step" id="mode-step" />
                                <Label htmlFor="mode-step" className="font-normal text-sm">Passo a Passo</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="single-page" id="mode-single" />
                                <Label htmlFor="mode-single" className="font-normal text-sm">Página Única</Label>
                            </div>
                        </RadioGroup>
                      </div>

                      <div className="space-y-4 rounded-lg border p-4">
                          <div className="flex items-center justify-between space-x-2">
                            <div className='flex items-start gap-3'>
                              <Palette className="h-5 w-5 text-muted-foreground mt-1 flex-shrink-0" />
                              <div className='flex flex-col'>
                                <Label htmlFor="useCustomTheme-switch" className="font-medium">Tema Customizado</Label>
                                <span className="text-xs font-normal text-muted-foreground">Sobrescrever cores globais.</span>
                              </div>
                            </div>
                            <Switch id="useCustomTheme-switch" checked={useCustomTheme} onCheckedChange={setUseCustomTheme} />
                          </div>
                          {useCustomTheme && (
                              <div className="space-y-4 pt-4 border-t animate-in fade-in-0 zoom-in-95">
                                  <div className="space-y-2">
                                    <Label htmlFor="custom-primaryColorHex">Cor Primária</Label>
                                    <div className="flex items-center gap-2">
                                        <Input id="custom-primaryColorHex" placeholder="#1D4ED8" value={customTheme?.primaryColorHex || ''} onChange={(e) => setCustomTheme(prev => ({...prev, primaryColorHex: e.target.value}))}/>
                                        <Input id="custom-primaryColorHexPicker" type="color" value={customTheme?.primaryColorHex || '#1D4ED8'} onChange={(e) => setCustomTheme(prev => ({...prev, primaryColorHex: e.target.value}))} className="h-10 w-12 p-1 rounded-md border cursor-pointer min-w-[3rem]"/>
                                    </div>
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="custom-secondaryColorHex">Cor Secundária</Label>
                                    <div className="flex items-center gap-2">
                                        <Input id="custom-secondaryColorHex" placeholder="#A5B4FC" value={customTheme?.secondaryColorHex || ''} onChange={(e) => setCustomTheme(prev => ({...prev, secondaryColorHex: e.target.value}))}/>
                                        <Input id="custom-secondaryColorHexPicker" type="color" value={customTheme?.secondaryColorHex || '#A5B4FC'} onChange={(e) => setCustomTheme(prev => ({...prev, secondaryColorHex: e.target.value}))} className="h-10 w-12 p-1 rounded-md border cursor-pointer min-w-[3rem]"/>
                                    </div>
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="custom-quizBackgroundColorHex">Fundo do Quiz</Label>
                                    <div className="flex items-center gap-2">
                                        <Input id="custom-quizBackgroundColorHex" placeholder="#FFFFFF" value={customTheme?.quizBackgroundColorHex || ''} onChange={(e) => setCustomTheme(prev => ({...prev, quizBackgroundColorHex: e.target.value}))}/>
                                        <Input id="custom-quizBackgroundColorHexPicker" type="color" value={customTheme?.quizBackgroundColorHex || '#FFFFFF'} onChange={(e) => setCustomTheme(prev => ({...prev, quizBackgroundColorHex: e.target.value}))} className="h-10 w-12 p-1 rounded-md border cursor-pointer min-w-[3rem]"/>
                                    </div>
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="custom-buttonPrimaryBgColorHex">Fundo do Botão</Label>
                                    <div className="flex items-center gap-2">
                                        <Input id="custom-buttonPrimaryBgColorHex" placeholder="#1E40AF" value={customTheme?.buttonPrimaryBgColorHex || ''} onChange={(e) => setCustomTheme(prev => ({...prev, buttonPrimaryBgColorHex: e.target.value}))}/>
                                        <Input id="custom-buttonPrimaryBgColorHexPicker" type="color" value={customTheme?.buttonPrimaryBgColorHex || '#1E40AF'} onChange={(e) => setCustomTheme(prev => ({...prev, buttonPrimaryBgColorHex: e.target.value}))} className="h-10 w-12 p-1 rounded-md border cursor-pointer min-w-[3rem]"/>
                                    </div>
                                  </div>
                              </div>
                          )}
                      </div>
                  </CardContent>
              </Card>

              <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-md">
                        <Fingerprint className="h-5 w-5 text-muted-foreground" />
                        Rastreamento (Pixel)
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                   <div className="flex items-center justify-between space-x-2 rounded-lg border p-3">
                        <Label htmlFor="pixel-ignore-primary" className="flex-1 font-normal text-sm">Ignorar Pixel Global Primário</Label>
                        <Switch id="pixel-ignore-primary" checked={pixelSettings?.ignoreGlobalPrimaryPixel} onCheckedChange={(checked) => setPixelSettings(prev => ({...prev, ignoreGlobalPrimaryPixel: checked}))} />
                   </div>
                    <div className="flex items-center justify-between space-x-2 rounded-lg border p-3">
                        <Label htmlFor="pixel-ignore-secondary" className="flex-1 font-normal text-sm">Ignorar Pixel Global Secundário</Label>
                        <Switch id="pixel-ignore-secondary" checked={pixelSettings?.ignoreGlobalSecondaryPixel} onCheckedChange={(checked) => setPixelSettings(prev => ({...prev, ignoreGlobalSecondaryPixel: checked}))} />
                   </div>
                   <div className="space-y-2">
                        <Label htmlFor="pixel-specific" className="text-sm">Pixel Exclusivo do Quiz</Label>
                        <Input id="pixel-specific" placeholder="ID do Pixel (opcional)" value={pixelSettings?.quizSpecificPixelId || ''} onChange={(e) => setPixelSettings(prev => ({...prev, quizSpecificPixelId: e.target.value}))} />
                   </div>
                </CardContent>
              </Card>
          </div>
        </div>

        <div className="mt-6">
            <Card className="shadow-lg">
                <CardFooter className="flex flex-col items-start gap-4 p-6">
                    {error && !success && (<Alert variant="destructive" className="w-full"><AlertTriangle className="h-4 w-4" /><AlertTitle>Erro</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>)}
                    {success && (<Alert variant="default" className="w-full bg-green-50 border-green-300 text-green-700 dark:bg-green-900/30 dark:border-green-700 dark:text-green-400"><Save className="h-4 w-4 text-green-600 dark:text-green-400" /><AlertTitle>Sucesso!</AlertTitle><AlertDescription>{success}</AlertDescription></Alert>)}
                    <Button type="submit" size="lg" className="shadow-md" disabled={isLoading || isFetching}>{isLoading ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Salvando...</>) : (<><Save className="mr-2 h-4 w-4" />Salvar Alterações</>)}</Button>
                </CardFooter>
            </Card>
        </div>
      </form>

      <Dialog open={isPreviewModalOpen} onOpenChange={setIsPreviewModalOpen}>
        <DialogContent className="max-w-2xl w-[95vw] h-[90vh] flex flex-col p-0 bg-transparent border-0 shadow-none">
          <DialogHeader className="p-4 border-b bg-card rounded-t-lg"><DialogTitle>Pré-visualização: {isLoadingPreview ? "Carregando..." : title || "Quiz"}</DialogTitle></DialogHeader>
           <div className="flex-grow overflow-y-auto bg-background"> 
            {isLoadingPreview ? (<div className="flex items-center justify-center h-full"><QuizFormLoading/></div>
            ) : previewQuizData && whitelabelSettings ? (
              <QuizForm
                quizQuestions={previewQuizData}
                quizSlug={slug} 
                quizTitle={title || "Pré-visualização"}
                quizDescription={description || DEFAULT_QUIZ_DESCRIPTION}
                logoUrl={whitelabelSettings.logoUrl || "https://placehold.co/150x50.png?text=Logo"}
                footerCopyrightText={whitelabelSettings.footerCopyrightText || `© ${new Date().getFullYear()} Preview.`}
                websiteUrl={whitelabelSettings.websiteUrl}
                instagramUrl={whitelabelSettings.instagramUrl}
                finalFacebookPixelIds={[]}
                googleAnalyticsId="" 
                onSubmitOverride={mockSubmitOverride}
                onAbandonmentOverride={async () => { console.log("Preview abandonment") }}
                isPreview={true}
                useCustomTheme={useCustomTheme}
                customTheme={customTheme}
                displayMode={displayMode}
              />
            ) : <div className="p-4 text-center text-muted-foreground">Não foi possível carregar a pré-visualização.</div>}
          </div>
          <DialogFooter className="p-4 border-t bg-card rounded-b-lg"><DialogClose asChild><Button variant="outline">Fechar</Button></DialogClose></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
