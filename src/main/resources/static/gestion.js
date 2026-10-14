/**
 * Gestión para gerente y administrador: CRUD de productos, consultas JPQL y roles.
 * Usa las funciones compartidas de app.js (apiRequest, readJson, escapeHtml, money...).
 */
const productFormElement = document.querySelector('#product-form');
const productFormMessage = document.querySelector('#product-form-message');
const managementMessage = document.querySelector('#management-message');
const usersMessage = document.querySelector('#users-message');

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
    await Promise.all([loadLowStock(), loadSalesSummary()]);

    const usersPanel = document.querySelector('#users-panel');
    usersPanel.hidden = currentUser?.role !== 'ADMIN';

    if (currentUser?.role === 'ADMIN') {
        await loadUsers();
    }
}

/**
 * Dibuja la lista editable de productos.
 */
function renderManagedProducts() {
    document.querySelector('#manage-products').innerHTML = products.map(product => `
        <article class="product">
            <div class="product-info">
                <h3>${escapeHtml(product.name)}</h3>
                <p class="product-category">${escapeHtml(product.category || 'General')}</p>
            </div>
            <div class="price">
                ${money(product.price)}
                <span class="stock">${Number(product.stock)} disponibles</span>
                <button class="button secondary" type="button"
                        data-action="edit" data-id="${product.id}">Editar</button>
                <button class="button secondary" type="button"
                        data-action="restock" data-id="${product.id}">+ Stock</button>
                <button class="button secondary" type="button"
                        data-action="delete" data-id="${product.id}">Eliminar</button>
            </div>
        </article>
    `).join('');
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

        document.querySelector('#users-list').innerHTML = users.map(user => `
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
