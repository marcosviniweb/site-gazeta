# Tarefas de Implementação: Mapeamento e Correção de Endpoints

## Onda 1: Backend Foundation (backend-specialist)
- [x] Refatorar `NewsVideoController` para suporte a JSON e boas práticas NestJS
- [x] Padronizar Enums de `NewsStatus` e garantir validação case-insensitive no backend
- [x] Migrar lógica de limite de destaques (6 itens) para o `NewsCoreService` (Atômico via Prisma)
- [x] Aplicar `nestjs-best-practices` nos controllers afetados (NewsVideoController, etc)

## Onda 2: Painel Core (frontend-specialist)
- [x] Refatorar `NewsService` para enviar payload JSON de vídeos compatível com o backend
- [x] Otimizar upload de mídias para envio em paralelo (Performance)
- [x] Implementar navegação de Lixeira (Tabs: Ativas, Inativas, Lixeira) no NewsList
- [x] Implementar ações de Restaurar e Excluir Permanente no Painel
- [x] Atualizar formulário de Notícias para delegar controle de destaque ao Backend

## Onda 3: Verificação e Testes (test-engineer)
- [x] Criar testes unitários para a nova lógica de destaques no Backend
- [x] Criar suite de testes E2E com Playwright para fluxo de criação de notícia completo
- [x] Verificar integridade das conexões e builds (Backend Build & Painel Lint)

## Onda 4: Finalização
- [x] Auditoria de design UX no painel (6 pilares)
- [x] Documentação técnica das alterações em `BACKEND_DOCS.md`
