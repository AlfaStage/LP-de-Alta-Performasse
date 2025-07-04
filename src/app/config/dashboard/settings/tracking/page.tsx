
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Fingerprint } from "lucide-react";

export default function TrackingSettingsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Fingerprint className="h-6 w-6" />
          Rastreadores (Pixels)
        </CardTitle>
        <CardDescription>
          Configure os IDs de rastreamento para Facebook Pixel, Google Analytics e outros.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Em breve: As configurações de Pixels e verificação de domínio serão movidas para esta seção.</p>
      </CardContent>
    </Card>
  );
}
