
"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Save, AlertTriangle, Info, Loader2, PlusCircle, Trash2, Wand2, FileJson, Eye, MessageSquareText, ListChecks, Edit3, Text, Phone, Mail, BadgeInfo, FileTextIcon, Link as LinkIconLucide, BookOpen, LayoutDashboard, File, Settings, ChevronsUpDown } from 'lucide-react';
import { createQuizAction } from '../actions';
import type { QuizQuestion, QuizOption, FormFieldConfig, WhitelabelConfig } from '@/types/quiz';
import dynamic from 'next/dynamic';
import QuizFormLoading from '@/components/quiz/QuizFormLoading';
import { fetchWhitelabelSettings } from '@/app/config/dashboard/settings/actions';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import IconPicker from '@/components/dashboard/IconPicker';
import QuestionPreview from '@/components/dashboard/QuestionPreview';
import Link from 'next/link';

const QuizForm = dynamic(() => import('@/components/quiz/QuizForm'), {
  ssr: false,
  loading: () => <div className="p-4"><QuizFormLoading/></div>,
});

const DEFAULT_QUIZ_DESCRIPTION = "Responda algumas perguntas para nos ajudar a entender suas preferências.";

export default function CreateQuizPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState(DEFAULT_QUIZ_DESCRIPTION);
  const [dashboardName, setDashboardName] = useState('');
  const [questionsJson, setQuestionsJson] = useState('[\n  \n]');
  const [interactiveQuestions, setInteractiveQuestions] = useState<QuizQuestion[]>([]);
  const [displayMode, setDisplayMode] = useState<'step-by-step' | 'single-page'>('step-by-step');
  const [currentTab, setCurrentTab] = useState<'interactive' | 'json'>('interactive');
  
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [previewQuizData, setPreviewQuizData] = useState<QuizQuestion[] | null>(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [whitelabelSettings, setWhitelabelSettings] = useState<Partial<WhitelabelConfig>>({});
  const [baseUrl, setBaseUrl] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setBaseUrl(window.location.origin);
    }
    async function fetchPreviewConfig() {
      const config = await fetchWhitelabelSettings();
      setWhitelabelSettings(config);
    }
    fetchPreviewConfig();
  }, []);

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
    let questionsForPreview: QuizQuestion[];
    if (currentTab === 'interactive') {
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
      const result = await createQuizAction({ 
        title, 
        slug, 
        description: description || DEFAULT_QUIZ_DESCRIPTION, 
        dashboardName: dashboardName || title, 
        questions: parsedQuestions,
        displayMode: displayMode,
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
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold md:text-3xl">Criar Novo Quiz</h1>
         <Button onClick={handleOpenPreview} variant="outline" disabled={!title.trim()}>
            <Eye className="mr-2 h-4 w-4" /> Pré-visualizar Quiz
        </Button>
      </div>
      <form onSubmit={handleSubmit}>
        <Card className="shadow-lg mb-6">
            <CardHeader>
                <CardTitle>Detalhes Gerais do Quiz</CardTitle>
                <CardDescription>
                    Defina o título, URL, e formato de exibição do seu novo quiz.
                </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title" className="flex items-center gap-1.5"><FileTextIcon className="h-4 w-4 text-muted-foreground" />Título Público</Label>
                  <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Quiz de Avaliação de Produto" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dashboardName" className="flex items-center gap-1.5"><BadgeInfo className="h-4 w-4 text-muted-foreground" />Nome Interno (Dashboard)</Label>
                  <Input id="dashboardName" value={dashboardName} onChange={(e) => setDashboardName(e.target.value)} placeholder="Opcional, ex: Campanha de Inverno" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug" className="flex items-center gap-1.5"><LinkIconLucide className="h-4 w-4 text-muted-foreground" />Slug (URL)</Label>
                  <Input id="slug" value={slug} onChange={handleSlugChange} placeholder="ex: avaliacao-produto" required />
                  <p className="text-xs text-muted-foreground">Será acessível em: {baseUrl ? `${baseUrl}/${slug}` : '...'}</p>
                </div>
                 <div className="space-y-2">
                    <Label className="flex items-center gap-1.5"><LayoutDashboard className="h-4 w-4 text-muted-foreground" />Formato de Exibição</Label>
                     <RadioGroup value={displayMode} onValueChange={(value) => setDisplayMode(value as 'step-by-step' | 'single-page')} className="flex gap-4 pt-2">
                        <div className="flex items-center space-x-2"><RadioGroupItem value="step-by-step" id="mode-step" /><Label htmlFor="mode-step" className="font-normal">Passo a Passo</Label></div>
                        <div className="flex items-center space-x-2"><RadioGroupItem value="single-page" id="mode-single" /><Label htmlFor="mode-single" className="font-normal">Página Única</Label></div>
                    </RadioGroup>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="description" className="flex items-center gap-1.5"><MessageSquareText className="h-4 w-4 text-muted-foreground" />Descrição do Quiz (Opcional)</Label>
                  <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Aparecerá abaixo do título na página do quiz." rows={2} />
                </div>
            </CardContent>
        </Card>

        <Tabs value={currentTab} onValueChange={(value) => handleTabChange(value as 'json' | 'interactive')} className="mb-6">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="interactive"><Wand2 className="mr-2 h-4 w-4" />Construtor Interativo</TabsTrigger>
                <TabsTrigger value="json"><FileJson className="mr-2 h-4 w-4" />Editor JSON</TabsTrigger>
            </TabsList>
            <TabsContent value="interactive">
                <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle>Perguntas do Quiz</CardTitle>
                        <CardDescription>Adicione e configure as perguntas do seu quiz usando o construtor abaixo.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Accordion type="single" collapsible className="w-full space-y-4">
                            {interactiveQuestions.map((q, qIndex) => (
                            <AccordionItem key={q.id || `q_interactive_${qIndex}`} value={q.id || `item-${qIndex}`} className="border rounded-lg bg-muted/20 p-0">
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
                                       <div className="flex justify-end">
                                            <Button variant="ghost" size="icon" onClick={() => removeQuestion(qIndex)} className="text-destructive hover:text-destructive/80"><Trash2 className="h-5 w-5" /><span className="sr-only">Remover Pergunta</span></Button>
                                        </div>
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
                                                <Card key={`q-${qIndex}-opt-${oIndex}`} className="p-3 bg-background/50 relative">
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
                                                <Card key={`q-${qIndex}-field-${fIndex}`} className="p-3 bg-background/50 relative">
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
                                    </div>
                                    {/* Coluna de Preview */}
                                    <div className="lg:sticky lg:top-4">
                                      <Card className="bg-background">
                                        <CardHeader><CardTitle className="text-md">Pré-visualização</CardTitle></CardHeader>
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
                        <Button type="button" onClick={addQuestion} variant="outline" className="w-full mt-6 py-3 text-base shadow-sm"><PlusCircle className="mr-2 h-5 w-5" /> Adicionar Nova Pergunta</Button>
                    </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="json">
                 <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle>Editor de Perguntas JSON</CardTitle>
                        <CardDescription>
                            Cole aqui o array de objetos das perguntas. Use o botão abaixo para consultar a estrutura e os campos disponíveis.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Textarea
                            id="questionsJson"
                            value={questionsJson}
                            onChange={(e) => setQuestionsJson(e.target.value)}
                            placeholder="[]"
                            rows={15}
                            className="font-mono text-xs bg-muted/20"
                        />
                         <Button asChild variant="outline" className="mt-4">
                            <Link href="/config/dashboard/documentation/quiz-json" target="_blank">
                                <BookOpen className="mr-2 h-4 w-4" /> Abrir Guia de Criação JSON
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>

        <Card className="mt-6 shadow-lg">
            <CardFooter className="flex flex-col items-start gap-4 p-6">
                {error && (<Alert variant="destructive" className="w-full"><AlertTriangle className="h-4 w-4" /><AlertTitle>Erro</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>)}
                {success && (<Alert variant="default" className="w-full bg-green-50 border-green-300 text-green-700 dark:bg-green-900/30 dark:border-green-700 dark:text-green-400"><Save className="h-4 w-4 text-green-600 dark:text-green-400" /><AlertTitle>Sucesso!</AlertTitle><AlertDescription>{success}</AlertDescription></Alert>)}
                <Button type="submit" className="text-base py-3 px-6 shadow-md" disabled={isLoading}>
                {isLoading ? (<><Loader2 className="mr-2 h-5 w-5 animate-spin" />Salvando...</>) : (<><Save className="mr-2 h-5 w-5" />Criar Quiz</>)}
                </Button>
            </CardFooter>
        </Card>
      </form>

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
                facebookPixelId="" 
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

    