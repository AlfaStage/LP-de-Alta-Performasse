
import Link from 'next/link';
import { promises as fs } from 'fs';
import path from 'path';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, ArrowRight, ShieldCheck } from 'lucide-react';
import type { QuizConfig } from '@/types/quiz';
import { getWhitelabelConfig } from '@/lib/whitelabel.server';
import { CLIENT_SIDE_ABANDONMENT_WEBHOOK_URL as ENV_CLIENT_SIDE_ABANDONMENT_WEBHOOK_URL } from '@/config/appConfig'; 
import TrackingScriptsWrapper from '@/components/TrackingScriptsWrapper';
import QuizClientWrapper from '@/components/quiz/QuizClientWrapper';

const DEFAULT_QUIZ_SLUG = "default";
const DEFAULT_QUIZ_DESCRIPTION = "Responda algumas perguntas para nos ajudar a entender suas preferências.";


async function getDefaultQuizConfig(): Promise<QuizConfig | null> {
  const quizzesDirectory = path.join(process.cwd(), 'src', 'data', 'quizzes');
  const filePath = path.join(quizzesDirectory, `${DEFAULT_QUIZ_SLUG}.json`);
  try {
    const fileContents = await fs.readFile(filePath, 'utf8');
    if (!fileContents.trim()) {
        console.warn(`Default quiz config file (${DEFAULT_QUIZ_SLUG}.json) is empty. A quiz might not render.`);
        return null;
    }
    const quizData = JSON.parse(fileContents) as QuizConfig;
    
    quizData.title = quizData.title || "Quiz Interativo";
    quizData.slug = quizData.slug || DEFAULT_QUIZ_SLUG;
    quizData.description = quizData.description || DEFAULT_QUIZ_DESCRIPTION;
    quizData.dashboardName = quizData.dashboardName || quizData.title;

    return quizData;
  } catch (error: any) {
    if (error.code === 'ENOENT') {
        console.warn(`Default quiz config file (${DEFAULT_QUIZ_SLUG}.json) not found. Quiz will not render.`);
    } else {
        console.error(`Failed to read or parse default quiz config (slug: ${DEFAULT_QUIZ_SLUG}):`, error);
    }
    return null;
  }
}

export default async function HomePage() {
  const defaultQuizConfig = await getDefaultQuizConfig();
  const whitelabelConfig = await getWhitelabelConfig();

  // --- Pixel Logic ---
  const finalPixelIds: string[] = [];
  if (defaultQuizConfig?.pixelSettings) {
    const { ignoreGlobalPrimaryPixel, ignoreGlobalSecondaryPixel, quizSpecificPixelId } = defaultQuizConfig.pixelSettings;
    
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

  if (!defaultQuizConfig || !defaultQuizConfig.questions || defaultQuizConfig.questions.length === 0 ) {
    return (
      <main className="container mx-auto p-4 min-h-screen flex flex-col items-center justify-center bg-background text-foreground">
        <Card className="w-full max-w-lg shadow-xl bg-card text-card-foreground">
          <CardHeader className="text-center">
            <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
            <CardTitle className="text-2xl font-bold text-destructive">Erro ao Carregar Quiz Padrão</CardTitle>
            <CardDescription className="text-muted-foreground">
              O arquivo do quiz padrão (<code className="bg-muted px-1 py-0.5 rounded-sm text-xs">default.json</code>) não foi encontrado, está vazio ou mal configurado.
              Por favor, crie ou verifique o arquivo <code className="bg-muted px-1 py-0.5 rounded-sm text-xs">src/data/quizzes/default.json</code>.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
             <Link href="/config/login">
                <Button variant="outline">
                    <ShieldCheck className="mr-2 h-4 w-4" />
                    Acessar Painel de Configuração
                </Button>
            </Link>
          </CardContent>
          <CardFooter className="p-6 bg-muted/30 flex justify-center">
             <p className="text-xs text-muted-foreground text-center w-full">
                {footerText}
            </p>
          </CardFooter>
        </Card>
      </main>
    );
  }

  return (
    <>
      <main className="bg-background text-foreground">
        <QuizClientWrapper 
          quizQuestions={defaultQuizConfig.questions} 
          quizSlug={defaultQuizConfig.slug} 
          quizTitle={defaultQuizConfig.title || whitelabelConfig.projectName || "Quiz Interativo"} 
          quizDescription={defaultQuizConfig.description}
          logoUrl={logoUrlToUse}
          finalFacebookPixelIds={uniquePixelIds}
          googleAnalyticsId={whitelabelConfig.googleAnalyticsId}
          clientAbandonmentWebhookUrl={clientAbandonmentWebhook}
          footerCopyrightText={footerText}
          websiteUrl={whitelabelConfig.websiteUrl}
          instagramUrl={whitelabelConfig.instagramUrl}
          useCustomTheme={defaultQuizConfig.useCustomTheme}
          customTheme={defaultQuizConfig.customTheme}
          displayMode={defaultQuizConfig.displayMode}
        />
        <div className="py-8 text-center bg-background">
          <Link href="/config/login">
            <Button variant="ghost" className="text-primary hover:text-primary/80 text-sm group">
              Acessar Painel de Configuração
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </div>
      </main>
      <TrackingScriptsWrapper
        finalFacebookPixelIds={uniquePixelIds}
        googleAnalyticsId={whitelabelConfig.googleAnalyticsId}
      />
    </>
  );
}
