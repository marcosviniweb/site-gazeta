export interface InternalRoute {
  path: string;
  label: string;
}

export const MENU_INTERNAL_ROUTES: InternalRoute[] = [
  { path: '/', label: 'Home' },
  { path: '/noticias', label: 'Notícias' },
  { path: '/videos', label: 'Vídeos' },
  { path: '/videosList', label: 'Lista de Vídeos' },
  { path: '/users', label: 'Usuários' },
  { path: '/config', label: 'Configurações' },
  { path: '/ads', label: 'Anúncios' },
  { path: '/adsList', label: 'Lista de Anúncios' },
  { path: '/sobre', label: 'Sobre' },
  { path: '/contato', label: 'Contato' },
];
