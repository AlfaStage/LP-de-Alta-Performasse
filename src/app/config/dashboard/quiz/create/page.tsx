
"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Save, AlertTriangle, Info, Loader2 } from 'lucide-react';
import { createQuizAction } from '../actions';
import type { QuizQuestion } from '@/types/quiz'; // For example structure
import { defaultContactStep } from '@/config/quizConfig'; // To show example
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

const exampleQuizJson = JSON.stringify([exampleQuestion, defaultContactStep], null, 2);


export default function CreateQuizPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [questionsJson, setQuestionsJson] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawSlug = e.target.value;
    // Allow only lowercase letters, numbers, and hyphens
    // Replace spaces with hyphens, remove other special characters
    const formattedSlug = rawSlug
      .toLowerCase()
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/[^a-z0-9-]/g, ''); // Remove invalid characters
    setSlug(formattedSlug);
  };
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    if (!title.trim() || !slug.trim() || !questionsJson.trim()) {
      setError("Todos os campos são obrigatórios.");
      setIsLoading(false);
      return;
    }
    
    let parsedQuestions;
    try {
      parsedQuestions = JSON.parse(questionsJson);
      if (!Array.isArray(parsedQuestions) || parsedQuestions.length === 0) {
        setError("O JSON das perguntas deve ser um array não vazio.");
        setIsLoading(false);
        return;
      }
    } catch (jsonError) {
      setError("JSON das perguntas inválido. Verifique a sintaxe.");
      setIsLoading(false);
      return;
    }

    try {
      const result = await createQuizAction({ title, slug, questions: parsedQuestions });
      if (result.success) {
        setSuccess(`Quiz "${title}" criado com sucesso! Acessível em /${slug}`);
        setTitle('');
        setSlug('');
        setQuestionsJson('');
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
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Detalhes do Quiz</CardTitle>
          <CardDescription>
            Configure um novo quiz interativo. O slug será usado na URL (ex: /meu-quiz).
            A última etapa de contato será adicionada automaticamente.
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
              <Label htmlFor="slug">Slug do Quiz (para URL)</Label>
              <Input
                id="slug"
                value={slug}
                onChange={handleSlugChange}
                placeholder="Ex: qualificacao-capilar (apenas letras minúsculas, números e hífens)"
                required
              />
               <p className="text-xs text-muted-foreground">
                Será acessível em: {APP_BASE_URL}/{slug || "seu-slug"}
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
                <AlertTitle>Exemplo de Estrutura JSON para Perguntas</AlertTitle>
                <AlertDescription>
                  <p className="mb-2">Cada pergunta deve ser um objeto com `id`, `name`, `text`, `type`, e `options` (para radio/checkbox) ou `fields` (para textFields). Nomes de ícones devem ser de `lucide-react` (ex: "User", "Smile"). A etapa de contato é adicionada automaticamente no final.</p>
                  <details>
                    <summary className="cursor-pointer text-primary hover:underline">Ver exemplo JSON</summary>
                    <pre className="mt-2 p-2 bg-muted rounded-md text-xs overflow-x-auto">
                      {exampleQuizJson}
                    </pre>
                  </details>
                </AlertDescription>
              </Alert>
            </div>
             {error && (
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
        </form>
      </Card>
    </div>
  );
}

