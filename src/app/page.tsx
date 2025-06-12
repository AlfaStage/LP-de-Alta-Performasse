
import Link from 'next/link';
import { promises as fs } from 'fs';
import path from 'path';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { List } from 'lucide-react';
import type { QuizConfig } from '@/types/quiz';
import { getWhitelabelConfig } from '@/lib/whitelabel';

async function getAvailableQuizzes(): Promise<QuizConfig[]> {
  const quizzesDirectory = path.join(process.cwd(), 'src', 'data', 'quizzes');
  try {
    const filenames = await fs.readdir(quizzesDirectory);
    const quizFiles = filenames.filter(filename => filename.endsWith('.json'));
    
    const quizzes = await Promise.all(quizFiles.map(async (filename) => {
      const filePath = path.join(quizzesDirectory, filename);
      const fileContents = await fs.readFile(filePath, 'utf8');
      const quizData = JSON.parse(fileContents) as QuizConfig;
      return {
        title: quizData.title || "Quiz sem título",
        slug: quizData.slug || filename.replace('.json', ''),
        questions: quizData.questions || [], 
      };
    }));
    return quizzes;
  } catch (error) {
    console.error("Failed to read quizzes directory:", error);
    return []; 
  }
}

export default async function HomePage() {
  const quizzes = await getAvailableQuizzes();
  const whitelabelConfig = await getWhitelabelConfig();

  return (
    <main className="container mx-auto p-4 min-h-screen flex flex-col items-center justify-center bg-background text-foreground">
      <Card className="w-full max-w-2xl shadow-xl bg-card text-card-foreground">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-primary">{whitelabelConfig.projectName || 'Bem-vindo ao Sistema de Quizzes'}</CardTitle>
          <CardDescription className="text-lg text-muted-foreground">
            Selecione um quiz abaixo para começar ou crie um novo no nosso painel de configuração.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {quizzes.length > 0 ? (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-center mb-3 text-card-foreground">Quizzes Disponíveis:</h2>
              <ul className="space-y-3">
                {quizzes.map((quiz) => (
                  <li key={quiz.slug}>
                    <Link href={`/${quiz.slug}`} className="block">
                      <Button variant="outline" className="w-full justify-start text-lg py-6 hover:bg-accent/80 hover:text-accent-foreground">
                        <List className="mr-3 h-5 w-5 text-primary" />
                        {quiz.title}
                      </Button>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-lg text-muted-foreground mb-4">Nenhum quiz disponível no momento.</p>
              <p className="text-sm text-card-foreground">
                Administradores podem criar novos quizzes no{" "}
                <Link href="/config/dashboard" className="text-primary hover:underline font-semibold">
                  Painel de Configuração
                </Link>.
              </p>
            </div>
          )}
          <div className="mt-8 text-center">
             <Link href="/config/login" className="text-sm text-primary hover:underline">
                Acessar Painel de Configuração
              </Link>
          </div>
        </CardContent>
      </Card>
       <p className="text-xs text-center mt-8 text-foreground/60">
            {whitelabelConfig.footerCopyrightText || `${whitelabelConfig.projectName || 'Ice Lazer'} © ${new Date().getFullYear()}. Todos os direitos reservados.`}
        </p>
    </main>
  );
}
