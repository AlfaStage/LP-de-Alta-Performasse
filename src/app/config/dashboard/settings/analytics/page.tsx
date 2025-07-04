
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

export default function AnalyticsSettingsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-6 w-6" />
          Dashboard e Estatísticas
        </CardTitle>
        <CardDescription>
          Configure como os dados de estatísticas e o dashboard são exibidos.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Em breve: Opções para definir o período padrão do filtro de data e a base de cálculo da taxa de conversão.</p>
      </CardContent>
    </Card>
  );
}
