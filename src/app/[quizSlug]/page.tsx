
import { promises as fs } from 'fs';
import path from 'path';
import QuizForm from '@/components/quiz/QuizForm';
import type { QuizConfig } from '@/types/quiz';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { defaultContactStep } from '@/config/quizConfig';
import { getWhitelabelConfig } from '@/lib/whitelabel';
import { CLIENT_SIDE_ABANDONMENT_WEBHOOK_URL as ENV_CLIENT_SIDE_ABANDONMENT_WEBHOOK_URL } from '@/config/appConfig'; // Fallback

interface QuizPageProps {
  params: {
    quizSlug: string;
  };
}

async function getQuizConfigFromFile(slug: string): Promise<QuizConfig | null> {
  const quizzesDirectory = path.join(process.cwd(), 'src', 'data', 'quizzes');
  const filePath = path.join(quizzesDirectory, `${slug}.json`);
  try {
    const fileContents = await fs.readFile(filePath, 'utf8');
    const quizData = JSON.parse(fileContents) as QuizConfig;
    
    quizData.title = quizData.title || "Quiz Interativo";
    quizData.slug = quizData.slug || slug;

    if (quizData.questions && Array.isArray(quizData.questions)) {
      quizData.questions = quizData.questions.filter(q => q.id !== defaultContactStep.id);
      quizData.questions.push(defaultContactStep);
    } else {
      quizData.questions = [defaultContactStep];
    }
    
    return quizData;
  } catch (error) {
    console.error(`Failed to read quiz config for slug ${slug}:`, error);
    return null;
  }
}

export async function generateStaticParams() {
  const quizzesDirectory = path.join(process.cwd(), 'src', 'data', 'quizzes');
  try {
    const filenames = await fs.readdir(quizzesDirectory);
    return filenames
      .filter(filename => filename.endsWith('.json'))
      .map(filename => ({
        quizSlug: filename.replace('.json', ''),
      }));
  } catch (error) {
    console.warn("Could not read quizzes directory for generateStaticParams. No quizzes will be pre-rendered.", error);
    return [];
  }
}


export default async function QuizPage({ params }: QuizPageProps) {
  const { quizSlug } = params;
  const quizConfigFromFile = await getQuizConfigFromFile(quizSlug);
  const whitelabelConfig = await getWhitelabelConfig();

  if (!quizConfigFromFile || !quizConfigFromFile.questions || quizConfigFromFile.questions.length === 0 ) {
    return (
      <main className="container mx-auto p-4 min-h-screen flex flex-col items-center justify-center">
        <Alert variant="destructive" className="w-full max-w-lg">
          <AlertTriangle className="h-5 w-5" />
          <AlertTitle>Quiz não encontrado ou mal configurado</AlertTitle>
          <AlertDescription>
            O quiz com o identificador "{quizSlug}" não pôde ser carregado ou está vazio.
            Por favor, verifique o URL ou <Link href="/" className="underline hover:text-primary">volte para a página inicial</Link>.
          </AlertDescription>
        </Alert>
      </main>
    );
  }
  
   if (quizConfigFromFile.questions.length === 1 && quizConfigFromFile.questions[0].id === defaultContactStep.id) {
     // Allows quiz with only contact step.
   }

  // Use whitelabel logoUrl, fallback to a default if not set
  const logoUrlToUse = whitelabelConfig.logoUrl || "https://placehold.co/150x50.png?text=Logo+Empresa";
  // Use client abandonment webhook from env as fallback, whitelabel not implemented for this yet
  const clientAbandonmentWebhook = ENV_CLIENT_SIDE_ABANDONMENT_WEBHOOK_URL;


  return (
    <main>
      <QuizForm 
        quizQuestions={quizConfigFromFile.questions} 
        quizSlug={quizConfigFromFile.slug} 
        quizTitle={quizConfigFromFile.title} 
        logoUrl={logoUrlToUse}
        facebookPixelId={whitelabelConfig.facebookPixelId}
        googleAnalyticsId={whitelabelConfig.googleAnalyticsId}
        clientAbandonmentWebhookUrl={clientAbandonmentWebhook}
      />
    </main>
  );
}
