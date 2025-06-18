
# Sistema de Quiz Interativo Whitelabel

Este projeto é uma aplicação web construída com Next.js, projetada para criar e gerenciar quizzes interativos para qualificação de leads ou coleta de informações diversas. Ele é totalmente personalizável (whitelabel) para diferentes clientes.

## Funcionalidades Principais

*   **Quiz Interativo Dinâmico:** Múltiplas etapas com diferentes tipos de perguntas (escolha única, múltipla escolha, campos de texto).
*   **Criação e Edição de Quizzes:** Interface administrativa para criar, editar e gerenciar múltiplos quizzes através de um construtor visual ou JSON.
*   **Configurações Whitelabel:** Painel para personalizar nome do projeto, logo, cores do tema, webhooks, links de rodapé e IDs de rastreamento (Facebook Pixel, Google Analytics, Token da API de Estatísticas).
*   **Estatísticas de Quiz:** Dashboard para visualizar quizzes iniciados, finalizados e taxas de conversão (agregado e por quiz). **Página de estatísticas dedicada por quiz** com detalhes por pergunta.
*   **Lógica Condicional (Básica):** (Suporte básico, mais complexidade via JSON) Algumas perguntas podem ser configuradas para aparecer com base nas respostas anteriores (funcionalidade a ser explorada/expandida).
*   **Coleta de Leads:** Coleta nome completo e WhatsApp/Email ao final do quiz (configurável).
*   **Integração com Webhooks:**
    *   Envia os dados completos do quiz para um webhook após a submissão (configurável via Whitelabel).
    *   Envia dados de abandono do quiz para um webhook (usando `navigator.sendBeacon` e Server Action) - URL configurável via `.env.local`.
*   **Rastreamento com Facebook Pixel e Google Analytics:**
    *   Suporte para múltiplos IDs de Pixel do Facebook e ID do Google Analytics (configurável via Whitelabel).
    *   Rastreia eventos chave: `PageView`, `QuizStart`, `QuestionAnswered` (para cada etapa), `QuizComplete` e `Lead`.
    *   O rastreamento é ativado apenas nas páginas públicas do quiz, não no painel de configuração.
*   **API de Estatísticas:** Endpoint protegido por token para acesso programático às estatísticas agregadas e por quiz.
*   **Design Responsivo:** Interface adaptada para desktops e dispositivos móveis.
*   **Componentes Modernos:** Utiliza ShadCN UI para componentes de interface e Tailwind CSS para estilização.
*   **Validação:** Validação de formulário com React Hook Form e Zod.

## Tecnologias Utilizadas

*   **Framework:** Next.js 15+ (App Router)
*   **Linguagem:** TypeScript
*   **Estilização:** Tailwind CSS, CSS Modules (via ShadCN)
*   **UI Components:** ShadCN UI
*   **Gerenciamento de Formulário:** React Hook Form
*   **Validação de Schema:** Zod
*   **Ícones:** Lucide React
*   **GenAI (Configuração):** Configurado com Genkit (atualmente não utilizado ativamente no quiz).

## Pré-requisitos (para Desenvolvimento Local)

*   Node.js (v18 ou superior recomendado)
*   npm (v8+) ou yarn (v1.22+)

## Configuração para Desenvolvimento Local

1.  **Clone o repositório:**
    ```bash
    git clone <URL_DO_SEU_REPOSITORIO_GIT> whitelabel-quiz-system
    cd whitelabel-quiz-system
    ```

2.  **Instale as dependências:**
    ```bash
    npm install
    ```

3.  **Configure as Variáveis de Ambiente:**
    Crie um arquivo chamado `.env.local` na raiz do projeto. Adicione as seguintes variáveis, substituindo os valores de exemplo pelos seus:

    ```env
    # Senha para acessar o dashboard de configuração (/config/dashboard)
    DASHBOARD_PASSWORD="SUA_SENHA_SEGURA_AQUI" # Ex: admin123 para dev, MUDE EM PRODUÇÃO!

    # Chave secreta para assinar os cookies de autenticação (mínimo 32 caracteres)
    AUTH_COOKIE_SECRET="SUA_CHAVE_SECRETA_SUPER_LONGA_E_SEGURA_AQUI_COM_MAIS_DE_32_CHARS"

    # (Opcional) Nome do cookie de autenticação
    # AUTH_COOKIE_NAME="meu-app-auth"

    # URL base da aplicação para desenvolvimento (usada em alguns links informativos e pelo middleware se necessário)
    # Para produção, esta variável DEVE ser configurada para o domínio público da sua aplicação.
    NEXT_PUBLIC_APP_BASE_URL="http://localhost:9002"

    # Webhook para ser usado pelo navigator.sendBeacon no QuizForm.tsx (client-side)
    # Deve ser prefixado com NEXT_PUBLIC_ para ser acessível no browser.
    NEXT_PUBLIC_QUIZ_ABANDONMENT_WEBHOOK_URL_CLIENT="YOUR_CLIENT_SIDE_ABANDONMENT_WEBHOOK_URL_PLACEHOLDER"

    # Webhook para ser usado pela Server Action logQuizAbandonment (server-side)
    # Não precisa do prefixo NEXT_PUBLIC_ se for usado apenas no servidor.
    QUIZ_ABANDONMENT_WEBHOOK_URL_SERVER="YOUR_SERVER_SIDE_ABANDONMENT_WEBHOOK_URL_PLACEHOLDER"

    # (Opcional) Chave de API do Google para Genkit, se for usar funcionalidades de IA.
    # GOOGLE_API_KEY="SUA_CHAVE_API_GOOGLE_PARA_GENKIT"
    ```

    **Importante sobre Configurações Whitelabel:**
    As configurações de Whitelabel (como IDs de Pixel do Facebook, Google Analytics ID, Webhook de Submissão de Quiz, cores, logo, Token da API de Estatísticas, links de rodapé) são gerenciadas através do dashboard em `/config/dashboard/settings`. Os valores iniciais são carregados de `src/data/whitelabel-config.json`. Certifique-se de que este arquivo existe e está configurado com placeholders genéricos ou seus próprios valores padrão.

4.  **Execute o servidor de desenvolvimento:**
    ```bash
    npm run dev
    ```
    A aplicação estará disponível em `http://localhost:9002` (conforme definido no `package.json`).

## Deploy em Servidor Ubuntu (ou Similar)

Este guia detalha como implantar esta aplicação Next.js em um servidor Ubuntu utilizando Nginx como reverse proxy e PM2 para gerenciamento de processos.

### Pré-requisitos do Servidor
(Conforme descrito anteriormente)

### 1. Configuração Inicial do Servidor
(Siga as etapas para instalar Node.js, Nginx, PM2 conforme detalhado no README original ou guias online)

### 2. Deploy da Aplicação

1.  **Clone o repositório no servidor.**
2.  **Instale as dependências do projeto:** `npm install`
3.  **Configure as Variáveis de Ambiente para Produção (`.env.local`):**
    ```env
    NODE_ENV=production
    DASHBOARD_PASSWORD="UMA_SENHA_MUITO_FORTE_E_UNICA_PARA_O_DASHBOARD"
    AUTH_COOKIE_SECRET="UMA_CHAVE_SECRETA_ALEATORIA_COM_MAIS_DE_32_CARACTERES_PARA_OS_COOKIES"
    NEXT_PUBLIC_APP_BASE_URL="https://seudominio.com" # URL pública da sua aplicação
    NEXT_PUBLIC_QUIZ_ABANDONMENT_WEBHOOK_URL_CLIENT="SUA_URL_DE_WEBHOOK_PRODUCAO_ABANDONO_CLIENT"
    QUIZ_ABANDONMENT_WEBHOOK_URL_SERVER="SUA_URL_DE_WEBHOOK_PRODUCAO_ABANDONO_SERVER"
    # GOOGLE_API_KEY="SUA_CHAVE_API_GOOGLE_PRODUCAO" # Se aplicável
    ```
4.  **Configurações Whitelabel Iniciais (`src/data/whitelabel-config.json`):**
    Antes do primeiro build em produção, você pode querer pré-configurar o arquivo `src/data/whitelabel-config.json` com os valores de produção desejados (Logo, Pixels, Webhook de Submissão, etc.). Caso contrário, você precisará acessar o dashboard após o deploy para configurá-los.
5.  **Faça o build da aplicação Next.js:** `npm run build`

### 3. Configurar Nginx como Reverse Proxy
(Siga as etapas de configuração do Nginx, garantindo que `proxy_pass` aponte para a porta correta - padrão `next start` é 3000).

### 4. Gerenciar a Aplicação com PM2
```bash
pm2 start npm --name "whitelabel-quiz" -- run start # 'whitelabel-quiz' é um nome de exemplo
pm2 startup # Para iniciar o PM2 no boot do sistema
pm2 save    # Salva a lista de processos atuais
```

### 5. (Opcional mas Recomendado) Configurar SSL com Let's Encrypt
(Siga as etapas do Certbot).

### **ALERTA IMPORTANTE SOBRE PERSISTÊNCIA DE DADOS EM PRODUÇÃO:**

*   **Quizzes, Configurações Whitelabel e Analytics:** Este sistema armazena dados de quizzes, configurações Whitelabel e estatísticas de analytics em arquivos JSON dentro do diretório `src/data/`.
*   **Limitação em Ambientes PaaS/Serverless:** Muitos ambientes de hospedagem modernos (como Firebase App Hosting, Vercel, Netlify, etc.) possuem sistemas de arquivos efêmeros ou read-only. **Isso significa que quaisquer alterações feitas nesses arquivos JSON através do dashboard podem ser perdidas** em reinicializações de instâncias ou novos deploys.
*   **Recomendação para Produção:** Para um ambiente de produção robusto e escalável, é **altamente recomendado** migrar o armazenamento desses dados dinâmicos para uma solução de banco de dados persistente (ex: Firestore, PostgreSQL, MySQL, MongoDB) ou um serviço de configuração/armazenamento dedicado.
*   A abordagem atual com arquivos JSON é adequada para desenvolvimento local ou para servidores onde você tem controle total sobre um sistema de arquivos persistente e gravável para o diretório da aplicação.

### Manutenção e Atualizações da Aplicação
1.  Navegue até o diretório da aplicação.
2.  `git pull origin main` (ou sua branch).
3.  `npm install` (se houver novas dependências).
4.  `npm run build`.
5.  `pm2 restart whitelabel-quiz` (ou o nome que você deu ao processo PM2).

## Estrutura de Pastas (Principais)

```
.
├── public/                  # Arquivos estáticos (ex: sua logo se não usar URL externa)
├── src/
│   ├── app/                 # Rotas do App Router, layouts, Server Actions globais
│   │   ├── [quizSlug]/page.tsx # Página dinâmica para renderizar cada quiz
│   │   ├── config/            # Rotas e lógica do painel de configuração
│   │   │   ├── login/page.tsx
│   │   │   └── dashboard/
│   │   │       ├── layout.tsx
│   │   │       ├── page.tsx      (Página inicial do dashboard)
│   │   │       ├── quiz/         (CRUD e estatísticas de quizzes)
│   │   │       │   ├── create/page.tsx
│   │   │       │   ├── edit/[quizSlug]/page.tsx
│   │   │       │   └── stats/[quizSlug]/page.tsx  (Estatísticas detalhadas do quiz)
│   │   │       ├── settings/     (Configurações Whitelabel)
│   │   │       │   ├── page.tsx
│   │   │       │   └── documentation/page.tsx (Documentação e Gestão de Token API)
│   │   │       └── actions.ts    (Server Actions específicas do dashboard)
│   │   ├── api/                 # Rotas de API (ex: /api/quiz-stats)
│   │   │   └── quiz-stats/route.ts
│   │   ├── globals.css
│   │   ├── layout.tsx         (Layout raiz da aplicação)
│   │   ├── page.tsx           (Página inicial, renderiza o quiz "default")
│   │   └── actions.ts         (Server Actions globais da aplicação)
│   ├── components/          # Componentes React reutilizáveis
│   │   ├── dashboard/       # Componentes do Painel (DashboardShell)
│   │   ├── quiz/            # Componentes específicos do Quiz (QuizForm, QuizProgressBar, QuizFormLoading)
│   │   ├── ui/              # Componentes ShadCN UI
│   │   └── TrackingScriptsWrapper.tsx # Wrapper para scripts de rastreamento (FB, GA)
│   ├── config/              # Configurações globais da app (env vars, quizConfig base)
│   │   ├── appConfig.ts
│   │   └── quizConfig.ts
│   ├── data/                # Dados dinâmicos (idealmente em DB para produção)
│   │   ├── quizzes/         # Arquivos JSON de configuração de cada quiz (ex: default.json)
│   │   ├── analytics/       # Arquivos JSON para estatísticas (ex: quiz_stats.json, [slug]_question_stats.json)
│   │   └── whitelabel-config.json # Configurações de Whitelabel
│   ├── hooks/               # Hooks React customizados (use-toast, use-mobile)
│   ├── lib/                 # Funções utilitárias e bibliotecas auxiliares
│   │   ├── authService.ts   # Lógica de autenticação
│   │   ├── fpixel.ts        # Helpers para Facebook Pixel
│   │   ├── gtag.ts          # Helpers para Google Analytics
│   │   ├── utils.ts         # Utilitários gerais (cn)
│   │   ├── whitelabel.ts    # Utils Whitelabel (client-safe, ex: hexToHsl)
│   │   └── whitelabel.server.ts # Utils Whitelabel (server-only, file access)
│   ├── middleware.ts        # Middleware para proteger rotas do dashboard
│   └── types/               # Definições TypeScript
│       └── quiz.ts
├── .env.local               # Variáveis de ambiente locais (NÃO versionar)
├── next.config.ts
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```
