
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { FileJson, HelpCircle, User, Mail, Smartphone, ThumbsUp, Sparkles, Heart, CheckCircle } from "lucide-react";
import Image from "next/image";

const codeBlockClass = "block whitespace-pre-wrap bg-muted/50 p-4 rounded-md text-sm font-mono overflow-x-auto";

const radioExample = `{
  "id": "q1_experience",
  "name": "previousExperience",
  "icon": "HelpCircle",
  "text": "Você já utilizou um serviço similar antes?",
  "explanation": "Saber sua experiência nos ajuda a entender melhor suas necessidades.",
  "type": "radio",
  "options": [
    {
      "value": "yes",
      "label": "Sim, já utilizei",
      "icon": "ThumbsUp"
    },
    {
      "value": "no",
      "label": "Não, é minha primeira vez",
      "icon": "Sparkles"
    }
  ]
}`;

const checkboxExample = `{
  "id": "q2_interest",
  "name": "areasOfInterest",
  "icon": "Heart",
  "text": "Quais dos seguintes tópicos mais lhe interessam?",
  "explanation": "Você pode selecionar múltiplas opções.",
  "type": "checkbox",
  "options": [
    {
      "value": "topic_a",
      "label": "Tópico A",
      "imageUrl": "https://placehold.co/300x200.png?text=Tópico+A",
      "dataAiHint": "abstract shape"
    },
    {
      "value": "topic_b",
      "label": "Tópico B",
      "imageUrl": "https://placehold.co/300x200.png?text=Tópico+B",
      "dataAiHint": "geometric pattern"
    },
    {
      "value": "topic_c",
      "label": "Tópico C",
      "imageUrl": "https://placehold.co/300x200.png?text=Tópico+C",
      "dataAiHint": "nature scene"
    }
  ]
}`;

const textFieldsExample = `{
  "id": "final_contact_step",
  "name": "contato",
  "icon": "User",
  "text": "Excelente! Para finalizarmos, deixe seus dados:",
  "explanation": "Suas informações estão seguras conosco.",
  "type": "textFields",
  "fields": [
    {
      "name": "nomeCompleto",
      "label": "Seu nome completo",
      "type": "text",
      "placeholder": "Ex: Maria da Silva",
      "icon": "User"
    },
    {
      "name": "whatsapp",
      "label": "Seu WhatsApp (com DDD)",
      "type": "tel",
      "placeholder": "Ex: (11) 98765-4321",
      "icon": "Smartphone"
    },
    {
      "name": "email",
      "label": "Seu melhor email",
      "type": "email",
      "placeholder": "Ex: maria.silva@email.com",
      "icon": "Mail"
    }
  ]
}`;


export default function QuizJsonGuidePage() {
  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <FileJson className="h-6 w-6 text-primary" />
            Guia: Criação de Quiz via JSON
          </CardTitle>
          <CardDescription>
            Aprenda a construir a estrutura de um quiz editando diretamente o código JSON. Isso permite maior flexibilidade e a criação de perguntas complexas.
          </CardDescription>
        </CardHeader>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Estrutura Geral do Quiz (`QuizConfig`)</CardTitle>
          <CardDescription>
            O arquivo JSON de um quiz é um objeto que define suas propriedades gerais e contém um array de perguntas.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li><code className="font-semibold text-foreground">title</code>: (string) O título principal do quiz, visível ao usuário.</li>
                <li><code className="font-semibold text-foreground">slug</code>: (string) O identificador único para a URL (ex: `meu-quiz-incrivel`).</li>
                <li><code className="font-semibold text-foreground">dashboardName</code>: (string, opcional) Nome que aparece no painel. Se omitido, usa o `title`.</li>
                <li><code className="font-semibold text-foreground">description</code>: (string, opcional) Texto que aparece abaixo do título do quiz.</li>
                <li><code className="font-semibold text-foreground">questions</code>: (array) Uma lista de objetos, onde cada objeto é uma pergunta.</li>
            </ul>
        </CardContent>
      </Card>
      
      <h2 className="text-xl font-semibold text-foreground pt-4 border-t">Tipos de Pergunta</h2>

      {/* RADIO QUESTION EXAMPLE */}
      <Card>
        <CardHeader>
          <CardTitle>Tipo de Pergunta: `radio` (Escolha Única)</CardTitle>
          <CardDescription>
            Usado quando o usuário deve selecionar apenas uma opção de uma lista.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold mb-2">Exemplo JSON:</h3>
            <pre className={codeBlockClass}>
              <code>{radioExample}</code>
            </pre>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Resultado Visual (Simulação):</h3>
            <Card className="p-6 space-y-4 bg-muted/30">
               <div className="flex items-start space-x-3">
                  <HelpCircle className="h-8 w-8 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <Label className="text-xl font-semibold text-card-foreground mb-1 block">
                      Você já utilizou um serviço similar antes?
                    </Label>
                    <p className="text-sm text-muted-foreground mb-3">Saber sua experiência nos ajuda a entender melhor suas necessidades.</p>
                  </div>
                </div>
                <RadioGroup className="space-y-2">
                    <div className="flex items-center space-x-3 p-3 border rounded-lg bg-background">
                        <ThumbsUp className="h-5 w-5 text-muted-foreground" />
                        <RadioGroupItem value="yes" id="radio-sim" />
                        <Label htmlFor="radio-sim" className="font-normal flex-1">Sim, já utilizei</Label>
                    </div>
                    <div className="flex items-center space-x-3 p-3 border rounded-lg bg-background">
                        <Sparkles className="h-5 w-5 text-muted-foreground" />
                        <RadioGroupItem value="no" id="radio-nao" />
                        <Label htmlFor="radio-nao" className="font-normal flex-1">Não, é minha primeira vez</Label>
                    </div>
                </RadioGroup>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* CHECKBOX QUESTION EXAMPLE */}
      <Card>
        <CardHeader>
          <CardTitle>Tipo de Pergunta: `checkbox` (Múltipla Escolha)</CardTitle>
          <CardDescription>
            Permite que o usuário selecione uma ou mais opções. Ideal para perguntas com imagens.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold mb-2">Exemplo JSON:</h3>
            <pre className={codeBlockClass}>
              <code>{checkboxExample}</code>
            </pre>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Resultado Visual (Simulação):</h3>
            <Card className="p-6 space-y-4 bg-muted/30">
                <div className="flex items-start space-x-3">
                    <Heart className="h-8 w-8 text-primary mt-1 flex-shrink-0" />
                    <div>
                        <Label className="text-xl font-semibold text-card-foreground mb-1 block">
                        Quais dos seguintes tópicos mais lhe interessam?
                        </Label>
                        <p className="text-sm text-muted-foreground mb-3">Você pode selecionar múltiplas opções.</p>
                    </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                    <div className="relative p-3 border rounded-lg cursor-pointer bg-background">
                        <div className="relative w-full h-24 mb-2 rounded-md overflow-hidden">
                            <Image src="https://placehold.co/300x200.png?text=Tópico+A" alt="Tópico A" layout="fill" objectFit="cover" />
                        </div>
                        <div className="text-center"><Label className="font-semibold text-sm">Tópico A</Label></div>
                    </div>
                    <div className="relative p-3 border-primary ring-2 ring-primary bg-primary/10 rounded-lg cursor-pointer">
                        <div className="relative w-full h-24 mb-2 rounded-md overflow-hidden">
                            <Image src="https://placehold.co/300x200.png?text=Tópico+B" alt="Tópico B" layout="fill" objectFit="cover" />
                        </div>
                        <div className="text-center"><Label className="font-semibold text-sm text-primary">Tópico B</Label></div>
                        <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1"><CheckCircle className="h-4 w-4" /></div>
                    </div>
                    <div className="relative p-3 border rounded-lg cursor-pointer bg-background">
                        <div className="relative w-full h-24 mb-2 rounded-md overflow-hidden">
                            <Image src="https://placehold.co/300x200.png?text=Tópico+C" alt="Tópico C" layout="fill" objectFit="cover" />
                        </div>
                        <div className="text-center"><Label className="font-semibold text-sm">Tópico C</Label></div>
                    </div>
                </div>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* TEXTFIELDS QUESTION EXAMPLE */}
       <Card>
        <CardHeader>
          <CardTitle>Tipo de Pergunta: `textFields` (Campos de Entrada)</CardTitle>
          <CardDescription>
            Usado para coletar dados do usuário, como nome, email e telefone. Ideal para a etapa final do quiz.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold mb-2">Exemplo JSON:</h3>
            <pre className={codeBlockClass}>
              <code>{textFieldsExample}</code>
            </pre>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Resultado Visual (Simulação):</h3>
            <Card className="p-6 space-y-4 bg-muted/30">
                <div className="flex items-start space-x-3">
                    <User className="h-8 w-8 text-primary mt-1 flex-shrink-0" />
                    <div>
                        <Label className="text-xl font-semibold text-card-foreground mb-1 block">
                        Excelente! Para finalizarmos, deixe seus dados:
                        </Label>
                        <p className="text-sm text-muted-foreground mb-3">Suas informações estão seguras conosco.</p>
                    </div>
                </div>
                <div className="space-y-4">
                    <div className="space-y-1">
                        <Label className="font-medium flex items-center"><User className="h-4 w-4 mr-2 text-primary"/>Seu nome completo</Label>
                        <Input type="text" placeholder="Ex: Maria da Silva" />
                    </div>
                    <div className="space-y-1">
                        <Label className="font-medium flex items-center"><Smartphone className="h-4 w-4 mr-2 text-primary"/>Seu WhatsApp (com DDD)</Label>
                        <Input type="tel" placeholder="Ex: (11) 98765-4321" />
                    </div>
                     <div className="space-y-1">
                        <Label className="font-medium flex items-center"><Mail className="h-4 w-4 mr-2 text-primary"/>Seu melhor email</Label>
                        <Input type="email" placeholder="Ex: maria.silva@email.com" />
                    </div>
                </div>
            </Card>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
