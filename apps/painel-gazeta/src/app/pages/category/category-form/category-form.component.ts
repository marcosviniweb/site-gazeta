import { tap } from 'rxjs';
import { Component,  inject, input, output, signal, computed, effect } from '@angular/core';

import { NonNullableFormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { Category, HexColor, isValidHexColor } from '@site-gazeta/models';
import { CategoryService } from '../../../core/services/category.service';
import { ColorPickerComponent } from '@site-gazeta/color-picker';

@Component({
  selector: 'app-category-form',
  imports: [ReactiveFormsModule, ColorPickerComponent, MatIconModule],
  templateUrl: './category-form.component.html',
  styleUrl: './category-form.component.scss',
})
export class CategoryFormComponent {
  fb = inject(NonNullableFormBuilder);
  categoryService = inject(CategoryService);
  editingCategory = input(null, {transform: (category: Category | null) => {
    if(category){
      this.setEditingCategory(category);
    }else{
      this.setEditingCategory(null);
    }
    return category;
  }});
  usedColors = input<HexColor[]>([]);
  isEditing = signal(false);
  categorySubmit = output<Category>();
  cancelEdit = output<void>();
  
  // Color picker state
  selectedColor = signal<HexColor>('#3b82f6');
  
  // Effect para atualizar cor quando usedColors mudar (inicialização e mudanças)
  private colorUpdateEffect = effect(() => {
    const used = this.usedColors();
    const editing = this.editingCategory();
    
    // Se não está editando, garantir que a cor selecionada está disponível
    if (!editing) {
      const currentColor = this.selectedColor();
      // Se a cor atual está em uso ou se é a inicialização (cor padrão), selecionar uma disponível
      if (used.includes(currentColor) || (currentColor === '#3b82f6' && used.length > 0)) {
        this.selectAvailableColor();
      }
    }
  });
  
  // Predefined colors (same as color picker)
  private predefinedColors: HexColor[] = [
    '#ef4444', // red-500
    '#f97316', // orange-500
    '#eab308', // yellow-500
    '#22c55e', // green-500
    '#06b6d4', // cyan-500
    '#3b82f6', // blue-500
    '#8b5cf6', // violet-500
    '#ec4899', // pink-500
    '#6b7280', // gray-500
    '#1f2937', // gray-800
    '#dc2626', // red-600
    '#ea580c', // orange-600
    '#ca8a04', // yellow-600
    '#16a34a', // green-600
    '#0891b2', // cyan-600
    '#2563eb', // blue-600
    '#7c3aed', // violet-600
    '#db2777', // pink-600
    '#4b5563', // gray-600
    '#111827', // gray-900
  ];

  form = this.fb.group({
    name: ['', Validators.required],
    description: ['',],
    slug: [''],
    isActive: [true]
  });
  
  // Computed property to check if current color is available
  isColorAvailable = computed(() => {
    const currentColor = this.selectedColor();
    const used = this.usedColors();
    const editingCategory = this.editingCategory();
    
    // If editing, exclude the current category's color from used colors
    if (editingCategory) {
      const usedWithoutCurrent = used.filter(color => color !== editingCategory.color);
      return !usedWithoutCurrent.includes(currentColor);
    }
    
    // Otherwise, check if color is not used
    return !used.includes(currentColor);
  });
  
 
  setEditingCategory(category: Category | null) {
    if(category){
      this.form.patchValue({
        name: category.name,
        description: category.description,
        isActive: category.isActive,
        slug: category.slug
      });
      this.selectedColor.set(category.color as HexColor);
      this.isEditing.set(true);
    }else{
      this.form.reset({ isActive: true });
      // Selecionar uma cor disponível ao invés de uma cor fixa
      this.selectAvailableColor();
      this.isEditing.set(false);
    }
  }
  
  onColorChange(color: HexColor) {
    this.selectedColor.set(color);
  }
 

  onSubmit() {
    if (this.form.valid && this.isColorAvailable()) {
      const formValue = this.form.value;
      const categoryData: Category = {
        name: formValue.name as string,
        description: formValue.description as string,
        slug: this.generateSlug(formValue.name as string),
        isActive: formValue.isActive,
        color: this.selectedColor()
      };

      if (this.isEditing()) {
        categoryData.id = this.editingCategory()?.id as number;
        
        this.categoryService.update(categoryData.id, categoryData)
        .pipe(
          tap(()=> console.log('passou aqui'))
        )
        .subscribe({
          next: (res) => {
            this.categorySubmit.emit(res as Category);
            // Após editar, selecionar uma cor disponível
            this.selectAvailableColor();
            this.setEditingCategory(null);
            this.form.reset({ isActive: true });
          },
          error:(error)=>{
            throw error
          }
        });
      }else{
      this.categoryService.create(categoryData)
      .subscribe({
        next: (res) => {
          console.log(res);
          this.categorySubmit.emit(res as Category);
          // Após criar, selecionar uma cor disponível
          this.selectAvailableColor();
          this.form.reset({ isActive: true });
        },
        error: (err) => {
          console.error(err);
        }
      });
    }
    }
  }

  onCancel() {
    this.form.reset({ isActive: true });
    // Selecionar uma cor disponível ao cancelar
    this.selectAvailableColor();
    this.cancelEdit.emit();
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  /**
   * Seleciona uma cor disponível da lista de cores predefinidas
   * que não está sendo usada por outras categorias
   */
  private selectAvailableColor(): void {
    const used = this.usedColors();
    const availableColor = this.predefinedColors.find(color => !used.includes(color));
    
    if (availableColor) {
      this.selectedColor.set(availableColor);
    } else {
      // Se todas as cores predefinidas estão em uso, usar a primeira cor predefinida
      // (isso não deveria acontecer, mas é um fallback seguro)
      this.selectedColor.set(this.predefinedColors[0]);
    }
  }
}
