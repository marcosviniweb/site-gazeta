import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { CategoryConfigComponent } from './category-config/category-config.component';
import { CarouselConfigComponent } from './carousel-config/carousel-config.component';

@Component({
  selector: 'app-home-config',
  standalone: true,
  imports: [CommonModule, CategoryConfigComponent, CarouselConfigComponent, MatIconModule],
  templateUrl: './home-config.component.html',
  styleUrl: './home-config.component.scss',
})
export class HomeConfigComponent {
  // Componente simplificado - cada sub-componente gerencia seu próprio salvamento
}
