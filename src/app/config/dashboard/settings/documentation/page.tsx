
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { API_STATS_ACCESS_TOKEN } from "@/config/appConfig";
import { Code, Terminal, Key, Info, Database, ListChecks } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const codeBlockClass = "block whitespace-pre-wrap bg-muted/50 p-4 rounded-md text-sm font-mono overflow-x-auto";

export default function DocumentationPage() {

  const exampleCurlCall = `
curl -X GET \\
  '${typeof window !== 'undefined' ? window.location.origin : 'YOUR_APP_BASE_URL'}/api/quiz-stats' \\
  -H 'Authorization: Bearer ${API_STATS_ACCESS_TOKEN}'
  `;

  const exampleJsonResponse = `
{
  "overallStats": {
    "totalStarted": 150,
    "totalCompleted": 75,
    "mostEngagingQuiz": {
      "title": "Quiz de Engajamento Top",
      "slug": "top-quiz",
      "startedCount": 50,
      "completedCount": 40,
      "conversionRate": 80
    }
  },
  "quizzes": [
    {
      "slug": "default",
      "title": "Quiz Padrão Ice Lazer",
      "dashboardName": "Quiz Padrão (Homepage)",
      "aggregateStats": {
        "startedCount": 100,
        "completedCount": 55
      },
      "questionLevelStats": {
        "q1_default": {
          "id": "q1_default",
          "type": "radio",
          "totalAnswers": 90,
          "options": {
            "sim": 60,
            "nao": 30
          }
        },
        "final_contact_step": {
          "id": "final_contact_step",
          "type": "textFields",
          "totalAnswers": 55,
          "fieldsHandled": true
        }
        // ... outras perguntas
      }
    },
    {
      "slug": "quiz-bahia",
      "title": "SmartCheck Bahia",
      "dashboardName": "Quiz Bahia",
      "aggregateStats": {
        "startedCount": 50,
        "completedCount": 20
      },
      "questionLevelStats": {
        // ... estatísticas das perguntas do quiz-bahia
      }
    }
    // ... outros quizzes
  ]
}
  `;


  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <BookText className="h-6 w-6 text-primary" />
            Documentação do Sistema e API
          </CardTitle>
          <CardDescription>
            Visão geral do sistema de quiz interativo e como acessar dados via API.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <section>
            <h2 className="text-xl font-semibold mb-2 flex items-center gap-2"><Info className="h-5 w-5 text-muted-foreground"/>Visão Geral do Sistema</h2>
            <p className="text-muted-foreground">
              Este sistema ("LP de Alta Performasse") permite a criação e gerenciamento de quizzes interativos para qualificação de leads.
              As principais funcionalidades incluem:
            </p>
            <ul className="list-disc list-inside space-y-1 mt-2 text-muted-foreground pl-4">
              <li>Criação e edição de múltiplos quizzes com diferentes tipos de perguntas.</li>
              <li>Coleta de informações de contato (nome, WhatsApp).</li>
              <li>Configurações Whitelabel para personalização (logo, cores, webhooks, IDs de rastreamento).</li>
              <li>Acompanhamento de estatísticas de quizzes iniciados, finalizados e por pergunta.</li>
              <li>Integração com Facebook Pixel e Google Analytics.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2 flex items-center gap-2"><Database className="h-5 w-5 text-muted-foreground"/>API de Estatísticas dos Quizzes</h2>
            <p className="text-muted-foreground">
              Uma API está disponível para buscar todas as estatísticas dos quizzes de forma programática.
            </p>

            <div className="mt-4 space-y-3">
              <div>
                <h3 className="font-medium text-lg">Endpoint:</h3>
                <code className={codeBlockClass}>GET /api/quiz-stats</code>
              </div>

              <div>
                <h3 className="font-medium text-lg flex items-center gap-2"><Key className="h-4 w-4 text-muted-foreground"/>Autenticação:</h3>
                <p className="text-muted-foreground">A API requer um token de acesso Bearer no cabeçalho de autorização.</p>
                <p className="text-muted-foreground mt-1">Seu Token de Acesso:</p>
                <Alert variant="default" className="bg-primary/10 border-primary/30">
                    <Key className="h-5 w-5 text-primary"/>
                    <AlertTitle className="text-primary">Token de Acesso (API Stats)</AlertTitle>
                    <AlertDescription className="font-mono text-primary/80 break-all">
                        {API_STATS_ACCESS_TOKEN}
                    </AlertDescription>
                </Alert>
                <p className="text-xs text-destructive mt-1">
                  <strong>Atenção:</strong> Este token é apenas para fins de demonstração neste protótipo. Em um ambiente de produção, ele deve ser gerenciado de forma segura e não exposto publicamente.
                </p>
              </div>

              <div>
                <h3 className="font-medium text-lg flex items-center gap-2"><Terminal className="h-5 w-5 text-muted-foreground"/>Exemplo de Chamada (cURL):</h3>
                <pre className={codeBlockClass}>
                  <code>{exampleCurlCall.trim()}</code>
                </pre>
                <p className="text-xs text-muted-foreground mt-1">
                  Substitua <code className="text-xs bg-muted px-1 py-0.5 rounded-sm">YOUR_APP_BASE_URL</code> pela URL base da sua aplicação se estiver testando de fora do navegador.
                </p>
              </div>

              <div>
                <h3 className="font-medium text-lg flex items-center gap-2"><ListChecks className="h-5 w-5 text-muted-foreground"/>Exemplo de Resposta JSON:</h3>
                <pre className={codeBlockClass}>
                  <code>{exampleJsonResponse.trim()}</code>
                </pre>
              </div>
               <Alert variant="default">
                <Info className="h-4 w-4"/>
                <AlertTitle>Nota sobre Persistência de Dados</AlertTitle>
                <AlertDescription>
                  Os dados de quizzes, configurações whitelabel e estatísticas são atualmente armazenados em arquivos JSON no servidor. Em ambientes de produção (especialmente PaaS/Serverless como Firebase App Hosting), esta abordagem pode não ser persistente. Para produção, é <strong>altamente recomendado</strong> migrar o armazenamento para um banco de dados (ex: Firestore, PostgreSQL).
                </AlertDescription>
              </Alert>
            </div>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
