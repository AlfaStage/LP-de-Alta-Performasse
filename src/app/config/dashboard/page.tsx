
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, ListPlus, PlusCircle } from 'lucide-react';
import { getQuizzesList } from './quiz/actions';
// Removido APP_BASE_URL pois os links serão relativos ou à raiz

export default async function DashboardPage() {
  const quizzes = await getQuizzesList();

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
            Lista de todos os quizzes configurados no sistema. Clique em um quiz para visualizá-lo ou edite suas configurações.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {quizzes.length > 0 ? (
            <ul className="space-y-3">
              {quizzes.map((quiz) => (
                <li key={quiz.slug} className="flex items-center justify-between p-3 border rounded-md hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-primary" />
                    <span className="font-medium">{quiz.title} (/{quiz.slug})</span>
                  </div>
                  <div className="space-x-2">
                    <Link href={`/${quiz.slug}`} target="_blank">
                       <Button variant="outline" size="sm">Visualizar</Button>
                    </Link>
                    {/* <Link href={`/config/dashboard/quiz/edit/${quiz.slug}`}>
                       <Button variant="outline" size="sm" disabled>Editar (Em breve)</Button>
                    </Link> */}
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
      
      {/* Placeholder for future stats or settings
      <Card>
        <CardHeader>
          <CardTitle>Estatísticas Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Em breve: Visualizações, conclusões, etc.</p>
        </CardContent>
      </Card>
      */}
    </div>
  );
}
