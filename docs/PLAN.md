# Plano de Mapeamento e Correção de Endpoints

## 🎼 Orchestration Report

### Task
Mapear todos os endpoints do `backend-gazeta`, verificar o consumo no `painel-gazeta`, identificar bugs e propor um plano de correção com testes.

### Status Atual
- Pesquisa concluída (Análise estática de controllers e serviços).
- Identificados desalinhamentos em DTOs, Enums e fluxos de negócio duplicados.

---

## 🔍 Mapeamento de Endpoints e Conexões

### 1. Módulo de Notícias (`/api/news`)
- **Backend**: Dividido em Core, Query, Status e Analytics.
- **Painel**: Consome via `NewsService`.
- **Potenciais Bugs**:
  - **Enums de Status**: Backend espera `ACTIVE`, `INACTIVE`, `TRASH`. Painel usa strings que podem divergir em caixa (case-sensitivity).
  - **Destaque (Emphasis)**: Painel gerencia o limite de 6 destaques manualmente buscando todos os destaques e removendo o mais antigo. Isso pode causar condições de corrida (race conditions) entre múltiplos usuários.
  - **Trash (Lixeira)**: Backend possui suporte completo para lixeira, mas o painel não tem interface para visualizar ou restaurar itens do lixo.

### 2. Módulo de Mídias (`/api/media`)
- **Backend**: Processa uploads via Sharp.
- **Painel**: Consome via `NewsService` (chamadas delegadas).
- **Potenciais Bugs**:
  - **Upload de Mídia**: Painel envia `emphasis` como string `'true'`/`'false'`. Backend converte, mas não há validação robusta de tipos no FormData.
  - **Fluxo de Upload**: O painel faz upload de mídias uma por uma após salvar a notícia. Se uma falhar, a notícia fica incompleta. O backend suporta `upload-multiple`, mas o painel não utiliza.

### 3. Módulo de Vídeos de Notícias (`/api/news-videos`)
- **Backend**: `NewsVideoController.create` espera JSON `CreateNewsVideoDto`.
- **Painel**: `NewsService.addVideo` envia `FormData`. **[BUG CRÍTICO IDENTIFICADO]** - O backend não está configurado para receber FormData nesse endpoint específico, resultando em erro 400 ou corpo vazio.

### 4. Módulo de Vídeos Galeria (`/api/videos`)
- **Backend**: Suporte a upload de vídeo e thumbnail, cálculo automático de duração.
- **Painel**: Consome via `VideoService`.
- **Potenciais Bugs**:
  - Sincronização de tags e categorias entre o JSON enviado e o que o backend espera (strings vs numbers).

---

## 🛠️ Plano de Correção Sugerido

### Fase 1: Correções Críticas (Backend & Frontend)
1. **Padronização de Vídeos**: Alterar `NewsVideoController` para aceitar `FormData` se for necessário upload, ou ajustar o Painel para enviar JSON (já que são apenas links).
2. **Robustez de Enums**: Garantir que o Painel utilize os Enums compartilhados (ou strings idênticas) e o Backend faça `.toUpperCase()` antes da validação.
3. **Upload Múltiplo**: Refatorar o upload de mídias no painel para usar o endpoint `upload-multiple`, reduzindo o número de requisições e garantindo atomicidade.

### Fase 2: Novas Funcionalidades e Melhorias
1. **Interface de Lixeira**: Criar página no painel para listar notícias com status `TRASH` e permitir restauração/exclusão permanente.
2. **Lógica de Destaque**: Mover a lógica de "remover o mais antigo" para o backend, garantindo que o limite de 6 seja respeitado de forma atômica.

### Fase 3: Verificação e Testes
1. **Testes de Integração**: Criar scripts de teste (Playwright) que simulem o fluxo completo:
   - Criar Notícia -> Upload Mídias -> Publicar -> Verificar na Home.
   - Mover para Lixeira -> Restaurar.
2. **Validação de Payload**: Implementar testes unitários no backend para garantir que todos os DTOs rejeitem dados malformados do painel.

---

## 🚀 Próximos Passos (Após Aprovação)

1. **Backend Specialist**: Ajustar `NewsVideoController` e implementar lógica de destaque no `NewsCoreService`.
2. **Frontend Specialist**: Implementar UI da Lixeira e refatorar `NewsService` para upload múltiplo.
3. **Test Engineer**: Criar suite de testes E2E para cobrir os fluxos corrigidos.

✅ Plano criado e aguardando aprovação.
