# Brainstorm e Plano: Filtros de Paginação e Controle em Massa

Ao implementar a paginação real via Backend na lista de notícias, os nossos componentes de filtros (que antes filtravam localmente todo o array) deixaram de funcionar porque os endpoints da API (NestJS) não estão programados para receber e processar os `QueryParams` complementares como categoria, data, ou views.

Abaixo, trago o **Brainstorm** solicitado para resolução deste impasse.

---

## 🧠 Brainstorm: Resolução de Filtros Paginados

### Opção A: Full Server-Side Filtering (Recomendado)
Extender os DTOs do backend (`NewsQueryDto`, etc.) para aceitarem **todos** os parâmetros de filtro originados pelo Painel (ex: `categoryId`, `order`, `views`, `date`). A API irá injetar estes parâmetros de forma segura diretamente na `WhereCondition` do Prisma, e efetuará apenas o corte de paginação (Take/Skip) *após* as condições de filtragem.

✅ **Prós:**
- A fonte da verdade permanece exata.
- Atinge escalabilidade e performance (funciona igualmente se o banco for de 100 ou 10.000 itens).
- O Frontend não é sobrecarregado com dados desnecessários.

❌ **Contras:**
- Modificações exigidas em múltiplas camadas do backend (Controller, DTO e Service Prisma).

📊 **Esforço:** Alto / Moderado

---

### Opção B: Client-Side Virtual Pagination (Híbrido)
Alterar temporariamente a chamada da listagem para retornar um lote ilimitado ou absurdamente grande (`limit=9999`) e delegar todo o trabalho cirúrgico ao Frontend. O Angular manteria os filtros rodando estritamente _in-memory_, separando visualmente o grande array em pedaços de 25 no Client.

✅ **Prós:**
- Zero necessidade de alterações na Query base do Prisma/Backend.

❌ **Contras:**
- Subverte todo o propósito de existir um sistema de paginação, gerando latência na consulta do SQL, inflação no tamanho do pacote de rede e eventuais leaks de memória no browser do admin.

📊 **Esforço:** Muito Baixo

---

## 💡 Recomendação
**Opção A**. Embora custe mais trabalho braçal em Back/Front, asseguramos um código maduro, otimizado e arquiteturalmente robusto para escala. Um painel "peso-pesado" é um péssimo trade-off apenas para poupar o esforço de definir query strings.

---
---

## 🛠️ Plano de Ação & Implementação

Tendo a resolução aprovada, daremos seguimento na construção sistemática para a padronização das ferramentas em massa.

### 1. Backend: Ampliação dos DTOs e Prisma Queries (Filtros)
#### [MODIFY] `apps/backend-gazeta/src/news/dto/news-query.dto.ts`
- Introduzir campos de `categoryId`, `order`, etc.
#### [MODIFY] `apps/backend-gazeta/src/news/query/news-query.service.ts`
- Injetar no `buildWhereCondition()` e orderBy do prisma as condições baseadas no DTO atualizado.

*(O mesmo processo será revisado e atualizado posteriormente para os DTOs e Services de Video e Ads para garantir busca paginada com os filtros de categorias/destaques operantes nestas áreas também).*

### 2. Frontend: Componentes Genéricos de Seleção em Massa
#### [MODIFY] `apps/painel-gazeta/src/app/pages/videos/video-list/video-list.component.ts` (E `ads-list.component.ts`)
- Adicionaremos **Signals de Seleção** (`selectedIds`, `isProcessing`, `processingProgress`) e suas funções nativas (`toggleSelectAll`, `toggleSelection`, `clearSelection`) aos _components_, copiando o excelente modelo que arquitetamos nas Notícias.
- Injeção das funções `bulkDelete()`, e `bulkUpdateStatus()`. Note que usaremos métodos sequenciais robustos com tratamento `concatMap` sobre RXJS para precaver *overloads*.

#### [MODIFY] `apps/painel-gazeta/src/app/pages/videos/video-list/video-list.component.html` (E `ads-list.component.html`)
- Atualizar a UI da Tabela incluindo `<th>` e `<td>` no formato Checkbox iterada.
- Adicionar no Header o `<div class="bulk-actions-toolbar">` com estatísticas dinâmicas (ex.: `"2 itens selecionados"`) e botões de massa (Alterar Rápido / Excluir Tudo) exatamente como construído para a lista de Notícias.
