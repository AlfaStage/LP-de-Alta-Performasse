
"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, ListPlus, PlusCircle, Edit, Trash2, Loader2, ShieldAlert, Eye, Lock } from 'lucide-react';
import { getQuizzesList, deleteQuizAction } from './quiz/actions';
import type { QuizConfig } from '@/types/quiz';
import { useEffect, useState } from 'react';
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
import { useToast } from '@/hooks/use-toast';

interface QuizListItem extends Omit<QuizConfig, 'questions'> {
  // No additional fields needed for now
}

const DEFAULT_QUIZ_SLUG = "default";

export default function DashboardPage() {
  const [quizzes, setQuizzes] = useState<QuizListItem[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [quizToDelete, setQuizToDelete] = useState<QuizListItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  async function fetchQuizzes() {
    setIsLoadingList(true);
    try {
      const quizList = await getQuizzesList();
      setQuizzes(quizList);
    } catch (error) {
      console.error("Failed to fetch quizzes:", error);
      toast({
        title: "Erro ao carregar quizzes",
        description: "Não foi possível buscar a lista de quizzes.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingList(false);
    }
  }

  useEffect(() => {
    fetchQuizzes();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
          description: `O quiz "${quizToDelete.title}" foi apagado com sucesso.`,
          variant: "default",
        });
        fetchQuizzes(); 
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

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
            <h1 className="text-3xl font-bold text-foreground tracking-tight">Visão Geral dos Quizzes</h1>
            <p className="text-muted-foreground">Gerencie seus quizzes interativos existentes ou crie novos.</p>
        </div>
        <Link href="/config/dashboard/quiz/create">
          <Button size="lg" className="flex items-center gap-2 shadow-sm">
            <PlusCircle className="h-5 w-5" />
            Criar Novo Quiz
          </Button>
        </Link>
      </div>

      {isLoadingList ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-lg">Carregando seus quizzes...</p>
        </div>
      ) : quizzes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quizzes.map((quiz) => (
            <Card key={quiz.slug} className="shadow-lg hover:shadow-xl transition-shadow bg-card">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                    <FileText className="h-8 w-8 text-primary mt-1" />
                    {quiz.slug === DEFAULT_QUIZ_SLUG && (
                        <Badge variant="secondary" className="flex items-center gap-1">
                            <Lock className="h-3 w-3" /> Padrão
                        </Badge>
                    )}
                </div>
                <CardTitle className="text-xl font-semibold pt-2 text-card-foreground">{quiz.title}</CardTitle>
                <CardDescription>
                    <Badge variant="outline">/{quiz.slug}</Badge>
                </CardDescription>
              </CardHeader>
              <CardFooter className="flex flex-col sm:flex-row gap-2 pt-4 border-t">
                <Link href={`/${quiz.slug}`} target="_blank" rel="noopener noreferrer" className="w-full">
                   <Button variant="outline" size="sm" className="w-full flex items-center gap-1">
                     <Eye className="h-4 w-4" /> Visualizar
                   </Button>
                </Link>
                <Link href={`/config/dashboard/quiz/edit/${quiz.slug}`} className="w-full">
                   <Button variant="outline" size="sm" className="w-full flex items-center gap-1">
                     <Edit className="h-4 w-4" /> Editar
                   </Button>
                </Link>
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
          ))}
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
            <AlertDialogTitle className="flex items-center gap-2 text-xl">
              <ShieldAlert className="h-7 w-7 text-destructive" />
              Confirmar Exclusão
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              Você tem certeza que deseja apagar o quiz "<strong>{quizToDelete?.title}</strong>"? Esta ação não pode ser desfeita e o arquivo do quiz será removido permanentemente.
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
    </div>
  );
}
