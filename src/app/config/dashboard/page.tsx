
"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, ListPlus, PlusCircle, Edit, Trash2, Loader2, ShieldAlert } from 'lucide-react';
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';

interface QuizListItem extends Omit<QuizConfig, 'questions'> {
  // No additional fields needed for now
}

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
  }, []);

  const handleDeleteQuiz = async () => {
    if (!quizToDelete) return;
    setIsDeleting(true);
    try {
      const result = await deleteQuizAction(quizToDelete.slug);
      if (result.success) {
        toast({
          title: "Quiz Apagado!",
          description: `O quiz "${quizToDelete.title}" foi apagado com sucesso.`,
          variant: "default",
        });
        fetchQuizzes(); // Re-fetch the list
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
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold md:text-3xl">Visão Geral do Dashboard</h1>
        <Link href="/config/dashboard/quiz/create">
          <Button className="flex items-center gap-2">
            <ListPlus className="h-5 w-5" />
            Criar Novo Quiz
          </Button>
        </Link>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Quizzes Existentes</CardTitle>
          <CardDescription>
            Lista de todos os quizzes configurados no sistema.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingList ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="ml-2">Carregando quizzes...</p>
            </div>
          ) : quizzes.length > 0 ? (
            <ul className="space-y-3">
              {quizzes.map((quiz) => (
                <li key={quiz.slug} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 border rounded-md hover:bg-muted/50 transition-colors gap-2 sm:gap-0">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-primary flex-shrink-0" />
                    <div className="flex-grow">
                      <span className="font-medium">{quiz.title}</span>
                      <p className="text-xs text-muted-foreground">/{quiz.slug}</p>
                    </div>
                  </div>
                  <div className="space-x-2 flex-shrink-0 self-end sm:self-center">
                    <Link href={`/${quiz.slug}`} target="_blank" rel="noopener noreferrer">
                       <Button variant="outline" size="sm">Visualizar</Button>
                    </Link>
                    <Link href={`/config/dashboard/quiz/edit/${quiz.slug}`}>
                       <Button variant="outline" size="sm" className="flex items-center gap-1">
                         <Edit className="h-3 w-3" /> Editar
                       </Button>
                    </Link>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        className="flex items-center gap-1"
                        onClick={() => setQuizToDelete(quiz)}
                      >
                        <Trash2 className="h-3 w-3" /> Apagar
                      </Button>
                    </AlertDialogTrigger>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p className="mb-2">Nenhum quiz encontrado.</p>
              <Link href="/config/dashboard/quiz/create">
                <Button variant="secondary">
                  <PlusCircle className="mr-2 h-4 w-4" /> Criar seu primeiro quiz
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!quizToDelete} onOpenChange={(open) => !open && setQuizToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <ShieldAlert className="h-6 w-6 text-destructive" />
              Confirmar Exclusão
            </AlertDialogTitle>
            <AlertDialogDescription>
              Você tem certeza que deseja apagar o quiz "<strong>{quizToDelete?.title}</strong>"? Esta ação não pode ser desfeita e o arquivo do quiz será removido permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setQuizToDelete(null)} disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteQuiz} 
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Apagando...
                </>
              ) : "Apagar Quiz"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
