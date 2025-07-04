
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Palette } from "lucide-react";

export default function AppearanceSettingsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-6 w-6" />
          Aparência e Cores
        </CardTitle>
        <CardDescription>
          Personalize a paleta de cores e a aparência geral dos quizzes.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Em breve: As configurações de cores e background serão movidas para esta seção.</p>
      </CardContent>
    </Card>
  );
}
