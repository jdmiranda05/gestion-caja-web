import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { LoginRequest, LoginResponse, RegisterRequest, Role, User } from '../models';

interface Session {
  token: string;
  username: string;
  role: Role;
  expiresAt: number;
}

const STORAGE_KEY = 'alondralu.session';

/**
 * Mantiene la sesión JWT emitida por el backend.
 * El token solo se guarda en sessionStorage (se borra al cerrar la pestaña)
 * y nunca se muestra completo en la interfaz.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly session = signal<Session | null>(this.restore());
  private expiryTimer?: ReturnType<typeof setTimeout>;

  readonly isAuthenticated = computed(() => this.session() !== null);
  readonly username = computed(() => this.session()?.username ?? null);
  readonly role = computed(() => this.session()?.role ?? null);
  readonly isStaff = computed(() => this.role() === 'MANAGER' || this.role() === 'ADMIN');
  readonly isAdmin = computed(() => this.role() === 'ADMIN');
  readonly isCustomer = computed(() => this.role() === 'CUSTOMER');
  readonly expiresAt = computed(() => this.session()?.expiresAt ?? null);

  constructor() {
    this.scheduleExpiry();
  }

  /** Token para el interceptor. */
  token(): string | null {
    const current = this.session();
    if (!current) return null;
    if (current.expiresAt <= Date.now()) {
      this.clear();
      return null;
    }
    return current.token;
  }

  /** Versión enmascarada para la demostración (no expone el token completo). */
  maskedToken(): string {
    const token = this.session()?.token;
    if (!token) return '—';
    return `${token.slice(0, 12)}…${token.slice(-6)}`;
  }

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>('/api/users/login', credentials).pipe(
      tap((response) => {
        const session: Session = {
          token: response.token,
          username: response.username,
          role: response.role,
          expiresAt: new Date(response.expiresAt).getTime(),
        };
        this.session.set(session);
        this.persist(session);
        this.scheduleExpiry();
      }),
    );
  }

  register(data: RegisterRequest): Observable<User> {
    return this.http.post<User>('/api/users/register', data);
  }

  me(): Observable<User> {
    return this.http.get<User>('/api/users/me');
  }

  /** Ruta de inicio según el rol. */
  homeFor(role: Role | null = this.role()): string {
    return role === 'MANAGER' || role === 'ADMIN' ? '/panel' : '/';
  }

  logout(reason?: 'expired'): void {
    this.clear();
    void this.router.navigate(['/login'], reason ? { queryParams: { motivo: reason } } : {});
  }

  /** Cierra la sesión por un 401 del servidor conservando la ruta de retorno. */
  handleUnauthorized(returnUrl: string): void {
    if (!this.session()) return;
    this.clear();
    void this.router.navigate(['/login'], { queryParams: { motivo: 'expired', returnUrl } });
  }

  private clear(): void {
    this.session.set(null);
    clearTimeout(this.expiryTimer);
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      /* almacenamiento no disponible */
    }
  }

  private persist(session: Session): void {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } catch {
      /* almacenamiento no disponible */
    }
  }

  private restore(): Session | null {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const session = JSON.parse(raw) as Session;
      return session.expiresAt > Date.now() ? session : null;
    } catch {
      return null;
    }
  }

  private scheduleExpiry(): void {
    clearTimeout(this.expiryTimer);
    const expiresAt = this.session()?.expiresAt;
    if (!expiresAt) return;
    const delay = Math.min(expiresAt - Date.now(), 2_147_000_000);
    this.expiryTimer = setTimeout(() => this.logout('expired'), Math.max(delay, 0));
  }
}
