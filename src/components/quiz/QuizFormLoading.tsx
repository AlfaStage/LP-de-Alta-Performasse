
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
        <div className="w-full px-6 pb-4">
            <Skeleton className="h-3 w-full" data-ai-hint="progress bar placeholder"/>
        </div>
        <CardContent className="p-6 md:p-8 space-y-6 bg-card">
           <div className="flex items-start space-x-3">
                <Skeleton className="h-8 w-8 rounded-full" data-ai-hint="icon placeholder"/>
                <div className="space-y-2 flex-1">
                    <Skeleton className="h-6 w-3/4" data-ai-hint="question text placeholder" />
                    <Skeleton className="h-4 w-1/2" data-ai-hint="question description placeholder" />
                </div>
           </div>
           <div className="space-y-3 pt-4">
               <Skeleton className="h-12 w-full" data-ai-hint="option placeholder" />
               <Skeleton className="h-12 w-full" data-ai-hint="option placeholder" />
               <Skeleton className="h-12 w-full" data-ai-hint="option placeholder" />
           </div>
        </CardContent>
        <div className="flex justify-between p-6 bg-muted/30">
            <Skeleton className="h-12 w-28" data-ai-hint="button placeholder" />
            <Skeleton className="h-12 w-28" data-ai-hint="button placeholder" />
        </div>
      </Card>
    </div>
  );
}
