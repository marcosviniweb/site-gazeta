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
type MenuType = 'external' | 'internal' | 'category';

interface InternalRoute {
  path: string;
  label: string;
}

@Component({
  selector: 'app-submenu-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MultiSelectComponent],
  templateUrl: './submenu-form.component.html',
  styleUrl: './submenu-form.component.scss',
})
export class SubmenuFormComponent {
  private fb = inject(FormBuilder);
  private menuService = inject(MenuService);
  private categoryService = inject(CategoryService);
  private alertService = inject(AlertService);

  // Inputs & Outputs
  parentMenu = input.required<Menu>();
  existingMenus = input<Menu[]>([]);
  allMenus = input.required<Menu[]>(); // Lista completa de menus para calcular ordem
  saveEvent = output<Menu>();
  cancelEvent = output<void>();

  // Signals
  menuForm!: FormGroup;
  selectedType = signal<MenuType>('internal');
  categories = signal<Category[]>([]);
  isLoading = signal(false);
  selectedCategories = signal<Category[]>([]); // Para multi-select

  // Rotas internas disponíveis
  internalRoutes: InternalRoute[] = [
    { path: '/', label: 'Home' },
    { path: '/videos', label: 'Vídeos' },
  ];

  constructor() {
    this.initForm();
    this.loadCategories();

    // Effect para atualizar parentId quando parentMenu mudar
    effect(() => {
      const parent = this.parentMenu();
      if (parent?.id) {
        this.menuForm.patchValue({ parentId: parent.id }, { emitEvent: false });
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
      categoryIds: [[]],
      categoryName: [''],
      slug: [''],
      order: [1],
      parentId: [null],
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
        break;
      case 'category':
        // Para category, não exigir categoryId pois podemos usar multi-select
        // A validação será feita no submitForm verificando selectedCategories
        nameControl?.clearValidators(); // Nome virá das categorias selecionadas
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
    const allMenus = this.allMenus();
    if (allMenus && allMenus.length > 0) {
      // Função recursiva para encontrar a maior ordem em todos os menus (incluindo children)
      const getAllOrders = (menus: Menu[]): number[] => {
        const orders: number[] = [];
        menus.forEach((menu) => {
          if (menu.order) orders.push(menu.order);
          if (menu.children && menu.children.length > 0) {
            orders.push(...getAllOrders(menu.children));
          }
        });
        return orders;
      };

      const allOrders = getAllOrders(allMenus);
      if (allOrders.length > 0) {
        const maxOrder = Math.max(...allOrders);
        return maxOrder + 1;
      }
    }
    return 1;
  }

  onCategoriesChange(categories: unknown[]): void {
    const validCategories = categories.filter((c: unknown): c is Category => {
      return !!(c && (c as Category).name && (c as Category).slug);
    });
    this.selectedCategories.set(validCategories);
  }

  submitForm(event?: Event): void {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

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
      console.warn('⚠️ Nenhuma categoria selecionada (submenu)');
      this.alertService.warning(
        'Atenção',
        'Por favor, selecione pelo menos uma categoria',
      );
      return;
    }

    // Para outros tipos (internal, external), validar o formulário normalmente
    if (this.menuForm.invalid) {
      console.error('❌ Formulário inválido (submenu):', this.menuForm.errors);
      Object.keys(this.menuForm.controls).forEach((key) => {
        const control = this.menuForm.get(key);
        if (control?.invalid) {
          console.error(`Campo ${key} inválido:`, control.errors);
        }
        control?.markAsTouched();
      });
      return;
    }

    this.isLoading.set(true);
    const parentMenu = this.parentMenu();

    // Criar menu único
    const parentId = formValue.parentId || parentMenu?.id || null;
    const finalOrder = this.calculateNextOrder();

    const menuData: Menu = {
      name: formValue.name,
      type: formValue.type,
      order: finalOrder,
      ...(formValue.type === 'internal' &&
        formValue.routerLink && { routerLink: formValue.routerLink }),
      ...(formValue.type === 'external' &&
        formValue.externalLink && { externalLink: formValue.externalLink }),
      ...(formValue.type === 'category' &&
        formValue.slug && { slug: formValue.slug }),
      ...(parentId && { parentId }),
    };

    this.menuService.create(menuData).subscribe({
      next: (menu) => {
        this.isLoading.set(false);
        this.alertService.success('Sucesso', 'Submenu criado com sucesso!');
        this.saveEvent.emit(menu as Menu);
        this.resetForm();
        // Fechar o modal após sucesso
        this.cancelEvent.emit();
      },
      error: (err) => {
        this.isLoading.set(false);
        console.error('Erro ao salvar menu:', err);
        this.alertService.error(
          'Erro',
          'Erro ao criar submenu. Tente novamente.',
        );
      },
    });
  }

  private createMultipleCategoryMenus(): void {
    const selectedCats = this.selectedCategories();
    const parentMenu = this.parentMenu();
    const formValue = this.menuForm.value;

    const parentId = formValue.parentId || parentMenu?.id || null;
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
    this.menuService.createCategoryMenus(menusData, parentId).subscribe({
      next: (menus) => {
        this.isLoading.set(false);
        const count = menus.length;
        this.alertService.success(
          'Sucesso',
          count === 1
            ? 'Submenu criado com sucesso!'
            : `${count} submenus criados com sucesso!`,
        );
        if (menus.length > 0) {
          this.saveEvent.emit(menus[menus.length - 1] as Menu);
        }
        this.resetForm();
        // Fechar o modal após sucesso
        this.cancelEvent.emit();
      },
      error: (err) => {
        this.isLoading.set(false);
        console.error('❌ Erro ao salvar menus de categorias (submenu):', err);
        console.error('Detalhes do erro:', {
          error: err,
          categorias: selectedCats,
          quantidade: selectedCats.length,
          parentId,
        });
        this.alertService.error(
          'Erro',
          'Erro ao criar submenus. Tente novamente.',
        );
      },
    });
  }

  resetForm(): void {
    const nextOrder = this.calculateNextOrder();
    const parentMenu = this.parentMenu();
    const parentId = parentMenu?.id || null;
    this.menuForm.reset({ type: 'internal', order: nextOrder, parentId });
    this.selectedType.set('internal');
    this.selectedCategories.set([]);
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
