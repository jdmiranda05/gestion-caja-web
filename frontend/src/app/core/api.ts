import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  Claim,
  ClaimAudit,
  ClaimRequest,
  ClaimStatus,
  DailySales,
  DeactivationRequest,
  DeactivationStatus,
  Product,
  ProductRequest,
  Purchase,
  Receipt,
  Role,
  Sale,
  SaleRequest,
  SaleSummary,
  StaffClaim,
  User,
} from './models';

/** Productos: GET (lista, búsqueda, detalle), POST, PUT, PATCH y DELETE. */
@Injectable({ providedIn: 'root' })
export class ProductApi {
  private readonly http = inject(HttpClient);
  private readonly base = '/api/products';

  list(): Observable<Product[]> {
    return this.http.get<Product[]>(this.base);
  }

  search(q: string, category?: string | null): Observable<Product[]> {
    let params = new HttpParams();
    if (q) params = params.set('q', q);
    if (category) params = params.set('category', category);
    return this.http.get<Product[]>(`${this.base}/search`, { params });
  }

  get(id: number): Observable<Product> {
    return this.http.get<Product>(`${this.base}/${id}`);
  }

  inactive(): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.base}/inactive`);
  }

  lowStock(limit = 10): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.base}/low-stock`, { params: { limit } });
  }

  create(body: ProductRequest): Observable<Product> {
    return this.http.post<Product>(this.base, body);
  }

  update(id: number, body: ProductRequest): Observable<Product> {
    return this.http.put<Product>(`${this.base}/${id}`, body);
  }

  restock(id: number, units: number): Observable<Product> {
    return this.http.patch<Product>(`${this.base}/${id}/stock`, { units });
  }

  restore(id: number): Observable<Product> {
    return this.http.patch<Product>(`${this.base}/${id}/restore`, {});
  }

  remove(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}

/** Caja: ventas, resumen, serie diaria y boleta. */
@Injectable({ providedIn: 'root' })
export class SaleApi {
  private readonly http = inject(HttpClient);
  private readonly base = '/api/sales';

  recent(): Observable<Sale[]> {
    return this.http.get<Sale[]>(this.base);
  }

  summary(): Observable<SaleSummary[]> {
    return this.http.get<SaleSummary[]>(`${this.base}/summary`);
  }

  daily(days = 14): Observable<DailySales[]> {
    return this.http.get<DailySales[]>(`${this.base}/daily`, { params: { days } });
  }

  register(body: SaleRequest): Observable<Sale> {
    return this.http.post<Sale>(this.base, body);
  }

  receipt(id: number): Observable<Receipt> {
    return this.http.get<Receipt>(`${this.base}/${id}/receipt`);
  }
}

/** Compras del cliente. */
@Injectable({ providedIn: 'root' })
export class PurchaseApi {
  private readonly http = inject(HttpClient);

  place(items: { productId: number; quantity: number }[]): Observable<Purchase> {
    return this.http.post<Purchase>('/api/purchases', { items });
  }

  mine(): Observable<Purchase[]> {
    return this.http.get<Purchase[]>('/api/purchases/my-orders');
  }
}

/** Reclamos: cliente y personal. */
@Injectable({ providedIn: 'root' })
export class ClaimApi {
  private readonly http = inject(HttpClient);
  private readonly base = '/api/claims';

  create(body: ClaimRequest): Observable<Claim> {
    return this.http.post<Claim>(this.base, body);
  }

  mine(): Observable<Claim[]> {
    return this.http.get<Claim[]>(`${this.base}/my-claims`);
  }

  staff(status?: ClaimStatus | null): Observable<StaffClaim[]> {
    const params = status ? new HttpParams().set('status', status) : undefined;
    return this.http.get<StaffClaim[]>(`${this.base}/staff`, { params });
  }

  startReview(id: number): Observable<StaffClaim> {
    return this.http.post<StaffClaim>(`${this.base}/staff/${id}/review`, {});
  }

  resolve(id: number, status: 'RESOLVED' | 'REJECTED', response: string): Observable<StaffClaim> {
    return this.http.post<StaffClaim>(`${this.base}/staff/${id}/resolve`, { status, response });
  }

  history(id: number): Observable<ClaimAudit[]> {
    return this.http.get<ClaimAudit[]>(`${this.base}/staff/${id}/history`);
  }
}

/** Usuarios, roles y solicitudes de desactivación. */
@Injectable({ providedIn: 'root' })
export class UserApi {
  private readonly http = inject(HttpClient);

  list(): Observable<User[]> {
    return this.http.get<User[]>('/api/users');
  }

  changeRole(id: number, role: Role): Observable<User> {
    return this.http.put<User>(`/api/users/${id}/role`, { role });
  }

  requestDeactivation(targetUserId: number, reason: string): Observable<DeactivationRequest> {
    return this.http.post<DeactivationRequest>('/api/admin/users/deactivation-requests', {
      targetUserId,
      reason,
    });
  }

  execute(id: number): Observable<DeactivationRequest> {
    return this.http.post<DeactivationRequest>(`/api/admin/users/deactivation-requests/${id}/execute`, {});
  }

  requests(status?: DeactivationStatus | null): Observable<DeactivationRequest[]> {
    const params = status ? new HttpParams().set('status', status) : undefined;
    return this.http.get<DeactivationRequest[]>('/api/approvals/deactivation-requests', { params });
  }

  approve(id: number): Observable<DeactivationRequest> {
    return this.http.post<DeactivationRequest>(`/api/approvals/deactivation-requests/${id}/approve`, {});
  }

  reject(id: number): Observable<DeactivationRequest> {
    return this.http.post<DeactivationRequest>(`/api/approvals/deactivation-requests/${id}/reject`, {});
  }
}
