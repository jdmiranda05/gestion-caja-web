import { Routes } from '@angular/router';
import { authGuard, guestGuard, roleGuard } from './core/auth/auth.guards';

/**
 * Rutas de la aplicación.
 *  - Tienda pública: catálogo.
 *  - Cliente (CUSTOMER): carrito, pedidos y reclamos.
 *  - Panel (MANAGER / ADMIN): resumen, caja, productos, reclamos, solicitudes.
 *  - Solo ADMIN: usuarios y roles.
 * Los guards solo controlan la navegación; el backend vuelve a verificar cada permiso.
 */
export const routes: Routes = [
  {
    path: 'login',
    canMatch: [guestGuard],
    title: 'Ingresar · Alondralu',
    loadComponent: () => import('./features/auth/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'registro',
    canMatch: [guestGuard],
    title: 'Crear cuenta · Alondralu',
    loadComponent: () => import('./features/auth/register.page').then((m) => m.RegisterPage),
  },
  {
    path: 'panel',
    canActivate: [authGuard, roleGuard('MANAGER', 'ADMIN')],
    loadComponent: () => import('./layout/panel-shell').then((m) => m.PanelShell),
    children: [
      {
        path: '',
        title: 'Resumen · Panel',
        loadComponent: () => import('./features/panel/dashboard.page').then((m) => m.DashboardPage),
      },
      {
        path: 'caja',
        title: 'Caja · Panel',
        loadComponent: () => import('./features/panel/cash.page').then((m) => m.CashPage),
      },
      {
        path: 'productos',
        title: 'Productos · Panel',
        loadComponent: () => import('./features/panel/products.page').then((m) => m.ProductsPage),
      },
      {
        path: 'productos/nuevo',
        title: 'Nuevo producto · Panel',
        loadComponent: () => import('./features/panel/product-form.page').then((m) => m.ProductFormPage),
      },
      {
        path: 'productos/:id/editar',
        title: 'Editar producto · Panel',
        loadComponent: () => import('./features/panel/product-form.page').then((m) => m.ProductFormPage),
      },
      {
        path: 'reclamos',
        title: 'Reclamos · Panel',
        loadComponent: () => import('./features/panel/claims.page').then((m) => m.StaffClaimsPage),
      },
      {
        path: 'solicitudes',
        title: 'Solicitudes · Panel',
        loadComponent: () => import('./features/panel/approvals.page').then((m) => m.ApprovalsPage),
      },
      {
        path: 'usuarios',
        canActivate: [roleGuard('ADMIN')],
        title: 'Usuarios · Panel',
        loadComponent: () => import('./features/panel/users.page').then((m) => m.UsersPage),
      },
    ],
  },
  {
    path: '',
    loadComponent: () => import('./layout/store-shell').then((m) => m.StoreShell),
    children: [
      {
        path: '',
        title: 'Tienda Alondralu · Catálogo',
        loadComponent: () => import('./features/store/catalog.page').then((m) => m.CatalogPage),
      },
      {
        path: 'carrito',
        title: 'Carrito · Alondralu',
        loadComponent: () => import('./features/store/cart.page').then((m) => m.CartPage),
      },
      {
        path: 'pedidos',
        canActivate: [roleGuard('CUSTOMER')],
        title: 'Mis pedidos · Alondralu',
        loadComponent: () => import('./features/store/orders.page').then((m) => m.OrdersPage),
      },
      {
        path: 'reclamos',
        canActivate: [roleGuard('CUSTOMER')],
        title: 'Reclamos · Alondralu',
        loadComponent: () => import('./features/store/claims.page').then((m) => m.CustomerClaimsPage),
      },
      {
        path: 'acceso-denegado',
        title: 'Acceso denegado · Alondralu',
        loadComponent: () => import('./features/errors.page').then((m) => m.ForbiddenPage),
      },
      {
        path: '**',
        title: 'Página no encontrada · Alondralu',
        loadComponent: () => import('./features/errors.page').then((m) => m.NotFoundPage),
      },
    ],
  },
];
