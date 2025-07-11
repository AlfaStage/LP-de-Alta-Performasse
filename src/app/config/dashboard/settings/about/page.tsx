
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Info, CodeXml, Link as LinkIcon } from "lucide-react";
import Link from 'next/link';

export default function AboutPage() {
  return (
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
  );
}
