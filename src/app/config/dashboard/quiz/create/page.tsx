
"use client";
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Save, AlertTriangle, Info, Loader2, PlusCircle, Trash2, Wand2, FileJson, Eye, MessageSquareText, ListChecks, Edit3, Text, Phone, Mail, BadgeInfo, FileTextIcon, Link as LinkIconLucide, BookOpen, LayoutDashboard, ChevronUp, ChevronDown, BrainCircuit, AudioWaveform, Image as ImageIconLucide, FileUp, GripVertical, Settings, Palette, Fingerprint, VenetianMask, Timer, UserX, UserCheck, Tags, Pilcrow, ThumbsDown, ThumbsUp } from 'lucide-react';
import { createQuizAction, generateQuizSectionAction } from '../actions';
import type { QuizQuestion, QuizOption, FormFieldConfig, WhitelabelConfig, QuizMessage, QuizConfig } from '@/types/quiz';
import dynamic from 'next/dynamic';
import QuizFormLoading from '@/components/quiz/QuizFormLoading';
import { fetchWhitelabelSettings } from '@/app/config/dashboard/settings/actions';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import IconPicker from '@/components/dashboard/IconPicker';
import QuestionPreview from '@/components/dashboard/QuestionPreview';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Switch } from '@/components/ui/switch';
import AiGenerationDialog from '@/components/dashboard/AiGenerationDialog';
import type { GenerationType } from '@/components/dashboard/AiGenerationDialog';

const QuizForm = dynamic(() => import('@/components/quiz/QuizForm'), {
  ssr: false,
  loading: () => <div className="p-4"><QuizFormLoading/></div>,
});

const DEFAULT_QUIZ_DESCRIPTION = "Responda algumas perguntas para nos ajudar a entender suas preferências.";

export default function CreateQuizPage() {
  const router = useRouter();
  const { toast } = useToast();

  // Common state
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [baseUrl, setBaseUrl] = useState('');
  
  // AI State
  const [isAiDialogOpen, setIsAiDialogOpen] = useState(false);
  const [currentGenerationType, setCurrentGenerationType] = useState<GenerationType>('details');
  const [hasApiKey, setHasApiKey] = useState(false);

  // Manual Form State
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState(DEFAULT_QUIZ_DESCRIPTION);
  const [dashboardName, setDashboardName] = useState('');
  const [questionsJson, setQuestionsJson] = useState('[\n  \n]');
  const [interactiveQuestions, setInteractiveQuestions] = useState<QuizQuestion[]>([]);
  const [messages, setMessages] = useState<QuizMessage[]>([]);
  const [displayMode, setDisplayMode] = useState<'step-by-step' | 'single-page'>('step-by-step');
  const [currentManualTab, setCurrentManualTab] = useState<'interactive' | 'json'>('interactive');
  const [isLoadingManual, setIsLoadingManual] = useState(false);
  const [successPageText, setSuccessPageText] = useState("Suas respostas foram enviadas com sucesso! Nossa equipe entrará em contato em breve.");
  const [disqualifiedPageText, setDisqualifiedPageText] = useState("Agradecemos seu interesse! No momento, não seguimos com seu perfil, mas guardamos seu contato para futuras oportunidades.");
  const [disqualifiedRedirectUrl, setDisqualifiedRedirectUrl] = useState("");
  const [disqualifiedRedirectDelaySeconds, setDisqualifiedRedirectDelaySeconds] = useState<number>(5);
  
  // Preview State
  const [previewQuizData, setPreviewQuizData] = useState<QuizQuestion[] | null>(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [whitelabelSettings, setWhitelabelSettings] = useState<Partial<WhitelabelConfig>>({});

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setBaseUrl(window.location.origin);
    }
    async function fetchPreviewConfig() {
      const config = await fetchWhitelabelSettings();
      setWhitelabelSettings(config);
      if (config.googleApiKey && config.googleApiKey.trim() !== '') {
        setHasApiKey(true);
      }
    }
    fetchPreviewConfig();
  }, []);

  const handleManualSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoadingManual(true);

    if (!title.trim() || !slug.trim()) {
      setError("Título e slug são obrigatórios.");
      setIsLoadingManual(false);
      return;
    }
    
    let parsedQuestions: QuizQuestion[];
    if (currentManualTab === 'json') {
      if (!questionsJson.trim() || questionsJson.trim() === '[]') {
         parsedQuestions = [];
      } else {
        try {
          parsedQuestions = JSON.parse(questionsJson);
          if (!Array.isArray(parsedQuestions)) {
            setError("O JSON das perguntas deve ser um array.");
            setIsLoadingManual(false);
            return;
          }
        } catch (jsonError) {
          setError("JSON das perguntas inválido. Verifique a sintaxe.");
          setIsLoadingManual(false);
          return;
        }
      }
    } else {
      parsedQuestions = interactiveQuestions;
    }
    
    try {
      const result = await createQuizAction({ 
        title, 
        slug, 
        description: description || DEFAULT_QUIZ_DESCRIPTION, 
        dashboardName: dashboardName || title, 
        questions: parsedQuestions,
        messages: messages,
        displayMode: displayMode,
        successPageText,
        disqualifiedPageText,
        disqualifiedRedirectUrl,
        disqualifiedRedirectDelaySeconds,
      });
      if (result.success && result.slug) {
        setSuccess(`Quiz "${title}" criado com sucesso! Acessível em /${result.slug}`);
        router.push(`/config/dashboard/quiz/edit/${result.slug}`);
      } else {
        setError(result.message || 'Falha ao criar o quiz.');
      }
    } catch (err) {
      setError('Ocorreu um erro ao tentar criar o quiz.');
      console.error(err);
    } finally {
      setIsLoadingManual(false);
    }
  };


  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawSlug = e.target.value;
    const formattedSlug = rawSlug
      .toLowerCase()
      .replace(/\s+/g, '-') 
      .replace(/[^a-z0-9-]/g, ''); 
    setSlug(formattedSlug);
  };
  
  const addQuestion = () => {
    setInteractiveQuestions([
      ...interactiveQuestions,
      { 
        id: `q_${interactiveQuestions.length + 1}_${Date.now().toString(36)}`, 
        name: `question${interactiveQuestions.length + 1}`, 
        text: '', 
        explanation: '',
        type: 'radio',
        isRequired: true,
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
    question.options.push({ value: `opt${(question.options.length || 0) + 1}_${Date.now().toString(36)}`, label: '', icon: undefined, explanation: '', imageUrl: '', dataAiHint: '', text_message: '', isDisqualifying: false });
    setInteractiveQuestions(newQuestions);
  };

  const updateOption = (qIndex: number, oIndex: number, field: keyof QuizOption, value: string | boolean) => {
    const newQuestions = [...interactiveQuestions];
    const question = newQuestions[qIndex];
    if (question.options && question.options[oIndex]) {
      question.options[oIndex] = { ...question.options[oIndex], [field]: value };
      setInteractiveQuestions(newQuestions);
    }
  };

  const removeOption = (qIndex: number, oIndex: number) => {
    const newQuestions = [...interactiveQuestions];
    const question = newQuestions[qIndex];
    if (question.options) {
      question.options.splice(oIndex, 1);
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

  const reorderMessages = (index: number, direction: 'up' | 'down') => {
    const newMessages = [...messages];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex >= 0 && newIndex < newMessages.length) {
      const temp = newMessages[index];
      newMessages[index] = newMessages[newIndex];
      newMessages[newIndex] = temp;
      setMessages(newMessages);
    }
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

  const handleManualTabChange = (newTab: 'interactive' | 'json') => {
    if (newTab === 'json' && currentManualTab === 'interactive') {
      setQuestionsJson(JSON.stringify(interactiveQuestions, null, 2));
    } else if (newTab === 'interactive' && currentManualTab === 'json') {
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
    setCurrentManualTab(newTab);
  };

  const handleOpenPreview = () => {
    let questionsForPreview: QuizQuestion[];
    if (currentManualTab === 'interactive') {
      questionsForPreview = interactiveQuestions;
    } else {
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
    }
    setPreviewQuizData(questionsForPreview);
    setIsPreviewModalOpen(true);
  };
  
  const mockSubmitOverride = async (data: Record<string, any>) => {
    console.log("Preview Submit:", data);
    alert("Submissão simulada! Verifique o console para os dados.");
  };

  const availableVariables = useMemo(() => {
    const vars: { label: string; value: string }[] = [];
    let questionsToParse: QuizQuestion[] = [];
    try {
        questionsToParse = currentManualTab === 'interactive' 
            ? interactiveQuestions 
            : JSON.parse(questionsJson);
        if (!Array.isArray(questionsToParse)) questionsToParse = [];
    } catch {
        questionsToParse = [];
    }

    questionsToParse.forEach((q: QuizQuestion) => {
      if (q.type === 'textFields' && q.fields) {
        q.fields.forEach(field => {
          if (field.name) {
            vars.push({ label: field.label || field.name, value: field.name });
          }
        });
      } else {
        if (q.name) {
          vars.push({ label: q.text || q.name, value: q.name });
        }
      }
    });
    return vars;
  }, [interactiveQuestions, questionsJson, currentManualTab]);

  const handleInsertVariable = (variableName: string, msgIndex: number) => {
    const currentMessage = messages[msgIndex];
    const newContent = (currentMessage.content ? currentMessage.content + ' ' : '') + `{{${variableName}}}`;
    updateMessage(msgIndex, 'content', newContent);
  };

  const handleOpenAiDialog = (type: GenerationType) => {
    setCurrentGenerationType(type);
    setIsAiDialogOpen(true);
  };
  
  const getCurrentContextData = useCallback(() => {
      let questions: QuizQuestion[] = [];
      try {
          const parsedQuestions = currentManualTab === 'interactive' ? interactiveQuestions : JSON.parse(questionsJson);
          if (Array.isArray(parsedQuestions)) {
              questions = parsedQuestions;
          }
      } catch {
          questions = interactiveQuestions;
      }
      return JSON.stringify({
          title, slug, dashboardName, description,
          questions,
          messages,
          successPageText, disqualifiedPageText
      });
  }, [title, slug, dashboardName, description, interactiveQuestions, questionsJson, currentManualTab, messages, successPageText, disqualifiedPageText]);


  const handleAiGeneratedData = (data: any, mode: 'overwrite' | 'improve' | 'complete') => {
    if (!data) return;

    if (currentGenerationType === 'details') {
        if (mode === 'complete') {
            if (!title && data.title) setTitle(data.title);
            if (!slug && data.slug) setSlug(data.slug.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''));
            if (!dashboardName && data.dashboardName) setDashboardName(data.dashboardName);
            if (!description && data.description) setDescription(data.description);
        } else { // Overwrite or Improve
            setTitle(data.title || title);
            setSlug(data.slug ? data.slug.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') : slug);
            setDashboardName(data.dashboardName || dashboardName);
            setDescription(data.description || description);
        }
    } else if (currentGenerationType === 'questions') {
        const newQuestions = data.questions || [];
        const combinedQuestions = mode === 'complete' ? [...interactiveQuestions, ...newQuestions] : newQuestions;
        setInteractiveQuestions(combinedQuestions);
        setQuestionsJson(JSON.stringify(combinedQuestions, null, 2));
    } else if (currentGenerationType === 'messages') {
        const newMessages = data.messages || [];
        const combinedMessages = mode === 'complete' ? [...messages, ...newMessages] : newMessages;
        setMessages(combinedMessages);
    } else if (currentGenerationType === 'results') {
        if (mode === 'complete') {
            if (!successPageText && data.successPageText) setSuccessPageText(data.successPageText);
            if (!disqualifiedPageText && data.disqualifiedPageText) setDisqualifiedPageText(data.disqualifiedPageText);
        } else { // Overwrite or Improve
            setSuccessPageText(data.successPageText || successPageText);
            setDisqualifiedPageText(data.disqualifiedPageText || disqualifiedPageText);
        }
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold md:text-3xl">Criar Novo Quiz</h1>
         <Button onClick={handleOpenPreview} variant="outline" disabled={!title.trim()}>
            <Eye className="mr-2 h-4 w-4" /> Pré-visualizar
        </Button>
      </div>
      <form onSubmit={handleManualSubmit}>
        <Tabs defaultValue="configuracoes" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4 h-auto">
            <TabsTrigger value="configuracoes" className="py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md">Configurações</TabsTrigger>
            <TabsTrigger value="perguntas" className="py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md">Perguntas</TabsTrigger>
            <TabsTrigger value="mensagens" className="py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md">Mensagens</TabsTrigger>
          </TabsList>

          <TabsContent value="configuracoes" className="space-y-6">
            <Card className="shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between">
                    <div className="space-y-1">
                        <CardTitle>Detalhes Gerais do Quiz</CardTitle>
                    </div>
                    {hasApiKey && (
                        <Button type="button" variant="outline" size="sm" onClick={() => handleOpenAiDialog('details')}>
                            <Wand2 className="mr-2 h-4 w-4"/> Gerar com IA
                        </Button>
                    )}
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                    <div className="space-y-2"><Label htmlFor="title" className="flex items-center gap-1.5"><FileTextIcon className="h-4 w-4 text-muted-foreground" />Título Público</Label><Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Quiz de Avaliação de Produto" required /></div>
                    <div className="space-y-2"><Label htmlFor="dashboardName" className="flex items-center gap-1.5"><BadgeInfo className="h-4 w-4 text-muted-foreground" />Nome Interno (Dashboard)</Label><Input id="dashboardName" value={dashboardName} onChange={(e) => setDashboardName(e.target.value)} placeholder="Opcional, ex: Campanha de Inverno" /></div>
                    <div className="space-y-2"><Label htmlFor="slug" className="flex items-center gap-1.5"><LinkIconLucide className="h-4 w-4 text-muted-foreground" />Slug (URL)</Label><Input id="slug" value={slug} onChange={handleSlugChange} placeholder="ex: avaliacao-produto" required /><p className="text-xs text-muted-foreground">Será acessível em: {baseUrl ? `${baseUrl}/${slug}` : '...'}</p></div>
                    <div className="space-y-2"><Label className="flex items-center gap-1.5"><LayoutDashboard className="h-4 w-4 text-muted-foreground" />Formato de Exibição</Label><RadioGroup value={displayMode} onValueChange={(value) => setDisplayMode(value as 'step-by-step' | 'single-page')} className="flex gap-4 pt-2"><div className="flex items-center space-x-2"><RadioGroupItem value="step-by-step" id="mode-step" /><Label htmlFor="mode-step" className="font-normal">Passo a Passo</Label></div><div className="flex items-center space-x-2"><RadioGroupItem value="single-page" id="mode-single" /><Label htmlFor="mode-single" className="font-normal">Página Única</Label></div></RadioGroup></div>
                    <div className="space-y-2 md:col-span-2"><Label htmlFor="description" className="flex items-center gap-1.5"><MessageSquareText className="h-4 w-4 text-muted-foreground" />Descrição do Quiz (Opcional)</Label><Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Aparecerá abaixo do título na página do quiz." rows={2} /></div>
                </CardContent>
            </Card>
            <Card className="shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Páginas de Resultado e Redirecionamento</CardTitle>
                    {hasApiKey && (
                        <Button type="button" variant="outline" size="sm" onClick={() => handleOpenAiDialog('results')}>
                            <Wand2 className="mr-2 h-4 w-4"/> Gerar com IA
                        </Button>
                    )}
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2"><Label htmlFor="successPageText" className="flex items-center gap-1.5"><UserCheck className="h-4 w-4 text-muted-foreground" />Texto da Página de Sucesso (Qualificado)</Label><Textarea id="successPageText" value={successPageText} onChange={(e) => setSuccessPageText(e.target.value)} rows={3}/></div>
                    <div className="space-y-2"><Label htmlFor="disqualifiedPageText" className="flex items-center gap-1.5"><UserX className="h-4 w-4 text-muted-foreground" />Texto da Página de Desqualificado</Label><Textarea id="disqualifiedPageText" value={disqualifiedPageText} onChange={(e) => setDisqualifiedPageText(e.target.value)} rows={3}/></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                        <div className="space-y-2"><Label htmlFor="disqualifiedRedirectUrl" className="flex items-center gap-1.5"><VenetianMask className="h-4 w-4 text-muted-foreground" />URL de Redirecionamento (Desqualificado)</Label><Input id="disqualifiedRedirectUrl" value={disqualifiedRedirectUrl} onChange={(e) => setDisqualifiedRedirectUrl(e.target.value)} placeholder="https://... (opcional)" /></div>
                        <div className="space-y-2"><Label htmlFor="disqualifiedRedirectDelaySeconds" className="flex items-center gap-1.5"><Timer className="h-4 w-4 text-muted-foreground" />Atraso para Redirecionar (segundos)</Label><Input type="number" id="disqualifiedRedirectDelaySeconds" value={disqualifiedRedirectDelaySeconds} onChange={(e) => setDisqualifiedRedirectDelaySeconds(Number(e.target.value) || 0)} /></div>
                    </div>
                </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="perguntas">
            <Card className="shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Perguntas do Quiz</CardTitle>
                    {hasApiKey && (
                        <Button type="button" variant="outline" size="sm" onClick={() => handleOpenAiDialog('questions')}>
                            <Wand2 className="mr-2 h-4 w-4"/> Gerar com IA
                        </Button>
                    )}
                </CardHeader>
                <CardContent>
                    <Tabs value={currentManualTab} onValueChange={(value) => handleManualTabChange(value as 'json' | 'interactive')}>
                        <TabsList className="grid w-full grid-cols-2 h-12">
                            <TabsTrigger value="interactive" className="text-base data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md"><Wand2 className="mr-2 h-5 w-5" />Construtor Interativo</TabsTrigger>
                            <TabsTrigger value="json" className="text-base data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md"><FileJson className="mr-2 h-5 w-5" />Editor JSON</TabsTrigger>
                        </TabsList>
                        <TabsContent value="interactive" className="pt-4">
                            <Accordion type="single" collapsible className="w-full space-y-4">
                                {interactiveQuestions.map((q, qIndex) => (
                                <AccordionItem key={q.id || `item-${qIndex}`} value={q.id || `item-${qIndex}`} className="border rounded-lg bg-muted/20 p-0">
                                    <AccordionTrigger className="px-4 py-3 text-lg font-medium hover:no-underline"><div className="flex items-center gap-3"><GripVertical className="h-5 w-5 text-muted-foreground" /><span>Pergunta {qIndex + 1}: {q.text || "Nova Pergunta"}</span></div></AccordionTrigger>
                                    <AccordionContent className="border-t"><div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-4"><div className="space-y-4"><Card><CardContent className="p-4 space-y-4"><div className="space-y-2"><Label htmlFor={`q-${qIndex}-text`}>Texto da Pergunta</Label><Textarea id={`q-${qIndex}-text`} placeholder="Qual o seu tipo de pele?" value={q.text} onChange={(e) => updateQuestion(qIndex, 'text', e.target.value)} /></div><div className="space-y-2"><Label htmlFor={`q-${qIndex}-explanation`}>Explicação (Opcional)</Label><Textarea id={`q-${qIndex}-explanation`} placeholder="Ajude o usuário a entender a pergunta." value={q.explanation || ''} onChange={(e) => updateQuestion(qIndex, 'explanation', e.target.value)} rows={2}/></div></CardContent></Card><Card><CardContent className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4"><div className="space-y-2"><Label htmlFor={`q-${qIndex}-id`}>ID da Pergunta</Label><Input id={`q-${qIndex}-id`} placeholder="Ex: q1_pele (único)" value={q.id} onChange={(e) => updateQuestion(qIndex, 'id', e.target.value)} /></div><div className="space-y-2"><Label htmlFor={`q-${qIndex}-name`}>Nome/Chave (form)</Label><Input id={`q-${qIndex}-name`} placeholder="Ex: tipoPele" value={q.name} onChange={(e) => updateQuestion(qIndex, 'name', e.target.value)} /></div><div className="space-y-2"><Label>Ícone da Pergunta</Label><IconPicker value={q.icon} onChange={(iconName) => updateQuestion(qIndex, 'icon', iconName)} /></div><div className="space-y-2"><Label>Tipo</Label><Select value={q.type} onValueChange={(value) => updateQuestion(qIndex, 'type', value)}><SelectTrigger><SelectValue placeholder="Selecione o tipo" /></SelectTrigger><SelectContent><SelectItem value="radio">Escolha Única (Radio)</SelectItem><SelectItem value="checkbox">Múltipla Escolha (Checkbox)</SelectItem><SelectItem value="textFields">Campos de Texto</SelectItem></SelectContent></Select></div><div className="md:col-span-2 flex items-center space-x-2 pt-2"><Switch id={`q-${qIndex}-isRequired`} checked={q.isRequired ?? true} onCheckedChange={(checked) => updateQuestion(qIndex, 'isRequired', checked)} /><Label htmlFor={`q-${qIndex}-isRequired`} className="font-normal text-sm">Pergunta Obrigatória</Label></div></CardContent></Card>
                                        {(q.type === 'radio' || q.type === 'checkbox') && (<Card><CardHeader className="pb-2"><CardTitle className="text-md">Opções de Resposta</CardTitle></CardHeader><CardContent className="space-y-3 p-4">{(q.options || []).map((opt, oIndex) => (<Card key={oIndex} className="p-3 bg-background/50 relative"><div className="space-y-3"><Label className="text-sm font-medium">Opção {oIndex + 1}</Label><div className="grid grid-cols-1 md:grid-cols-2 gap-2"><div className="space-y-1"><Label htmlFor={`q-${qIndex}-opt-${oIndex}-value`} className="text-xs">Valor (ID)</Label><Input id={`q-${qIndex}-opt-${oIndex}-value`} placeholder="Ex: opcao_a" value={opt.value} onChange={(e) => updateOption(qIndex, oIndex, 'value', e.target.value)} /></div><div className="space-y-1"><Label htmlFor={`q-${qIndex}-opt-${oIndex}-label`} className="text-xs">Label Visível</Label><Input id={`q-${qIndex}-opt-${oIndex}-label`} placeholder="Ex: Opção A" value={opt.label} onChange={(e) => updateOption(qIndex, oIndex, 'label', e.target.value)} /></div></div><div className="space-y-1"><Label htmlFor={`q-${qIndex}-opt-${oIndex}-text_message`} className="text-xs">Texto para Mensagem (Opcional)</Label><Input id={`q-${qIndex}-opt-${oIndex}-text_message`} placeholder="Ex: 'que já tem experiência'" value={opt.text_message || ''} onChange={(e) => updateOption(qIndex, oIndex, 'text_message', e.target.value)} /></div><div className="space-y-1"><Label className="text-xs">Ícone</Label><IconPicker value={opt.icon} onChange={(iconName) => updateOption(qIndex, oIndex, 'icon', iconName)} /></div><div className="space-y-1"><Label htmlFor={`q-${qIndex}-opt-${oIndex}-imageUrl`} className="text-xs">URL da Imagem (Opcional)</Label><Input id={`q-${qIndex}-opt-${oIndex}-imageUrl`} placeholder="https://placehold.co/300x200.png" value={opt.imageUrl || ''} onChange={(e) => updateOption(qIndex, oIndex, 'imageUrl', e.target.value)} /></div><div className="space-y-1"><Label htmlFor={`q-${qIndex}-opt-${oIndex}-dataAiHint`} className="text-xs">Dica IA para Imagem</Label><Input id={`q-${qIndex}-opt-${oIndex}-dataAiHint`} placeholder="Ex: abstract shape" value={opt.dataAiHint || ''} onChange={(e) => updateOption(qIndex, oIndex, 'dataAiHint', e.target.value)} /></div><div className="flex items-center space-x-2 pt-2"><Switch id={`q-${qIndex}-opt-${oIndex}-isDisqualifying`} checked={opt.isDisqualifying} onCheckedChange={(checked) => updateOption(qIndex, oIndex, 'isDisqualifying', checked)} /><Label htmlFor={`q-${qIndex}-opt-${oIndex}-isDisqualifying`} className="text-xs font-normal text-destructive">Desqualificar esta resposta</Label></div></div><Button variant="ghost" size="icon" onClick={() => removeOption(qIndex, oIndex)} className="absolute top-1 right-1 text-destructive hover:text-destructive/80 h-7 w-7"><Trash2 className="h-4 w-4" /></Button></Card>))}<Button type="button" variant="outline" size="sm" onClick={() => addOption(qIndex)} className="mt-2 w-full"><PlusCircle className="mr-2 h-4 w-4" /> Adicionar Opção</Button></CardContent></Card>)}
                                        {q.type === 'textFields' && (<Card><CardHeader className="pb-2"><CardTitle className="text-md">Campos de Entrada</CardTitle></CardHeader><CardContent className="space-y-3 p-4">{(q.fields || []).map((field, fIndex) => (<Card key={fIndex} className="p-3 bg-background/50 relative"><div className="space-y-3"><Label className="text-sm font-medium">Campo {fIndex + 1}</Label><div className="grid grid-cols-1 md:grid-cols-2 gap-2"><div className="space-y-1"><Label htmlFor={`q-${qIndex}-field-${fIndex}-name`} className="text-xs">Nome/Chave</Label><Input id={`q-${qIndex}-field-${fIndex}-name`} placeholder="Ex: nomeCompleto" value={field.name} onChange={(e) => updateFormField(qIndex, fIndex, 'name', e.target.value)} /></div><div className="space-y-1"><Label htmlFor={`q-${qIndex}-field-${fIndex}-label`} className="text-xs">Label Visível</Label><Input id={`q-${qIndex}-field-${fIndex}-label`} placeholder="Ex: Nome Completo" value={field.label} onChange={(e) => updateFormField(qIndex, fIndex, 'label', e.target.value)} /></div></div><div className="grid grid-cols-1 md:grid-cols-2 gap-2"><div><Label className="text-xs">Tipo do Campo</Label><Select value={field.type} onValueChange={(val) => updateFormField(qIndex, fIndex, 'type', val as 'text'|'tel'|'email')}><SelectTrigger><SelectValue placeholder="Tipo" /></SelectTrigger><SelectContent><SelectItem value="text">Texto</SelectItem><SelectItem value="tel">Telefone</SelectItem><SelectItem value="email">Email</SelectItem></SelectContent></Select></div><div><Label className="text-xs">Ícone</Label><IconPicker value={field.icon} onChange={(val) => updateFormField(qIndex, fIndex, 'icon', val)} /></div></div><div className="space-y-1"><Label htmlFor={`q-${qIndex}-field-${fIndex}-placeholder`} className="text-xs">Placeholder</Label><Input id={`q-${qIndex}-field-${fIndex}-placeholder`} placeholder="Ex: Digite seu nome" value={field.placeholder || ''} onChange={(e) => updateFormField(qIndex, fIndex, 'placeholder', e.target.value)} /></div></div><Button variant="ghost" size="icon" onClick={() => removeFormField(qIndex, fIndex)} className="absolute top-1 right-1 text-destructive hover:text-destructive/80 h-7 w-7"><Trash2 className="h-4 w-4" /></Button></Card>))}<Button type="button" variant="outline" size="sm" onClick={() => addFormField(qIndex)} className="mt-2 w-full"><PlusCircle className="mr-2 h-4 w-4" /> Adicionar Campo</Button></CardContent></Card>)}
                                        <div className="flex justify-end pt-2"><Button variant="ghost" size="sm" onClick={() => removeQuestion(qIndex)} className="text-destructive hover:text-destructive/80 hover:bg-destructive/10"><Trash2 className="mr-2 h-4 w-4" />Remover Pergunta</Button></div></div>
                                    <div className="lg:sticky lg:top-4"><Card className="bg-background"><CardHeader><CardTitle className="text-md">Pré-visualização</CardTitle></CardHeader><CardContent><QuestionPreview question={q} /></CardContent></Card></div></div></AccordionContent></AccordionItem>))}
                            </Accordion>
                            <Button type="button" onClick={addQuestion} variant="outline" className="w-full mt-6 shadow-sm"><PlusCircle className="mr-2 h-4 w-4" /> Adicionar Nova Pergunta</Button>
                        </TabsContent>
                        <TabsContent value="json" className="pt-4">
                            <Textarea id="questionsJson" value={questionsJson} onChange={(e) => setQuestionsJson(e.target.value)} placeholder="[]" rows={15} className="font-mono text-xs bg-muted/20"/>
                            <Button asChild variant="outline" className="mt-4"><Link href="/config/dashboard/documentation/quiz-json" target="_blank"><BookOpen className="mr-2 h-4 w-4" /> Abrir Guia de Criação JSON</Link></Button>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="mensagens" className="space-y-6">
            <Card className="shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Mensagens Pós-Quiz</CardTitle>
                    </div>
                    {hasApiKey && (
                        <Button type="button" variant="outline" size="sm" onClick={() => handleOpenAiDialog('messages')}>
                            <Wand2 className="mr-2 h-4 w-4"/> Gerar com IA
                        </Button>
                    )}
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {messages.map((msg, msgIndex) => (
                            <Card key={msg.id} className="p-4 bg-muted/30">
                            <div className="flex gap-4">
                                <div className="flex flex-col items-center gap-1 text-muted-foreground">
                                    <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => reorderMessages(msgIndex, 'up')} disabled={msgIndex === 0}><ChevronUp className="h-5 w-5" /></Button>
                                    <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => reorderMessages(msgIndex, 'down')} disabled={msgIndex === messages.length - 1}><ChevronDown className="h-5 w-5" /></Button>
                                </div>
                                <div className="flex-grow flex flex-col gap-4">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                                        <div className="space-y-2 md:col-span-1"><Label>Tipo da Mensagem</Label><Select value={msg.type} onValueChange={(value: QuizMessage['type']) => updateMessage(msgIndex, 'type', value)}><SelectTrigger><div className="flex items-center gap-2">{msg.type === 'imagem' ? <ImageIconLucide className="h-4 w-4 text-muted-foreground" /> : msg.type === 'audio' ? <AudioWaveform className="h-4 w-4 text-muted-foreground" /> : <MessageSquareText className="h-4 w-4 text-muted-foreground" />}<SelectValue placeholder="Selecione o tipo" /></div></SelectTrigger><SelectContent><SelectItem value="mensagem">Texto</SelectItem><SelectItem value="imagem">Imagem</SelectItem><SelectItem value="audio">Áudio</SelectItem></SelectContent></Select></div>
                                        <div className="space-y-2 md:col-span-2"><Label>Conteúdo</Label>{msg.type === 'mensagem' ? (<Textarea placeholder="Digite sua mensagem aqui..." value={msg.content} onChange={(e) => updateMessage(msgIndex, 'content', e.target.value)} rows={3} />) : (<div className="flex items-center gap-2"><Label htmlFor={`file-upload-${msg.id}`} className={cn(buttonVariants({ variant: "outline" }), "cursor-pointer")}><FileUp className="mr-2 h-4 w-4" /><span>{msg.filename ? 'Trocar' : 'Escolher'}</span></Label><Input id={`file-upload-${msg.id}`} type="file" accept={msg.type === 'imagem' ? "image/*" : "audio/*"} onChange={(e) => handleFileChange(e, msgIndex)} className="hidden" />{msg.filename ? (<span className="text-sm text-muted-foreground truncate" title={msg.filename}>{msg.filename}</span>) : (<span className="text-sm text-muted-foreground">Nenhum arquivo</span>)}</div>)}</div>
                                    </div>
                                    <div className="flex items-center justify-end gap-2 mt-2 pt-2 border-t border-border/30">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button type="button" variant="outline" size="sm" disabled={availableVariables.length === 0 || msg.type !== 'mensagem'}>
                                                <Tags className="mr-2 h-4 w-4" /> Inserir Variável
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent>
                                            <DropdownMenuLabel>Variáveis do Quiz</DropdownMenuLabel>
                                            <DropdownMenuSeparator />
                                            {availableVariables.length > 0 ? (
                                                availableVariables.map(variable => (
                                                    <DropdownMenuItem key={variable.value} onSelect={() => handleInsertVariable(variable.value, msgIndex)}>
                                                        {variable.label}
                                                    </DropdownMenuItem>
                                                ))
                                            ) : (
                                                <DropdownMenuItem disabled>Nenhuma variável encontrada</DropdownMenuItem>
                                            )}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                    <Button variant="ghost" size="icon" onClick={() => removeMessage(msgIndex)} className="text-muted-foreground hover:text-destructive h-8 w-8">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                                </div>
                            </div>
                            </Card>
                        ))}
                    </div>
                    <Button type="button" variant="outline" className="w-full mt-4" onClick={addMessage} disabled={messages.length >= 5}><PlusCircle className="mr-2 h-4 w-4" /> Adicionar Mensagem</Button>
                </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Card className="mt-6 shadow-lg">
            <CardFooter className="flex flex-col items-start gap-4 p-6">
                {error && (<Alert variant="destructive" className="w-full"><AlertTriangle className="h-4 w-4" /><AlertTitle>Erro</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>)}
                {success && (<Alert variant="default" className="w-full bg-green-50 border-green-300 text-green-700 dark:bg-green-900/30 dark:border-green-700 dark:text-green-400"><Save className="h-4 w-4 text-green-600 dark:text-green-400" /><AlertTitle>Sucesso!</AlertTitle><AlertDescription>{success}</AlertDescription></Alert>)}
                <Button type="submit" size="lg" className="shadow-md" disabled={isLoadingManual}>
                {isLoadingManual ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Salvando...</>) : (<><Save className="mr-2 h-4 w-4" />Criar Quiz</>)}
                </Button>
            </CardFooter>
        </Card>
      </form>
      
      {hasApiKey && (
        <AiGenerationDialog
          isOpen={isAiDialogOpen}
          setIsOpen={setIsAiDialogOpen}
          generationType={currentGenerationType}
          onGenerate={handleAiGeneratedData}
          existingDataContext={getCurrentContextData()}
        />
      )}

      <Dialog open={isPreviewModalOpen} onOpenChange={setIsPreviewModalOpen}>
        <DialogContent className="max-w-2xl w-[95vw] h-[90vh] flex flex-col p-0">
          <DialogHeader className="p-4 border-b"><DialogTitle>Pré-visualização do Quiz: {title || "Novo Quiz"}</DialogTitle></DialogHeader>
          <div className="flex-grow overflow-y-auto bg-background">
            {previewQuizData ? (
              <QuizForm
                quizQuestions={previewQuizData}
                quizSlug={slug || "preview-slug"}
                quizTitle={title || "Pré-visualização do Quiz"}
                quizDescription={description || DEFAULT_QUIZ_DESCRIPTION}
                logoUrl={whitelabelSettings.logoUrl || "https://placehold.co/150x50.png?text=Logo"}
                footerCopyrightText={whitelabelSettings.footerCopyrightText || `© ${new Date().getFullYear()} Preview. Todos os direitos reservados.`}
                websiteUrl={whitelabelSettings.websiteUrl}
                instagramUrl={whitelabelSettings.instagramUrl}
                successPageText={successPageText}
                disqualifiedPageText={disqualifiedPageText}
                disqualifiedRedirectUrl={disqualifiedRedirectUrl}
                disqualifiedRedirectDelaySeconds={disqualifiedRedirectDelaySeconds}
                finalFacebookPixelIds={[]}
                googleAnalyticsId="" 
                onSubmitOverride={mockSubmitOverride}
                onAbandonmentOverride={async () => { console.log("Preview abandonment") }}
                isPreview={true}
                displayMode={displayMode}
              />
            ) : <div className="p-4"><QuizFormLoading /></div> }
          </div>
          <DialogFooter className="p-4 border-t"><DialogClose asChild><Button variant="outline">Fechar Pré-visualização</Button></DialogClose></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
