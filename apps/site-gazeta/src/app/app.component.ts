import { Component, inject,  signal, ChangeDetectionStrategy } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ApiService } from './core/service/api.service';
import { Ads } from '@site-gazeta/models';
@Component({
  imports: [RouterModule],
  selector: 'app-root',
  template: `
    <router-outlet></router-outlet>
  `,
  styles:[`
    :host{
      display: flex;
      flex-direction: column;
      height: 100%;
      width: 100%;
    }
  `],
  changeDetection:ChangeDetectionStrategy.OnPush
})
export class AppComponent {
  apiService = inject(ApiService);
  announcements = signal<Ads[]>([]);

  title = 'site-gazeta';
 
}
