import { Component, inject, signal, computed, ElementRef, viewChild, output, input, effect } from '@angular/core';
import {
  NonNullableFormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { Ads } from '@site-gazeta/models';
import { AlertService } from '@site-gazeta/alert';
import { MatIconModule } from '@angular/material/icon';
import {
  AdsFormControls,
  SelectOption
} from '@site-gazeta/ads-config';
import {
  urlValidator,
  endDateAfterStartDateValidator
} from '@site-gazeta/ads-config';
import { AdsService } from '../../../core/services/ads.service';

interface FormState {
  selectedFile: File | null;
  selectedFileName: string;
  imagePreviewUrl: string | SafeUrl | null;
  isSubmitting: boolean;
}

@Component({
  selector: 'app-ads-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatIconModule],
  templateUrl: './ads-form.component.html',
  styleUrls: ['./ads-form.component.scss'],
})
export class AdsFormComponent  {
  private fb = inject(NonNullableFormBuilder);
  private adsService = inject(AdsService);
  private alertService = inject(AlertService);
  private sanitizer = inject(DomSanitizer);

  // Inputs
  adToEdit = input<Ads | null>(null);

  // Outputs
  formSubmitted = output<void>();
  formCancelled = output<void>();

  // ViewChild para o input de arquivo
  fileInput = viewChild<ElementRef<HTMLInputElement>>('fileInput');

  // Estado do formulário usando signals
  state = signal<FormState>({
    selectedFile: null,
    selectedFileName: '',
    imagePreviewUrl: null,
    isSubmitting: false,
  });

  // Computed signals
  isSubmitting = computed(() => this.state().isSubmitting);
  imagePreviewUrl = computed(() => this.state().imagePreviewUrl);
  selectedFileName = computed(() => this.state().selectedFileName);
  isEdit = computed(() => !!this.adToEdit());

  adForm!: FormGroup<AdsFormControls>;

  readonly allPositionOptions: SelectOption[] = [
    { value: 'top', label: 'Topo', pages: ['home'] },
    { value: 'center', label: 'Centro', pages: ['home', 'content'] },
    { value: 'bottom', label: 'Rodapé', pages: ['home', 'content'] },
  ];

  readonly placementOptions: SelectOption[] = [
    { value: 'header', label: 'Cabeçalho' },
    { value: 'home', label: 'Home' },
    { value: 'content', label: 'Conteúdo' },
  ];

  readonly allSizeOptions: SelectOption[] = [
    { value: '728x90', label: '728x90 (Banner horizontal)' },
    { value: '300x250', label: '300x250 (Banner Mobile)' },
    { value: '160x600', label: '160x600 (Banner vertical)' },
    { value: '200x200', label: '200x200 (Banner pequeno Mobile)' },
  ];

  private readonly sizeMatrix: Record<string, Record<string, string[]>> = {
    header: {
      top: ['728x90'],
    },
    home: {
      top: ['728x90','300x250'],
      center: ['728x90', '300x250', '200x200'],
      bottom: ['160x600', '728x90'],
    },
    content: {
      center: ['728x90', '300x250', '160x600'],
      bottom: ['728x90',],
    },
  };

  positionOptions = signal<SelectOption[]>([]);
  isPositionDisabled = signal<boolean>(false);
  sizeOptions = signal<SelectOption[]>([]);

  readonly ALLOWED_IMAGE_TYPES = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
  ];

  readonly MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

  constructor() {
    this.initForm();
    this.setupPositionDisableSync();
    this.setupPlacementListener();
    this.refreshPositionSignals(this.adForm.get('placement')?.value as string | null);
    this.refreshSizeOptionsSignal();

    effect(() => {
      const ad = this.adToEdit();
      if (ad) {
        this.loadAdForEdit(ad);
      } else {
        this.resetForm();
      }
    });
  }

  private setupPositionDisableSync(): void {
    // Sincroniza o estado disabled do campo position com o placement
    const placementControl = this.adForm.get('placement');
    const positionControl = this.adForm.get('position');

    // Verifica o estado inicial
    if (placementControl?.value === 'header') {
      positionControl?.disable();
    }

    // Observa mudanças no placement
    placementControl?.valueChanges.subscribe((value) => {
      if (value === 'header') {
        positionControl?.disable();
      } else {
        positionControl?.enable();
      }
    });
  }

  private setupPlacementListener(): void {
    const placementControl = this.adForm.get('placement');
    const positionControl = this.adForm.get('position');
    const sizeControl = this.adForm.get('size');

    placementControl?.valueChanges.subscribe((value) => {
      const placement = value as string;
      this.refreshPositionSignals(placement);

      if (placement === 'header') {
        positionControl?.setValue('top', { emitEvent: false });
        this.ensureValidSize(sizeControl);
        this.refreshSizeOptionsSignal();
        return;
      }

      if (placement === 'home' || placement === 'content') {
        const validPositions = this.getValidPositions(placement);
        const currentPosition = positionControl?.value as string;

        if (currentPosition && !validPositions.includes(currentPosition)) {
          positionControl?.setValue('');
        }
      }

      this.ensureValidSize(sizeControl);
      this.refreshSizeOptionsSignal();
    });

    positionControl?.valueChanges.subscribe(() => {
      this.ensureValidSize(sizeControl);
      this.refreshSizeOptionsSignal();
    });

    this.refreshPositionSignals(placementControl?.value as string | null);
    this.refreshSizeOptionsSignal();
  }

  private initForm(): void {
    const initialValues = this.getInitialFormValues();

    this.adForm = this.fb.group<AdsFormControls>({
      title: this.fb.control(initialValues.title, [Validators.required, Validators.minLength(3)]),
      description: this.fb.control(initialValues.description, [Validators.maxLength(500)]),
      clickUrl: this.fb.control(initialValues.clickUrl, [urlValidator()]),
      position: this.fb.control(initialValues.position, [Validators.required]),
      placement: this.fb.control(initialValues.placement, [Validators.required]),
      size: this.fb.control(initialValues.size, [Validators.required]),
      isActive: this.fb.control(initialValues.isActive),
      priority: this.fb.control(initialValues.priority, [Validators.min(1), Validators.max(10)]),
      startDate: this.fb.control(initialValues.startDate),
      endDate: this.fb.control(initialValues.endDate, [endDateAfterStartDateValidator('startDate')]),
      image: this.fb.control(initialValues.image, [Validators.required]),
    });
  }

  private loadAdForEdit(ad: Ads): void {
    this.state.update(state => ({
      ...state,
      imagePreviewUrl: ad.imageUrl,
    }));

    const formattedAd = {
      ...ad,
      startDate: this.formatDate(ad.startDate),
      endDate: this.formatDate(ad.endDate),
    };

    this.updateImageValidators(false);

    this.adForm.patchValue(formattedAd);

    if (ad.placement === 'header') {
      const positionControl = this.adForm.get('position');
      // Limpa o campo primeiro para remover qualquer estado de erro
      positionControl?.reset();
      // Define o valor "topo" após limpar o campo
      positionControl?.setValue('top', { emitEvent: false });
    }

    this.ensureValidSize(this.adForm.get('size'));
    this.refreshPositionSignals(ad.placement);
    this.refreshSizeOptionsSignal();
  }

  triggerFileInput(): void {
    this.fileInput()?.nativeElement.click();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      this.clearFileSelection();
      return;
    }

    const file = input.files[0];

    // Validar tipo de arquivo
    if (!this.isValidImageType(file)) {
      this.alertService.error(
        'Tipo de arquivo inválido',
        'Por favor, selecione apenas arquivos de imagem (JPG, PNG, GIF, WEBP)'
      );
      input.value = '';
      this.clearFileSelection();
      return;
    }

    // Validar tamanho do arquivo
    if (file.size > this.MAX_FILE_SIZE) {
      this.alertService.error(
        'Arquivo muito grande',
        'O arquivo deve ter no máximo 5MB'
      );
      input.value = '';
      this.clearFileSelection();
      return;
    }

    // Criar preview da imagem
    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      const dataUrl = e.target?.result as string;
      this.state.update(state => ({
        ...state,
        selectedFile: file,
        selectedFileName: file.name,
        imagePreviewUrl: this.sanitizer.bypassSecurityTrustUrl(dataUrl),
      }));
    };
    reader.readAsDataURL(file);

    this.adForm.patchValue({ image: file.name });
  }

  private isValidImageType(file: File): boolean {
    return this.ALLOWED_IMAGE_TYPES.includes(file.type);
  }

  onRemoveImage(): void {
    this.clearFileSelection({ resetImageControl: !this.isEdit(), preservePreview: false });
    if (!this.isEdit()) {
      this.adForm.get('image')?.markAsTouched();
    }
  }

  onSubmit(): void {
    // Marcar todos os campos como tocados para exibir erros
    this.markFormGroupTouched();

    // Validar formulário
    if (this.adForm.invalid) {
      this.alertService.warning(
        'Formulário inválido',
        'Por favor, corrija os erros antes de continuar'
      );
      return;
    }

    // Validar arquivo no modo de criação
    if (!this.isEdit() && !this.state().selectedFile) {
      this.alertService.error(
        'Imagem obrigatória',
        'Por favor, selecione uma imagem para o anúncio'
      );
      return;
    }

    this.state.update(state => ({ ...state, isSubmitting: true }));

    const data = this.adForm.getRawValue();
    const formData = new FormData();

    // Adicionar todos os campos exceto a imagem
    Object.entries(data).forEach(([key, value]) => {
      if (key !== 'image') {
        formData.append(key, String(value));
      }
    });

    // Adicionar imagem se houver
    if (this.state().selectedFile) {
      formData.append('image', this.state().selectedFile!);
    }

    const ad = this.adToEdit();
    if (ad?.id) {
      this.updateAdvertisement(ad.id, formData);
    } else {
      this.createAdvertisement(formData);
    }
  }

  private createAdvertisement(formData: FormData): void {
    this.adsService.create(formData).subscribe({
      next: () => {
        this.alertService.success(
          'Anúncio criado!',
          'O anúncio foi criado com sucesso'
        );
        this.resetForm();
        this.formSubmitted.emit();
        this.state.update(state => ({ ...state, isSubmitting: false }));
      },
      error: (err) => {
        const errorMessage = err?.error?.message || 'Erro desconhecido ao criar anúncio';
        this.alertService.error(
          'Erro ao criar anúncio',
          errorMessage
        );
        this.state.update(state => ({ ...state, isSubmitting: false }));
      },
    });
  }

  private updateAdvertisement(id: number, formData: FormData): void {
    this.adsService.update(id, formData).subscribe({
      next: () => {
        this.alertService.success(
          'Anúncio atualizado!',
          'O anúncio foi atualizado com sucesso'
        );
        this.resetForm();
        this.formSubmitted.emit();
        this.state.update(state => ({ ...state, isSubmitting: false }));
      },
      error: (err) => {
        const errorMessage = err?.error?.message || 'Erro desconhecido ao atualizar anúncio';
        this.alertService.error(
          'Erro ao atualizar anúncio',
          errorMessage
        );
        this.state.update(state => ({ ...state, isSubmitting: false }));
      },
    });
  }

  private markFormGroupTouched(): void {
    Object.keys(this.adForm.controls).forEach((key) => {
      const control = this.adForm.get(key);
      control?.markAsTouched();
    });
  }

  private formatDate(date: string): string {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  resetForm(): void {
    const initialValues = this.getInitialFormValues();
    this.adForm.reset(initialValues);
    this.updateImageValidators(true);
    this.clearFileSelection({ resetImageControl: true, preservePreview: false });
    this.refreshPositionSignals(this.adForm.get('placement')?.value as string | null);
    this.refreshSizeOptionsSignal();
  }

  private getInitialFormValues() {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30);

    return {
      title: '' as string,
      description: '' as string,
      clickUrl: null as string | null,
      position: '' as string,
      placement: '' as string,
      size: '' as string,
      isActive: true,
      priority: 1,
      startDate: this.formatDate(startDate.toISOString()),
      endDate: this.formatDate(endDate.toISOString()),
      image: '' as string,
    } as const;
  }

  private updateImageValidators(isRequired: boolean): void {
    const imageControl = this.adForm.get('image');
    if (!imageControl) {
      return;
    }

    if (isRequired) {
      imageControl.setValidators([Validators.required]);
    } else {
      imageControl.clearValidators();
    }

    imageControl.updateValueAndValidity({ emitEvent: false });
  }

  private clearFileSelection(options?: { resetImageControl?: boolean; preservePreview?: boolean }): void {
    const { resetImageControl = !this.isEdit(), preservePreview = this.isEdit() } = options ?? {};

    this.state.update(state => ({
      ...state,
      selectedFile: null,
      selectedFileName: '',
      imagePreviewUrl: preservePreview ? state.imagePreviewUrl : null,
    }));

    if (resetImageControl) {
      this.adForm.patchValue({ image: '' });
    }
  }

  private ensureValidSize(
    sizeControl: FormGroup['controls'][keyof AdsFormControls] | null | undefined,
  ): void {
    if (!sizeControl) {
      return;
    }

    const validSizes = this.getValidSizesFromForm();
    if (sizeControl.value && !validSizes.includes(sizeControl.value as string)) {
      sizeControl.setValue('');
    }
  }

  private getValidSizesFromForm(): string[] {
    const placement = (this.adForm?.get('placement')?.value as string) ?? null;
    const position = (this.adForm?.get('position')?.value as string) ?? null;
    return this.buildSizeOptions(placement, position).map(option => option.value);
  }

  private getValidPositions(placement: 'home' | 'content'): string[] {
    return this.allPositionOptions
      .filter(option => option.pages?.includes(placement))
      .map(option => option.value);
  }

  private refreshPositionSignals(placement: string | null): void {
    const isHeader = placement === 'header';
    this.isPositionDisabled.set(isHeader);

    if (!placement || isHeader) {
      this.positionOptions.set([]);
      return;
    }

    if (placement === 'home' || placement === 'content') {
      const options = this.allPositionOptions.filter(option =>
        option.pages?.includes(placement)
      );
      this.positionOptions.set(options);
      return;
    }

    this.positionOptions.set([]);
  }

  private refreshSizeOptionsSignal(): void {
    const placement = (this.adForm?.get('placement')?.value as string) ?? null;
    const position = (this.adForm?.get('position')?.value as string) ?? null;
    this.sizeOptions.set(this.buildSizeOptions(placement, position));
  }

  private buildSizeOptions(placement: string | null, position: string | null): SelectOption[] {
    if (!placement) {
      return [];
    }

    const placementMap = this.sizeMatrix[placement];

    if (!placementMap) {
      return [];
    }

    if (placement === 'header') {
      const allowedSizes = placementMap['top'] ?? [];
      return this.allSizeOptions.filter(opt => allowedSizes.includes(opt.value));
    }

    if (!position) {
      return [];
    }

    const allowedSizes = placementMap[position] ?? [];
    return this.allSizeOptions.filter(opt => allowedSizes.includes(opt.value));
  }

  onCancel(): void {
    this.resetForm();
    this.formCancelled.emit();
  }

  // Helpers para mensagens de erro
  getErrorMessage(controlName: keyof AdsFormControls): string {
    const control = this.adForm.get(controlName);
    if (!control || !control.errors || !control.touched) {
      return '';
    }

    const errors = control.errors;
    if (errors['required']) return 'Este campo é obrigatório';
    if (errors['minlength']) return `Mínimo de ${errors['minlength'].requiredLength} caracteres`;
    if (errors['maxlength']) return `Máximo de ${errors['maxlength'].requiredLength} caracteres`;
    if (errors['min']) return `Valor mínimo: ${errors['min'].min}`;
    if (errors['max']) return `Valor máximo: ${errors['max'].max}`;
    if (errors['invalidUrl']) return 'URL inválida';
    if (errors['endDateBeforeStart']) return 'A data final deve ser posterior à data inicial';

    return 'Campo inválido';
  }

  hasError(controlName: keyof AdsFormControls): boolean {
    const control = this.adForm.get(controlName);
    // Não mostrar erro para campos desabilitados
    if (control?.disabled) {
      return false;
    }
    return !!(control?.invalid && control?.touched);
  }
}
