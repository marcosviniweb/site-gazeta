import { Directive, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CategoryService } from '../../core/services/category.service';
import { MenuService } from '../../core/services/menu.service';
import { AlertService } from '@site-gazeta/alert';
import { Category, Menu } from '@site-gazeta/models';
import { MENU_INTERNAL_ROUTES } from './menu-routes.config';

export type MenuType = 'external' | 'internal' | 'category' | 'submenu';

@Directive()
export abstract class MenuFormBase {
  protected fb = inject(FormBuilder);
  protected menuService = inject(MenuService);
  protected categoryService = inject(CategoryService);
  protected alertService = inject(AlertService);

  // Signals
  menuForm!: FormGroup;
  selectedType = signal<MenuType>('internal');
  categories = signal<Category[]>([]);
  isLoading = signal(false);
  selectedCategories = signal<Category[]>([]);

  // Rotas internas disponíveis
  internalRoutes = MENU_INTERNAL_ROUTES;

  // Opções para p-select (tipo de menu)
  typeOptions = [
    { label: 'Página Interna', value: 'internal' },
    { label: 'Link Externo', value: 'external' },
    { label: 'Categoria', value: 'category' },
    { label: 'Submenu (Agrupador)', value: 'submenu' },
  ];

  submenuTypeOptions = [
    { label: 'Página Interna', value: 'internal' },
    { label: 'Link Externo', value: 'external' },
    { label: 'Categoria', value: 'category' },
  ];

  protected initBaseForm(additionalControls: any = {}): void {
    this.menuForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      type: ['internal', Validators.required],
      routerLink: [''],
      externalLink: [''],
      categoryId: [null],
      categoryIds: [[]],
      categoryName: [''],
      slug: [''],
      order: [1],
      ...additionalControls
    });

    // Listener para mudanças no tipo
    this.menuForm.get('type')?.valueChanges.subscribe((type: MenuType) => {
      this.selectedType.set(type);
      this.updateValidators(type);

      // Limpar categorias selecionadas quando mudar de tipo
      if (type !== 'category') {
        this.selectedCategories.set([]);
      }
    });
  }

  protected updateValidators(type: MenuType): void {
    const routerLinkControl = this.menuForm.get('routerLink');
    const externalLinkControl = this.menuForm.get('externalLink');
    const categoryIdControl = this.menuForm.get('categoryId');
    const nameControl = this.menuForm.get('name');

    // Reset validators
    routerLinkControl?.clearValidators();
    externalLinkControl?.clearValidators();
    categoryIdControl?.clearValidators();

    // Apply validators based on type
    switch (type) {
      case 'internal':
        routerLinkControl?.setValidators([Validators.required]);
        nameControl?.setValidators([Validators.required, Validators.minLength(2)]);
        break;
      case 'external':
        externalLinkControl?.setValidators([Validators.required, Validators.pattern(/^https?:\/\/.+/)]);
        nameControl?.setValidators([Validators.required, Validators.minLength(2)]);
        if (this.menuForm.get('name')?.value === '' && type === 'external') {
           // allow it to be validated
        }
        break;
      case 'category':
        nameControl?.clearValidators(); // Nome virá das categorias selecionadas
        break;
      case 'submenu':
        nameControl?.setValidators([Validators.required, Validators.minLength(2)]);
        break;
    }

    routerLinkControl?.updateValueAndValidity({ emitEvent: false });
    externalLinkControl?.updateValueAndValidity({ emitEvent: false });
    categoryIdControl?.updateValueAndValidity({ emitEvent: false });
    nameControl?.updateValueAndValidity({ emitEvent: false });
  }

  protected loadCategories(): void {
    this.categoryService.getActive().subscribe({
      next: (categories) => this.categories.set(categories),
      error: (err) => console.error('Erro ao carregar categorias:', err),
    });
  }

  onCategoriesChange(categories: unknown[]): void {
    // Validar que todas as categorias têm name e slug
    const validCategories = categories.filter((c: unknown): c is Category => {
      return !!(c && (c as Category).name && (c as Category).slug);
    });
    this.selectedCategories.set(validCategories);
  }

  // Getters para validação
  get nameControl() { return this.menuForm.get('name'); }
  get routerLinkControl() { return this.menuForm.get('routerLink'); }
  get externalLinkControl() { return this.menuForm.get('externalLink'); }
  get categoryIdControl() { return this.menuForm.get('categoryId'); }

  abstract resetForm(): void;
  abstract submitForm(event?: Event): void;
}
