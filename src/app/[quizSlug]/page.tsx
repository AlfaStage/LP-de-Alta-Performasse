
import { promises as fs } from 'fs';
import path from 'path';
import type { QuizConfig } from '@/types/quiz';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { getWhitelabelConfig } from '@/lib/whitelabel.server';
import { CLIENT_SIDE_ABANDONMENT_WEBHOOK_URL as ENV_CLIENT_SIDE_ABANDONMENT_WEBHOOK_URL } from '@/config/appConfig'; 
import TrackingScriptsWrapper from '@/components/TrackingScriptsWrapper';
import QuizClientWrapper from '@/components/quiz/QuizClientWrapper';

const DEFAULT_QUIZ_DESCRIPTION = "Responda algumas perguntas para nos ajudar a entender suas preferências.";

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
    if (!fileContents.trim()) {
        console.warn(`Quiz config file for slug ${slug} is empty.`);
        return null;
    }
    const quizData = JSON.parse(fileContents) as QuizConfig;
    
    quizData.title = quizData.title || "Quiz Interativo";
    quizData.slug = quizData.slug || slug;
    quizData.description = quizData.description || DEFAULT_QUIZ_DESCRIPTION;
    quizData.dashboardName = quizData.dashboardName || quizData.title;
    quizData.isActive = quizData.isActive ?? true;
    quizData.useCustomTheme = quizData.useCustomTheme ?? false;
    quizData.customTheme = quizData.customTheme || {};
    quizData.displayMode = quizData.displayMode || 'step-by-step';
    quizData.pixelSettings = quizData.pixelSettings || {};
    
    return quizData;
  } catch (error: any) {
    if (error.code === 'ENOENT') {
    } else {
        console.error(`Failed to read quiz config for slug ${slug}:`, error);
    }
    return null;
  }
}

export async function generateStaticParams() {
  const quizzesDirectory = path.join(process.cwd(), 'src', 'data', 'quizzes');
  try {
    const filenames = await fs.readdir(quizzesDirectory);
    return filenames
      .filter(filename => filename.endsWith('.json') && filename.trim() !== '.json') 
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
  
  const renderQuizUnavailable = (message: string) => (
      <main className="container mx-auto p-4 min-h-screen flex flex-col items-center justify-center bg-background text-foreground">
        <Alert variant="destructive" className="w-full max-w-lg bg-card text-card-foreground shadow-lg">
          <AlertTriangle className="h-8 w-8" />
          <AlertTitle className="text-xl">Quiz Indisponível</AlertTitle>
          <AlertDescription>
            {message}
            Por favor, verifique o URL ou <Link href="/" className="underline hover:text-primary font-semibold">volte para a página inicial</Link>.
          </AlertDescription>
        </Alert>
      </main>
  );

  if (!quizConfigFromFile || !quizConfigFromFile.questions || quizConfigFromFile.questions.length === 0 ) {
    return renderQuizUnavailable(`O quiz com o identificador "${quizSlug}" não pôde ser carregado, está vazio ou não existe.`);
  }

  if (!(quizConfigFromFile.isActive ?? true)) {
    return renderQuizUnavailable(`Este quiz está temporariamente indisponível.`);
  }

  // --- Pixel Logic ---
  const finalPixelIds: string[] = [];
  if (quizConfigFromFile.pixelSettings) {
    const { ignoreGlobalPrimaryPixel, ignoreGlobalSecondaryPixel, quizSpecificPixelId } = quizConfigFromFile.pixelSettings;
    
    if (!ignoreGlobalPrimaryPixel && whitelabelConfig.facebookPixelId) {
      finalPixelIds.push(whitelabelConfig.facebookPixelId);
    }
    if (!ignoreGlobalSecondaryPixel && whitelabelConfig.facebookPixelIdSecondary) {
      finalPixelIds.push(whitelabelConfig.facebookPixelIdSecondary);
    }
    if (quizSpecificPixelId) {
      finalPixelIds.push(quizSpecificPixelId);
    }
  } else { // Fallback for quizzes created before this feature
    if (whitelabelConfig.facebookPixelId) finalPixelIds.push(whitelabelConfig.facebookPixelId);
    if (whitelabelConfig.facebookPixelIdSecondary) finalPixelIds.push(whitelabelConfig.facebookPixelIdSecondary);
  }
  const uniquePixelIds = [...new Set(finalPixelIds.filter(id => id && id.trim() !== ''))];
  // --- End Pixel Logic ---

  const logoUrlToUse = whitelabelConfig.logoUrl || "https://placehold.co/150x50.png?text=Sua+Logo";
  const clientAbandonmentWebhook = ENV_CLIENT_SIDE_ABANDONMENT_WEBHOOK_URL;
  const footerText = whitelabelConfig.footerCopyrightText || `© ${new Date().getFullYear()} ${whitelabelConfig.projectName || 'Seu Projeto'}. Todos os direitos reservados.`;


  return (
    <>
      <main className="bg-background text-foreground">
        <QuizClientWrapper 
          quizQuestions={quizConfigFromFile.questions} 
          quizSlug={quizConfigFromFile.slug} 
          quizTitle={quizConfigFromFile.title || whitelabelConfig.projectName || "Quiz Interativo"} 
          quizDescription={quizConfigFromFile.description}
          logoUrl={logoUrlToUse}
          finalFacebookPixelIds={uniquePixelIds}
          googleAnalyticsId={whitelabelConfig.googleAnalyticsId}
          clientAbandonmentWebhookUrl={clientAbandonmentWebhook}
          footerCopyrightText={footerText}
          websiteUrl={whitelabelConfig.websiteUrl}
          instagramUrl={whitelabelConfig.instagramUrl}
          useCustomTheme={quizConfigFromFile.useCustomTheme}
          customTheme={quizConfigFromFile.customTheme}
          displayMode={quizConfigFromFile.displayMode}
        />
      </main>
      <TrackingScriptsWrapper
        finalFacebookPixelIds={uniquePixelIds}
        googleAnalyticsId={whitelabelConfig.googleAnalyticsId}
      />
    </>
  );
}
