import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

export default function AnalyticsSettingsPage() {
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl text-foreground">
          <BarChart3 className="h-6 w-6" />
          Estatísticas
        </CardTitle>
        <CardDescription>
          Configure como os dados de estatísticas e o dashboard são exibidos e calculados.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
            <div>
                <h3 className="font-semibold text-lg text-foreground">Filtro de Período Padrão</h3>
                <p className="text-muted-foreground">Em breve: Opção para definir o período padrão do filtro de data (ex: últimos 7 dias, últimos 30 dias) a ser exibido ao carregar o dashboard.</p>
            </div>
            <div>
                <h3 className="font-semibold text-lg text-foreground">Cálculo da Taxa de Conversão</h3>
                <p className="text-muted-foreground">Em breve: Opção para escolher a base de cálculo da taxa de conversão: (quiz aberto vs. finalizado) ou (primeira pergunta respondida vs. finalizado).</p>
            </div>
        </div>
      </CardContent>
    </Card>
  );
}
