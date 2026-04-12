import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { SocialMediaComponent } from './social-media/social-media.component';
import { HomeConfigComponent } from './home-config/home-config.component';
import { MaintenanceComponent } from './maintenance/maintenance.component';
import { MediaCleanupComponent } from './media-cleanup/media-cleanup.component';

@Component({
  selector: 'app-config',
  standalone: true,
  imports: [CommonModule, SocialMediaComponent, HomeConfigComponent, MaintenanceComponent, MediaCleanupComponent, MatIconModule],
  templateUrl: './config.component.html',
  styleUrl: './config.component.scss',
})
export class ConfigComponent {
  activeTab: 'social-media' | 'home-config' | 'maintenance' | 'media-cleanup' = 'social-media';
  user = localStorage.getItem('user');

  setActiveTab(tab: 'social-media' | 'home-config' | 'maintenance' | 'media-cleanup') {
    this.activeTab = tab;
  }
}
