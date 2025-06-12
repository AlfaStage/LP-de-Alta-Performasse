
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2 } from "lucide-react";

export default function QuizFormLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background text-foreground">
      <Card className="w-full max-w-xl shadow-2xl rounded-xl overflow-hidden bg-card text-card-foreground">
        <CardHeader className="p-6 bg-card">
          <div className="flex items-center space-x-3">
            <Skeleton className="h-12 w-36" data-ai-hint="logo placeholder" />
            <div>
              <Skeleton className="h-8 w-48 mb-2" data-ai-hint="title placeholder" />
              <Skeleton className="h-4 w-64" data-ai-hint="description placeholder" />
            </div>
          </div>
        </CardHeader>
        <div className="w-full px-2 mb-6">
            <Skeleton className="h-3 w-full" data-ai-hint="progress bar placeholder"/>
            <Skeleton className="h-4 w-24 mx-auto mt-2" data-ai-hint="progress text placeholder" />
        </div>
        <CardContent className="p-6 md:p-8 space-y-6 bg-card">
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-12 w-12 text-primary animate-spin" />
            <p className="ml-4 text-lg text-muted-foreground">Carregando Quiz...</p>
          </div>
           <Skeleton className="h-10 w-full" data-ai-hint="question text placeholder" />
           <Skeleton className="h-20 w-full" data-ai-hint="options placeholder" />
        </CardContent>
        <div className="flex justify-between p-6 bg-muted/30">
            <Skeleton className="h-12 w-28" data-ai-hint="button placeholder" />
            <Skeleton className="h-12 w-28" data-ai-hint="button placeholder" />
        </div>
      </Card>
    </div>
  );
}
