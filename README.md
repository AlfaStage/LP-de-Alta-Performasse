
# Quiz Interativo Ice Lazer para Qualificação de Leads

Este projeto é uma aplicação web construída com Next.js, projetada para qualificar leads para tratamentos de depilação a laser da Ice Lazer através de um quiz interativo. Ele coleta respostas, informações de contato e integra-se com o Facebook Pixel para rastreamento de eventos e otimização de campanhas.

## Funcionalidades Principais

*   **Quiz Interativo:** Múltiplas etapas com diferentes tipos de perguntas (escolha única, múltipla escolha, campos de texto).
*   **Lógica Condicional:** Algumas perguntas aparecem com base nas respostas anteriores.
*   **Coleta de Leads:** Coleta nome completo e WhatsApp ao final do quiz.
*   **Integração com Webhooks:**
    *   Envia os dados completos do quiz para um webhook após a submissão.
    *   Envia dados de abandono do quiz para um webhook (usando `navigator.sendBeacon` e Server Action).
*   **Rastreamento com Facebook Pixel:**
    *   Suporte para múltiplos IDs de Pixel do Facebook.
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
    # Webhook para ser usado pelo navigator.sendBeacon no QuizForm.tsx (client-side)
    # Deve ser prefixado com NEXT_PUBLIC_ para ser acessível no browser.
    NEXT_PUBLIC_QUIZ_ABANDONMENT_WEBHOOK_URL="SUA_URL_DE_WEBHOOK_PARA_ABANDONO_CLIENT_SIDE"

    # Webhook para ser usado pela Server Action logQuizAbandonment (server-side)
    # Não precisa do prefixo NEXT_PUBLIC_ se for usado apenas no servidor.
    # Se for a mesma URL, você pode definir ambas.
    QUIZ_ABANDONMENT_WEBHOOK_URL="SUA_URL_DE_WEBHOOK_PARA_ABANDONO_SERVER_SIDE"

    # (Opcional) Chave de API do Google para Genkit, se for usar funcionalidades de IA.
    # GOOGLE_API_KEY="SUA_CHAVE_API_GOOGLE_PARA_GENKIT"
    ```

    **Importante sobre os Pixels do Facebook:**
    Os IDs dos Pixels do Facebook (`FACEBOOK_PIXEL_ID` e `FACEBOOK_PIXEL_ID_SECONDARY`) são configurados diretamente no arquivo `src/config/pixelConfig.ts`. Edite este arquivo para inserir seus IDs de Pixel.

4.  **Execute o servidor de desenvolvimento:**
    ```bash
    npm run dev
    ```
    A aplicação estará disponível em `http://localhost:9002` (conforme definido no `package.json`).

## Scripts Disponíveis

*   `npm run dev`: Inicia o servidor de desenvolvimento (Turbopack, porta 9002).
*   `npm run build`: Compila a aplicação para produção.
*   `npm run start`: Inicia um servidor de produção (após o build, porta 3000 por padrão ou 9002 se modificar o script).
*   `npm run lint`: Executa o ESLint.
*   `npm run typecheck`: Verifica os tipos com TypeScript.
*   `npm run genkit:dev`: Inicia o servidor de desenvolvimento do Genkit.
*   `npm run genkit:watch`: Inicia o servidor de desenvolvimento do Genkit com watch mode.

## Deploy em Servidor Ubuntu

Este guia detalha como implantar esta aplicação Next.js em um servidor Ubuntu utilizando Nginx como reverse proxy e PM2 para gerenciamento de processos.

### Pré-requisitos do Servidor

*   Um servidor Ubuntu (e.g., 20.04, 22.04 LTS).
*   Acesso SSH ao servidor com privilégios `sudo`.
*   Node.js (v18 ou superior) e npm instalados no servidor.
*   Nginx instalado no servidor.
*   PM2 instalado globalmente no servidor.
*   Um nome de domínio configurado para apontar para o IP do seu servidor (recomendado para SSL).

### 1. Configuração Inicial do Servidor

1.  **Acesse seu servidor via SSH:**
    ```bash
    ssh seu_usuario@ip_do_servidor
    ```

2.  **Atualize os pacotes do sistema:**
    ```bash
    sudo apt update && sudo apt upgrade -y
    ```

3.  **Instale Node.js e npm:**
    Recomenda-se usar NVM (Node Version Manager):
    ```bash
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
    ```
    Feche e reabra seu terminal SSH ou execute `source ~/.bashrc` (ou `source ~/.zshrc`).
    ```bash
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    [ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"
    nvm install --lts
    nvm use --lts
    node -v # Verifique a versão do Node
    npm -v  # Verifique a versão do npm
    ```

4.  **Instale Nginx:**
    ```bash
    sudo apt install nginx -y
    ```
    Se você usa o firewall UFW, permita o tráfego Nginx:
    ```bash
    sudo ufw allow 'Nginx Full'
    sudo ufw enable # Se ainda não estiver habilitado
    sudo ufw status
    ```

5.  **Instale PM2:**
    PM2 é um gerenciador de processos para aplicações Node.js.
    ```bash
    sudo npm install pm2 -g
    ```

### 2. Deploy da Aplicação

1.  **Clone o repositório no servidor:**
    Escolha um diretório para sua aplicação (ex: `/var/www/`).
    ```bash
    sudo mkdir -p /var/www/ice-lazer-quiz
    sudo chown -R $USER:$USER /var/www/ice-lazer-quiz # Dê permissão ao seu usuário atual
    cd /var/www/ice-lazer-quiz
    git clone <URL_DO_SEU_REPOSITORIO_GIT> . # O '.' clona no diretório atual
    ```

2.  **Instale as dependências do projeto:**
    ```bash
    npm install
    ```

3.  **Configure as Variáveis de Ambiente para Produção:**
    Crie e edite o arquivo `.env.local` no diretório `/var/www/ice-lazer-quiz`:
    ```bash
    nano .env.local
    ```
    Adicione as variáveis necessárias (substitua pelos seus valores de produção):
    ```env
    NEXT_PUBLIC_QUIZ_ABANDONMENT_WEBHOOK_URL="SUA_URL_DE_WEBHOOK_PRODUCAO_PARA_ABANDONO_CLIENT_SIDE"
    QUIZ_ABANDONMENT_WEBHOOK_URL="SUA_URL_DE_WEBHOOK_PRODUCAO_PARA_ABANDONO_SERVER_SIDE"
    NODE_ENV=production
    # Outras variáveis específicas de produção, se houver
    ```
    Lembre-se de que os IDs do Facebook Pixel são configurados em `src/config/pixelConfig.ts`. Se forem diferentes para produção, atualize-os antes do build.

4.  **Faça o build da aplicação Next.js:**
    ```bash
    npm run build
    ```
    Isso criará a pasta `.next` com os arquivos otimizados para produção.

### 3. Configurar Nginx como Reverse Proxy

Nginx irá escutar nas portas 80 (HTTP) e 443 (HTTPS) e encaminhar o tráfego para sua aplicação Next.js.

1.  **Crie um arquivo de configuração do Nginx para seu site:**
    Substitua `seudominio.com` pelo seu nome de domínio.
    ```bash
    sudo nano /etc/nginx/sites-available/seudominio.com
    ```

2.  **Cole a seguinte configuração no arquivo:**
    O script `npm run start` (que é `next start`) por padrão roda na porta 3000.
    ```nginx
    server {
        listen 80;
        listen [::]:80;

        server_name seudominio.com www.seudominio.com; # Substitua pelo seu domínio

        # Para logs (opcional, mas útil)
        access_log /var/log/nginx/seudominio.com.access.log;
        error_log /var/log/nginx/seudominio.com.error.log;

        location / {
            proxy_pass http://localhost:3000; # Porta padrão do 'next start'
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }

        # Otimização para servir arquivos estáticos do Next.js diretamente pelo Nginx
        location /_next/static {
            alias /var/www/ice-lazer-quiz/.next/static;
            expires 1y;
            access_log off;
        }

        location ~ ^/_next/image {
            proxy_pass http://localhost:3000; # Deixe o Next.js lidar com a otimização de imagens
            proxy_set_header Host $host;
        }
    }
    ```
    **Nota:** Se você modificar o script `start` no `package.json` para usar uma porta diferente (ex: `next start -p 9002`), ajuste `proxy_pass http://localhost:3000;` para `proxy_pass http://localhost:9002;`.

3.  **Crie um link simbólico para habilitar o site:**
    ```bash
    sudo ln -s /etc/nginx/sites-available/seudominio.com /etc/nginx/sites-enabled/
    ```

4.  **Teste a configuração do Nginx:**
    ```bash
    sudo nginx -t
    ```
    Se mostrar "syntax is ok" e "test is successful", prossiga.

5.  **Reinicie o Nginx:**
    ```bash
    sudo systemctl restart nginx
    ```

### 4. Gerenciar a Aplicação com PM2

1.  **Inicie sua aplicação Next.js com PM2:**
    Navegue até o diretório da sua aplicação (`/var/www/ice-lazer-quiz`).
    ```bash
    # O comando 'npm run start' será executado.
    # 'next start' por padrão usa a porta 3000.
    pm2 start npm --name "ice-lazer-quiz" -- run start
    ```
    Se você modificou o script `start` no `package.json` para `"start": "next start -p 9002"`:
    ```bash
    # pm2 start npm --name "ice-lazer-quiz" -- run start
    # Ou diretamente:
    # pm2 start "next start -p 9002" --name "ice-lazer-quiz"
    ```


2.  **Configure PM2 para iniciar na inicialização do sistema:**
    ```bash
    pm2 startup systemd
    ```
    PM2 fornecerá um comando para você executar com `sudo`. Copie e execute-o.

3.  **Salve a configuração atual do PM2:**
    ```bash
    pm2 save
    ```

4.  **Comandos úteis do PM2:**
    *   `pm2 list`: Lista todos os processos.
    *   `pm2 logs ice-lazer-quiz`: Mostra os logs da aplicação.
    *   `pm2 monit`: Interface de monitoramento no terminal.
    *   `pm2 restart ice-lazer-quiz`: Reinicia a aplicação.
    *   `pm2 stop ice-lazer-quiz`: Para a aplicação.
    *   `pm2 delete ice-lazer-quiz`: Remove a aplicação do PM2.

Sua aplicação Next.js deve estar acessível através do seu nome de domínio.

### 5. (Opcional mas Recomendado) Configurar SSL com Let's Encrypt

1.  **Instale o Certbot e o plugin Nginx do Certbot:**
    ```bash
    sudo apt install certbot python3-certbot-nginx -y
    ```

2.  **Obtenha e instale um certificado SSL:**
    Substitua `seudominio.com` e `www.seudominio.com` pelos seus.
    ```bash
    sudo certbot --nginx -d seudominio.com -d www.seudominio.com
    ```
    Siga as instruções na tela. O Certbot modificará automaticamente sua configuração Nginx para HTTPS e configurará a renovação automática.

3.  **Verifique a renovação automática:**
    ```bash
    sudo certbot renew --dry-run
    ```

### Manutenção e Atualizações da Aplicação

1.  **Acesse o diretório da aplicação:**
    ```bash
    cd /var/www/ice-lazer-quiz
    ```
2.  **(Opcional) Pare a aplicação para evitar conflitos:**
    ```bash
    pm2 stop ice-lazer-quiz
    ```
3.  **Puxe as últimas alterações do seu repositório Git:**
    ```bash
    git pull origin main # Ou sua branch principal
    ```
4.  **Reinstale as dependências (se houver alterações no `package.json`):**
    ```bash
    npm install
    ```
5.  **Refaça o build da aplicação:**
    ```bash
    npm run build
    ```
6.  **Reinicie a aplicação com PM2:**
    ```bash
    pm2 restart ice-lazer-quiz
    ```

## Estrutura de Pastas (Principais)

```
.
├── public/              # Arquivos estáticos (ex: favicon.ico, images)
├── src/
│   ├── app/             # Rotas do App Router (páginas, layouts, actions)
│   │   ├── globals.css  # Estilos globais e variáveis de tema ShadCN/Tailwind
│   │   ├── layout.tsx   # Layout raiz da aplicação
│   │   ├── page.tsx     # Componente da página inicial (geralmente /)
│   │   └── actions.ts   # Server Actions (ex: submitQuizData, logQuizAbandonment)
│   ├── components/      # Componentes React reutilizáveis
│   │   ├── quiz/        # Componentes específicos do Quiz (QuizForm, QuizProgressBar)
│   │   ├── ui/          # Componentes ShadCN UI (Button, Card, Input, etc.)
│   │   └── FacebookPixelScript.tsx # Script para carregar e inicializar o FB Pixel
│   ├── config/          # Arquivos de configuração da aplicação
│   │   ├── pixelConfig.ts # Configuração dos IDs do Facebook Pixel e lógica relacionada
│   │   └── quizConfig.ts  # Definições das perguntas, opções e lógica do quiz
│   ├── hooks/           # Hooks React customizados
│   │   ├── use-mobile.tsx # Hook para detectar se o dispositivo é móvel
│   │   └── use-toast.ts   # Hook para gerenciar notificações (toasts)
│   ├── lib/             # Funções utilitárias e bibliotecas auxiliares
│   │   ├── fpixel.ts    # Funções wrapper para interagir com o Facebook Pixel
│   │   └── utils.ts     # Utilitários gerais (ex: cn para classnames)
│   └── ai/              # Funcionalidades de Inteligência Artificial com Genkit
│       ├── genkit.ts    # Configuração e inicialização do Genkit e plugins
│       └── dev.ts       # Ponto de entrada para desenvolvimento de flows Genkit
├── .env.local           # Arquivo para variáveis de ambiente locais (NÃO versionar)
├── .gitignore           # Arquivos e pastas ignorados pelo Git
├── next.config.ts       # Configurações específicas do Next.js
├── package.json         # Metadados do projeto, dependências e scripts
├── tailwind.config.ts   # Configuração do Tailwind CSS
└── tsconfig.json        # Configuração do compilador TypeScript
```

## Contribuição

Se desejar contribuir com o projeto, por favor, siga estas etapas:
1.  Faça um fork do repositório.
2.  Crie uma nova branch (`git checkout -b feature/sua-feature`).
3.  Faça commit das suas alterações (`git commit -am 'Adiciona nova feature'`).
4.  Envie para a branch (`git push origin feature/sua-feature`).
5.  Crie um novo Pull Request.

Por favor, certifique-se de que seu código segue os padrões de linting e que os testes (se aplicável) passam.

## Licença

Este projeto é de propriedade privada. Todos os direitos reservados.
(Ou especifique sua licença, e.g., MIT License, se for open source)
```