
"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Info, CodeXml, Link as LinkIcon, ShieldAlert, RotateCcw, Loader2 } from "lucide-react";
import Link from 'next/link';
import { Button } from '@/components/ui/button';
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
import { factoryResetAction } from '../actions';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';


export default function AboutPage() {
  const [isResetting, setIsResetting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleFactoryReset = async () => {
    setIsResetting(true);
    try {
      const result = await factoryResetAction();
      if (result.success) {
        toast({
          title: "Sistema Resetado!",
          description: "O sistema foi restaurado para as configurações de fábrica. Você será redirecionado.",
          variant: "default",
          duration: 5000,
        });
        // Redirect to login page after reset
        setTimeout(() => router.push('/config/login'), 2000);
      } else {
        toast({
          title: "Erro ao Resetar",
          description: result.message || "Não foi possível resetar o sistema.",
          variant: "destructive",
        });
        setIsResetting(false);
      }
    } catch (error) {
      toast({
        title: "Erro Inesperado",
        description: "Ocorreu um erro ao tentar resetar o sistema.",
        variant: "destructive",
      });
      setIsResetting(false);
    }
  };


  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl text-foreground">
            <Info className="h-6 w-6" />
            Sobre o Sistema
          </CardTitle>
          <CardDescription>
            Informações sobre o projeto, sua versão e créditos.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <p className="text-lg font-semibold text-foreground">
                Sistema de Quiz Interativo Whitelabel
            </p>
            <Badge variant="secondary" className="mt-1">Versão 2.0</Badge>
          </div>
          <p className="text-muted-foreground">
              Este sistema foi construído para permitir a criação rápida e personalizável de quizzes interativos para captação e qualificação de leads. É projetado para ser totalmente whitelabel, adaptando-se à marca e às necessidades de diferentes clientes, com um poderoso assistente de IA para criação de conteúdo.
          </p>
          
          <div className="pt-4 border-t">
            <p className="font-semibold text-foreground flex items-center gap-2 mb-2">
              <CodeXml className="h-5 w-5" />
              Criado e Desenvolvido por:
            </p>
            <div className="space-y-2">
              <Link href="https://labs.alfastage.com.br" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors group">
                  <LinkIcon className="h-4 w-4" />
                  <span>AlfaStage Labs (labs.alfastage.com.br)</span>
              </Link>
               <Link href="https://marketingdigitalfr.com.br" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors group">
                  <LinkIcon className="h-4 w-4" />
                  <span>FR Digital (marketingdigitalfr.com.br)</span>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="border-destructive/30 bg-destructive/5">
        <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2"><ShieldAlert className="h-5 w-5" />Ações de Risco</CardTitle>
            <CardDescription className="text-destructive/80">
                Ações nesta seção são permanentes e não podem ser desfeitas. Use com extremo cuidado.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="destructive" disabled={isResetting}>
                        <RotateCcw className="h-5 w-5 mr-2" />
                        Resetar Sistema para Padrão de Fábrica
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2"><ShieldAlert className="h-6 w-6 text-destructive"/>Confirmar Reset de Fábrica</AlertDialogTitle>
                        <AlertDialogDescription asChild>
                           <div className="space-y-2">
                                <p>Você tem certeza absoluta? Esta ação é <strong>IRREVERSÍVEL</strong> e irá:</p>
                                <ul className="list-disc list-inside space-y-1">
                                    <li>Apagar <strong>TODOS</strong> os quizzes personalizados.</li>
                                    <li>Apagar <strong>TODAS</strong> as estatísticas.</li>
                                    <li>Restaurar <strong>TODAS</strong> as configurações (Aparência, Integrações, IA, etc.) para os valores padrão.</li>
                                </ul>
                                <p>O sistema voltará ao seu estado inicial.</p>
                           </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isResetting}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={handleFactoryReset} 
                            disabled={isResetting}
                            className="bg-destructive hover:bg-destructive/90"
                        >
                            {isResetting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin"/> Resetando...
                                </>
                            ) : "Sim, eu entendo, resetar tudo"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </CardContent>
      </Card>

    </div>
  );
}
