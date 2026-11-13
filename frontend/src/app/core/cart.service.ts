import { Injectable, computed, effect, signal } from '@angular/core';
import { Product } from './models';

export interface CartLine {
  product: Product;
  quantity: number;
}

const KEY = 'alondralu.cart';
export const MAX_PER_ITEM = 99;

/** Carrito del cliente; se conserva en el navegador entre recargas. */
@Injectable({ providedIn: 'root' })
export class CartService {
  readonly lines = signal<CartLine[]>(this.read());
  readonly count = computed(() => this.lines().reduce((sum, line) => sum + line.quantity, 0));
  readonly total = computed(() =>
    this.lines().reduce((sum, line) => sum + line.quantity * Number(line.product.price), 0),
  );

  constructor() {
    effect(() => {
      try {
        localStorage.setItem(KEY, JSON.stringify(this.lines()));
      } catch {
        /* sin almacenamiento */
      }
    });
  }

  quantityOf(productId: number): number {
    return this.lines().find((line) => line.product.id === productId)?.quantity ?? 0;
  }

  add(product: Product, quantity = 1): void {
    const limit = Math.min(product.stock, MAX_PER_ITEM);
    this.lines.update((lines) => {
      const existing = lines.find((line) => line.product.id === product.id);
      if (existing) {
        return lines.map((line) =>
          line.product.id === product.id
            ? { product, quantity: Math.min(line.quantity + quantity, limit) }
            : line,
        );
      }
      return [...lines, { product, quantity: Math.min(quantity, limit) }];
    });
  }

  setQuantity(productId: number, quantity: number): void {
    this.lines.update((lines) =>
      lines
        .map((line) => {
          const limit = Math.min(line.product.stock, MAX_PER_ITEM);
          return line.product.id === productId
            ? { ...line, quantity: Math.max(0, Math.min(quantity, limit)) }
            : line;
        })
        .filter((line) => line.quantity > 0),
    );
  }

  remove(productId: number): void {
    this.lines.update((lines) => lines.filter((line) => line.product.id !== productId));
  }

  clear(): void {
    this.lines.set([]);
  }

  private read(): CartLine[] {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? (JSON.parse(raw) as CartLine[]) : [];
    } catch {
      return [];
    }
  }
}
