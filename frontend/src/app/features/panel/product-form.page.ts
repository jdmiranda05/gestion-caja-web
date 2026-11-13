import { ChangeDetectionStrategy, Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ProductApi } from '../../core/api';
import { toApiError } from '../../core/http-error';
import { ToastService } from '../../core/toast.service';
import { FieldError } from '../../shared/field-error';
import { applyServerErrors, decimals2, integer, notBlank, touchAll } from '../../shared/forms';
import { Icon } from '../../shared/icon';
import { ErrorState } from '../../shared/states';

@Component({
  selector: 'app-product-form-page',
  imports: [ReactiveFormsModule, RouterLink, FieldError, Icon, ErrorState],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page narrow">
      <a class="back" routerLink="/panel/productos"><app-icon name="arrow-left" />Productos</a>
      <header class="page-header">
        <div>
          <span class="eyebrow">{{ isEdit() ? 'Editar · ID ' + id() : 'Inventario' }}</span>
          <h1>{{ isEdit() ? 'Editar producto' : 'Nuevo producto' }}</h1>
          <p>{{ isEdit() ? 'Los cambios se aplican de inmediato en el catálogo y en caja.' : 'Completa los datos para publicarlo en el catálogo.' }}</p>
        </div>
      </header>

      @if (loadError()) {
        <div class="card"><app-error-state [message]="loadError()!">
          <a class="btn btn-sm" routerLink="/panel/productos">Volver</a>
        </app-error-state></div>
      } @else {
        <form class="card" [formGroup]="form" (ngSubmit)="submit()" novalidate [attr.aria-busy]="loading()">
          <div class="card-body">
            @if (loading()) {
              <div class="form-grid">
                @for (i of [1,2,3,4]; track i) { <div class="stack-sm"><span class="skeleton" style="width: 30%; height: 10px"></span><span class="skeleton" style="height: 38px"></span></div> }
              </div>
            } @else {
              <div class="form-grid">
                <div class="field span-2">
                  <label for="name">Nombre</label>
                  <input id="name" class="input" formControlName="name" maxlength="80" placeholder="Ej. Leche entera 1 L" />
                  <app-field-error [control]="form.controls.name" label="El nombre" />
                </div>
                <div class="field span-2">
                  <label for="category">Categoría</label>
                  <input id="category" class="input" formControlName="category" list="categorias" maxlength="40" placeholder="Ej. Lácteos" />
                  <datalist id="categorias">
                    @for (cat of suggestions; track cat) { <option [value]="cat"></option> }
                  </datalist>
                  <app-field-error [control]="form.controls.category" label="La categoría" />
                </div>
                <div class="field">
                  <label for="price">Precio</label>
                  <div class="input-prefix">
                    <span>S/</span>
                    <input id="price" class="input num" type="number" inputmode="decimal" step="0.10" min="0.10" formControlName="price" placeholder="0.00" />
                  </div>
                  <app-field-error [control]="form.controls.price" label="El precio" />
                </div>
                <div class="field">
                  <label for="stock">Stock inicial</label>
                  <input id="stock" class="input num" type="number" inputmode="numeric" step="1" min="0" formControlName="stock" placeholder="0" />
                  <span class="hint">Unidades disponibles para la venta.</span>
                  <app-field-error [control]="form.controls.stock" label="El stock" />
                </div>
              </div>
              @if (error()) {
                <div class="alert alert-danger form-alert" role="alert"><app-icon name="alert-circle" [size]="18" />
                  <div><strong>No se pudo guardar</strong>{{ error() }}</div></div>
              }
            }
          </div>
          <div class="card-footer">
            <span>{{ form.dirty ? 'Hay cambios sin guardar' : '' }}</span>
            <div class="row">
              <a class="btn" routerLink="/panel/productos">Cancelar</a>
              <button class="btn btn-primary" type="submit" [disabled]="saving() || loading()">
                @if (saving()) { <span class="spinner"></span> Guardando… } @else { {{ isEdit() ? 'Guardar cambios' : 'Crear producto' }} }
              </button>
            </div>
          </div>
        </form>
      }
    </div>
  `,
  styles: `
    .narrow { max-width: 760px; }
    .back { display: inline-flex; align-items: center; gap: 6px; margin-bottom: var(--s-4); color: var(--ink-3); font-size: var(--text-sm); font-weight: 500; }
    .back:hover { color: var(--ink); text-decoration: none; }
    .form-alert { margin-top: var(--s-5); }
    @media (max-width: 640px) { .card-footer { flex-direction: column-reverse; align-items: stretch; } .card-footer .row > * { flex: 1; } }
  `,
})
export class ProductFormPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(ProductApi);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  /** Viene del parámetro de ruta :id (withComponentInputBinding). */
  readonly id = input<string>();
  protected readonly isEdit = computed(() => !!this.id());
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly loadError = signal<string | null>(null);
  protected readonly suggestions = ['Abarrotes', 'Bebidas', 'Lacteos', 'Limpieza', 'Panaderia', 'Snacks'];

  protected readonly form = this.fb.group({
    name: this.fb.nonNullable.control('', [Validators.required, notBlank, Validators.minLength(2), Validators.maxLength(80)]),
    category: this.fb.nonNullable.control('', [Validators.required, notBlank, Validators.maxLength(40)]),
    price: this.fb.control<number | null>(null, [Validators.required, Validators.min(0.1), Validators.max(99999.99), decimals2]),
    stock: this.fb.control<number | null>(null, [Validators.required, Validators.min(0), Validators.max(100000), integer]),
  });

  ngOnInit(): void {
    const id = this.id();
    if (!id) return;
    this.loading.set(true);
    this.api.get(Number(id)).subscribe({
      next: (product) => {
        this.form.reset({ name: product.name, category: product.category, price: Number(product.price), stock: product.stock });
        this.loading.set(false);
      },
      error: (err) => {
        this.loadError.set(toApiError(err).message);
        this.loading.set(false);
      },
    });
  }

  submit(): void {
    this.error.set(null);
    touchAll(this.form);
    if (this.form.invalid) return;
    this.saving.set(true);
    const value = this.form.getRawValue();
    const body = { name: value.name.trim(), category: value.category.trim(), price: Number(value.price), stock: Number(value.stock) };
    const request = this.isEdit() ? this.api.update(Number(this.id()), body) : this.api.create(body);
    request.subscribe({
      next: (product) => {
        this.saving.set(false);
        this.form.markAsPristine();
        this.toast.ok(this.isEdit() ? 'Producto actualizado' : 'Producto creado', product.name);
        void this.router.navigate(['/panel/productos']);
      },
      error: (err) => {
        this.saving.set(false);
        const apiError = toApiError(err);
        applyServerErrors(this.form, apiError);
        this.error.set(apiError.message);
      },
    });
  }
}
