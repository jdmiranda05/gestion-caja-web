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
    const data = await response.json();
    saleMessageElement.textContent = 'Venta registrada y stock actualizado.';
    event.target.reset();
    await Promise.all([loadProducts(), loadSales()]);
    showReceipt(data.id);
});

saleProductElement.addEventListener('change', updateTotal);
saleQuantityElement.addEventListener('input', updateTotal);
document.querySelector('#refresh-button').addEventListener('click', () => Promise.all([loadProducts(), loadSales()]));
loadProducts().then(loadSales);

// ==========================================
// FUNCIONES PARA LA BOLETA DE VENTA
// ==========================================

async function showReceipt(saleId) {
    try {
        const response = await fetch('/api/sales/' + saleId + '/receipt');
        if (!response.ok) {
            alert('No se pudo obtener la boleta de venta.');
            return;
        }
        const receipt = await response.json();

        // Rellenar datos en el ticket
        document.getElementById('ticketNumber').innerText = receipt.receiptNumber;
        document.getElementById('ticketDate').innerText = new Date(receipt.issueDate).toLocaleString();
        document.getElementById('ticketQty').innerText = receipt.quantity;
        document.getElementById('ticketProduct').innerText = receipt.productName;
        document.getElementById('ticketUnitPrice').innerText = 'S/. ' + Number(receipt.unitPrice).toFixed(2);
        document.getElementById('ticketItemTotal').innerText = 'S/. ' + Number(receipt.total).toFixed(2);

        // Calculos de IGV y Subtotal (18%)
        const total = Number(receipt.total);
        const subtotal = total / 1.18;
        const igv = total - subtotal;

        document.getElementById('ticketSubtotal').innerText = subtotal.toFixed(2);
        document.getElementById('ticketIgv').innerText = igv.toFixed(2);
        document.getElementById('ticketTotal').innerText = total.toFixed(2);

        // Mostrar el modal
        document.getElementById('receiptModalBackdrop').style.display = 'flex';
    } catch (error) {
        console.error('Error al cargar la boleta:', error);
        alert('Ocurrio un error al cargar la boleta.');
    }
}

function closeReceiptModal() {
    document.getElementById('receiptModalBackdrop').style.display = 'none';
}

function printReceiptTicket() {
    window.print();
}
