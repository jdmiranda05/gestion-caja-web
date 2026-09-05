const productsElement = document.querySelector('#products');
const publicProductsElement = document.querySelector('#public-products');
const saleProductElement = document.querySelector('#sale-product');
const saleQuantityElement = document.querySelector('#sale-quantity');
const saleTotalElement = document.querySelector('#sale-total');
const saleMessageElement = document.querySelector('#sale-message');
let products = [];

const money = value => `S/ ${Number(value).toFixed(2)}`;

async function loadProducts() {
    const response = await fetch('/api/products');
    products = await response.json();
    productsElement.innerHTML = products.map(product => `
        <article class="product">
            <div><h3>${product.name}</h3><p>${product.category || 'General'}</p></div>
            <div class="price">${money(product.price)}<span class="stock">${product.stock} disponibles</span></div>
        </article>`).join('');
    publicProductsElement.innerHTML = products.map(product => `
        <div class="public-product"><strong>${product.name}</strong><span>${money(product.price)}</span></div>`).join('');
    saleProductElement.innerHTML = products.map(product =>
        `<option value="${product.id}">${product.name} - ${money(product.price)} (${product.stock})</option>`).join('');
    document.querySelector('#product-count').textContent = products.length;
    document.querySelector('#stock-count').textContent = products.reduce((sum, product) => sum + product.stock, 0);
    updateTotal();
}

async function loadSales() {
    const response = await fetch('/api/sales');
    const sales = await response.json();
    document.querySelector('#sale-count').textContent = sales.length;
}

function updateTotal() {
    const product = products.find(item => String(item.id) === saleProductElement.value);
    const quantity = Number(saleQuantityElement.value || 0);
    saleTotalElement.textContent = product ? money(product.price * quantity) : 'S/ 0.00';
}

document.querySelector('#sale-form').addEventListener('submit', async event => {
    event.preventDefault();
    saleMessageElement.className = 'message';
    saleMessageElement.textContent = 'Registrando venta...';
    const response = await fetch('/api/sales', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            productId: Number(saleProductElement.value),
            quantity: Number(saleQuantityElement.value),
            customerName: document.querySelector('#customer-name').value
        })
    });
    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        saleMessageElement.className = 'message error';
        saleMessageElement.textContent = error.detail || error.message || 'No se pudo registrar la venta.';
        return;
    }
    saleMessageElement.textContent = 'Venta registrada y stock actualizado.';
    event.target.reset();
    await Promise.all([loadProducts(), loadSales()]);
});

saleProductElement.addEventListener('change', updateTotal);
saleQuantityElement.addEventListener('input', updateTotal);
document.querySelector('#refresh-button').addEventListener('click', () => Promise.all([loadProducts(), loadSales()]));
loadProducts().then(loadSales);
