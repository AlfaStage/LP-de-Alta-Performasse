
"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, AlertTriangle, Info, Loader2, PlusCircle, Trash2, Wand2, FileJson } from 'lucide-react';
import { createQuizAction } from '../actions';
import type { QuizQuestion, QuizOption, FormFieldConfig } from '@/types/quiz';
import { defaultContactStep } from '@/config/quizConfig';
import { APP_BASE_URL } from '@/config/appConfig';

const exampleQuestion: QuizQuestion = {
  id: "q_example",
  name: "exampleQuestion",
  icon: "HelpCircle",
  text: "Esta é uma pergunta de exemplo?",
  type: "radio",
  options: [
    { value: "yes", label: "Sim", icon: "ThumbsUp" },
    { value: "no", label: "Não", icon: "ThumbsDown" }
  ]
};
const exampleQuizJson = JSON.stringify([exampleQuestion], null, 2);


export default function CreateQuizPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [questionsJson, setQuestionsJson] = useState('');
  const [interactiveQuestions, setInteractiveQuestions] = useState<QuizQuestion[]>([]);
  const [currentTab, setCurrentTab] = useState<'json' | 'interactive'>('interactive');
  
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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
    if (field === 'type') { // Reset options/fields if type changes
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
    question.options = [...(question.options || []), { value: `opt${(question.options?.length || 0) + 1}`, label: '' }];
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
    question.fields = [...(question.fields || []), { name: `field${(question.fields?.length || 0) + 1}`, label: '', type: 'text', icon: 'Type' }];
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
        setError("JSON das perguntas é obrigatório no modo JSON.");
        setIsLoading(false);
        return;
      }
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
    } else {
      if (interactiveQuestions.length === 0) {
        setError("Adicione ao menos uma pergunta no construtor interativo.");
        setIsLoading(false);
        return;
      }
      parsedQuestions = interactiveQuestions;
    }
    
    if (parsedQuestions.length === 0 && currentTab === 'json') {
         setError("O JSON das perguntas não pode ser um array vazio.");
         setIsLoading(false);
         return;
    }


    try {
      const result = await createQuizAction({ title, slug, questions: parsedQuestions });
      if (result.success) {
        setSuccess(`Quiz "${title}" criado com sucesso! Acessível em /${result.slug}`);
        setTitle('');
        setSlug('');
        setQuestionsJson('');
        setInteractiveQuestions([]);
        // router.push('/config/dashboard'); // Optionally redirect
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
      <h1 className="text-2xl font-semibold md:text-3xl">Criar Novo Quiz</h1>
      <form onSubmit={handleSubmit}>
        <Card className="shadow-lg mb-6">
            <CardHeader>
                <CardTitle>Detalhes Gerais do Quiz</CardTitle>
                <CardDescription>
                    Defina o título e o slug para a URL do seu novo quiz.
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
                <Label htmlFor="slug">Slug do Quiz (para URL)</Label>
                <Input
                    id="slug"
                    value={slug}
                    onChange={handleSlugChange}
                    placeholder="Ex: qualificacao-capilar (letras minúsculas, números, hífens)"
                    required
                />
                <p className="text-xs text-muted-foreground">
                    Será acessível em: {APP_BASE_URL}/{slug || "seu-slug"}
                </p>
                </div>
            </CardContent>
        </Card>

        <Tabs value={currentTab} onValueChange={(value) => setCurrentTab(value as 'json' | 'interactive')} className="mb-6">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="interactive"><Wand2 className="mr-2 h-4 w-4" />Construtor Interativo</TabsTrigger>
                <TabsTrigger value="json"><FileJson className="mr-2 h-4 w-4" />Entrada JSON</TabsTrigger>
            </TabsList>
            <TabsContent value="interactive">
                <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle>Construtor Interativo de Perguntas</CardTitle>
                        <CardDescription>
                        Adicione e configure as perguntas do seu quiz. A etapa de contato será adicionada automaticamente no final.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {interactiveQuestions.map((q, qIndex) => (
                        <Card key={q.id} className="p-4 space-y-3 bg-muted/30">
                            <div className="flex justify-between items-center">
                                <Label className="text-base font-semibold">Pergunta {qIndex + 1}</Label>
                                <Button variant="ghost" size="icon" onClick={() => removeQuestion(qIndex)} className="text-destructive hover:text-destructive/80">
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <Input placeholder="ID da Pergunta (ex: q1_pele)" value={q.id} onChange={(e) => updateQuestion(qIndex, 'id', e.target.value)} />
                                <Input placeholder="Nome/Chave (ex: tipoPele)" value={q.name} onChange={(e) => updateQuestion(qIndex, 'name', e.target.value)} />
                            </div>
                            <Textarea placeholder="Texto da Pergunta" value={q.text} onChange={(e) => updateQuestion(qIndex, 'text', e.target.value)} />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <Input placeholder="Ícone Lucide (ex: User)" value={q.icon || ''} onChange={(e) => updateQuestion(qIndex, 'icon', e.target.value)} />
                                <Select value={q.type} onValueChange={(value) => updateQuestion(qIndex, 'type', value)}>
                                    <SelectTrigger><SelectValue placeholder="Tipo de Pergunta" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="radio">Radio (Escolha Única)</SelectItem>
                                        <SelectItem value="checkbox">Checkbox (Múltipla Escolha)</SelectItem>
                                        <SelectItem value="textFields">Campos de Texto</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {q.type === 'radio' || q.type === 'checkbox' ? (
                            <div className="space-y-2 pl-4 border-l-2 border-primary/30">
                                <Label className="text-sm font-medium">Opções:</Label>
                                {(q.options || []).map((opt, oIndex) => (
                                <div key={oIndex} className="flex items-center gap-2">
                                    <Input placeholder="Valor da Opção" value={opt.value} onChange={(e) => updateOption(qIndex, oIndex, 'value', e.target.value)} className="flex-1" />
                                    <Input placeholder="Label da Opção" value={opt.label} onChange={(e) => updateOption(qIndex, oIndex, 'label', e.target.value)} className="flex-1" />
                                    {/* Placeholder for Icon, ImageUrl, etc. in future iteration */}
                                    <Button variant="ghost" size="icon" onClick={() => removeOption(qIndex, oIndex)} className="text-destructive hover:text-destructive/80">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                                ))}
                                <Button type="button" variant="outline" size="sm" onClick={() => addOption(qIndex)} className="mt-1">
                                <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Opção
                                </Button>
                            </div>
                            ) : null}

                            {q.type === 'textFields' ? (
                            <div className="space-y-2 pl-4 border-l-2 border-primary/30">
                                <Label className="text-sm font-medium">Campos de Texto:</Label>
                                {(q.fields || []).map((field, fIndex) => (
                                <div key={fIndex} className="space-y-1 p-2 border rounded bg-background">
                                    <div className="flex items-center gap-2">
                                    <Input placeholder="Nome/Chave do Campo" value={field.name} onChange={(e) => updateFormField(qIndex, fIndex, 'name', e.target.value)} className="flex-1"/>
                                    <Input placeholder="Label do Campo" value={field.label} onChange={(e) => updateFormField(qIndex, fIndex, 'label', e.target.value)} className="flex-1"/>
                                    <Button variant="ghost" size="icon" onClick={() => removeFormField(qIndex, fIndex)} className="text-destructive hover:text-destructive/80">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                    </div>
                                    <div className="flex items-center gap-2">
                                    <Select value={field.type} onValueChange={(val) => updateFormField(qIndex, fIndex, 'type', val as 'text'|'tel'|'email')}>
                                        <SelectTrigger className="flex-1"><SelectValue placeholder="Tipo do Campo" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="text">Texto</SelectItem>
                                            <SelectItem value="tel">Telefone</SelectItem>
                                            <SelectItem value="email">Email</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Input placeholder="Ícone Lucide (ex: User)" value={field.icon || ''} onChange={(e) => updateFormField(qIndex, fIndex, 'icon', e.target.value)} className="flex-1" />
                                    </div>
                                </div>
                                ))}
                                <Button type="button" variant="outline" size="sm" onClick={() => addFormField(qIndex)} className="mt-1">
                                <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Campo de Texto
                                </Button>
                            </div>
                            ) : null}
                        </Card>
                        ))}
                        <Button type="button" onClick={addQuestion} variant="outline" className="w-full mt-4 py-3">
                            <PlusCircle className="mr-2 h-5 w-5" /> Adicionar Nova Pergunta
                        </Button>
                    </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="json">
                 <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle>Perguntas do Quiz (Formato JSON)</CardTitle>
                        <CardDescription>
                            Cole aqui o array de objetos das perguntas em formato JSON. A etapa de contato é adicionada automaticamente.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Textarea
                            id="questionsJson"
                            value={questionsJson}
                            onChange={(e) => setQuestionsJson(e.target.value)}
                            placeholder="Cole aqui o array de objetos das perguntas em formato JSON."
                            rows={15}
                            className="font-mono text-xs"
                        />
                        <Alert variant="default" className="mt-2">
                            <Info className="h-4 w-4" />
                            <AlertTitle>Exemplo de Estrutura JSON para Perguntas</AlertTitle>
                            <AlertDescription>
                            <p className="mb-2">Cada pergunta deve ser um objeto com `id`, `name`, `text`, `type`, e `options` (para radio/checkbox) ou `fields` (para textFields). Nomes de ícones devem ser de `lucide-react` (ex: "User", "Smile").</p>
                            <details>
                                <summary className="cursor-pointer text-primary hover:underline">Ver exemplo JSON (sem etapa de contato)</summary>
                                <pre className="mt-2 p-2 bg-muted rounded-md text-xs overflow-x-auto">
                                {exampleQuizJson}
                                </pre>
                            </details>
                            </AlertDescription>
                        </Alert>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>

        <Card className="mt-6 shadow-lg">
            <CardFooter className="flex flex-col items-start gap-4 p-6">
                {error && (
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
                <Button type="submit" className="text-base py-3" disabled={isLoading}>
                {isLoading ? (
                    <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Salvando...
                    </>
                ) : (
                    <>
                    <Save className="mr-2 h-5 w-5" />
                    Criar Quiz
                    </>
                )}
                </Button>
            </CardFooter>
        </Card>
      </form>
    </div>
  );
}
