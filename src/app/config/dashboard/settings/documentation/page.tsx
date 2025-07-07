
"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Code, Terminal, Key, Database, ListChecks, RefreshCw, Loader2, ShieldAlert, Trash2 } from "lucide-react";
import { fetchWhitelabelSettings, generateApiStatsTokenAction, deleteApiStatsTokenAction } from '../actions'; 
import type { WhitelabelConfig } from '@/types/quiz';
import { useToast } from '@/hooks/use-toast';

const codeBlockClass = "block whitespace-pre-wrap bg-muted/50 p-4 rounded-md text-sm font-mono overflow-x-auto";

export default function DocumentationApiPage() {
  const [apiToken, setApiToken] = useState<string | null | undefined>(undefined); 
  const [isLoadingToken, setIsLoadingToken] = useState(false);
  const [isGeneratingToken, setIsGeneratingToken] = useState(false);
  const [isDeletingToken, setIsDeletingToken] = useState(false);
  const [showDeleteTokenDialog, setShowDeleteTokenDialog] = useState(false);
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

  const handleDeleteToken = async () => {
    setIsDeletingToken(true);
    try {
      const result = await deleteApiStatsTokenAction();
      if (result.success) {
        setApiToken(null); // Clear the token in UI
        toast({
          title: "Token Excluído!",
          description: result.message || "Token da API foi excluído com sucesso.",
          variant: "default",
        });
      } else {
        toast({
          title: "Erro ao Excluir Token",
          description: result.message || "Não foi possível excluir o token.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro Inesperado",
        description: "Ocorreu um erro ao tentar excluir o token.",
        variant: "destructive",
      });
    } finally {
      setIsDeletingToken(false);
      setShowDeleteTokenDialog(false);
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
      "title": "Quiz Mais Engajador",
      "slug": "quiz-engajador",
      // ... outros campos do quiz
      "startedCount": 50,
      "completedCount": 40,
      "conversionRate": 80
    }
  },
  "quizzes": [
    {
      "slug": "default",
      "title": "Quiz Padrão (Modelo)",
      "dashboardName": "Quiz Padrão (Modelo)",
      "aggregateStats": {
        // ... campos do QuizAnalyticsData
        "startedCount": 100,
        "completedCount": 55
        // ...
      },
      "questionLevelStats": {
        "q1_generic_experience": {
          "id": "q1_generic_experience",
          "type": "radio",
          "totalAnswers": 90,
          "options": {
            "yes": 60,
            "no": 30
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
            <Database className="h-6 w-6 text-primary" />
            Documentação da API de Estatísticas
          </CardTitle>
          <CardDescription>
            Acesse as estatísticas dos quizzes de forma programática.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <section>
            <h2 className="text-xl font-semibold mb-2 flex items-center gap-2"><Key className="h-5 w-5 text-muted-foreground"/>Autenticação e Token de Acesso</h2>
            <p className="text-muted-foreground mb-2">
              A API requer um token de acesso Bearer no cabeçalho de autorização.
              Você pode gerar, visualizar ou excluir seu token abaixo. Guarde-o com segurança.
            </p>
            
            {isLoadingToken && (
              <div className="flex items-center gap-2 text-muted-foreground mt-2">
                <Loader2 className="h-5 w-5 animate-spin" /> Carregando token...
              </div>
            )}

            {!isLoadingToken && apiToken && (
              <Alert variant="default" className="mt-2 bg-primary/10 border-primary/30">
                  <Key className="h-5 w-5 text-primary"/>
                  <AlertTitle className="text-primary">Seu Token de Acesso Atual</AlertTitle>
                  <AlertDescription className="font-mono text-primary/80 break-all text-sm">
                      {apiToken}
                  </AlertDescription>
              </Alert>
            )}
             {!isLoadingToken && !apiToken && (
              <Alert variant="default" className="mt-2">
                  <ShieldAlert className="h-5 w-5 text-amber-600"/>
                  <AlertTitle className="text-amber-700">Nenhum Token de API Configurado</AlertTitle>
                  <AlertDescription className="text-amber-600">
                      Nenhum token de acesso à API de estatísticas foi gerado. Clique no botão abaixo para gerar um.
                  </AlertDescription>
              </Alert>
            )}

            <div className="flex flex-wrap gap-2 mt-3">
              <Button 
                onClick={handleGenerateToken} 
                disabled={isGeneratingToken || isLoadingToken}
                variant="outline"
              >
                {isGeneratingToken ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                {isGeneratingToken ? "Gerando..." : (apiToken ? "Gerar Novo Token" : "Gerar Token")}
              </Button>
              <AlertDialog open={showDeleteTokenDialog} onOpenChange={setShowDeleteTokenDialog}>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    disabled={!apiToken || isLoadingToken || isDeletingToken}
                    onClick={() => setShowDeleteTokenDialog(true)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Excluir Token
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2"><ShieldAlert className="h-6 w-6 text-destructive" />Confirmar Exclusão do Token</AlertDialogTitle>
                    <AlertDialogDescription>
                      Você tem certeza que deseja excluir o token de acesso da API? 
                      Qualquer integração usando o token atual deixará de funcionar. 
                      Você poderá gerar um novo token a qualquer momento.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={isDeletingToken}>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteToken}
                      disabled={isDeletingToken}
                      className="bg-destructive hover:bg-destructive/90"
                    >
                      {isDeletingToken ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      Sim, Excluir Token
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </section>

          <section className="space-y-4 pt-4 border-t">
              <h2 className="font-medium text-xl">Endpoint</h2>
              <code className={codeBlockClass}>GET /api/quiz-stats</code>

              <h2 className="font-medium text-lg flex items-center gap-2"><Terminal className="h-5 w-5 text-muted-foreground"/>Exemplo de Chamada (cURL)</h2>
              <pre className={codeBlockClass}>
                <code>{exampleCurlCall.trim()}</code>
              </pre>
              <p className="text-xs text-muted-foreground mt-1">
                Substitua <code className="text-xs bg-muted px-1 py-0.5 rounded-sm">SUA_APP_BASE_URL</code> pela URL base da sua aplicação se estiver testando de fora do navegador ou se o token ainda não foi carregado.
              </p>
          </section>

          <section className="space-y-4 pt-4 border-t">
            <h2 className="font-medium text-lg flex items-center gap-2"><ListChecks className="h-5 w-5 text-muted-foreground"/>Exemplo de Resposta JSON</h2>
            <pre className={codeBlockClass}>
              <code>{exampleJsonResponse.trim()}</code>
            </pre>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}

