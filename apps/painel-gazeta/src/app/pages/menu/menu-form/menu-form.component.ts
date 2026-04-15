import {
  Component,
  inject,
  signal,
  effect,
  input,
  output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MenuService } from '../../../core/services/menu.service';
import { CategoryService } from '../../../core/services/category.service';
import { Category, Menu } from '@site-gazeta/models';
import { AlertService } from '@site-gazeta/alert';
import { MultiSelectComponent } from '@site-gazeta/multi-select';
import { MatIconModule } from '@angular/material/icon';
type MenuType = 'external' | 'internal' | 'category' | 'submenu';

interface InternalRoute {
  path: string;
  label: string;
}

@Component({
  selector: 'app-menu-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MultiSelectComponent,
    MatIconModule,
  ],
  templateUrl: './menu-form.component.html',
  styleUrl: './menu-form.component.scss',
})
export class MenuFormComponent {
  private fb = inject(FormBuilder);
  private menuService = inject(MenuService);
  private categoryService = inject(CategoryService);
  private alertService = inject(AlertService);

  // Inputs & Outputs
  menuToEdit = input<Menu | null>(null);
  existingMenus = input<Menu[]>([]);
  saveEvent = output<Menu>();
  cancelEvent = output<void>();

  // Signals
  menuForm!: FormGroup;
  selectedType = signal<MenuType>('internal');
  categories = signal<Category[]>([]);
  isLoading = signal(false);
  showCategoryDropdown = signal(false);
  selectedCategories = signal<Category[]>([]); // Para multi-select

  // Rotas internas disponíveis
  internalRoutes: InternalRoute[] = [
    { path: '/', label: 'Home' },
    { path: '/noticias', label: 'Notícias' },
    { path: '/videos', label: 'Vídeos' },
    { path: '/sobre', label: 'Sobre' },
    { path: '/contato', label: 'Contato' },
  ];

  constructor() {
    this.initForm();
    this.loadCategories();

    // Effect para atualizar form quando receber menu para editar
    effect(() => {
      const menu = this.menuToEdit();
      if (menu) {
        this.loadMenuForEdit(menu);
      } else {
        // Se não está editando, calcular próxima ordem disponível
        const nextOrder = this.calculateNextOrder();
        this.menuForm.patchValue({ order: nextOrder }, { emitEvent: false });
      }
    });
  }

  private initForm(): void {
    this.menuForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      type: ['internal', Validators.required],
      routerLink: [''],
      externalLink: [''],
      categoryId: [null],
      categoryIds: [[]], // Para multi-select
      categoryName: [''],
      slug: [''],
      order: [1],
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

  private updateValidators(type: MenuType): void {
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
        nameControl?.setValidators([
          Validators.required,
          Validators.minLength(2),
        ]);
        break;
      case 'external':
        externalLinkControl?.setValidators([
          Validators.required,
          Validators.pattern(/^https?:\/\/.+/),
        ]);
        nameControl?.setValidators([
          Validators.required,
          Validators.minLength(2),
        ]);
        this.menuForm.patchValue({ name: '' }); // Limpar nome para forçar preenchimento
        break;
      case 'category':
        // Para category, não exigir categoryId pois podemos usar multi-select
        // A validação será feita no submitForm verificando selectedCategories
        nameControl?.clearValidators(); // Nome virá das categorias selecionadas
        break;
      case 'submenu':
        // Para submenu (agrupador), apenas o nome é obrigatório
        nameControl?.setValidators([
          Validators.required,
          Validators.minLength(2),
        ]);
        break;
    }

    routerLinkControl?.updateValueAndValidity({ emitEvent: false });
    externalLinkControl?.updateValueAndValidity({ emitEvent: false });
    categoryIdControl?.updateValueAndValidity({ emitEvent: false });
    nameControl?.updateValueAndValidity({ emitEvent: false });
  }

  private loadCategories(): void {
    this.categoryService.getActive().subscribe({
      next: (categories) => this.categories.set(categories),
      error: (err) => console.error('Erro ao carregar categorias:', err),
    });
  }

  private calculateNextOrder(): number {
    const menus = this.existingMenus();
    if (!menus || menus.length === 0) {
      return 1;
    }

    // Encontrar a maior ordem existente
    const maxOrder = Math.max(...menus.map((m) => m.order || 1));
    return maxOrder + 1;
  }

  private loadMenuForEdit(menu: Menu): void {
    this.selectedType.set((menu.type as MenuType) || 'internal');
    this.menuForm.patchValue({
      name: menu.name,
      type: menu.type || 'internal',
      routerLink: menu.routerLink || '',
      externalLink: menu.externalLink || '',
      slug: menu.slug || '',
      order: menu.order || 1,
    });
  }

  selectCategory(category: Category): void {
    // Modo single-select: selecionar uma categoria
    this.menuForm.patchValue({
      categoryId: category.id,
      categoryName: category.name,
      name: category.name,
      slug: category.slug,
    });
    this.showCategoryDropdown.set(false);
  }

  toggleCategoryDropdown(): void {
    this.showCategoryDropdown.update((v) => !v);
  }

  getSelectedCategory(): Category | null {
    const categoryId = this.menuForm.get('categoryId')?.value;
    return this.categories().find((c) => c.id === categoryId) || null;
  }

  onCategoriesChange(categories: unknown[]): void {
    // Validar que todas as categorias têm name e slug
    const validCategories = categories.filter((c: unknown): c is Category => {
      const isValid = !!(c && (c as Category).name && (c as Category).slug);
      return isValid;
    });
    this.selectedCategories.set(validCategories);
  }

  submitForm(): void {
    const formValue = this.menuForm.value;
    const isCategory = formValue.type === 'category';

    // Se for tipo category e tiver categorias selecionadas, usar criação em lote
    if (isCategory && this.selectedCategories().length > 0) {
      this.isLoading.set(true);
      this.createMultipleCategoryMenus();
      return;
    }

    // Validação para categoria sem multi-select (modo single)
    if (isCategory && this.selectedCategories().length === 0) {
      this.alertService.warning(
        'Atenção',
        'Por favor, selecione pelo menos uma categoria',
      );
      return;
    }

    // Para outros tipos (internal, external), validar o formulário normalmente
    if (this.menuForm.invalid) {
      Object.keys(this.menuForm.controls).forEach((key) => {
        const control = this.menuForm.get(key);
        if (control?.invalid) {
          control?.markAsTouched();
        }
      });
      return;
    }

    this.isLoading.set(true);

    // Criar menu único (internal, external ou submenu)
    const menuData: Menu = {
      name: formValue.name,
      type: formValue.type,
      order: formValue.order || 1,
      ...(formValue.type === 'internal' &&
        formValue.routerLink && { routerLink: formValue.routerLink }),
      ...(formValue.type === 'external' &&
        formValue.externalLink && { externalLink: formValue.externalLink }),
      ...(formValue.type === 'category' &&
        formValue.slug && { slug: formValue.slug }),
      // submenu não precisa de campos adicionais, apenas name e type
    };

    const menuToEdit = this.menuToEdit();
    const apiCall = menuToEdit
      ? this.menuService.update(menuToEdit?.id ?? 0, menuData)
      : this.menuService.create(menuData);

    apiCall.subscribe({
      next: (menu) => {
        this.isLoading.set(false);
        const action = menuToEdit ? 'atualizado' : 'criado';
        this.alertService.success('Sucesso', `Menu ${action} com sucesso!`);
        this.saveEvent.emit(menu as Menu);
        this.resetForm();
      },
      error: (err) => {
        this.isLoading.set(false);
        console.error('Erro ao salvar menu:', err);
        const action = menuToEdit ? 'atualizar' : 'criar';
        this.alertService.error(
          'Erro',
          `Erro ao ${action} menu. Tente novamente.`,
        );
      },
    });
  }

  private createMultipleCategoryMenus(): void {
    const selectedCats = this.selectedCategories();
    const nextOrder = this.calculateNextOrder();

    // Validar que todas as categorias têm name e slug antes de criar
    const validCats = selectedCats.filter((cat) => {
      return !!(cat.name && cat.slug);
    });

    if (validCats.length === 0) {
      this.isLoading.set(false);
      return;
    }

    // Preparar dados para criação em lote
    const menusData = validCats.map((category, index) => ({
      name: String(category.name).trim(),
      slug: String(category.slug).trim(),
      order: nextOrder + index,
    }));

    // Usar o novo endpoint batch para criar todos os menus de uma vez
    this.menuService.createCategoryMenus(menusData).subscribe({
      next: (menus) => {
        this.isLoading.set(false);
        const count = menus.length;
        this.alertService.success(
          'Sucesso',
          count === 1
            ? 'Menu criado com sucesso!'
            : `${count} menus criados com sucesso!`,
        );
        // Emitir o último menu criado (ou poderia emitir todos)
        if (menus.length > 0) {
          this.saveEvent.emit(menus[menus.length - 1] as Menu);
        }
        this.resetForm();
      },
      error: (err) => {
        this.isLoading.set(false);
        console.error('❌ Erro ao salvar menus de categorias:', err);
        console.error('Detalhes do erro:', {
          error: err,
          categorias: selectedCats,
          quantidade: selectedCats.length,
        });
        this.alertService.error(
          'Erro',
          'Erro ao criar menus. Tente novamente.',
        );
      },
    });
  }

  resetForm(): void {
    const nextOrder = this.calculateNextOrder();
    this.menuForm.reset({ type: 'internal', order: nextOrder });
    this.selectedType.set('internal');
    this.selectedCategories.set([]);
    this.showCategoryDropdown.set(false);
  }

  onCancel(): void {
    this.resetForm();
    this.cancelEvent.emit();
  }

  // Getters para validação
  get nameControl() {
    return this.menuForm.get('name');
  }
  get routerLinkControl() {
    return this.menuForm.get('routerLink');
  }
  get externalLinkControl() {
    return this.menuForm.get('externalLink');
  }
  get categoryIdControl() {
    return this.menuForm.get('categoryId');
  }
}
