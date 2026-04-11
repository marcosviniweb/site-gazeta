# 📚 Documentação do Backend - Gazeta

Este documento descreve o estado atual do `backend-gazeta`, incluindo tecnologias utilizadas, arquitetura e endpoints disponíveis.

## 🛠️ Tecnologias Utilizadas

- **Framework**: [NestJS](https://nestjs.com/) (v11+)
- **Linguagem**: TypeScript
- **Banco de Dados**: MySQL (utilizando [Prisma ORM](https://www.prisma.io/) v6)
- **Segurança**: 
  - [Helmet](https://helmetjs.github.io/): Proteção de headers HTTP.
  - [Passport.js](https://www.passportjs.org/): Estratégias de autenticação JWT e local.
- **Performance**:
  - [Compression](https://github.com/expressjs/compression): Compressão Gzip para payloads.
  - **Índices de Banco**: Índices otimizados para busca e ordenação de notícias/analytics.
- **Documentação**: [Swagger/OpenAPI](https://swagger.io/) (disponível em `/api`).
- **Upload de Arquivos**: [Multer](https://github.com/expressjs/multer) com armazenamento local em `uploads/`.
- **Processamento de Mídias**: 
  - [Sharp](https://sharp.pixelplumbing.com/): Otimização, redimensionamento e conversão de imagens.
  - [Fluent-ffmpeg](https://github.com/fluent-ffmpeg/node-fluent-ffmpeg): Extração de metadados, thumbnails e processamento de vídeos.

---

## 🚀 Endpoints Principais

A API utiliza o prefixo global `/api`. Abaixo estão os principais módulos e suas rotas:

### 📰 Notícias (`/api/news`)
*Módulo modularizado para escalabilidade:*

#### 🔹 News Core
- `POST /api/news`: Criação de notícia com suporte a múltiplas categorias e tags.
- `PATCH /api/news/:id`: Atualização de dados centrais e conteúdo.
- `GET /api/news/:id`: Detalhes completos da notícia para edição.

#### 🔹 News Query (Público/Busca)
- `GET /api/news`: Lista notícias com paginação robusta e filtros.
- `GET /api/news/search`: Busca textual server-side.
- `GET /api/news/slug/:slug`: Recuperação de notícia por slug amigável (Frontend).
- `GET /api/news/public/latest`: Últimas notícias formatadas para o portal.

#### 🔹 News Status & Admin
- `PATCH /api/news/:id/status`: Alterar visibilidade (`ACTIVE`, `INACTIVE`, `TRASH`).
- `PATCH /api/news/:id/emphasis`: Alternar destaque na home.
- `DELETE /api/news/:id`: Movimentação para lixeira ou exclusão permanente.

#### 🔹 News Bulk Actions (Lote)
- `PATCH /api/news/bulk/status`: Alterar status de múltiplas notícias simultaneamente.
- `PATCH /api/news/bulk/emphasis`: Alterar destaque de múltiplas notícias.
- `DELETE /api/news/bulk/delete`: Exclusão física permanente em lote.

#### 🔹 News Analytics
- Métricas integradas de visualização por notícia.

### 📁 Categorias (`/api/categories`)
- `GET /api/categories`: Lista todas as categorias.
- `GET /api/categories/active`: Lista categorias ativas.
- `POST /api/categories`: Criar nova categoria.
- `PUT /api/categories/:id`: Editar categoria.

### 🔐 Autenticação (`/api/auth`)
- `POST /api/auth/login`: Autenticação e geração de token JWT.
- `GET /api/auth/profile`: Dados do usuário logado.

### 🎥 Vídeos (`/api/videos`)
*Gerenciamento avançado de galeria:*
- `GET /api/videos`: Listagem paginada com filtros de categoria e busca.
- `POST /api/videos/upload`: Upload de vídeo + thumbnail (calcula duração automaticamente).
- `PATCH /api/videos/:id/upload`: Atualização de arquivos de mídia.
- `GET /api/videos/featured`: Lista apenas vídeos em destaque.
- `GET /api/videos/latest`: Retorna os vídeos mais recentes (excluindo destaques).
- `GET /api/videos/by-category`: Vídeos agrupados para seções do site.
- `PATCH /api/videos/bulk/featured`: Alternar destaque de múltiplos vídeos.
- `DELETE /api/videos/bulk/delete`: Exclusão física permanente em lote.

### 📊 Analytics (`/api/analytics`)
*Sistema de inteligência e monitoramento:*
- `POST /api/analytics/track-view`: Tracking de visualizações (Público).
- `GET /api/analytics/kpis`: Indicadores de performance (Admin).
- `GET /api/analytics/access-series`: Dados temporais de tráfego.
- `GET /api/analytics/top-news`: Ranking de notícias mais lidas.
- `GET /api/analytics/activities`: Log de auditoria de ações administrativas.

### 🖼️ Mídias e Conteúdo
- `/api/media`: Gerenciamento de biblioteca de imagens (mídias destacadas).
- `/api/content-media`: Upload direto de imagens/vídeos para o corpo das notícias.
- `/api/news-videos`: Gerenciamento de vínculos vídeo-notícia.

### ⚙️ Configurações e Menu
- `/api/config`: Configurações dinâmicas de layout e SEO.
- `/api/menu`: Gerenciamento de menus multinível e ordenação.
- `/api/advertisements`: Gestão de banners e espaços publicitários.

---

## 📂 Estrutura de Arquivos Estáticos

O servidor serve arquivos estáticos localizados na pasta `uploads/` da raiz do projeto:
- **Imagens**: Otimizadas via middleware.
- **Vídeos**: Suporte a *Range Requests* (streaming progressivo) e headers de cache específicos.

---

## 🛠️ Comandos Úteis

- **Gerar Cliente Prisma**: `npx prisma generate --schema=apps/backend-gazeta/prisma/schema.prisma`
- **Sincronizar Banco de Dados**: `npx prisma db push --schema=apps/backend-gazeta/prisma/schema.prisma`
- **Executar em Desenvolvimento**: `npx nx serve backend-gazeta`
