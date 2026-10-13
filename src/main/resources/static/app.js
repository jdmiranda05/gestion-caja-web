const productsElement = document.querySelector('#products');
const saleProductElement = document.querySelector('#sale-product');
const saleQuantityElement = document.querySelector('#sale-quantity');
const saleTotalElement = document.querySelector('#sale-total');
const saleMessageElement = document.querySelector('#sale-message');
// Controles de bÃºsqueda, categorÃ­a y paginaciÃ³n del catÃ¡logo.
const productSearchElement = document.querySelector('#product-search');
const categoryFiltersElement = document.querySelector('#category-filters');
const catalogResultsElement = document.querySelector('#catalog-results');
const catalogPaginationElement = document.querySelector('#catalog-pagination');

const PRODUCTS_PER_PAGE = 6;
let selectedCategory = 'all';
let currentCatalogPage = 1;

// Obtiene los elementos visuales del carrito y del historial de pedidos.
const customerPanel = document.querySelector('#customer-panel');
const cartItemsElement = document.querySelector('#cart-items');
const cartTotalElement = document.querySelector('#cart-total');
const cartMessageElement = document.querySelector('#cart-message');
const ordersListElement = document.querySelector('#orders-list');
const ordersMessageElement = document.querySelector('#orders-message');
const checkoutButton = document.querySelector('#checkout-button');
// Elementos de registro y consulta de reclamos del cliente.
const claimFormElement = document.querySelector('#claim-form');
const claimOrderIdElement = document.querySelector('#claim-order-id');
const claimOrderItemIdElement = document.querySelector('#claim-order-item-id');
const claimSelectedProductElement = document.querySelector('#claim-selected-product');
const claimFormMessageElement = document.querySelector('#claim-form-message');
const claimsListElement = document.querySelector('#claims-list');
const claimsMessageElement = document.querySelector('#claims-message');
const submitClaimButton = document.querySelector('#submit-claim-button');

let claimSubmissionInProgress = false;

let products = [];
let currentUser = null;
let csrfInfo = null;

// Guarda el nÃºmero de pedido visible para cada compra del cliente.
let customerOrderNumbers = new Map();

// PaginaciÃ³n del historial de compras.
const ORDERS_PER_PAGE = 6;
let currentOrdersPage = 1;

// PaginaciÃ³n y numeraciÃ³n individual de reclamos.
const CLAIMS_PER_PAGE = 6;
let currentClaimsPage = 1;
let customerClaimNumbers = new Map();

// Mantiene los productos y cantidades seleccionados durante la sesiÃ³n del navegador.
let cart = [];

// Evita confirmar varias compras simultÃ¡neamente desde el botÃ³n del carrito.
let checkoutInProgress = false;

/**
 * Formatea una cantidad numÃ©rica como moneda peruana.
 */
function money(value) {
    return `S/ ${Number(value).toFixed(2)}`;
}

/**
 * Normaliza texto para buscar sin distinguir mayÃºsculas ni tildes.
 */
function normalizeCatalogText(value) {
    return String(value ?? '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLocaleLowerCase('es');
}

/**
 * Obtiene los productos que coinciden con la bÃºsqueda y la categorÃ­a.
 */
function getFilteredProducts() {
    const searchText = normalizeCatalogText(productSearchElement.value.trim());

    return products.filter(product => {
        const name = normalizeCatalogText(product.name);
        const category = normalizeCatalogText(product.category || 'General');

        const matchesSearch =
            !searchText ||
            name.includes(searchText) ||
            category.includes(searchText);

        const matchesCategory =
            selectedCategory === 'all' ||
            normalizeCatalogText(product.category) ===
                normalizeCatalogText(selectedCategory);

        return matchesSearch && matchesCategory;
    });
}

/**
 * Dibuja los botones de paginaciÃ³n del catÃ¡logo.
 */
function renderCatalogPagination(totalPages) {
    if (totalPages <= 1) {
        catalogPaginationElement.innerHTML = '';
        return;
    }

    let buttonsHtml = `
        <button class="page-button" type="button"
                data-page="${currentCatalogPage - 1}"
                ${currentCatalogPage === 1 ? 'disabled' : ''}
                aria-label="PÃ¡gina anterior">
            Anterior
        </button>
    `;

    for (let page = 1; page <= totalPages; page++) {
        buttonsHtml += `
            <button
                class="page-button ${page === currentCatalogPage ? 'active' : ''}"
                type="button"
                data-page="${page}"
                aria-label="PÃ¡gina ${page}"
                aria-current="${page === currentCatalogPage ? 'page' : 'false'}">
                ${page}
            </button>
        `;
    }

    buttonsHtml += `
        <button class="page-button" type="button"
                data-page="${currentCatalogPage + 1}"
                ${currentCatalogPage === totalPages ? 'disabled' : ''}
                aria-label="PÃ¡gina siguiente">
            Siguiente
        </button>
    `;

    catalogPaginationElement.innerHTML = buttonsHtml;
}

/**
 * Actualiza ambas vistas del catÃ¡logo usando los mismos filtros y pÃ¡gina.
 */
function renderCatalog() {
    const filteredProducts = getFilteredProducts();
    const totalProducts = filteredProducts.length;
    const totalPages = Math.ceil(totalProducts / PRODUCTS_PER_PAGE);

    // Mantiene la pÃ¡gina vÃ¡lida cuando cambia la bÃºsqueda o el catÃ¡logo.
    if (totalPages === 0) {
        currentCatalogPage = 1;
    } else {
        currentCatalogPage = Math.min(currentCatalogPage, totalPages);
    }

    const startIndex = (currentCatalogPage - 1) * PRODUCTS_PER_PAGE;
    const visibleProducts = filteredProducts.slice(
        startIndex,
        startIndex + PRODUCTS_PER_PAGE
    );

    productsElement.innerHTML = visibleProducts.map(product => `
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
                ${currentUser?.role === 'CUSTOMER' && Number(product.stock) > 0 ? `
                    <button
                        class="button secondary add-to-cart-button"
                        type="button"
                        data-product-id="${product.id}">
                        Agregar al carrito
                    </button>
                ` : ''}
            </div>
        </article>
    `).join('');


    if (totalProducts === 0) {
        const searchText = productSearchElement.value.trim();

        showMessage(
            document.querySelector('#products-message'),
            searchText || selectedCategory !== 'all'
                ? 'No se encontraron productos con esos filtros.'
                : 'TodavÃ­a no hay productos registrados.'
        );
    } else {
        showMessage(document.querySelector('#products-message'), '');
    }

    if (catalogResultsElement) {
        if (totalProducts === 0) {
            catalogResultsElement.textContent = '0 productos encontrados';
        } else {
            const firstProduct = startIndex + 1;
            const lastProduct = Math.min(
                startIndex + visibleProducts.length,
                totalProducts
            );

            catalogResultsElement.textContent =
                `Mostrando ${firstProduct}â€“${lastProduct} de ${totalProducts} productos`;
        }
    }

    renderCatalogPagination(totalPages);
}

/**
 * Muestra un mensaje de estado y aplica el estilo correspondiente.
 */
function showMessage(element, message, isError = false) {
    if (!element) return;

    element.textContent = message;
    element.classList.toggle('error', isError);
}

/**
 * Obtiene un token CSRF nuevo para las solicitudes protegidas.
 */
async function getCsrfToken() {
    const response = await fetch('/api/users/csrf', {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        credentials: 'same-origin',
        cache: 'no-store'
    });

    if (!response.ok) {
        throw new Error('No se pudo preparar la protecciÃ³n de seguridad. Recarga la pÃ¡gina.');
    }

    csrfInfo = await response.json();

    if (!csrfInfo.token || !csrfInfo.headerName) {
        throw new Error('El servidor no devolviÃ³ un token de seguridad vÃ¡lido.');
    }

    return csrfInfo;
}

/**
 * EnvÃ­a una solicitud JSON incluyendo el token CSRF cuando corresponde.
 */
async function apiRequest(url, options = {}) {
    const requestOptions = { ...options };
    const method = (requestOptions.method || 'GET').toUpperCase();
    const headers = new Headers(requestOptions.headers || {});

    headers.set('Accept', 'application/json');

    if (requestOptions.body && !headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
    }

    if (!['GET', 'HEAD', 'OPTIONS', 'TRACE'].includes(method)) {
        const csrf = await getCsrfToken();
        headers.set(csrf.headerName, csrf.token);
    }

    requestOptions.method = method;
    requestOptions.headers = headers;
    requestOptions.credentials = 'same-origin';

    return fetch(url, requestOptions);
}

/**
 * Lee una respuesta JSON y proporciona un objeto vacÃ­o si no contiene JSON vÃ¡lido.
 */
async function readJson(response) {
    try {
        return await response.json();
    } catch {
        return {};
    }
}

/**
 * Carga los productos y actualiza el catÃ¡logo y el resumen de inventario.
 */
async function loadProducts() {
    const message = document.querySelector('#products-message');

    try {
        const response = await fetch('/api/products', {
            headers: { 'Accept': 'application/json' },
            credentials: 'same-origin'
        });

        if (!response.ok) {
            throw new Error('No se pudo cargar el catÃ¡logo de productos.');
        }

        products = await response.json();

        // Actualiza las tarjetas sin modificar el carrito ni el historial.
        renderCatalog();

        // Actualiza los productos disponibles para registrar una venta.
        saleProductElement.innerHTML = products
            .filter(product => Number(product.stock) > 0)
            .map(product => `
                <option value="${product.id}">
                    ${escapeHtml(product.name)} - ${money(product.price)}
                    (${Number(product.stock)} disponibles)
                </option>
            `).join('');

        document.querySelector('#product-count').textContent = products.length;

        document.querySelector('#stock-count').textContent = products.reduce(
            (sum, product) => sum + Number(product.stock || 0),
            0
        );

        saleProductElement.disabled =
            products.every(product => Number(product.stock) <= 0);

        updateTotal();
        renderCart();
    } catch (error) {
        showMessage(
            message,
            error.message || 'OcurriÃ³ un error al cargar los productos.',
            true
        );
    }
}

/**
 * Escapa texto antes de insertarlo como contenido HTML.
 */
function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, character => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    })[character]);
}

/**
 * Muestra la sección elegida y actualiza el estado de las pestañas.
 */
function mostrarSeccion(idSeccion, boton) {
    document.querySelectorAll(
        '#seccion-catalogo, #seccion-compras, #seccion-reclamos'
    ).forEach(seccion => {
        seccion.classList.remove('seccion-activa');
        seccion.classList.add('seccion-oculta');
    });

    document.querySelectorAll('#nav-secciones .tab-btn').forEach(tab => {
        tab.classList.remove('activo');
        tab.setAttribute('aria-selected', 'false');
    });

    const seccion = document.getElementById(idSeccion);
    seccion.classList.remove('seccion-oculta');
    seccion.classList.add('seccion-activa');
    boton.classList.add('activo');
    boton.setAttribute('aria-selected', 'true');
}

/**
 * Consulta la sesiÃ³n actual y muestra las opciones permitidas para el rol del usuario.
 */
async function loadCurrentUser() {
    const sessionMessage = document.querySelector('#session-message');
    const logoutButton = document.querySelector('#logout-button');
    const loginLink = document.querySelector('#login-link');
    const registerLink = document.querySelector('#register-link');
    const navSecciones = document.querySelector('#nav-secciones');
    const salePanel = document.querySelector('#sale-panel');
    const contentGrid = document.querySelector('#content-grid');
    const saleCount = document.querySelector('#sale-count');

    try {
        const response = await fetch('/api/users/me', {
            headers: { 'Accept': 'application/json' },
            credentials: 'same-origin',
            cache: 'no-store'
        });

        if (response.status === 401 || response.status === 403) {
            // Restablece la vista pÃºblica cuando no hay una sesiÃ³n autenticada.
            currentUser = null;
            salePanel.hidden = true;
            customerPanel.hidden = true;
            registerLink.hidden = false;
            loginLink.hidden = false;
            navSecciones.hidden = true;
            logoutButton.hidden = true;

            contentGrid.classList.add('public-mode');
            saleCount.textContent = 'â€”';

            cart = [];
            renderCart();

            showMessage(
                sessionMessage,
                'Bienvenido. Inicia sesiÃ³n o crea una cuenta para continuar.'
            );

            return;
        }

        if (!response.ok) {
            throw new Error('No se pudo comprobar la sesiÃ³n actual.');
        }

        // Actualiza la interfaz para mostrar Ãºnicamente las opciones de la sesiÃ³n activa.
        currentUser = await response.json();

        navSecciones.hidden = false;
        loginLink.hidden = true;
        registerLink.hidden = true;
        logoutButton.hidden = false;

        showMessage(
            sessionMessage,
            `Hola, ${currentUser.username}. Tu sesiÃ³n estÃ¡ activa.`
        );

        // Identifica los permisos y muestra los paneles correspondientes al rol.
        const canManageSales = ['MANAGER', 'ADMIN'].includes(currentUser.role);
        const isCustomer = currentUser.role === 'CUSTOMER';

        document.querySelector('#tab-compras').hidden = !isCustomer;
        document.querySelector('#tab-reclamos').hidden = !isCustomer;
        salePanel.hidden = !canManageSales;
        customerPanel.hidden = !isCustomer;
        contentGrid.classList.toggle('public-mode', !canManageSales);

        // Vuelve a cargar el catÃ¡logo para mostrar los botones del rol actual.
        await loadProducts();

        // Actualiza el carrito, historial y reclamos cuando inicia sesiÃ³n un cliente.
        if (isCustomer) {
            renderCart();
            await loadMyOrders();
            await loadMyClaims();
        }

        if (canManageSales) {
            await loadSales();
        } else {
            saleCount.textContent = 'â€”';
            showMessage(
                saleMessageElement,
                'Tu cuenta es de cliente. La caja estÃ¡ reservada al personal autorizado.'
            );
        }
    } catch (error) {
        // Muestra las opciones pÃºblicas si no se pudo comprobar la sesiÃ³n.
        currentUser = null;
        salePanel.hidden = true;
        customerPanel.hidden = true;
        loginLink.hidden = false;
        registerLink.hidden = false;
        navSecciones.hidden = true;
        logoutButton.hidden = true;

        contentGrid.classList.add('public-mode');
        saleCount.textContent = 'â€”';

        cart = [];
        renderCart();

        showMessage(
            sessionMessage,
            error.message || 'No se pudo comprobar la sesiÃ³n.',
            true
        );
    }
}

/**
 * Carga las ventas recientes solo cuando el usuario tiene permisos de caja.
 */
async function loadSales() {
    if (!currentUser || !['MANAGER', 'ADMIN'].includes(currentUser.role)) {
        document.querySelector('#sale-count').textContent = 'â€”';
        return;
    }

    try {
        const response = await fetch('/api/sales', {
            headers: { 'Accept': 'application/json' },
            credentials: 'same-origin'
        });

        if (!response.ok) {
            throw new Error(
                response.status === 401 || response.status === 403
                    ? 'No tienes permisos para consultar las ventas.'
                    : 'No se pudieron cargar las ventas.'
            );
        }

        const sales = await response.json();
        document.querySelector('#sale-count').textContent = sales.length;
    } catch (error) {
        document.querySelector('#sale-count').textContent = 'â€”';
        showMessage(saleMessageElement, error.message, true);
    }
}

/**
 * Calcula el importe de la venta segÃºn el producto y la cantidad seleccionados.
 */
function updateTotal() {
    const product = products.find(item => String(item.id) === saleProductElement.value);
    const quantity = Number(saleQuantityElement.value || 0);

    saleTotalElement.textContent =
        product && quantity > 0 ? money(product.price * quantity) : 'S/ 0.00';
}

/**
 * Dibuja los productos del carrito y calcula el importe total.
 */
function renderCart() {
    if (!cartItemsElement || !cartTotalElement) return;

    // Elimina del carrito los productos que ya no aparecen en el catÃ¡logo.
    cart = cart.filter(item =>
        products.some(product => Number(product.id) === item.productId)
    );

    if (cart.length === 0) {
        cartItemsElement.innerHTML = '<p class="muted-text">Tu carrito estÃ¡ vacÃ­o.</p>';
        cartTotalElement.textContent = money(0);
        checkoutButton.disabled = true;
        return;
    }

    let total = 0;

    cartItemsElement.innerHTML = cart.map(item => {
        const product = products.find(
            currentProduct => Number(currentProduct.id) === item.productId
        );

        if (!product) return '';

        const subtotal = Number(product.price) * item.quantity;
        total += subtotal;

        return `
            <article class="cart-item">
                <div>
                    <strong>${escapeHtml(product.name)}</strong>
                    <p>${money(product.price)} por unidad</p>
                    <p>Subtotal: ${money(subtotal)}</p>
                </div>
                <div class="cart-item-actions">
                    <label>
                        Cantidad
                        <input
                            type="number"
                            min="1"
                            max="${Number(product.stock)}"
                            value="${item.quantity}"
                            data-cart-quantity="${item.productId}">
                    </label>
                    <button
                        class="button secondary"
                        type="button"
                        data-remove-cart="${item.productId}">
                        Quitar
                    </button>
                </div>
            </article>
        `;
    }).join('');

    cartTotalElement.textContent = money(total);
    checkoutButton.disabled = checkoutInProgress;
}
/**
 * Agrega un producto al carrito sin superar las unidades disponibles.
 */
function addToCart(productId) {
    if (!currentUser || currentUser.role !== 'CUSTOMER') {
        showMessage(cartMessageElement, 'Inicia sesiÃ³n como cliente para comprar.', true);
        return;
    }

    const product = products.find(item => Number(item.id) === productId);

    if (!product || Number(product.stock) <= 0) {
        showMessage(cartMessageElement, 'Este producto no tiene stock disponible.', true);
        return;
    }

    const cartItem = cart.find(item => item.productId === productId);

    if (cartItem) {
        if (cartItem.quantity >= Number(product.stock)) {
            showMessage(cartMessageElement, 'No puedes agregar mÃ¡s unidades que el stock disponible.', true);
            return;
        }

        cartItem.quantity += 1;
    } else {
        cart.push({ productId, quantity: 1 });
    }

    showMessage(cartMessageElement, `${product.name} se agregÃ³ al carrito.`);
    renderCart();
}

/**
 * Carga y presenta el historial de compras del cliente autenticado.
 */
async function loadMyOrders() {
    if (!currentUser || currentUser.role !== 'CUSTOMER') return;

    showMessage(ordersMessageElement, 'Cargando historial...');

    try {
        const response = await fetch('/api/purchases/my-orders', {
            headers: { 'Accept': 'application/json' },
            credentials: 'same-origin',
            cache: 'no-store'
        });
        const data = await readJson(response);

        if (!response.ok) {
            throw new Error(
                data.message || data.detail || 'No se pudo cargar el historial de compras.'
            );
        }

        if (!Array.isArray(data) || data.length === 0) {
            ordersListElement.innerHTML = '';
            customerOrderNumbers.clear();
            showMessage(ordersMessageElement, 'TodavÃ­a no tienes compras registradas.');
            return;
        }

        // Numera los pedidos de cada cliente desde el mÃ¡s antiguo.
        const chronologicalOrders = [...data].sort((a, b) => {
            const dateA = new Date(a.createdAt).getTime();
            const dateB = new Date(b.createdAt).getTime();
            if (dateA !== dateB) return dateA - dateB;
            return Number(a.id) - Number(b.id);
        });

        customerOrderNumbers = new Map(
            chronologicalOrders.map((order, index) => [Number(order.id), index + 1])
        );

        // Calcula los pedidos que corresponden a la pÃ¡gina actual.
        const totalPages = Math.ceil(data.length / ORDERS_PER_PAGE);

        currentOrdersPage = Math.max(
            1,
            Math.min(currentOrdersPage, totalPages)
        );

        const startIndex = (currentOrdersPage - 1) * ORDERS_PER_PAGE;

        const visibleOrders = data.slice(
            startIndex,
            startIndex + ORDERS_PER_PAGE
        );

        // Actualiza los controles de paginaciÃ³n.
        ordersPaginationElement.hidden = totalPages <= 1;

        ordersPageInfoElement.textContent =
            `PÃ¡gina ${currentOrdersPage} de ${totalPages} Â· ${data.length} compras`;

        ordersPrevButton.disabled = currentOrdersPage === 1;
        ordersNextButton.disabled = currentOrdersPage >= totalPages;

        ordersListElement.innerHTML = visibleOrders.map(order => {
            const date = order.createdAt
                ? new Date(order.createdAt).toLocaleString('es-PE')
                : 'Fecha no disponible';

            const itemsHtml = (order.items || []).map(item => {
                console.log('Pedido:', order.id);
                console.log('Producto completo:', item);
                console.log('ID del producto:', item.id);
                const productName = escapeHtml(item.productName || 'Producto');
                const hasItemId = item.id !== null && item.id !== undefined;

                return `
                    <li class="order-item">
                        <div class="order-item-details">
                            <span>${productName}</span>
                            <span>Ã— ${Number(item.quantity)} â€” ${money(item.lineTotal)}</span>
                        </div>
                        ${hasItemId ? `
                            <button class="button secondary claim-product-button"
                                    type="button"
                                    data-claim-order-id="${Number(order.id)}"
                                    data-claim-order-item-id="${Number(item.id)}"
                                    data-claim-product-name="${productName}">
                                Presentar reclamo
                            </button>
                        ` : `
                            <p class="message">No se pudo identificar este artÃ­culo para reclamar.</p>
                        `}
                    </li>
                `;
            }).join('');

            const orderNumber = customerOrderNumbers.get(Number(order.id)) ?? Number(order.id);
            return `
                <article class="order-card">
                    <div>
                        <strong>Pedido #${orderNumber}</strong>
                        <p>${escapeHtml(date)}</p>
                    </div>
                    <ul>${itemsHtml}</ul>
                    <p><strong>Total: ${money(order.total)}</strong></p>
                </article>
            `;
        }).join('');

        showMessage(ordersMessageElement, '');
    } catch (error) {
        showMessage(
            ordersMessageElement,
            error.message || 'OcurriÃ³ un error al cargar el historial.',
            true
        );
    }
}

function getClaimStatusLabel(status) {
    const labels = {
        PENDING: 'Pendiente',
        IN_REVIEW: 'En revisiÃ³n',
        RESOLVED: 'Resuelto',
        REJECTED: 'Rechazado'
    };
    return labels[status] || status || 'Estado desconocido';
}

/** Carga los reclamos registrados por el cliente autenticado. */
async function loadMyClaims() {
    if (!currentUser || currentUser.role !== 'CUSTOMER') return;

    showMessage(claimsMessageElement, 'Cargando reclamos...');
    try {
        const response = await fetch('/api/claims/my-claims', {
            headers: { 'Accept': 'application/json' },
            credentials: 'same-origin',
            cache: 'no-store'
        });
        const data = await readJson(response);

        if (!response.ok) {
            throw new Error(data.message || data.detail || 'No se pudieron cargar tus reclamos.');
        }

        if (!Array.isArray(data) || data.length === 0) {
            claimsListElement.innerHTML = '';
            customerClaimNumbers.clear();
            currentClaimsPage = 1;
            showMessage(claimsMessageElement, 'TodavÃ­a no has presentado reclamos.');
            return;
        }

        // Ordena los reclamos desde el mÃ¡s antiguo para numerarlos.
        const chronologicalClaims = [...data].sort((a, b) => {
            const dateA = new Date(a.createdAt).getTime();
            const dateB = new Date(b.createdAt).getTime();

            if (dateA !== dateB) return dateA - dateB;

            return Number(a.id) - Number(b.id);
            });

        // Asigna a cada reclamo un nÃºmero propio del cliente.
        customerClaimNumbers = new Map(
                chronologicalClaims.map((claim, index) => [
                Number(claim.id),
                index + 1
                ])
            );

            // Calcula quÃ© reclamos mostrar en la pÃ¡gina actual.
            const totalPages = Math.ceil(data.length / CLAIMS_PER_PAGE);

            currentClaimsPage = Math.max(
                1,
                Math.min(currentClaimsPage, totalPages)
            );

            const startIndex = (currentClaimsPage - 1) * CLAIMS_PER_PAGE;

            const visibleClaims = data.slice(
                startIndex,
                startIndex + CLAIMS_PER_PAGE
            );

            // Muestra la paginaciÃ³n solamente cuando hay mÃ¡s de una pÃ¡gina.
            claimsPaginationElement.hidden = totalPages <= 1;

            // Indica la pÃ¡gina actual y la cantidad de reclamos del cliente.
            claimsPageInfoElement.textContent =
            `PÃ¡gina ${currentClaimsPage} de ${totalPages} Â· ${data.length} reclamos`;

            // Habilita o deshabilita los botones segÃºn corresponda.
            claimsPrevButton.disabled = currentClaimsPage === 1;
            claimsNextButton.disabled = currentClaimsPage >= totalPages;

        claimsListElement.innerHTML = visibleClaims.map(claim => {
            const date = claim.createdAt
                ? new Date(claim.createdAt).toLocaleString('es-PE')
                : 'Fecha no disponible';
            const orderNumber = customerOrderNumbers.get(Number(claim.orderId)) ?? Number(claim.orderId);
            return `
                <article class="claim-card">
                    <div class="claim-card-heading">
                        <strong>Reclamo #${customerClaimNumbers.get(Number(claim.id))}</strong>
                        <span class="claim-status">${escapeHtml(getClaimStatusLabel(claim.status))}</span>
                    </div>
                    <p><strong>Pedido:</strong> #${orderNumber}</p>
                    <p><strong>Producto:</strong> ${escapeHtml(claim.productName || 'Producto')}</p>
                    <p><strong>Motivo:</strong> ${escapeHtml(claim.reason || '')}</p>
                    <p class="claim-description">${escapeHtml(claim.description || '')}</p>
                    <p class="claim-date"><strong>Fecha:</strong> ${escapeHtml(date)}</p>
                </article>
            `;
        }).join('');
        showMessage(claimsMessageElement, '');
    } catch (error) {
        showMessage(
            claimsMessageElement,
            error.message || 'OcurriÃ³ un error al cargar los reclamos.',
            true
        );
    }
}

/** EnvÃ­a un reclamo para un artÃ­culo de una compra del cliente. */
claimFormElement.addEventListener('submit', async event => {
    event.preventDefault();
    if (claimSubmissionInProgress) return;

    if (!currentUser || currentUser.role !== 'CUSTOMER') {
        showMessage(claimFormMessageElement, 'Inicia sesiÃ³n como cliente para presentar un reclamo.', true);
        return;
    }

    const orderId = Number(claimOrderIdElement.value);
    const orderItemId = Number(claimOrderItemIdElement.value);
    const reason = document.querySelector('#claim-reason').value;
    const description = document.querySelector('#claim-description').value.trim();

    if (!Number.isInteger(orderId) || orderId <= 0 || !Number.isInteger(orderItemId) || orderItemId <= 0) {
        showMessage(claimFormMessageElement, 'Selecciona un artÃ­culo de tu historial de compras.', true);
        return;
    }
    if (!reason || !description) {
        showMessage(claimFormMessageElement, 'Completa el motivo y la descripciÃ³n del reclamo.', true);
        return;
    }

    claimSubmissionInProgress = true;
    submitClaimButton.disabled = true;
    showMessage(claimFormMessageElement, 'Registrando reclamo...');

    try {
        const response = await apiRequest('/api/claims', {
            method: 'POST',
            body: JSON.stringify({ orderId, orderItemId, reason, description })
        });
        const data = await readJson(response);

        if (!response.ok) {
            throw new Error(
                data.message || data.detail ||
                (response.status === 401
                    ? 'Tu sesiÃ³n ha caducado. Inicia sesiÃ³n nuevamente.'
                    : response.status === 403
                        ? 'No tienes permiso para presentar este reclamo.'
                        : 'No se pudo registrar el reclamo.')
            );
        }

        claimFormElement.reset();
        claimSelectedProductElement.textContent = 'Selecciona un producto de tu historial de compras.';
        showMessage(claimFormMessageElement, 'Reclamo registrado correctamente.');
        await loadMyClaims();
    } catch (error) {
        showMessage(
            claimFormMessageElement,
            error.message || 'OcurriÃ³ un error al enviar el reclamo.',
            true
        );
    } finally {
        claimSubmissionInProgress = false;
        submitClaimButton.disabled = false;
    }
});

/**
 * EnvÃ­a la compra al servidor y actualiza el catÃ¡logo tras la confirmaciÃ³n.
 */
async function checkout() {
    if (checkoutInProgress) return;

    if (!currentUser || currentUser.role !== 'CUSTOMER') {
        showMessage(cartMessageElement, 'Debes iniciar sesiÃ³n como cliente.', true);
        return;
    }

    if (cart.length === 0) {
        showMessage(cartMessageElement, 'Agrega al menos un producto antes de comprar.', true);
        return;
    }

    checkoutInProgress = true;
    checkoutButton.disabled = true;
    showMessage(cartMessageElement, 'Procesando tu compra...');

    try {
        const response = await apiRequest('/api/purchases', {
            method: 'POST',
            body: JSON.stringify({
                items: cart.map(item => ({
                    productId: item.productId,
                    quantity: item.quantity
                }))
            })
        });

        const data = await readJson(response);

        if (!response.ok) {
            throw new Error(
                data.message || data.detail ||
                (response.status === 401
                    ? 'Tu sesiÃ³n ha caducado. Inicia sesiÃ³n nuevamente.'
                    : response.status === 403
                        ? 'No tienes permiso para realizar esta compra.'
                        : 'No se pudo completar la compra.')
            );
        }

        // VacÃ­a el carrito solo cuando el servidor confirma la compra.
        cart = [];

        await loadProducts();
        renderCart();
        await loadMyOrders();

        const customerOrderNumber =
            customerOrderNumbers.get(Number(data.id)) ?? Number(data.id);

        showMessage(
            cartMessageElement,
            `Â¡Compra realizada correctamente! Pedido #${customerOrderNumber}.`
        );
    } catch (error) {
        showMessage(
            cartMessageElement,
            error.message || 'OcurriÃ³ un error al procesar la compra.',
            true
        );
    } finally {
        checkoutInProgress = false;
        renderCart();
    }
}

/**
 * Busca productos por nombre o categorÃ­a.
 */
if (productSearchElement) {
    productSearchElement.addEventListener('input', () => {
        currentCatalogPage = 1;
        renderCatalog();
    });
}
/**
 * Filtra el catÃ¡logo al seleccionar una categorÃ­a.
 */
if (categoryFiltersElement) {
    categoryFiltersElement.addEventListener('click', event => {
        const button = event.target.closest('[data-category]');

        if (!button) return;

        selectedCategory = button.dataset.category;
        currentCatalogPage = 1;

        categoryFiltersElement
            .querySelectorAll('[data-category]')
            .forEach(categoryButton => {
                const isActive =
                    categoryButton.dataset.category === selectedCategory;

                categoryButton.classList.toggle('active', isActive);
                categoryButton.setAttribute(
                    'aria-pressed',
                    String(isActive)
                );
            });

        renderCatalog();
    });
}

/**
 * Cambia de pÃ¡gina dentro del catÃ¡logo.
 */
if (catalogPaginationElement) {
    catalogPaginationElement.addEventListener('click', event => {
        const button = event.target.closest('[data-page]');

        if (!button || button.disabled) return;

        const requestedPage = Number(button.dataset.page);

        if (!Number.isInteger(requestedPage) || requestedPage < 1) {
            return;
        }

        currentCatalogPage = requestedPage;
        renderCatalog();
    });
}

/**
 * Conecta los botones para agregar, quitar y cambiar cantidades del carrito.
 */
productsElement.addEventListener('click', event => {
    const button = event.target.closest('.add-to-cart-button');

    if (!button) return;

    addToCart(Number(button.dataset.productId));
});

/**
 * Actualiza la cantidad seleccionada y respeta el stock del producto.
 */
cartItemsElement.addEventListener('change', event => {
    const input = event.target.closest('[data-cart-quantity]');

    if (!input) return;

    const productId = Number(input.dataset.cartQuantity);
    const quantity = Number(input.value);
    const product = products.find(item => Number(item.id) === productId);
    const cartItem = cart.find(item => item.productId === productId);

    if (!product || !cartItem) return;

    if (!Number.isInteger(quantity) || quantity < 1) {
        showMessage(cartMessageElement, 'La cantidad debe ser un nÃºmero entero mayor que cero.', true);
        renderCart();
        return;
    }

    if (quantity > Number(product.stock)) {
        showMessage(cartMessageElement, 'La cantidad supera el stock disponible.', true);
        renderCart();
        return;
    }

    cartItem.quantity = quantity;
    showMessage(cartMessageElement, '');
    renderCart();
});

/**
 * Quita del carrito el producto seleccionado.
 */
cartItemsElement.addEventListener('click', event => {
    const button = event.target.closest('[data-remove-cart]');

    if (!button) return;

    const productId = Number(button.dataset.removeCart);
    cart = cart.filter(item => item.productId !== productId);

    showMessage(cartMessageElement, 'Producto eliminado del carrito.');
    renderCart();
});

/**
 * VacÃ­a el carrito sin registrar una compra.
 */
document.querySelector('#clear-cart-button').addEventListener('click', () => {
    cart = [];
    showMessage(cartMessageElement, 'El carrito estÃ¡ vacÃ­o.');
    renderCart();
});

/**
 * Confirma el pedido cuando el cliente pulsa el botÃ³n de compra.
 */
checkoutButton.addEventListener('click', checkout);

/**
 * Permite actualizar manualmente el historial de compras.
 */
document.querySelector('#refresh-orders-button').addEventListener('click', loadMyOrders);

// Botones de paginaciÃ³n del historial de compras.
const ordersPaginationElement = document.querySelector('#orders-pagination');
const ordersPrevButton = document.querySelector('#orders-prev-button');
const ordersNextButton = document.querySelector('#orders-next-button');
const ordersPageInfoElement = document.querySelector('#orders-page-info');

// Retrocede una pÃ¡gina.
ordersPrevButton.addEventListener('click', async () => {
    if (currentOrdersPage <= 1) return;

    currentOrdersPage--;
    await loadMyOrders();
});

// Avanza una pÃ¡gina.
ordersNextButton.addEventListener('click', async () => {
    currentOrdersPage++;
    await loadMyOrders();
});

document.querySelector('#refresh-claims-button').addEventListener('click', loadMyClaims);

// Controles de paginaciÃ³n del historial de reclamos.
const claimsPaginationElement = document.querySelector('#claims-pagination');
const claimsPrevButton = document.querySelector('#claims-prev-button');
const claimsNextButton = document.querySelector('#claims-next-button');
const claimsPageInfoElement = document.querySelector('#claims-page-info');

// Retrocede una pÃ¡gina de reclamos.
claimsPrevButton.addEventListener('click', async () => {
    if (currentClaimsPage <= 1) return;

    currentClaimsPage--;
    await loadMyClaims();
});

// Avanza una pÃ¡gina de reclamos.
claimsNextButton.addEventListener('click', async () => {
    currentClaimsPage++;
    await loadMyClaims();
});

// Permite seleccionar un artÃ­culo del historial para completar el formulario de reclamo.
ordersListElement.addEventListener('click', event => {
    const button = event.target.closest('.claim-product-button');
    if (!button) return;

    if (!currentUser || currentUser.role !== 'CUSTOMER') {
        showMessage(claimFormMessageElement, 'Inicia sesiÃ³n como cliente para presentar un reclamo.', true);
        return;
    }

    claimOrderIdElement.value = button.dataset.claimOrderId;
    claimOrderItemIdElement.value = button.dataset.claimOrderItemId;
    claimSelectedProductElement.textContent = `Producto seleccionado: ${button.dataset.claimProductName}`;
    showMessage(claimFormMessageElement, '');
    claimFormElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
});

/**
 * Registra una venta y muestra la boleta si el servidor confirma la operaciÃ³n.
 */
document.querySelector('#sale-form').addEventListener('submit', async event => {
    event.preventDefault();

    if (!currentUser || !['MANAGER', 'ADMIN'].includes(currentUser.role)) {
        showMessage(saleMessageElement, 'Debes iniciar sesiÃ³n con una cuenta autorizada para registrar ventas.', true);
        return;
    }

    const quantity = Number(saleQuantityElement.value);

    if (!Number.isInteger(quantity) || quantity < 1) {
        showMessage(saleMessageElement, 'Ingresa una cantidad entera mayor que cero.', true);
        return;
    }

    const product = products.find(item => String(item.id) === saleProductElement.value);

    if (!product || quantity > Number(product.stock)) {
        showMessage(saleMessageElement, 'Verifica que el producto tenga stock suficiente.', true);
        return;
    }

    const submitButton = event.currentTarget.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    showMessage(saleMessageElement, 'Registrando venta...');

    try {
        const response = await apiRequest('/api/sales', {
            method: 'POST',
            body: JSON.stringify({
                productId: Number(saleProductElement.value),
                quantity,
                customerName: document.querySelector('#customer-name').value.trim()
            })
        });

        const data = await readJson(response);

        if (!response.ok) {
            throw new Error(
                data.message || data.detail ||
                (response.status === 401
                    ? 'Tu sesiÃ³n ha caducado. Inicia sesiÃ³n nuevamente.'
                    : response.status === 403
                        ? 'No tienes permisos para registrar ventas.'
                        : 'No se pudo registrar la venta.')
            );
        }

        showMessage(saleMessageElement, 'Venta registrada y stock actualizado.');
        event.currentTarget.reset();

        await loadProducts();
        await loadSales();

        if (data.id) {
            await showReceipt(data.id);
        }
    } catch (error) {
        showMessage(saleMessageElement, error.message || 'OcurriÃ³ un error al registrar la venta.', true);
    } finally {
        submitButton.disabled = false;
        updateTotal();
    }
});

/**
 * Cierra la sesiÃ³n actual enviando el token CSRF requerido por Spring Security.
 */
document.querySelector('#logout-button').addEventListener('click', async () => {
    const logoutButton = document.querySelector('#logout-button');
    const sessionMessage = document.querySelector('#session-message');

    logoutButton.disabled = true;

    try {
        const response = await apiRequest('/logout', { method: 'POST' });

        if (!response.ok) {
            throw new Error('No se pudo cerrar la sesiÃ³n.');
        }

        window.location.assign('/');
    } catch (error) {
        showMessage(sessionMessage, error.message || 'OcurriÃ³ un error al cerrar la sesiÃ³n.', true);
        logoutButton.disabled = false;
    }
});

/**
 * Actualiza el total cuando cambia el producto o la cantidad.
 */
saleProductElement.addEventListener('change', updateTotal);
saleQuantityElement.addEventListener('input', updateTotal);

/**
 * Recarga el catÃ¡logo y, cuando corresponde, las ventas recientes.
 */
document.querySelector('#refresh-button').addEventListener('click', async () => {
    await loadProducts();
    await loadSales();
});

/**
 * Obtiene la boleta de una venta y muestra sus importes en el modal.
 */
async function showReceipt(saleId) {
    try {
        const response = await fetch(`/api/sales/${encodeURIComponent(saleId)}/receipt`, {
            headers: { 'Accept': 'application/json' },
            credentials: 'same-origin'
        });

        if (!response.ok) {
            throw new Error('No se pudo obtener la boleta de venta.');
        }

        const receipt = await response.json();

        document.getElementById('ticketNumber').textContent = receipt.receiptNumber;
        document.getElementById('ticketDate').textContent =
            new Date(receipt.issueDate).toLocaleString('es-PE');
        document.getElementById('ticketQty').textContent = receipt.quantity;
        document.getElementById('ticketProduct').textContent = receipt.productName;
        document.getElementById('ticketUnitPrice').textContent =
            `S/. ${Number(receipt.unitPrice).toFixed(2)}`;
        document.getElementById('ticketItemTotal').textContent =
            `S/. ${Number(receipt.total).toFixed(2)}`;

        // Calcula el subtotal y el IGV incluido en el total, segÃºn la tasa usada por el proyecto.
        const total = Number(receipt.total);
        const subtotal = total / 1.18;
        const igv = total - subtotal;

        document.getElementById('ticketSubtotal').textContent = subtotal.toFixed(2);
        document.getElementById('ticketIgv').textContent = igv.toFixed(2);
        document.getElementById('ticketTotal').textContent = total.toFixed(2);

        document.getElementById('receiptModalBackdrop').style.display = 'flex';
    } catch (error) {
        console.error('Error al cargar la boleta:', error);
        showMessage(saleMessageElement, error.message || 'OcurriÃ³ un error al cargar la boleta.', true);
    }
}

/**
 * Cierra la ventana de la boleta de venta.
 */
function closeReceiptModal() {
    document.getElementById('receiptModalBackdrop').style.display = 'none';
}

/**
 * Abre el diÃ¡logo de impresiÃ³n para imprimir la boleta o guardarla como PDF.
 */
function printReceiptTicket() {
    window.print();
}

/**
 * Inicializa el catÃ¡logo y verifica si existe una sesiÃ³n autenticada.
 */
async function initializeApp() {
    await loadProducts();
    await loadCurrentUser();
}

initializeApp();