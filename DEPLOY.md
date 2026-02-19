
# Guia de Implantação (Deployment) - VMware / Linux

Este guia descreve como implantar o **SaaS FTTX Manager** em um servidor de produção (Ubuntu Server recomendado) rodando no VMware, utilizando Docker.

## Especificações Recomendadas para a VM
- **Processador (vCPU)**: 2 Núcleos ou mais.
- **Memória RAM**: 4 GB (Mínimo), 8 GB (Recomendado).
- **Armazenamento**: 50 GB SSD (para o sistema e banco de dados).
- **Sistema Operacional**: Ubuntu Server 22.04 LTS ou 24.04 LTS forjado para produção.
- **Rede**: IP Fixo (Static IP) configurado na VM.

## Pré-requisitos de Software
- **Docker Engine** e **Docker Compose** (Plugin).
- **VMware Tools** (`open-vm-tools`) para melhor performance e gerenciamento.


## Passos para Instalação

### 1. Preparação do Servidor (VM)

Após instalar o Ubuntu Server na VM:

1.  **Atualizar o sistema**:
    ```bash
    sudo apt update && sudo apt upgrade -y
    ```

2.  **Instalar ferramentas do VMware**:
    ```bash
    sudo apt install open-vm-tools -y
    ```
    *Isso melhora o mouse, vídeo e permite que o VMware gerencie o desligamento correto da VM.*

3.  **Instalar Docker**:
    (Método rápido via script oficial)
    ```bash
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    # Adicionar seu usuário ao grupo docker (para não usar sudo sempre)
    sudo usermod -aG docker $USER
    newgrp docker
    ```

### 2. Preparar a Aplicação
Na sua máquina de desenvolvimento, verifique se os arquivos `Dockerfile` e `docker-compose.yml` estão salvos e atualizados.

### 3. Transferir Arquivos para a VM
Você pode copiar a pasta do projeto para a VM via SCP ou clonar do seu repositório Git (recomendado).

**Método via Git:**
```bash
# Na VM:
git clone <seu-repositorio-git> fttx-manager
cd fttx-manager
```

### 3. Configurar e Rodar
Na pasta do projeto dentro da VM:

1.  **Criar pasta de dados**:
    ```bash
    mkdir data
    ```
    *Dica: Se quiser manter seus dados atuais, copie o arquivo `server/db.sqlite` do seu PC para a pasta `data/` na VM (renomeando para `db.sqlite`).*

2.  **Iniciar o Sistema**:
    ```bash
    docker compose up -d --build
    ```
    Isso vai baixar as dependências, compilar o sistema e iniciar os containers e segundo plano.

3.  **Verificar Status**:
    ```bash
    docker compose ps
    ```
    Você deve ver `fttx-server` e `fttx-client` com status "Up".

### 4. Acessar o Sistema
Abra o navegador no seu PC e digite o IP da VM:
`http://<IP-DA-VM>`

O sistema deve carregar a tela de login.

---

## Comandos Úteis

- **Parar o sistema**: `docker compose down`
- **Ver logs em tempo real**: `docker compose logs -f`

### Como Atualizar o Sistema (Aplicar Correções)
Sempre que eu (a IA) ou você fizermos melhorias no código, siga estes passos na VM para aplicar:

1.  **Baixar as mudanças**:
    ```bash
    git pull
    ```

2.  **Recriar os containers (com a nova versão)**:
    ```bash
    docker compose up -d --build
    ```
    *Isso vai garantir que todas as alterações (frontend, backend e configurações) sejam aplicadas.*
