import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ThemeService } from '../core/theme.service';
import { Icon } from '../shared/icon';

@Component({
  selector: 'app-theme-toggle',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button class="btn btn-ghost btn-icon" (click)="theme.cycle()" [attr.aria-label]="label()" [title]="label()">
      <app-icon [name]="icon()" />
    </button>
  `,
})
export class ThemeToggle {
  protected readonly theme = inject(ThemeService);
  protected readonly icon = computed(() =>
    ({ light: 'sun', dark: 'moon', system: 'monitor' })[this.theme.preference()],
  );
  protected readonly label = computed(
    () => `Tema: ${({ light: 'claro', dark: 'oscuro', system: 'del sistema' })[this.theme.preference()]}`,
  );
}
