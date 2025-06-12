
import { promises as fs } from 'fs';
import path from 'path';
import QuizForm from '@/components/quiz/QuizForm';
import type { QuizConfig } from '@/types/quiz';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { defaultContactStep } from '@/config/quizConfig'; // Importar a etapa de contato padrão

interface QuizPageProps {
  params: {
    quizSlug: string;
  };
}

async function getQuizConfig(slug: string): Promise<QuizConfig | null> {
  const quizzesDirectory = path.join(process.cwd(), 'src', 'data', 'quizzes');
  const filePath = path.join(quizzesDirectory, `${slug}.json`);
  try {
    const fileContents = await fs.readFile(filePath, 'utf8');
    const quizData = JSON.parse(fileContents) as QuizConfig;
    
    quizData.title = quizData.title || "Quiz Interativo";
    quizData.slug = quizData.slug || slug;

    // Garantir que a etapa de contato seja sempre a última
    if (quizData.questions && Array.isArray(quizData.questions)) {
      // Remove qualquer instância existente da etapa de contato padrão para evitar duplicatas
      quizData.questions = quizData.questions.filter(q => q.id !== defaultContactStep.id);
      // Adiciona a etapa de contato padrão ao final
      quizData.questions.push(defaultContactStep);
    } else {
      // Se não houver perguntas ou não for um array, inicializa com a etapa de contato
      // Isso garante que mesmo um quiz "vazio" tenha a etapa de contato.
      // A validação na página ainda tratará casos de quiz sem questões de conteúdo se necessário.
      quizData.questions = [defaultContactStep];
    }
    
    // Se, após adicionar a etapa de contato, ela for a ÚNICA pergunta e o quiz
    // deveria ter outras perguntas antes, a lógica de validação abaixo (no componente da página)
    // pode precisar ser ajustada se um quiz SÓ com contato não for desejável.
    // Por ora, a lógica abaixo que checa `quizConfig.questions.length === 0`
    // (ou < 2 se contato é sempre adicionado) precisaria de ajuste.
    // A regra atual é: se o JSON original está vazio, ele mostrará erro. Se o JSON tem perguntas,
    // o contato é adicionado. Se o JSON tem só o contato, ele é padronizado.

    return quizData;
  } catch (error) {
    console.error(`Failed to read quiz config for slug ${slug}:`, error);
    return null;
  }
}

export async function generateStaticParams() {
  const quizzesDirectory = path.join(process.cwd(), 'src', 'data', 'quizzes');
  try {
    const filenames = await fs.readdir(quizzesDirectory);
    return filenames
      .filter(filename => filename.endsWith('.json'))
      .map(filename => ({
        quizSlug: filename.replace('.json', ''),
      }));
  } catch (error) {
    console.warn("Could not read quizzes directory for generateStaticParams. No quizzes will be pre-rendered.", error);
    return [];
  }
}


export default async function QuizPage({ params }: QuizPageProps) {
  const { quizSlug } = params;
  const quizConfig = await getQuizConfig(quizSlug);

  // Atualizando a validação: um quiz deve ter pelo menos a pergunta de contato.
  // Se defaultContactStep é sempre adicionado, length nunca será 0 se o arquivo existir.
  // Consideramos um quiz inválido se não tiver NENHUMA pergunta de conteúdo ANTES da de contato.
  // Ou seja, se só tiver a pergunta de contato e o JSON original era vazio ou só tinha ela.
  if (!quizConfig || !quizConfig.questions || quizConfig.questions.length === 0 ) {
    // Se quizConfig.questions.length === 1, significa que só tem a de contato, o que é válido se for intencional.
    // A lógica em getQuizConfig já garante que defaultContactStep é adicionada.
    // O problema seria se o quizConfig em si não pudesse ser carregado.
    return (
      <main className="container mx-auto p-4 min-h-screen flex flex-col items-center justify-center">
        <Alert variant="destructive" className="w-full max-w-lg">
          <AlertTriangle className="h-5 w-5" />
          <AlertTitle>Quiz não encontrado ou mal configurado</AlertTitle>
          <AlertDescription>
            O quiz com o identificador "{quizSlug}" não pôde ser carregado ou está vazio.
            Por favor, verifique o URL ou <Link href="/" className="underline hover:text-primary">volte para a página inicial</Link>.
          </AlertDescription>
        </Alert>
      </main>
    );
  }
  
   // Se um quiz é válido APENAS se tiver mais do que a etapa de contato:
   if (quizConfig.questions.length === 1 && quizConfig.questions[0].id === defaultContactStep.id) {
     // Aqui você poderia decidir que um quiz só com a etapa de contato não é suficiente.
     // No entanto, a criação via dashboard permite isso se o usuário não fornecer perguntas.
     // Vamos permitir por enquanto, já que o usuário pode querer um formulário de contato simples.
   }


  return (
    <main>
      <QuizForm 
        quizQuestions={quizConfig.questions} 
        quizSlug={quizConfig.slug} 
        quizTitle={quizConfig.title} 
      />
    </main>
  );
}
