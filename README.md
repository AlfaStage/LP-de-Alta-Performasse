
# Quiz Interativo Ice Lazer para Qualificação de Leads

Este projeto é uma aplicação web construída com Next.js, projetada para qualificar leads para tratamentos de depilação a laser da Ice Lazer através de um quiz interativo. Ele coleta respostas, informações de contato e integra-se com o Facebook Pixel para rastreamento de eventos e otimização de campanhas.

## Funcionalidades Principais

*   **Quiz Interativo:** Múltiplas etapas com diferentes tipos de perguntas (escolha única, múltipla escolha, campos de texto).
*   **Criação e Edição de Quizzes:** Interface administrativa para criar, editar e gerenciar múltiplos quizzes.
*   **Configurações Whitelabel:** Painel para personalizar nome do projeto, logo, cores do tema, webhooks e IDs de rastreamento.
*   **Estatísticas de Quiz:** Dashboard para visualizar quizzes iniciados, finalizados e taxas de conversão (agregado e por quiz).
*   **Lógica Condicional:** (Suporte básico, mais complexidade via JSON) Algumas perguntas aparecem com base nas respostas anteriores.
*   **Coleta de Leads:** Coleta nome completo e WhatsApp ao final do quiz.
*   **Integração com Webhooks:**
    *   Envia os dados completos do quiz para um webhook após a submissão (configurável via Whitelabel).
    *   Envia dados de abandono do quiz para um webhook (usando `navigator.sendBeacon` e Server Action).
*   **Rastreamento com Facebook Pixel e Google Analytics:**
    *   Suporte para múltiplos IDs de Pixel do Facebook e ID do Google Analytics (configurável via Whitelabel).
    *   Rastreia eventos chave: `PageView`, `QuizStart`, `QuestionAnswered` (para cada etapa), `QuizComplete` e `Lead`.
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
*   **GenAI (Futuro):** Configurado com Genkit (atualmente não utilizado ativamente no quiz).

## Pré-requisitos (para Desenvolvimento Local)

*   Node.js (v18 ou superior recomendado)
*   npm (v8+) ou yarn (v1.22+)

## Configuração para Desenvolvimento Local

1.  **Clone o repositório:**
    ```bash
    git clone <URL_DO_SEU_REPOSITORIO_GIT> ice-lazer-quiz
    cd ice-lazer-quiz
    ```

2.  **Instale as dependências:**
    ```bash
    npm install
    ```
    ou
    ```bash
    yarn install
    ```

3.  **Configure as Variáveis de Ambiente:**
    Crie um arquivo chamado `.env.local` na raiz do projeto. Adicione as seguintes variáveis, substituindo os valores de exemplo pelos seus:

    ```env
    # Senha para acessar o dashboard de configuração (/config/dashboard)
    DASHBOARD_PASSWORD="SUA_SENHA_SEGURA_AQUI"

    # Chave secreta para assinar os cookies de autenticação (mínimo 32 caracteres)
    AUTH_COOKIE_SECRET="SUA_CHAVE_SECRETA_SUPER_LONGA_E_SEGURA_AQUI"

    # (Opcional) Nome do cookie de autenticação
    # AUTH_COOKIE_NAME="meu-app-auth"

    # URL base da aplicação para desenvolvimento (usada em alguns links informativos e pelo middleware se necessário)
    # Para produção, esta variável DEVE ser configurada para o domínio público da sua aplicação.
    NEXT_PUBLIC_APP_BASE_URL="http://localhost:9002"

    # Webhook para ser usado pelo navigator.sendBeacon no QuizForm.tsx (client-side)
    # Deve ser prefixado com NEXT_PUBLIC_ para ser acessível no browser.
    NEXT_PUBLIC_QUIZ_ABANDONMENT_WEBHOOK_URL_CLIENT="SUA_URL_DE_WEBHOOK_PARA_ABANDONO_CLIENT_SIDE"

    # Webhook para ser usado pela Server Action logQuizAbandonment (server-side)
    # Não precisa do prefixo NEXT_PUBLIC_ se for usado apenas no servidor.
    QUIZ_ABANDONMENT_WEBHOOK_URL_SERVER="SUA_URL_DE_WEBHOOK_PARA_ABANDONO_SERVER_SIDE"

    # (Opcional) Chave de API do Google para Genkit, se for usar funcionalidades de IA.
    # GOOGLE_API_KEY="SUA_CHAVE_API_GOOGLE_PARA_GENKIT"
    ```

    **Importante sobre Configurações Whitelabel:**
    As configurações de Whitelabel (como IDs de Pixel do Facebook, Google Analytics ID, Webhook de Submissão de Quiz, cores, logo) são gerenciadas através do dashboard em `/config/dashboard/settings`. Os valores iniciais são carregados de `src/data/whitelabel-config.json`.

4.  **Execute o servidor de desenvolvimento:**
    ```bash
    npm run dev
    ```
    A aplicação estará disponível em `http://localhost:9002` (conforme definido no `package.json`).

## Deploy em Servidor Ubuntu (ou Similar)

Este guia detalha como implantar esta aplicação Next.js em um servidor Ubuntu utilizando Nginx como reverse proxy e PM2 para gerenciamento de processos.

### Pré-requisitos do Servidor

*   Um servidor Ubuntu (e.g., 20.04, 22.04 LTS).
*   Acesso SSH ao servidor com privilégios `sudo`.
*   Node.js (v18 ou superior) e npm instalados no servidor.
*   Nginx instalado no servidor.
*   PM2 instalado globalmente no servidor.
*   Um nome de domínio configurado para apontar para o IP do seu servidor (recomendado para SSL).

### 1. Configuração Inicial do Servidor

(Siga as etapas para instalar Node.js, Nginx, PM2 conforme detalhado anteriormente no README)

### 2. Deploy da Aplicação

1.  **Clone o repositório no servidor:**
    (Conforme detalhado anteriormente)

2.  **Instale as dependências do projeto:**
    ```bash
    npm install
    ```

3.  **Configure as Variáveis de Ambiente para Produção:**
    Crie e edite o arquivo `.env.local` no diretório raiz da aplicação (ex: `/var/www/ice-lazer-quiz/.env.local`):
    ```bash
    nano .env.local
    ```
    Adicione as variáveis necessárias, **substituindo pelos seus valores de produção**:
    ```env
    NODE_ENV=production

    # !! IMPORTANTE PARA PRODUÇÃO !!
    DASHBOARD_PASSWORD="UMA_SENHA_MUITO_FORTE_E_UNICA_PARA_O_DASHBOARD"
    AUTH_COOKIE_SECRET="UMA_CHAVE_SECRETA_ALEATORIA_COM_MAIS_DE_32_CARACTERES_PARA_OS_COOKIES"
    NEXT_PUBLIC_APP_BASE_URL="https://seudominio.com" # URL pública da sua aplicação

    # Configure seus webhooks de produção
    NEXT_PUBLIC_QUIZ_ABANDONMENT_WEBHOOK_URL_CLIENT="SUA_URL_DE_WEBHOOK_PRODUCAO_ABANDONO_CLIENT"
    QUIZ_ABANDONMENT_WEBHOOK_URL_SERVER="SUA_URL_DE_WEBHOOK_PRODUCAO_ABANDONO_SERVER"

    # GOOGLE_API_KEY="SUA_CHAVE_API_GOOGLE_PRODUCAO" # Se aplicável
    ```

4.  **Configurações Whitelabel Iniciais (Opcional, mas recomendado):**
    Antes do primeiro build em produção, você pode querer pré-configurar o arquivo `src/data/whitelabel-config.json` com os valores de produção desejados (Logo, Pixels, Webhook de Submissão, etc.). Caso contrário, você precisará acessar o dashboard após o deploy para configurá-los.

5.  **Faça o build da aplicação Next.js:**
    ```bash
    npm run build
    ```
    Isso criará a pasta `.next` com os arquivos otimizados para produção.

### 3. Configurar Nginx como Reverse Proxy

(Siga as etapas de configuração do Nginx conforme detalhado anteriormente, certificando-se de que `proxy_pass` aponte para a porta correta que o PM2 usará - padrão `next start` é 3000).

### 4. Gerenciar a Aplicação com PM2

1.  **Inicie sua aplicação Next.js com PM2:**
    Navegue até o diretório da sua aplicação (`/var/www/ice-lazer-quiz`).
    ```bash
    # O comando 'npm run start' será executado.
    # 'next start' por padrão usa a porta 3000.
    pm2 start npm --name "ice-lazer-quiz" -- run start
    ```
    (Siga as etapas para `pm2 startup` e `pm2 save` conforme detalhado anteriormente).

### 5. (Opcional mas Recomendado) Configurar SSL com Let's Encrypt

(Siga as etapas do Certbot conforme detalhado anteriormente).

### **ALERTA IMPORTANTE SOBRE PERSISTÊNCIA DE DADOS EM PRODUÇÃO:**

*   **Quizzes, Configurações Whitelabel e Analytics:** Este protótipo armazena dados de quizzes, configurações Whitelabel e estatísticas de analytics em arquivos JSON dentro do diretório `src/data/`.
*   **Limitação em Ambientes PaaS/Serverless:** Muitos ambientes de hospedagem modernos (como Firebase App Hosting, Vercel, Netlify, etc.) possuem sistemas de arquivos efêmeros ou read-only para o código da aplicação após o deploy. **Isso significa que quaisquer alterações feitas nesses arquivos JSON através do dashboard (novos quizzes, mudança de configurações, coleta de analytics) podem ser perdidas** em reinicializações de instâncias ou novos deploys.
*   **Recomendação para Produção:** Para um ambiente de produção robusto e escalável, é **altamente recomendado** migrar o armazenamento desses dados dinâmicos para uma solução de banco de dados persistente (ex: Firestore, PostgreSQL, MySQL, MongoDB) ou um serviço de configuração/armazenamento dedicado. O código das Server Actions em `src/lib/whitelabel.server.ts` e `src/app/config/dashboard/quiz/actions.ts` precisaria ser adaptado para interagir com o banco de dados escolhido.
*   A abordagem atual com arquivos JSON é adequada para desenvolvimento local ou para servidores onde você tem controle total sobre um sistema de arquivos persistente e gravável para o diretório da aplicação.

### Manutenção e Atualizações da Aplicação

(Siga as etapas conforme detalhado anteriormente, lembrando de reiniciar com `pm2 restart ice-lazer-quiz`).

## Estrutura de Pastas (Principais)

```
.
├── public/                  # Arquivos estáticos
├── src/
│   ├── app/                 # Rotas do App Router, layouts, Server Actions globais
│   │   ├── [quizSlug]/page.tsx # Página dinâmica para renderizar cada quiz
│   │   ├── config/            # Rotas e lógica do painel de configuração
│   │   │   ├── login/page.tsx
│   │   │   └── dashboard/
│   │   │       ├── layout.tsx
│   │   │       ├── page.tsx      (Página inicial do dashboard)
│   │   │       ├── quiz/         (CRUD e estatísticas de quizzes)
│   │   │       └── settings/     (Configurações Whitelabel)
│   │   ├── globals.css
│   │   ├── layout.tsx         (Layout raiz da aplicação)
│   │   └── page.tsx           (Página inicial, renderiza o quiz "default")
│   ├── components/          # Componentes React reutilizáveis
│   │   ├── quiz/            # Componentes específicos do Quiz (QuizForm, QuizProgressBar)
│   │   ├── ui/              # Componentes ShadCN UI
│   │   └── FacebookPixelScript.tsx
│   ├── config/              # Configurações globais da app (env vars, quizConfig base)
│   │   ├── appConfig.ts
│   │   └── quizConfig.ts
│   ├── data/                # Dados dinâmicos (idealmente em DB para produção)
│   │   ├── quizzes/         # Arquivos JSON de configuração de cada quiz (ex: default.json)
│   │   ├── analytics/       # Arquivos JSON para estatísticas (ex: quiz_stats.json)
│   │   └── whitelabel-config.json # Configurações de Whitelabel
│   ├── hooks/               # Hooks React customizados
│   ├── lib/                 # Funções utilitárias e bibliotecas auxiliares
│   │   ├── authService.ts   # Lógica de autenticação
│   │   ├── fpixel.ts        # Helpers para Facebook Pixel
│   │   ├── gtag.ts          # Helpers para Google Analytics
│   │   ├── utils.ts         # Utilitários gerais
│   │   ├── whitelabel.ts    # Utils Whitelabel (client-safe)
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

## Contribuição

Se desejar contribuir com o projeto, por favor, siga estas etapas:
1.  Faça um fork do repositório.
2.  Crie uma nova branch (`git checkout -b feature/sua-feature`).
3.  Faça commit das suas alterações (`git commit -am 'Adiciona nova feature'`).
4.  Envie para a branch (`git push origin feature/sua-feature`).
5.  Crie um novo Pull Request.

Por favor, certifique-se de que seu código segue os padrões de linting e que os testes (se aplicável) passam.
```