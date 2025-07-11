
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Download, Upload, ArrowRightLeft, FileArchive, FileJson, FileText, BrainCircuit, BarChart3, List, ShieldAlert, Loader2 } from "lucide-react";
import { getQuizzesList } from '@/app/config/dashboard/quiz/actions';
import { exportAllDataAction, exportFileAction, importDataAction } from './actions';
import type { QuizListItem } from '@/types/quiz';

type ImportPreview = {
  fileName: string;
  fileContent: string;
  type: 'zip' | 'json';
};

export default function PortabilityPage() {
  const { toast } = useToast();
  const [quizzes, setQuizzes] = useState<QuizListItem[]>([]);
  const [selectedQuiz, setSelectedQuiz] = useState<string>('');
  const [isExportingAll, setIsExportingAll] = useState(false);
  const [isExportingFile, setIsExportingFile] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importPreview, setImportPreview] = useState<ImportPreview | null>(null);

  useEffect(() => {
    async function loadQuizzes() {
      const quizList = await getQuizzesList();
      setQuizzes(quizList);
    }
    loadQuizzes();
  }, []);

  const handleExportAll = async () => {
    setIsExportingAll(true);
    try {
      const result = await exportAllDataAction();
      if (result.success && result.data) {
        const blob = new Blob([Buffer.from(result.data, 'base64')], { type: 'application/zip' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = result.fileName || 'quiz-system-backup.zip';
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        toast({ title: "Exportação Concluída", description: "O backup completo foi baixado." });
      } else {
        throw new Error(result.message || 'Falha ao gerar o arquivo ZIP.');
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Erro desconhecido.";
      toast({ title: "Erro na Exportação", description: msg, variant: "destructive" });
    } finally {
      setIsExportingAll(false);
    }
  };

  const handleExportFile = async (fileKey: string, fileName: string) => {
    setIsExportingFile(fileKey);
    try {
      const result = await exportFileAction(fileKey);
      if (result.success && result.data) {
        const blob = new Blob([result.data], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        toast({ title: "Exportação Concluída", description: `${fileName} foi baixado.` });
      } else {
        throw new Error(result.message || `Falha ao exportar ${fileName}.`);
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Erro desconhecido.";
      toast({ title: "Erro na Exportação", description: msg, variant: "destructive" });
    } finally {
      setIsExportingFile(null);
    }
  };

  const onFileDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const file = event.dataTransfer.files?.[0];
    if (file) {
      handleFile(file);
    }
  }, []);
  
  const onFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  }, []);

  const handleFile = (file: File) => {
    const reader = new FileReader();
    const fileType = file.name.endsWith('.zip') ? 'zip' : 'json';
    
    if (fileType === 'zip') {
      reader.readAsDataURL(file);
    } else {
      reader.readAsText(file, 'UTF-8');
    }

    reader.onload = (readEvent) => {
      const content = readEvent.target?.result as string;
      const finalContent = fileType === 'zip' ? content.split(',')[1] : content;
      setImportPreview({
        fileName: file.name,
        fileContent: finalContent,
        type: fileType
      });
    };
    reader.onerror = () => {
      toast({ title: "Erro de Leitura", description: "Não foi possível ler o arquivo selecionado.", variant: "destructive" });
    };
  };

  const handleImportConfirm = async () => {
    if (!importPreview) return;
    setIsImporting(true);
    try {
      const result = await importDataAction(importPreview.fileContent, importPreview.type);
      if (result.success) {
        toast({ title: "Importação Concluída!", description: result.message, variant: "default" });
        // Optionally, force a reload to reflect all changes across the app
        window.location.reload();
      } else {
        throw new Error(result.message || "Ocorreu um erro durante a importação.");
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Erro desconhecido.";
      toast({ title: "Erro na Importação", description: msg, variant: "destructive" });
    } finally {
      setIsImporting(false);
      setImportPreview(null);
    }
  };

  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl text-foreground">
            <Download className="h-6 w-6" />
            Exportar Dados
          </CardTitle>
          <CardDescription>
            Faça o backup de suas configurações e quizzes. Você pode exportar tudo de uma vez ou arquivos individuais.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-4 border rounded-lg flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="font-semibold flex items-center gap-2"><FileArchive className="h-5 w-5 text-primary"/>Backup Completo</h3>
              <p className="text-sm text-muted-foreground">Exporta todas as configurações, quizzes e estatísticas em um único arquivo .zip.</p>
            </div>
            <Button onClick={handleExportAll} disabled={isExportingAll} className="w-full md:w-auto">
              {isExportingAll ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Download className="mr-2 h-4 w-4"/>}
              {isExportingAll ? 'Exportando...' : 'Exportar Tudo (.zip)'}
            </Button>
          </div>
          <div className="p-4 border rounded-lg space-y-4">
            <h3 className="font-semibold flex items-center gap-2"><FileJson className="h-5 w-5 text-primary"/>Exportações Individuais</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Button variant="outline" onClick={() => handleExportFile('whitelabel-config.json', 'whitelabel-config.json')} disabled={!!isExportingFile}><FileText className="mr-2 h-4 w-4"/>Configurações Gerais</Button>
              <Button variant="outline" onClick={() => handleExportFile('ai-prompts.json', 'ai-prompts.json')} disabled={!!isExportingFile}><BrainCircuit className="mr-2 h-4 w-4"/>Prompts de IA</Button>
              <Button variant="outline" onClick={() => handleExportFile('analytics/quiz_stats.json', 'quiz_stats.json')} disabled={!!isExportingFile}><BarChart3 className="mr-2 h-4 w-4"/>Estatísticas Agregadas</Button>
            </div>
            <div className="pt-4 border-t flex flex-col md:flex-row items-center gap-4">
              <Select onValueChange={setSelectedQuiz} value={selectedQuiz}>
                <SelectTrigger className="w-full md:w-[300px]">
                  <SelectValue placeholder="Selecione um quiz para exportar..." />
                </SelectTrigger>
                <SelectContent>
                  {quizzes.map(quiz => <SelectItem key={quiz.slug} value={quiz.slug}>{quiz.dashboardName || quiz.title}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button onClick={() => handleExportFile(`quizzes/${selectedQuiz}.json`, `${selectedQuiz}.json`)} disabled={!selectedQuiz || !!isExportingFile}><List className="mr-2 h-4 w-4"/>Exportar Quiz Selecionado</Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl text-foreground">
            <Upload className="h-6 w-6" />
            Importar Dados
          </CardTitle>
          <CardDescription>
            Importe um backup (.zip) ou um arquivo de configuração (.json). Isso substituirá os dados existentes.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <div 
              className="border-2 border-dashed rounded-lg p-12 text-center text-muted-foreground hover:border-primary hover:text-primary transition-colors cursor-pointer"
              onDragOver={e => e.preventDefault()}
              onDrop={onFileDrop}
              onClick={() => document.getElementById('file-upload-input')?.click()}
            >
              <Upload className="mx-auto h-12 w-12 mb-4"/>
              <p className="font-semibold">Arraste e solte o arquivo aqui</p>
              <p className="text-sm">ou clique para selecionar (.zip ou .json)</p>
            </div>
             <input
                id="file-upload-input"
                type="file"
                accept=".zip,.json"
                className="hidden"
                onChange={onFileSelect}
              />
        </CardContent>
      </Card>

      <AlertDialog open={!!importPreview} onOpenChange={() => setImportPreview(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2"><ShieldAlert className="h-6 w-6 text-destructive"/>Confirmar Importação</AlertDialogTitle>
            <AlertDialogDescription>
              Você está prestes a importar o arquivo <strong>{importPreview?.fileName}</strong>. Esta ação <strong>substituirá permanentemente</strong> os dados existentes no sistema que correspondem aos arquivos dentro do seu upload.
              <br/><br/>
              Tem certeza que deseja continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isImporting} onClick={() => setImportPreview(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleImportConfirm} disabled={isImporting} className="bg-primary hover:bg-primary/90">
              {isImporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Upload className="mr-2 h-4 w-4"/>}
              {isImporting ? 'Importando...' : 'Sim, Substituir e Importar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
