
"use client";
import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Save, AlertTriangle, Info, Loader2, ArrowLeft } from 'lucide-react';
import { getQuizForEdit, updateQuizAction, type QuizEditData } from '@/app/config/dashboard/quiz/actions';
import type { QuizQuestion } from '@/types/quiz';
import { defaultContactStep } from '@/config/quizConfig';
import { APP_BASE_URL } from '@/config/appConfig';
import Link from 'next/link';

const exampleQuestion: QuizQuestion = {
  id: "q_example_edit",
  name: "exampleQuestionEdit",
  icon: "HelpCircle",
  text: "Esta é uma pergunta de exemplo para edição?",
  type: "radio",
  options: [
    { value: "yes_edit", label: "Sim (editado)", icon: "ThumbsUp" },
    { value: "no_edit", label: "Não (editado)", icon: "ThumbsDown" }
  ]
};

// Example JSON string for placeholder (excluding contact step)
const exampleQuizJson = JSON.stringify([exampleQuestion], null, 2);


export default function EditQuizPage() {
  const router = useRouter();
  const params = useParams();
  const quizSlug = typeof params.quizSlug === 'string' ? params.quizSlug : '';

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState(quizSlug); // Slug is read-only for now
  const [questionsJson, setQuestionsJson] = useState('');
  const [originalQuizData, setOriginalQuizData] = useState<QuizEditData | null>(null);
  
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  const fetchQuizData = useCallback(async () => {
    if (!quizSlug) {
        setError("Slug do quiz não encontrado na URL.");
        setIsFetching(false);
        return;
    }
    setIsFetching(true);
    setError(null);
    try {
      const data = await getQuizForEdit(quizSlug);
      if (data) {
        setOriginalQuizData(data);
        setTitle(data.title);
        setSlug(data.slug); // Should match quizSlug
        setQuestionsJson(data.questionsJson);
      } else {
        setError(`Quiz com slug "${quizSlug}" não encontrado ou falha ao carregar.`);
      }
    } catch (err) {
      setError("Erro ao buscar dados do quiz para edição.");
      console.error(err);
    } finally {
      setIsFetching(false);
    }
  }, [quizSlug]);

  useEffect(() => {
    fetchQuizData();
  }, [fetchQuizData]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    if (!title.trim() || !slug.trim() || !questionsJson.trim()) {
      setError("Título e JSON das perguntas são obrigatórios.");
      setIsLoading(false);
      return;
    }
    
    let parsedQuestions;
    try {
      parsedQuestions = JSON.parse(questionsJson);
      if (!Array.isArray(parsedQuestions)) { // Allow empty array, contact step will be added
        setError("O JSON das perguntas deve ser um array.");
        setIsLoading(false);
        return;
      }
    } catch (jsonError) {
      setError("JSON das perguntas inválido. Verifique a sintaxe.");
      setIsLoading(false);
      return;
    }

    try {
      const result = await updateQuizAction({ title, slug, questions: parsedQuestions });
      if (result.success) {
        setSuccess(`Quiz "${title}" atualizado com sucesso!`);
        // Optionally refetch data or update state if needed
        await fetchQuizData(); 
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
            <Button variant="outline" onClick={() => router.push('/config/dashboard')} className="mt-4">
                <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para o Dashboard
            </Button>
        </div>
     )
  }


  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold md:text-3xl">Editar Quiz: {originalQuizData?.title || slug}</h1>
        <Button variant="outline" onClick={() => router.push('/config/dashboard')}>
             <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para o Dashboard
        </Button>
      </div>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Detalhes do Quiz</CardTitle>
          <CardDescription>
            Modifique o título e as perguntas do quiz. O slug não pode ser alterado.
            A etapa de contato é gerenciada automaticamente.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
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
            <div className="space-y-2">
              <Label htmlFor="questionsJson">Perguntas do Quiz (Formato JSON)</Label>
              <Textarea
                id="questionsJson"
                value={questionsJson}
                onChange={(e) => setQuestionsJson(e.target.value)}
                placeholder="Cole aqui o array de objetos das perguntas em formato JSON."
                rows={15}
                required
                className="font-mono text-xs"
              />
              <Alert variant="default" className="mt-2">
                <Info className="h-4 w-4" />
                <AlertTitle>Estrutura JSON para Perguntas</AlertTitle>
                <AlertDescription>
                  <p className="mb-2">Edite o array de objetos das perguntas. Não inclua a etapa de contato aqui; ela é adicionada automaticamente. Nomes de ícones devem ser de `lucide-react`.</p>
                  <details>
                    <summary className="cursor-pointer text-primary hover:underline">Ver exemplo JSON (apenas perguntas de conteúdo)</summary>
                    <pre className="mt-2 p-2 bg-muted rounded-md text-xs overflow-x-auto">
                      {exampleQuizJson}
                    </pre>
                  </details>
                </AlertDescription>
              </Alert>
            </div>
             {error && !success && ( // Show error only if there's no success message
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Erro</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {success && (
              <Alert variant="default" className="bg-green-50 border-green-300 text-green-700 dark:bg-green-900/30 dark:border-green-700 dark:text-green-400">
                <Save className="h-4 w-4 text-green-600 dark:text-green-400" />
                <AlertTitle>Sucesso!</AlertTitle>
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}
          </CardContent>
          <CardFooter>
            <Button type="submit" className="text-base py-3" disabled={isLoading || isFetching}>
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
        </form>
      </Card>
    </div>
  );
}

    

    