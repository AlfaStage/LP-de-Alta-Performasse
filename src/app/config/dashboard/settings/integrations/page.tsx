
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link2 } from "lucide-react";

export default function IntegrationsSettingsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link2 className="h-6 w-6" />
          Integrações e Webhooks
        </CardTitle>
        <CardDescription>
          Gerencie webhooks e outras integrações externas.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Em breve: As configurações de webhooks e da API do Genkit serão movidas para esta seção.</p>
      </CardContent>
    </Card>
  );
}
