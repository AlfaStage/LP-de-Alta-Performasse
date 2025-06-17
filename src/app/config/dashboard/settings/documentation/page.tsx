
"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Code, Terminal, Key, Info, Database, ListChecks, BookText, RefreshCw, Loader2, ShieldAlert } from "lucide-react";
import { fetchWhitelabelSettings, generateApiStatsTokenAction } from '../actions'; 
import type { WhitelabelConfig } from '@/types/quiz';
import { useToast } from '@/hooks/use-toast';

const codeBlockClass = "block whitespace-pre-wrap bg-muted/50 p-4 rounded-md text-sm font-mono overflow-x-auto";

export default function DocumentationPage() {
  const [apiToken, setApiToken] = useState<string | null | undefined>(undefined); 
  const [isLoadingToken, setIsLoadingToken] = useState(false);
  const [isGeneratingToken, setIsGeneratingToken] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    async function loadToken() {
      setIsLoadingToken(true);
      try {
        const settings = await fetchWhitelabelSettings();
        setApiToken(settings.apiStatsAccessToken || null); 
      } catch (error) {
        console.error("Failed to fetch API token:", error);
        toast({
          title: "Erro ao Carregar Token",
          description: "Não foi possível buscar o token da API.",
          variant: "destructive",
        });
        setApiToken(null);
      } finally {
        setIsLoadingToken(false);
      }
    }
    loadToken();
  }, [toast]);

  const handleGenerateToken = async () => {
    setIsGeneratingToken(true);
    try {
      const result = await generateApiStatsTokenAction();
      if (result.success && result.newToken) {
        setApiToken(result.newToken);
        toast({
          title: "Token Gerado!",
          description: result.message || "Novo token de API gerado com sucesso.",
          variant: "default",
        });
      } else {
        toast({
          title: "Erro ao Gerar Token",
          description: result.message || "Não foi possível gerar um novo token.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro Inesperado",
        description: "Ocorreu um erro ao tentar gerar o token.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingToken(false);
    }
  };

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'SUA_APP_BASE_URL';
  const exampleCurlCall = apiToken 
    ? `
curl -X GET \\
  '${baseUrl}/api/quiz-stats' \\
  -H 'Authorization: Bearer ${apiToken}'
  `
    : `
curl -X GET \\
  '${baseUrl}/api/quiz-stats' \\
  -H 'Authorization: Bearer SEU_TOKEN_DE_ACESSO_AQUI'
  `;

  const exampleJsonResponse = `
{
  "overallStats": {
    "totalStarted": 150,
    "totalCompleted": 75,
    "mostEngagingQuiz": {
      "title": "Quiz de Engajamento Top",
      "slug": "top-quiz",
      // ... outros campos do quiz
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
        // ... campos do QuizAnalyticsData
        "startedCount": 100,
        "completedCount": 55
        // ...
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
        // ... outras perguntas
        "final_contact_step": {
            "id": "final_contact_step",
            "type": "textFields",
            "totalAnswers": 55,
            "fieldsHandled": true
        }
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
              <li>Configurações Whitelabel para personalização (logo, cores, webhooks, IDs de rastreamento, token de API).</li>
              <li>Acompanhamento de estatísticas de quizzes iniciados, finalizados e por pergunta.</li>
              <li>Integração com Facebook Pixel e Google Analytics.</li>
              <li>API para acesso programático às estatísticas dos quizzes.</li>
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
                <h3 className="font-medium text-lg flex items-center gap-2"><Key className="h-4 w-4 text-muted-foreground"/>Autenticação e Token de Acesso:</h3>
                <p className="text-muted-foreground">
                  A API requer um token de acesso Bearer no cabeçalho de autorização.
                  Você pode gerar ou visualizar seu token abaixo.
                </p>
                
                {isLoadingToken && (
                  <div className="flex items-center gap-2 text-muted-foreground mt-2">
                    <Loader2 className="h-5 w-5 animate-spin" /> Carregando token...
                  </div>
                )}

                {!isLoadingToken && apiToken && (
                  <Alert variant="default" className="mt-2 bg-primary/10 border-primary/30">
                      <Key className="h-5 w-5 text-primary"/>
                      <AlertTitle className="text-primary">Seu Token de Acesso Atual (API Stats)</AlertTitle>
                      <AlertDescription className="font-mono text-primary/80 break-all text-sm">
                          {apiToken}
                      </AlertDescription>
                  </Alert>
                )}
                 {!isLoadingToken && !apiToken && (
                  <Alert variant="destructive" className="mt-2">
                      <ShieldAlert className="h-5 w-5"/>
                      <AlertTitle>Nenhum Token de API Configurado</AlertTitle>
                      <AlertDescription>
                          Nenhum token de acesso à API de estatísticas foi gerado ainda. Clique no botão abaixo para gerar um.
                      </AlertDescription>
                  </Alert>
                )}

                <Button 
                  onClick={handleGenerateToken} 
                  disabled={isGeneratingToken || isLoadingToken}
                  variant="outline"
                  className="mt-3"
                >
                  {isGeneratingToken ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                  {isGeneratingToken ? "Gerando..." : (apiToken ? "Gerar Novo Token" : "Gerar Token de API")}
                </Button>
              </div>

              <div>
                <h3 className="font-medium text-lg flex items-center gap-2"><Terminal className="h-5 w-5 text-muted-foreground"/>Exemplo de Chamada (cURL):</h3>
                <pre className={codeBlockClass}>
                  <code>{exampleCurlCall.trim()}</code>
                </pre>
                <p className="text-xs text-muted-foreground mt-1">
                  Substitua <code className="text-xs bg-muted px-1 py-0.5 rounded-sm">SUA_APP_BASE_URL</code> pela URL base da sua aplicação se estiver testando de fora do navegador ou se o token ainda não foi carregado.
                </p>
              </div>

              <div>
                <h3 className="font-medium text-lg flex items-center gap-2"><ListChecks className="h-5 w-5 text-muted-foreground"/>Exemplo de Resposta JSON:</h3>
                <pre className={codeBlockClass}>
                  <code>{exampleJsonResponse.trim()}</code>
                </pre>
              </div>
            </div>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
