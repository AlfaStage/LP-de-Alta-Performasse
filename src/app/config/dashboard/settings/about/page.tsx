import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Info, CodeXml } from "lucide-react";

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
      <CardContent className="space-y-4">
        <div>
          <p className="text-lg font-semibold text-foreground">
              Sistema de Quiz Interativo Whitelabel
          </p>
          <Badge variant="secondary" className="mt-1">Versão 2.0 (em desenvolvimento)</Badge>
        </div>
        <p className="text-muted-foreground">
            Este sistema foi construído para permitir a criação rápida e personalizável de quizzes interativos para captação e qualificação de leads. Ele é projetado para ser totalmente whitelabel, adaptando-se à marca e às necessidades de diferentes clientes.
        </p>
        
        <div className="pt-4">
          <p className="font-semibold text-foreground flex items-center gap-2">
            <CodeXml className="h-5 w-5" />
            Produzido por:
          </p>
          <p className="text-muted-foreground mt-1">
            [Coloque o nome da sua empresa aqui]
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Para mais informações, entre em contato através de [seu email ou site].
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
