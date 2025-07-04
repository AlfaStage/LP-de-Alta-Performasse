
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Info } from "lucide-react";

export default function AboutPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Info className="h-6 w-6" />
          Sobre o Sistema
        </CardTitle>
        <CardDescription>
          Informações sobre o projeto e seus créditos.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p>
            <strong>Sistema de Quiz Interativo Whitelabel</strong>
        </p>
        <p className="text-sm text-muted-foreground">
            Versão: 2.0 (em desenvolvimento)
        </p>
        <p>
            Este sistema foi construído para permitir a criação rápida e personalizável de quizzes para captação e qualificação de leads.
        </p>
        <p className="pt-4">
          <strong>Produzido por:</strong>
          <br />
          <span className="text-muted-foreground">[Coloque o nome da sua empresa aqui]</span>
        </p>
      </CardContent>
    </Card>
  );
}
