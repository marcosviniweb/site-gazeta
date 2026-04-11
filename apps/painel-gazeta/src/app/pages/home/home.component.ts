import { Component, inject } from '@angular/core';


import { SidebarComponent } from '@site-gazeta/sidebar';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-home',
  imports: [SidebarComponent, RouterModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})

export class HomeComponent {
  authService = inject(AuthService);
  route = inject(ActivatedRoute);
  menuItems = [
    { name: 'Metricas', routerLink: '/', type: 'internal', icon: 'insights'},
    { name: 'Menu', routerLink: 'menu', type: 'internal', icon: 'menu_open'},
    { name: 'Categorias', routerLink: 'category', type: 'internal', icon: 'category'},
    { name: 'Notícias', routerLink: 'news', type: 'submenu', icon: 'newspaper', children:[
      { name: 'Criar Notícia', routerLink: 'news', type: 'internal' },
      { name:'Lista de Notícias', routerLink: 'newsList', type: 'internal'}
    ]},
    { name: 'Vídeos', routerLink: 'videos', type: 'submenu', icon: 'play_circle', children:[
      { name: 'Upload de Vídeo', routerLink: 'videos', type: 'internal' },
      { name:'Lista de Vídeos', routerLink: 'videosList', type: 'internal'}
    ]},
    { name: 'Anúncios', routerLink: 'ads', type: 'submenu', icon: 'ads_click', children:[
      { name: 'Criar Anúncio', routerLink: 'ads', type: 'internal' },
      { name:'Lista de Anúncios', routerLink: 'adsList', type: 'internal'}
    ]},
    // { name: 'Usuários', routerLink: 'users'},
    { name: 'Configurações', routerLink: 'config', type: 'internal', icon: 'settings' },
  ]
  logout(){
    this.authService.logout();
  }
}
