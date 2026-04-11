import {
  Component,
  ChangeDetectionStrategy,
  signal,
  input,
  output,
  computed,
  viewChild,
  ElementRef,
  forwardRef,
  afterRenderEffect,
  model,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';
import { MultiSelectConfig } from '../../models/multi-select.model';
import { MultiSelectItem } from '../../models/multi-select-item.model';

const DEFAULT_CONFIG: Required<MultiSelectConfig> = {
  placeholder: 'Nenhum item selecionado',
  searchPlaceholder: 'Buscar...',
  emptyMessage: 'Nenhum item disponível',
  noResultsMessage: 'Nenhum item encontrado',
  addButtonLabel: 'Adicionar Item',
  addMoreButtonLabel: 'Adicionar mais itens',
  showSearch: true,
  maxHeight: '250px',
  disabled: false,
};

@Component({
  selector: 'lib-multi-select',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './multi-select.component.html',
  styleUrl: './multi-select.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MultiSelectComponent),
      multi: true,
    },
  ],
})
export class MultiSelectComponent implements ControlValueAccessor {
  private dropdownMenu = viewChild<ElementRef<HTMLDivElement>>('dropdownMenu');

  items = input.required<unknown[]>();
  config = input<Partial<MultiSelectConfig>>({});
  selectedItems = model<unknown[]>([]);
  valueProp = input<string | null>(null);

  dropdownStateChange = output<boolean>();

  protected searchTerm = signal<string>('');
  protected dropdownOpen = signal<boolean>(false);
  protected touched = signal<boolean>(false);
  protected internalDisabled = signal<boolean>(false);
  protected focusedIndex = signal<number>(-1);

  /**
   * Helper para o template acessar propriedades de itens desconhecidos (unknown)
   */
  asItem(item: unknown): MultiSelectItem {
    return item as MultiSelectItem;
  }

  readonly mergedConfig = computed<Required<MultiSelectConfig>>(() => ({
    ...DEFAULT_CONFIG,
    ...this.config(),
  }));

  readonly isAllSelected = computed(() => {
    const items = this.items();
    const selected = this.selectedItems();
    return items.length > 0 && selected.length === items.length;
  });

  readonly filteredItems = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const allItems = this.items();

    if (!term) {
      return allItems;
    }

    return allItems.filter((item) => {
      const i = item as Record<string, unknown>;
      const label = (String(i['label'] ?? i['name'] ?? i['title'] ?? '')).toLowerCase();
      const description = (String(i['description'] ?? '')).toLowerCase();
      return label.includes(term) || description.includes(term);
    });
  });

  readonly isDisabled = computed(
    () => this.mergedConfig().disabled || this.internalDisabled()
  );

  private onChange: (value: unknown[]) => void = () => { /* noop */ };
  private onTouched: () => void = () => { /* noop */ };

  constructor() {
    afterRenderEffect(() => {
      if (this.dropdownOpen()) {
        const element = this.dropdownMenu()?.nativeElement;
        if (element && element !== document.activeElement) {
          element.focus();
        }
      }
    });
  }

  isItemSelected(item: unknown): boolean {
    const items = this.selectedItems();
    const i = item as Record<string, unknown>;
    return items.some((s: unknown) => (s as Record<string, unknown>)['id'] === i['id']);
  }

  toggleDropdown(event?: Event): void {
    if (this.isDisabled()) return;

    event?.preventDefault();
    event?.stopPropagation();

    const newState = !this.dropdownOpen();
    this.dropdownOpen.set(newState);
    this.dropdownStateChange.emit(newState);
    
    if (newState) {
      this.focusedIndex.set(-1);
    } else {
      this.searchTerm.set('');
      this.markAsTouched();
    }
  }

  selectAll(): void {
    if (this.isDisabled()) return;
    const currentSelected = [...this.selectedItems()];
    const filtered = this.filteredItems();

    filtered.forEach(item => {
      const i = item as Record<string, unknown>;
      if (!this.isItemSelected(item) && !i['disabled']) {
        currentSelected.push(item);
      }
    });

    this.emitChange(currentSelected);
  }

  clearAll(): void {
    if (this.isDisabled()) return;
    this.emitChange([]);
  }

  closeDropdown(): void {
    if (this.dropdownOpen()) {
      this.dropdownOpen.set(false);
      this.searchTerm.set('');
      this.dropdownStateChange.emit(false);
      this.markAsTouched();
    }
  }

  onSearchChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchTerm.set(input.value);
  }

  selectItem(item: unknown, event?: Event): void {
    const i = item as Record<string, unknown>;
    if (this.isDisabled() || i['disabled']) return;

    event?.preventDefault();
    event?.stopPropagation();

    const current = [...this.selectedItems()];
    const index = current.findIndex((s: unknown) => (s as Record<string, unknown>)['id'] === i['id']);

    if (index >= 0) {
      current.splice(index, 1);
    } else {
      current.push(item);
    }

    this.emitChange(current);
  }

  removeItem(item: unknown, event?: Event): void {
    if (this.isDisabled()) return;

    event?.preventDefault();
    event?.stopPropagation();

    const i = item as Record<string, unknown>;
    const current = this.selectedItems().filter((s: unknown) => (s as Record<string, unknown>)['id'] !== i['id']);
    this.emitChange(current);
  }

  onDropdownBlur(event: FocusEvent): void {
    const relatedTarget = event.relatedTarget as HTMLElement;
    const currentTarget = event.currentTarget as HTMLElement;
    if (!currentTarget.contains(relatedTarget)) {
      setTimeout(() => {
        this.closeDropdown();
      }, 150);
    }
  }

  onKeyDown(event: KeyboardEvent): void {
    if (this.isDisabled()) return;

    if (event.key === 'Escape') {
      this.closeDropdown();
      return;
    }

    if (!this.dropdownOpen()) {
      if (event.key === 'Enter' || event.key === 'ArrowDown') {
        this.toggleDropdown();
      }
      return;
    }

    const items = this.filteredItems();
    if (items.length === 0) return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.focusedIndex.update(i => (i + 1) % items.length);
        this.scrollToFocused();
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.focusedIndex.update(i => (i - 1 + items.length) % items.length);
        this.scrollToFocused();
        break;
      case 'Enter':
        event.preventDefault();
        if (this.focusedIndex() >= 0) {
          this.selectItem(items[this.focusedIndex()]);
        }
        break;
      case 'Tab':
        this.closeDropdown();
        break;
    }
  }

  private scrollToFocused(): void {
    const listEl = this.dropdownMenu()?.nativeElement.querySelector('.dropdown-list');
    const focusedEl = listEl?.querySelectorAll('.dropdown-item')[this.focusedIndex()] as HTMLElement;

    if (listEl && focusedEl) {
      const listRect = listEl.getBoundingClientRect();
      const itemRect = focusedEl.getBoundingClientRect();

      if (itemRect.bottom > listRect.bottom) {
        focusedEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      } else if (itemRect.top < listRect.top) {
        focusedEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }

  private emitChange(items: unknown[]): void {
    this.selectedItems.set(items);

    if (this.onChange) {
      const prop = this.valueProp();
      if (prop) {
        this.onChange(items.map(item => (item as Record<string, unknown>)[prop]));
      } else {
        this.onChange(items);
      }
    }
  }

  private markAsTouched(): void {
    if (!this.touched()) {
      this.touched.set(true);
      this.onTouched();
    }
  }

  writeValue(value: unknown[]): void {
    if (value && Array.isArray(value)) {
      const prop = this.valueProp();
      if (prop) {
        const items = this.items();
        const mappedItems = value
          .map(v => items.find(i => (i as Record<string, unknown>)[prop] === v))
          .filter(i => !!i);
        this.selectedItems.set(mappedItems);
      } else {
        this.selectedItems.set(value);
      }
    } else {
      this.selectedItems.set([]);
    }
  }

  registerOnChange(fn: (value: unknown[]) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.internalDisabled.set(isDisabled);
  }
}
