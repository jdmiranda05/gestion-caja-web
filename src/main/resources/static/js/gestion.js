/**
 * Gestión para gerente y administrador: CRUD de productos, consultas JPQL y roles.
 * Usa las funciones compartidas de app.js (apiRequest, readJson, escapeHtml, money...).
 */
const productFormElement = document.querySelector('#product-form');
const productFormMessage = document.querySelector('#product-form-message');
const managementMessage = document.querySelector('#management-message');
const usersMessage = document.querySelector('#users-message');
const deactivationFormMessage = document.querySelector('#deactivation-form-message');
const deactivationRequestsMessage = document.querySelector('#deactivation-requests-message');
let adminUsers = [];

/**
 * Convierte una respuesta fallida en un mensaje legible.
 */
async function errorMessageFrom(response, fallback) {
    const data = await readJson(response);

    if (response.status === 403) {
        return 'No tienes permisos para esta operación (HTTP 403).';
    }

    return data.message || data.detail || fallback;
}

/**
 * Carga todas las listas de la sección de gestión.
 */
async function initManagement() {
    renderManagedProducts();
    const isAdmin = currentUser?.role === 'ADMIN';
    document.querySelector('#admin-tab').hidden = !isAdmin;
    mostrarGestionTab(isAdmin ? 'administracion' : 'productos');

    await Promise.all([
    loadLowStock(),
    loadSalesSummary(),
    loadStaffClaims(),
    loadInactiveProducts()
]);

    if (isAdmin) {
        await loadUsers();
        await loadDeactivationRequests();
    }
}

/**
 * Dibuja la lista editable de productos.
 */
// =============================================
// BÚSQUEDA Y PAGINACIÓN DE PRODUCTOS - GERENCIA
// =============================================

const manageProductsSearch = document.querySelector('#manage-products-search');
const manageProductsPagination = document.querySelector('#manage-products-pagination');
const manageProductsPrev = document.querySelector('#manage-products-prev');
const manageProductsNext = document.querySelector('#manage-products-next');
const manageProductsPageInfo = document.querySelector('#manage-products-page-info');

const MANAGE_PRODUCTS_PER_PAGE = 5;
let manageProductsPage = 1;

function renderManagedProducts() {
    const container = document.querySelector('#manage-products');
    if (!container) return;

    const search = (manageProductsSearch?.value || '')
        .trim()
        .toLocaleLowerCase('es');

    const filtered = products.filter(product => {
        const searchable = [
            product.id,
            product.name,
            product.category
        ]
            .filter(value => value != null)
            .join(' ')
            .toLocaleLowerCase('es');

        return searchable.includes(search);
    });

    const totalPages = Math.max(
        1,
        Math.ceil(filtered.length / MANAGE_PRODUCTS_PER_PAGE)
    );

    manageProductsPage = Math.min(
        Math.max(1, manageProductsPage),
        totalPages
    );

    const start = (manageProductsPage - 1) * MANAGE_PRODUCTS_PER_PAGE;

    const visibleProducts = filtered.slice(
        start,
        start + MANAGE_PRODUCTS_PER_PAGE
    );

    container.innerHTML = visibleProducts.length
        ? visibleProducts.map(product => `
            <article class="product">
                <div class="product-info">
                    <h3>${escapeHtml(product.name)}</h3>
                    <p class="product-category">
                        ${escapeHtml(product.category || 'General')}
                    </p>
                </div>

                <div class="price">
                    ${money(product.price)}

                    <span class="stock">
                        ${Number(product.stock)} disponibles
                    </span>

                    <button class="button secondary" type="button"
                            data-action="edit"
                            data-id="${product.id}">
                        Editar
                    </button>

                    <button class="button secondary" type="button"
                            data-action="restock"
                            data-id="${product.id}">
                        + Stock
                    </button>

                    <button class="button secondary" type="button"
                            data-action="delete"
                            data-id="${product.id}">
                        Eliminar
                    </button>
                </div>
            </article>
        `).join('')
        : '<p class="muted-text">No se encontraron productos.</p>';

    if (manageProductsPagination) {
        manageProductsPagination.hidden =
            filtered.length <= MANAGE_PRODUCTS_PER_PAGE;
    }

    if (manageProductsPageInfo) {
        manageProductsPageInfo.textContent =
            `Página ${manageProductsPage} de ${totalPages} · ${filtered.length} productos`;
    }

    if (manageProductsPrev) {
        manageProductsPrev.disabled = manageProductsPage <= 1;
    }

    if (manageProductsNext) {
        manageProductsNext.disabled = manageProductsPage >= totalPages;
    }
}

// Buscar productos mientras el gerente escribe.
if (manageProductsSearch) {
    manageProductsSearch.addEventListener('input', () => {
        manageProductsPage = 1;
        renderManagedProducts();
    });
}

// Página anterior.
if (manageProductsPrev) {
    manageProductsPrev.addEventListener('click', () => {
        if (manageProductsPage > 1) {
            manageProductsPage--;
            renderManagedProducts();
        }
    });
}

// Página siguiente.
if (manageProductsNext) {
    manageProductsNext.addEventListener('click', () => {
        const search = (manageProductsSearch?.value || '')
            .trim()
            .toLocaleLowerCase('es');

        const totalMatches = products.filter(product =>
            [product.id, product.name, product.category]
                .filter(value => value != null)
                .join(' ')
                .toLocaleLowerCase('es')
                .includes(search)
        ).length;

        const totalPages = Math.max(
            1,
            Math.ceil(totalMatches / MANAGE_PRODUCTS_PER_PAGE)
        );

        if (manageProductsPage < totalPages) {
            manageProductsPage++;
            renderManagedProducts();
        }
    });
}

/**
 * Restablece el formulario al modo de creación.
 */
function resetProductForm() {
    productFormElement.reset();
    document.querySelector('#product-id').value = '';
    document.querySelector('#product-form-title').textContent = 'Nuevo producto';
    document.querySelector('#product-cancel').hidden = true;
}

/**
 * Consulta JPQL: productos con stock bajo.
 */
async function loadLowStock() {
    try {
        const response = await fetch('/api/products/low-stock?limit=10', {
            headers: { 'Accept': 'application/json' },
            credentials: 'same-origin'
        });

        if (!response.ok) {
            throw new Error(await errorMessageFrom(response, 'No se pudo cargar el stock bajo.'));
        }

        const items = await response.json();

        document.querySelector('#low-stock-list').innerHTML = items.length
            ? items.map(item => `
                <article class="product">
                    <div class="product-info"><h3>${escapeHtml(item.name)}</h3></div>
                    <div class="price"><span class="stock">${Number(item.stock)} disponibles</span></div>
                </article>`).join('')
            : '<p class="muted-text">No hay productos con stock bajo.</p>';
    } catch (error) {
        showMessage(managementMessage, error.message, true);
    }
}

/**
 * Consulta JPQL: ventas acumuladas por producto.
 */
async function loadSalesSummary() {
    try {
        const response = await fetch('/api/sales/summary', {
            headers: { 'Accept': 'application/json' },
            credentials: 'same-origin'
        });

        if (!response.ok) {
            throw new Error(await errorMessageFrom(response, 'No se pudo cargar el resumen de ventas.'));
        }

        const rows = await response.json();

        document.querySelector('#sales-summary').innerHTML = rows.length
            ? rows.map(row => `
                <article class="product">
                    <div class="product-info"><h3>${escapeHtml(row.productName)}</h3></div>
                    <div class="price">
                        ${money(row.revenue)}
                        <span class="stock">${Number(row.units)} unidades</span>
                    </div>
                </article>`).join('')
            : '<p class="muted-text">Todavía no hay ventas registradas.</p>';
    } catch (error) {
        showMessage(managementMessage, error.message, true);
    }
}

/**
 * Lista los usuarios y permite cambiar su rol (solo ADMIN).
 */
async function loadUsers() {
    try {
        const response = await fetch('/api/users', {
            headers: { 'Accept': 'application/json' },
            credentials: 'same-origin'
        });

        if (!response.ok) {
            throw new Error(await errorMessageFrom(response, 'No se pudo cargar los usuarios.'));
        }

        const users = await response.json();
        adminUsers = Array.isArray(users) ? users : [];
        const targetSelect = document.querySelector('#deactivation-target');
        targetSelect.innerHTML = '<option value="">Selecciona un usuario</option>' +
            adminUsers
                .filter(user => Number(user.id) !== Number(currentUser.id))
                .map(user => `<option value="${Number(user.id)}">${escapeHtml(user.username)} (${escapeHtml(user.role)})</option>`)
                .join('');

        document.querySelector('#users-list').innerHTML = adminUsers.map(user => `
            <article class="product">
                <div class="product-info">
                    <h3>${escapeHtml(user.username)}</h3>
                    <p class="product-category">${escapeHtml(user.email)}</p>
                </div>
                <div class="price">
                    <select data-user-role="${user.id}" aria-label="Rol de ${escapeHtml(user.username)}">
                        ${['CUSTOMER', 'MANAGER', 'ADMIN'].map(role => `
                            <option value="${role}" ${role === user.role ? 'selected' : ''}>${role}</option>
                        `).join('')}
                    </select>
                    <button class="button secondary" type="button"
                            data-action="save-role" data-id="${user.id}">Guardar rol</button>
                </div>
            </article>
        `).join('');
    } catch (error) {
        showMessage(usersMessage, error.message, true);
    }
}

const deactivationStatusLabels = {
    PENDING: 'Pendiente',
    APPROVED: 'Aprobada',
    REJECTED: 'Rechazada',
    EXECUTED: 'Ejecutada'
};

async function loadDeactivationRequests() {
    const list = document.querySelector('#deactivation-requests-list');
    if (!list || currentUser?.role !== 'ADMIN') return;

    const status = document.querySelector('#deactivation-status-filter').value;
    const url = status
        ? `/api/approvals/deactivation-requests?status=${encodeURIComponent(status)}`
        : '/api/approvals/deactivation-requests';

    showMessage(deactivationRequestsMessage, 'Cargando solicitudes...');

    try {
        const response = await apiRequest(url);
        if (!response.ok) {
            throw new Error(await errorMessageFrom(response, 'No se pudieron cargar las solicitudes.'));
        }

        const requests = await response.json();
        list.innerHTML = requests.length ? requests.map(request => {
            const target = adminUsers.find(user => Number(user.id) === Number(request.targetUserId));
            const requester = adminUsers.find(user => Number(user.id) === Number(request.requestedByUserId));
            const requestedAt = request.requestedAt
                ? new Date(request.requestedAt).toLocaleString('es-PE')
                : 'Sin fecha';
            const canDecide = request.status === 'PENDING'
                && Number(request.requestedByUserId) !== Number(currentUser.id);

            return `<article class="product">
                <div class="product-info">
                    <h3>Solicitud #${Number(request.id)} · ${escapeHtml(deactivationStatusLabels[request.status] || request.status)}</h3>
                    <p><strong>Cuenta:</strong> ${escapeHtml(target?.username || `Usuario #${request.targetUserId}`)}</p>
                    <p><strong>Solicitada por:</strong> ${escapeHtml(requester?.username || `Usuario #${request.requestedByUserId}`)}</p>
                    <p><strong>Motivo:</strong> ${escapeHtml(request.reason || '')}</p>
                    <p class="muted-text">${escapeHtml(requestedAt)}</p>
                </div>
                <div class="price">
                    ${canDecide ? `
                        <button class="button primary" type="button" data-deactivation-action="approve" data-request-id="${Number(request.id)}">Aprobar</button>
                        <button class="button secondary" type="button" data-deactivation-action="reject" data-request-id="${Number(request.id)}">Rechazar</button>
                    ` : ''}
                    ${request.status === 'APPROVED' ? `
                        <button class="button secondary" type="button" data-deactivation-action="execute" data-request-id="${Number(request.id)}">Ejecutar desactivación</button>
                    ` : ''}
                </div>
            </article>`;
        }).join('') : '<p class="muted-text">No hay solicitudes con este estado.</p>';
        showMessage(deactivationRequestsMessage, `${requests.length} solicitud(es).`);
    } catch (error) {
        list.innerHTML = '';
        showMessage(deactivationRequestsMessage, error.message, true);
    }
}

document.querySelector('#deactivation-request-form').addEventListener('submit', async event => {
    event.preventDefault();
    const targetUserId = Number(document.querySelector('#deactivation-target').value);
    const reason = document.querySelector('#deactivation-reason').value.trim();
    if (!targetUserId || !reason) return;

    try {
        const response = await apiRequest('/api/admin/users/deactivation-requests', {
            method: 'POST',
            body: JSON.stringify({ targetUserId, reason })
        });
        if (!response.ok) {
            throw new Error(await errorMessageFrom(response, 'No se pudo enviar la solicitud.'));
        }

        event.target.reset();
        showMessage(deactivationFormMessage, 'Solicitud enviada para aprobación.');
        await loadDeactivationRequests();
    } catch (error) {
        showMessage(deactivationFormMessage, error.message, true);
    }
});

document.querySelector('#deactivation-requests-list').addEventListener('click', async event => {
    const button = event.target.closest('[data-deactivation-action]');
    if (!button || currentUser?.role !== 'ADMIN') return;

    const requestId = Number(button.dataset.requestId);
    const action = button.dataset.deactivationAction;
    if (action === 'execute'
            && !confirm('¿Ejecutar la desactivación de esta cuenta?')) return;

    const path = action === 'execute'
        ? `/api/admin/users/deactivation-requests/${requestId}/execute`
        : `/api/approvals/deactivation-requests/${requestId}/${action}`;

    button.disabled = true;
    try {
        const response = await apiRequest(path, { method: 'POST' });
        if (!response.ok) {
            throw new Error(await errorMessageFrom(response, 'No se pudo procesar la solicitud.'));
        }
        showMessage(deactivationRequestsMessage, 'Solicitud actualizada.');
        await loadDeactivationRequests();
    } catch (error) {
        showMessage(deactivationRequestsMessage, error.message, true);
        button.disabled = false;
    }
});

document.querySelector('#deactivation-refresh').addEventListener('click', loadDeactivationRequests);
document.querySelector('#deactivation-status-filter').addEventListener('change', loadDeactivationRequests);

/**
 * Crea o actualiza un producto según exista un identificador en el formulario.
 */
productFormElement.addEventListener('submit', async event => {
    event.preventDefault();

    const id = document.querySelector('#product-id').value;
    const body = {
        name: document.querySelector('#product-name').value.trim(),
        category: document.querySelector('#product-category').value.trim(),
        price: Number(document.querySelector('#product-price').value),
        stock: Number(document.querySelector('#product-stock').value)
    };

    showMessage(productFormMessage, 'Guardando producto...');

    try {
        const response = await apiRequest(id ? `/api/products/${id}` : '/api/products', {
            method: id ? 'PUT' : 'POST',
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            throw new Error(await errorMessageFrom(response, 'No se pudo guardar el producto.'));
        }

        showMessage(productFormMessage, id ? 'Producto actualizado.' : 'Producto creado.');
        resetProductForm();
        await loadProducts();
        await initManagement();
    } catch (error) {
        showMessage(productFormMessage, error.message, true);
    }
});

document.querySelector('#product-cancel').addEventListener('click', resetProductForm);

/**
 * Atiende los botones de editar, eliminar y reponer stock.
 */
document.querySelector('#manage-products').addEventListener('click', async event => {
    const button = event.target.closest('button[data-action]');

    if (!button) return;

    const id = button.dataset.id;
    const product = products.find(item => String(item.id) === id);

    if (button.dataset.action === 'edit' && product) {
        document.querySelector('#product-id').value = product.id;
        document.querySelector('#product-name').value = product.name;
        document.querySelector('#product-category').value = product.category || '';
        document.querySelector('#product-price').value = product.price;
        document.querySelector('#product-stock').value = product.stock;
        document.querySelector('#product-form-title').textContent = 'Editar producto';
        document.querySelector('#product-cancel').hidden = false;
        productFormElement.scrollIntoView({ behavior: 'smooth' });
        return;
    }

    try {
        let response;

        if (button.dataset.action === 'delete') {
            if (!confirm(`¿Eliminar "${product?.name}" del catálogo?`)) return;
            response = await apiRequest(`/api/products/${id}`, { method: 'DELETE' });
        } else {
            const units = Number(prompt('¿Cuántas unidades quieres agregar?', '10'));
            if (!Number.isInteger(units) || units < 1) return;
            response = await apiRequest(`/api/products/${id}/stock`, {
                method: 'PATCH',
                body: JSON.stringify({ units })
            });
        }

        if (!response.ok) {
            throw new Error(await errorMessageFrom(response, 'No se pudo completar la operación.'));
        }

        showMessage(productFormMessage, 'Operación realizada correctamente.');
        await loadProducts();
        await initManagement();
    } catch (error) {
        showMessage(productFormMessage, error.message, true);
    }
});

/**
 * Guarda el nuevo rol elegido para un usuario.
 */
document.querySelector('#users-list').addEventListener('click', async event => {
    const button = event.target.closest('button[data-action="save-role"]');

    if (!button) return;

    const select = document.querySelector(`select[data-user-role="${button.dataset.id}"]`);

    try {
        const response = await apiRequest(`/api/users/${button.dataset.id}/role`, {
            method: 'PUT',
            body: JSON.stringify({ role: select.value })
        });

        if (!response.ok) {
            throw new Error(await errorMessageFrom(response, 'No se pudo cambiar el rol.'));
        }

        showMessage(usersMessage, 'Rol actualizado correctamente.');
        await loadUsers();
            } catch (error) {
        showMessage(usersMessage, error.message, true);
    }
});

// =============================================
// ATENCIÓN DE RECLAMOS - GERENCIA Y ADMIN
// =============================================

const staffClaimsFilter = document.querySelector('#staff-claims-filter');
const staffClaimsList = document.querySelector('#staff-claims-list');
const staffClaimsMessage = document.querySelector('#staff-claims-message');
const staffClaimsRefresh = document.querySelector('#staff-claims-refresh');
const staffClaimsSearch = document.querySelector('#staff-claims-search');
const staffClaimsPagination = document.querySelector('#staff-claims-pagination');
const staffClaimsPrev = document.querySelector('#staff-claims-prev');
const staffClaimsNext = document.querySelector('#staff-claims-next');
const staffClaimsPageInfo = document.querySelector('#staff-claims-page-info');

const STAFF_CLAIMS_PER_PAGE = 5;

let staffClaimsData = [];
let staffClaimsPage = 1;

function staffClaimStatusLabel(status) {
    const labels = {
        PENDING: 'Pendiente',
        IN_REVIEW: 'En revisión',
        RESOLVED: 'Resuelto',
        REJECTED: 'Rechazado'
    };

    return labels[status] || status;
}
function renderStaffClaimsPage() {
    if (!staffClaimsList) return;

    const search = (staffClaimsSearch?.value || '')
        .trim()
        .toLocaleLowerCase('es');

    const filtered = staffClaimsData.filter(claim => {
        const searchable = [
            claim.internalCode,
            claim.id,
            claim.orderId,
            claim.productName,
            claim.reason,
            claim.description
        ].filter(value => value != null)
         .join(' ')
         .toLocaleLowerCase('es');

        return searchable.includes(search);
    });

    const totalPages = Math.max(
        1,
        Math.ceil(filtered.length / STAFF_CLAIMS_PER_PAGE)
    );

    staffClaimsPage = Math.min(Math.max(1, staffClaimsPage), totalPages);

    const start = (staffClaimsPage - 1) * STAFF_CLAIMS_PER_PAGE;
    const visible = filtered.slice(start, start + STAFF_CLAIMS_PER_PAGE);

    // Ocultamos las tarjetas que no pertenecen a la página actual.
    staffClaimsList.querySelectorAll('[data-staff-claim-card]').forEach(card => {
        const id = Number(card.dataset.staffClaimCard);
        card.hidden = !visible.some(claim => Number(claim.id) === id);
    });

    if (staffClaimsPagination) {
        staffClaimsPagination.hidden = filtered.length <= STAFF_CLAIMS_PER_PAGE;
    }

    if (staffClaimsPageInfo) {
        staffClaimsPageInfo.textContent =
            `Página ${staffClaimsPage} de ${totalPages} · ${filtered.length} reclamos`;
    }

    if (staffClaimsPrev) {
        staffClaimsPrev.disabled = staffClaimsPage <= 1;
    }

    if (staffClaimsNext) {
        staffClaimsNext.disabled = staffClaimsPage >= totalPages;
    }
}

async function loadStaffClaims() {
    if (!['MANAGER', 'ADMIN'].includes(currentUser?.role)) {
        return;
    }

    if (!staffClaimsList || !staffClaimsFilter) {
        return;
    }

    showMessage(staffClaimsMessage, 'Cargando reclamos...');

    try {
        const status = staffClaimsFilter.value;

        const url = status
            ? `/api/claims/staff?status=${encodeURIComponent(status)}`
            : '/api/claims/staff';

        const response = await apiRequest(url);

        if (!response.ok) {
            throw new Error(
                await errorMessageFrom(
                    response,
                    'No se pudieron cargar los reclamos.'
                )
            );
        }

        const claims = await response.json();
        staffClaimsData = Array.isArray(claims) ? claims : [];

        if (!Array.isArray(claims) || claims.length === 0) {
            staffClaimsList.innerHTML =
                '<p class="muted-text">No hay reclamos para mostrar.</p>';

            showMessage(staffClaimsMessage, '');
            return;
        }

        staffClaimsList.innerHTML = claims.map(claim => {
            const date = claim.createdAt
                ? new Date(claim.createdAt).toLocaleString('es-PE')
                : 'Sin fecha';

            return `<article class="product"
                 data-staff-claim-card="${Number(claim.id)}">
                 <div class="product-info">
                        <h3>
                            Reclamo ${escapeHtml(claim.internalCode || String(claim.id))}
                        </h3>

                        <p>
                            <strong>Estado:</strong>
                            ${escapeHtml(staffClaimStatusLabel(claim.status))}
                        </p>

                        <p>
                            <strong>Pedido:</strong>
                            #${Number(claim.orderId)}
                        </p>

                        <p>
                            <strong>Producto:</strong>
                            ${escapeHtml(claim.productName || 'No disponible')}
                        </p>

                        <p>
                            <strong>Motivo:</strong>
                            ${escapeHtml(claim.reason || '')}
                        </p>

                        <p>
                            <strong>Descripción:</strong>
                            ${escapeHtml(claim.description || '')}
                        </p>

                        <p class="muted-text">
                            Registrado: ${escapeHtml(date)}
                        </p>
                        ${claim.status === 'PENDING' ? `
    <button class="button primary"
            type="button"
            data-claim-action="review"
            data-claim-id="${Number(claim.id)}">
        Iniciar revisión
    </button>
` : ''}

${claim.status === 'IN_REVIEW' ? `
    <div class="claim-response-form">
        <label for="staff-response-${Number(claim.id)}">
            Respuesta al cliente
        </label>

        <textarea
            id="staff-response-${Number(claim.id)}"
            rows="4"
            maxlength="2000"
            placeholder="Escribe una respuesta clara para el cliente..."></textarea>

        <button class="button primary"
                type="button"
                data-claim-action="resolve"
                data-claim-id="${Number(claim.id)}">
            Resolver reclamo
        </button>

        <button class="button secondary"
                type="button"
                data-claim-action="reject"
                data-claim-id="${Number(claim.id)}">
            Rechazar reclamo
        </button>
    </div>
` : ''}

<button class="button secondary"
        type="button"
        data-claim-action="history"
        data-claim-id="${Number(claim.id)}">
    Ver historial
</button>

<div id="staff-history-${Number(claim.id)}"
     class="muted-text"
     hidden></div>
                    </div>
                </article>
            `;
        }).join('');
        renderStaffClaimsPage();

        showMessage(
            staffClaimsMessage,
            `${claims.length} reclamo(s) encontrado(s).`
        );

    } catch (error) {
        staffClaimsList.innerHTML = '';

        showMessage(
            staffClaimsMessage,
            error.message || 'Error al consultar reclamos.',
            true
        );
    }
}

if (staffClaimsFilter) {
    staffClaimsFilter.addEventListener('change', loadStaffClaims);
}

if (staffClaimsRefresh) {
    staffClaimsRefresh.addEventListener('click', loadStaffClaims);
}
// =============================================
// NAVEGACIÓN INTERNA DE GESTIÓN
// =============================================

const gestionNav = document.querySelector('#gestion-nav');

function mostrarGestionTab(nombre) {
    if (!gestionNav) return;

    // Actualizar el botón seleccionado.
    gestionNav.querySelectorAll('[data-gestion-tab]').forEach(boton => {
        const activo = boton.dataset.gestionTab === nombre;

        boton.classList.toggle('activo', activo);
        boton.setAttribute('aria-selected', String(activo));
    });

    // Mostrar únicamente el panel seleccionado.
    document.querySelectorAll('[data-gestion-panel]').forEach(panel => {
        panel.hidden = panel.dataset.gestionPanel !== nombre;
    });
}

if (gestionNav) {
    gestionNav.addEventListener('click', event => {
        const boton = event.target.closest('[data-gestion-tab]');

        if (!boton) return;

        mostrarGestionTab(boton.dataset.gestionTab);
    });
}

// =============================================
// ACCIONES DE RECLAMOS
// =============================================

if (staffClaimsList) {
    staffClaimsList.addEventListener('click', async event => {
        const button = event.target.closest('[data-claim-action]');
        if (!button) return;

        if (!['MANAGER', 'ADMIN'].includes(currentUser?.role)) return;

        const id = Number(button.dataset.claimId);
        const action = button.dataset.claimAction;

        if (!Number.isSafeInteger(id) || id <= 0) return;

        button.disabled = true;

        try {
            if (action === 'history') {
                const response = await apiRequest(
                    `/api/claims/staff/${id}/history`
                );

                if (!response.ok) {
                    throw new Error(await errorMessageFrom(
                        response, 'No se pudo consultar el historial.'
                    ));
                }

                const history = await response.json();
                const container = document.getElementById(`staff-history-${id}`);

                if (!container) return;

                container.innerHTML = history.length
                    ? history.map(item => `
                        <p>
                            <strong>${escapeHtml(item.action)}</strong>
                            — ${escapeHtml(item.details || '')}
                            <br>
                            Estado:
                            ${escapeHtml(staffClaimStatusLabel(item.previousStatus))}
                            →
                            ${escapeHtml(staffClaimStatusLabel(item.newStatus))}
                            <br>
                            Usuario ID: ${Number(item.actorUserId)}
                            <br>
                            ${escapeHtml(item.createdAt
                                ? new Date(item.createdAt).toLocaleString('es-PE')
                                : 'Sin fecha')}
                        </p>
                    `).join('')
                    : '<p>Sin movimientos registrados.</p>';

                container.hidden = !container.hidden;
                return;
            }

            if (action === 'review') {
                if (!confirm('¿Iniciar la revisión de este reclamo?')) return;

                const response = await apiRequest(
                    `/api/claims/staff/${id}/review`,
                    { method: 'POST' }
                );

                if (!response.ok) {
                    throw new Error(await errorMessageFrom(
                        response, 'No se pudo iniciar la revisión.'
                    ));
                }

                await loadStaffClaims();
                return;
            }

            if (action === 'resolve' || action === 'reject') {
                const textarea = document.getElementById(`staff-response-${id}`);
                const text = textarea?.value.trim() || '';

                if (!text) {
                    showMessage(
                        staffClaimsMessage,
                        'Debes escribir una respuesta antes de finalizar.',
                        true
                    );
                    return;
                }

                if (text.length > 2000) {
                    showMessage(
                        staffClaimsMessage,
                        'La respuesta no puede superar los 2000 caracteres.',
                        true
                    );
                    return;
                }

                const status = action === 'resolve'
                    ? 'RESOLVED'
                    : 'REJECTED';

                if (!confirm(
                    `¿Confirmas que deseas ${action === 'resolve' ? 'resolver' : 'rechazar'} este reclamo?`
                )) return;

                const response = await apiRequest(
                    `/api/claims/staff/${id}/resolve`,
                    {
                        method: 'POST',
                        body: JSON.stringify({
                            status,
                            response: text
                        })
                    }
                );

                if (!response.ok) {
                    throw new Error(await errorMessageFrom(
                        response, 'No se pudo finalizar el reclamo.'
                    ));
                }

                await loadStaffClaims();
                showMessage(staffClaimsMessage, 'Reclamo actualizado correctamente.');
            }
        } catch (error) {
            showMessage(
                staffClaimsMessage,
                error.message || 'Ocurrió un error.',
                true
            );
        } finally {
            button.disabled = false;
        }
    });
}
if (staffClaimsSearch) {
    staffClaimsSearch.addEventListener('input', () => {
        staffClaimsPage = 1;
        renderStaffClaimsPage();
    });
}

if (staffClaimsPrev) {
    staffClaimsPrev.addEventListener('click', () => {
        if (staffClaimsPage > 1) {
            staffClaimsPage--;
            renderStaffClaimsPage();
        }
    });
}

if (staffClaimsNext) {
    staffClaimsNext.addEventListener('click', () => {
        staffClaimsPage++;
        renderStaffClaimsPage();
    });
}

// =============================================
// SEPARACIÓN DE INVENTARIO Y REPORTES
// =============================================

function organizarPanelesGestion() {
    const gestionNav = document.querySelector('#gestion-nav');
    const salesSummary = document.querySelector('#sales-summary');

    if (!gestionNav || !salesSummary) return;

    // Evitar crear el panel dos veces.
    if (document.querySelector('#gestion-reportes-panel')) return;

    // Crear el panel independiente de Reportes.
    const reportesPanel = document.createElement('section');

    reportesPanel.id = 'gestion-reportes-panel';
    reportesPanel.className = 'panel';
    reportesPanel.dataset.gestionPanel = 'reportes';
    reportesPanel.hidden = true;

    reportesPanel.innerHTML = `
        <p class="eyebrow">REPORTES DE VENTAS</p>
        <h2>Resumen de ventas</h2>
        <p class="muted-text">
            Consulta las unidades vendidas y los ingresos
            acumulados por producto.
        </p>
    `;

    // Mover el listado existente sin destruir sus datos.
    reportesPanel.appendChild(salesSummary);

    // Colocar Reportes dentro de la sección Gestión.
    document.querySelector('#seccion-gestion')
        .appendChild(reportesPanel);
}

organizarPanelesGestion();

// =============================================
// HISTORIAL DE PRODUCTOS RETIRADOS
// =============================================

const inactiveProductsList = document.querySelector('#inactive-products-list');
const inactiveProductsSearch = document.querySelector('#inactive-products-search');
const inactiveProductsPagination = document.querySelector('#inactive-products-pagination');
const inactiveProductsPrev = document.querySelector('#inactive-products-prev');
const inactiveProductsNext = document.querySelector('#inactive-products-next');
const inactiveProductsPageInfo = document.querySelector('#inactive-products-page-info');
const inactiveProductsRefresh = document.querySelector('#inactive-products-refresh');
const inactiveProductsMessage = document.querySelector('#inactive-products-message');

const INACTIVE_PRODUCTS_PER_PAGE = 5;

let inactiveProductsData = [];
let inactiveProductsPage = 1;

function renderInactiveProducts() {
    if (!inactiveProductsList) return;

    const search = (inactiveProductsSearch?.value || '')
        .trim()
        .toLocaleLowerCase('es');

    const filtered = inactiveProductsData.filter(product =>
        [product.id, product.name, product.category]
            .filter(value => value != null)
            .join(' ')
            .toLocaleLowerCase('es')
            .includes(search)
    );

    const totalPages = Math.max(
        1,
        Math.ceil(filtered.length / INACTIVE_PRODUCTS_PER_PAGE)
    );

    inactiveProductsPage = Math.min(inactiveProductsPage, totalPages);

    const start = (inactiveProductsPage - 1) * INACTIVE_PRODUCTS_PER_PAGE;
    const visible = filtered.slice(start, start + INACTIVE_PRODUCTS_PER_PAGE);

    inactiveProductsList.innerHTML = visible.length
        ? visible.map(product => `
            <article class="product">
                <div class="product-info">
                    <h3>${escapeHtml(product.name)}</h3>
                    <p class="product-category">
                        ${escapeHtml(product.category || 'General')}
                    </p>
                    <p class="muted-text">ID: ${Number(product.id)} · Retirado</p>
                </div>

                <div class="price">
                    ${money(product.price)}
                    <span class="stock">
                        ${Number(product.stock)} disponibles
                    </span>

                    <button
                        class="button secondary"
                        type="button"
                        data-restore-product="${Number(product.id)}">
                        Restaurar
                    </button>
                </div>
            </article>
        `).join('')
        : `<p class="muted-text">${
            search
                ? 'No se encontraron productos retirados con esa búsqueda.'
                : 'No hay productos retirados.'
        }</p>`;

    if (inactiveProductsPagination) {
        inactiveProductsPagination.hidden =
            filtered.length <= INACTIVE_PRODUCTS_PER_PAGE;
    }

    if (inactiveProductsPageInfo) {
        inactiveProductsPageInfo.textContent =
            `Página ${inactiveProductsPage} de ${totalPages}`;
    }

    if (inactiveProductsPrev) {
        inactiveProductsPrev.disabled = inactiveProductsPage <= 1;
    }

    if (inactiveProductsNext) {
        inactiveProductsNext.disabled = inactiveProductsPage >= totalPages;
    }
}

async function loadInactiveProducts() {
    if (!inactiveProductsList) return;

    try {
        const response = await apiRequest('/api/products/inactive', {
            method: 'GET'
        });

        if (!response.ok) {
            throw new Error(
                await errorMessageFrom(response, 'No se pudo cargar el historial.')
            );
        }

        inactiveProductsData = await response.json();
        renderInactiveProducts();

    } catch (error) {
        showMessage(inactiveProductsMessage, error.message, true);
    }
}

inactiveProductsSearch?.addEventListener('input', () => {
    inactiveProductsPage = 1;
    renderInactiveProducts();
});

inactiveProductsPrev?.addEventListener('click', () => {
    if (inactiveProductsPage > 1) {
        inactiveProductsPage--;
        renderInactiveProducts();
    }
});

inactiveProductsNext?.addEventListener('click', () => {
    inactiveProductsPage++;
    renderInactiveProducts();
});

inactiveProductsRefresh?.addEventListener('click', loadInactiveProducts);

inactiveProductsList?.addEventListener('click', async event => {
    const button = event.target.closest('button[data-restore-product]');
    if (!button) return;

    const id = button.dataset.restoreProduct;

    if (!confirm('¿Deseas restaurar este producto al catálogo?')) return;

    button.disabled = true;

    try {
        const response = await apiRequest(`/api/products/${id}/restore`, {
            method: 'PATCH'
        });

        if (!response.ok) {
            throw new Error(
                await errorMessageFrom(response, 'No se pudo restaurar el producto.')
            );
        }

        showMessage(inactiveProductsMessage, 'Producto restaurado correctamente.');

        await loadProducts();
        await initManagement();

    } catch (error) {
        showMessage(inactiveProductsMessage, error.message, true);
        button.disabled = false;
    }
});