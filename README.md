
# Sistema de Quiz Interativo Whitelabel v2.0

Este projeto é uma aplicação web construída com Next.js, projetada para criar e gerenciar quizzes interativos para qualificação de leads ou coleta de informações diversas. É totalmente personalizável (whitelabel) e agora conta com uma poderosa integração de IA para auxiliar na criação de conteúdo.

## Funcionalidades Principais (V2)

*   **Criação de Quiz Interativo**: Múltiplas etapas com diferentes tipos de perguntas (escolha única, múltipla escolha, campos de texto).
*   **Assistente de IA para Conteúdo**:
    *   **Geração Granular**: Botões de "Gerar com IA" contextuais para cada seção do quiz: **Detalhes**, **Perguntas**, **Mensagens Pós-Quiz** e **Páginas de Resultado**.
    *   **Modos de Geração Inteligente**: A IA pode **Gerar do Zero**, **Melhorar** o conteúdo existente, ou **Completar** apenas os campos vazios.
    *   **Prompts Customizáveis**: Os prompts que guiam a IA para cada tipo de geração podem ser editados no painel de configurações.
    *   **Seleção de Modelo**: Possibilidade de escolher o modelo de IA do Google (ex: `gemini-1.5-flash`, `gemini-1.5-pro`) a ser utilizado.
*   **Lógica de Perguntas**:
    *   Marque perguntas como **obrigatórias** para garantir a coleta de dados essenciais.
    *   Defina opções de resposta que **desqualificam** um lead, direcionando-o para uma página de resultado específica.
*   **Configurações Whitelabel Completas**:
    *   **Identidade Visual**: Personalize nome do projeto, logo, cores do tema (primária, secundária, botões, fundos) e links do rodapé.
    *   **Integrações**: Configure webhooks de submissão (para leads qualificados e desqualificados) e IDs de rastreamento (Facebook Pixel, Google Analytics).
*   **Estatísticas de Quiz Detalhadas**:
    *   Dashboard com visão geral do desempenho de todos os quizzes (iniciados, engajados, finalizados, taxa de conversão).
    *   **Página de estatísticas dedicada por quiz** com análise de respostas para cada pergunta.
    *   Filtro de período (hoje, últimos 7 dias, etc.) e métrica de conversão personalizáveis.
*   **Coleta de Leads e Webhooks**:
    *   Coleta nome completo, WhatsApp e Email ao final do quiz (campos configuráveis).
    *   Envia os dados completos do quiz (respostas e mensagens personalizadas) para um webhook após a submissão.
*   **Rastreamento com Facebook Pixel e Google Analytics**:
    *   Suporte para múltiplos IDs de Pixel do Facebook (primário, secundário, por quiz) e ID do Google Analytics.
    *   Rastreia eventos chave: `PageView`, `QuizStart`, `QuestionAnswered`, `QuizComplete` e `Lead`.
*   **API de Estatísticas**: Endpoint protegido por token para acesso programático às estatísticas.
*   **Design Responsivo e Performance**: Interface otimizada para desktops e dispositivos móveis, com pré-carregamento de páginas para navegação rápida no painel.

## Tecnologias Utilizadas

*   **Framework**: Next.js (App Router)
*   **Linguagem**: TypeScript
*   **Estilização**: Tailwind CSS
*   **UI Components**: ShadCN UI
*   **Gerenciamento de Formulário**: React Hook Form & Zod
*   **Geração de Conteúdo IA**: Google Gemini via Genkit

## Configuração para Desenvolvimento Local

1.  **Clone o repositório e instale as dependências:**
    ```bash
    git clone <URL_DO_REPOSITORIO> whitelabel-quiz-system
    cd whitelabel-quiz-system
    npm install
    ```

2.  **Configure as Variáveis de Ambiente (`.env.local`):**
    Crie um arquivo `.env.local` na raiz do projeto com o seguinte conteúdo:
    ```env
    # Senha para acessar o dashboard de configuração (/config/dashboard)
    DASHBOARD_PASSWORD="SUA_SENHA_SEGURA_AQUI"

    # Chave secreta para os cookies de autenticação (mínimo 32 caracteres)
    AUTH_COOKIE_SECRET="SUA_CHAVE_SECRETA_SUPER_LONGA_E_SEGURA_AQUI"
    ```

3.  **Configurações Whitelabel Iniciais (`src/data/whitelabel-config.json`):**
    As demais configurações (logo, cores, webhooks, chaves de API) são gerenciadas pelo painel em `/config/dashboard/settings`. O sistema iniciará com valores padrão. Para usar a IA, você precisará adicionar sua Chave de API do Google em "Configurações > Integrações".

4.  **Execute o servidor de desenvolvimento:**
    ```bash
    npm run dev
    ```
    A aplicação estará disponível em `http://localhost:9002`.

## Alerta sobre Persistência de Dados

Este sistema, por padrão, armazena os dados de configuração dos quizzes, estatísticas e configurações whitelabel em arquivos JSON no diretório `src/data/`.

*   **Ideal para Desenvolvimento e Servidores Dedicados**: Esta abordagem funciona bem para desenvolvimento local ou em ambientes de servidor único onde o sistema de arquivos é persistente (como um VPS ou servidor dedicado).
*   **Limitação em Ambientes Serverless/PaaS**: Em plataformas como **Vercel, Netlify ou Firebase App Hosting**, o sistema de arquivos é efêmero ou read-only. Isso significa que **quaisquer alterações feitas pelo painel serão perdidas** em novos deploys ou reinicializações.
*   **Recomendação para Produção Escalável**: Para um ambiente de produção robusto, é **altamente recomendado** adaptar o código para usar um banco de dados persistente (ex: Firestore, PostgreSQL, MongoDB) para armazenar os dados dinâmicos.

## Estrutura de Pastas (Principais)

```
.
├── src/
│   ├── app/                 # Rotas, layouts e Server Actions
│   │   ├── [quizSlug]/      # Rota dinâmica para exibir um quiz
│   │   ├── config/          # Rotas do painel de configuração (login, dashboard)
│   │   ├── api/             # Rotas de API (ex: /api/quiz-stats)
│   │   └── page.tsx         # Página inicial que renderiza o quiz "default"
│   ├── components/
│   │   ├── dashboard/       # Componentes específicos do painel
│   │   ├── quiz/            # Componentes do formulário de quiz
│   │   └── ui/              # Componentes ShadCN UI
│   ├── data/                # DADOS DINÂMICOS (JSON)
│   │   ├── quizzes/         # Configuração de cada quiz (.json)
│   │   ├── analytics/       # Estatísticas dos quizzes (.json)
│   │   └── whitelabel-config.json # Configurações de Whitelabel
│   ├── lib/                 # Funções utilitárias (auth, helpers)
│   ├── middleware.ts        # Protege as rotas do dashboard
│   └── types/               # Definições TypeScript
├── .env.local               # Variáveis de ambiente (NÃO versionar)
└── README.md
```
