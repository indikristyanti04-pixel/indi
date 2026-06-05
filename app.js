// ========== API CONFIG ==========
const API = 'https://dummyjson.com';

// ========== STATE ==========
let state = {
    currentPage: 1,
    currentCategory: 'all',
    searchQuery: '',
    sortBy: 'default',
    totalProducts: 0,
    limit: 12,
    categories: []
};

// ========== DATA PRODUK & KERANJANG ==========
let userAddedProducts = [];
let userUpdatedProducts = {};
let cart = [];

// ========== HELPER FUNCTIONS ==========
function showToast(message, type = 'error') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `${message} <button style="background:none;border:none;color:white;margin-left:10px;cursor:pointer;" onclick="this.parentElement.remove()">×</button>`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

// ========== FUNGSI KERANJANG ==========
function loadCartFromStorage() {
    const savedCart = localStorage.getItem('shopCatalogCart');
    if (savedCart) {
        cart = JSON.parse(savedCart);
        updateCartDisplay();
    }
}

function saveCartToStorage() {
    localStorage.setItem('shopCatalogCart', JSON.stringify(cart));
    updateCartDisplay();
}

function updateCartDisplay() {
    const cartCount = document.getElementById('cartCount');
    if (cartCount) {
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartCount.innerText = totalItems;
    }
}

function addToCart(product) {
    const existingItem = cart.find(item => item.id === product.id);
    
    if (existingItem) {
        existingItem.quantity++;
        showToast(`📦 ${product.title} (${existingItem.quantity})`, 'success');
    } else {
        cart.push({
            id: product.id,
            title: product.title,
            price: product.price,
            quantity: 1
        });
        showToast(`✅ ${product.title} ditambahkan ke keranjang!`, 'success');
    }
    saveCartToStorage();
}

function removeFromCart(productId) {
    const index = cart.findIndex(item => item.id == productId);
    if (index !== -1) {
        const removed = cart[index];
        cart.splice(index, 1);
        showToast(`🗑️ ${removed.title} dihapus`, 'info');
        saveCartToStorage();
        renderCartModal();
    }
}

function updateCartQuantity(productId, newQuantity) {
    const item = cart.find(item => item.id == productId);
    if (item) {
        if (newQuantity <= 0) {
            removeFromCart(productId);
        } else {
            item.quantity = newQuantity;
            saveCartToStorage();
            renderCartModal();
        }
    }
}

function getCartTotal() {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
}

function renderCartModal() {
    const modalBody = document.getElementById('cartModalBody');
    if (!modalBody) return;
    
    if (cart.length === 0) {
        modalBody.innerHTML = '<div class="loading-text">🛒 Keranjang Anda kosong</div>';
        document.getElementById('cartTotal').innerHTML = '<strong>Total: $0</strong>';
        return;
    }
    
    modalBody.innerHTML = cart.map(item => `
        <div style="display:flex; align-items:center; gap:15px; padding:12px; border-bottom:1px solid #eee;">
            <div style="flex:1;">
                <div style="font-weight:bold;">${escapeHtml(item.title)}</div>
                <div style="color:#e94560;">$${item.price}</div>
            </div>
            <div style="display:flex; align-items:center; gap:8px;">
                <button onclick="window.updateCartQuantity(${item.id}, ${item.quantity - 1})" style="width:30px; height:30px; border-radius:5px; border:1px solid #ddd; background:white; cursor:pointer;">-</button>
                <span style="min-width:30px; text-align:center;">${item.quantity}</span>
                <button onclick="window.updateCartQuantity(${item.id}, ${item.quantity + 1})" style="width:30px; height:30px; border-radius:5px; border:1px solid #ddd; background:white; cursor:pointer;">+</button>
            </div>
            <button onclick="window.removeFromCart(${item.id})" style="background:#e94560; color:white; border:none; padding:8px 12px; border-radius:5px; cursor:pointer;">Hapus</button>
        </div>
    `).join('');
    
    const total = getCartTotal();
    document.getElementById('cartTotal').innerHTML = `<strong>Total: $${total.toFixed(2)}</strong>`;
}

function openCartModal() {
    renderCartModal();
    document.getElementById('cartModal').style.display = 'flex';
}

function closeCartModal() {
    document.getElementById('cartModal').style.display = 'none';
}

function checkout() {
    if (cart.length === 0) {
        showToast('Keranjang kosong!', 'error');
        return;
    }
    const total = getCartTotal();
    showToast(`🎉 Checkout berhasil! Total: $${total.toFixed(2)}`, 'success');
    cart = [];
    saveCartToStorage();
    renderCartModal();
    closeCartModal();
}

// ========== API CALLS ==========
async function fetchAPI(endpoint, options = {}) {
    try {
        const res = await fetch(`${API}${endpoint}`, options);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.json();
    } catch (error) {
        throw new Error(`Gagal koneksi: ${error.message}`);
    }
}

async function getProducts() {
    try {
        let endpoint = `/products?limit=${state.limit}&skip=${(state.currentPage-1)*state.limit}`;
        
        if (state.searchQuery) {
            endpoint = `/products/search?q=${state.searchQuery}&limit=${state.limit}&skip=${(state.currentPage-1)*state.limit}`;
        } else if (state.currentCategory !== 'all') {
            endpoint = `/products/category/${state.currentCategory}?limit=${state.limit}&skip=${(state.currentPage-1)*state.limit}`;
        }
        
        const data = await fetchAPI(endpoint);
        let allProducts = [...data.products];
        
        // Gabungkan produk tambahan user
        userAddedProducts.forEach(userProduct => {
            const exists = allProducts.some(p => p.id == userProduct.id);
            if (!exists) allProducts.unshift(userProduct);
        });
        
        // Terapkan update
        allProducts = allProducts.map(p => {
            if (userUpdatedProducts[p.id]) {
                return { ...p, ...userUpdatedProducts[p.id] };
            }
            return p;
        });
        
        // Filter kategori
        if (state.currentCategory !== 'all') {
            allProducts = allProducts.filter(p => p.category === state.currentCategory);
        }
        
        // Filter pencarian
        if (state.searchQuery) {
            const query = state.searchQuery.toLowerCase();
            allProducts = allProducts.filter(p => p.title.toLowerCase().includes(query));
        }
        
        // Sorting
        if (state.sortBy === 'price-asc') allProducts.sort((a,b) => a.price - b.price);
        if (state.sortBy === 'price-desc') allProducts.sort((a,b) => b.price - a.price);
        if (state.sortBy === 'title-asc') allProducts.sort((a,b) => a.title.localeCompare(b.title));
        
        // Pagination
        const start = (state.currentPage - 1) * state.limit;
        const paginatedProducts = allProducts.slice(start, start + state.limit);
        
        return { products: paginatedProducts, total: allProducts.length };
    } catch (error) {
        showToast(error.message);
        return { products: [], total: 0 };
    }
}

async function getCategories() {
    try {
        return await fetchAPI('/products/categories');
    } catch (error) {
        showToast('Gagal memuat kategori');
        return [];
    }
}

async function addProduct(data) {
    try {
        const res = await fetch(`${API}/products/add`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error('Gagal menambah produk');
        return await res.json();
    } catch (error) {
        throw new Error('Gagal menambah produk: ' + error.message);
    }
}

async function updateProduct(id, data) {
    try {
        const isUserProduct = id > 100 || userAddedProducts.some(p => p.id == id);
        
        if (isUserProduct) {
            const index = userAddedProducts.findIndex(p => p.id == id);
            if (index !== -1) {
                userAddedProducts[index] = { ...userAddedProducts[index], ...data };
                showToast(`✅ "${data.title}" berhasil diupdate!`, 'success');
                return userAddedProducts[index];
            }
        }
        
        try {
            const res = await fetch(`${API}/products/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (res.ok) {
                showToast(`✅ Produk berhasil diupdate!`, 'success');
                return await res.json();
            }
        } catch (e) {}
        
        userUpdatedProducts[id] = data;
        showToast(`⚠️ Produk disimpan di memori lokal`, 'info');
        return { id, ...data };
    } catch (error) {
        throw new Error('Gagal update produk: ' + error.message);
    }
}

async function deleteProduct(id) {
    try {
        userAddedProducts = userAddedProducts.filter(p => p.id != id);
        delete userUpdatedProducts[id];
        
        try {
            const res = await fetch(`${API}/products/${id}`, { method: 'DELETE' });
            if (res.ok) return await res.json();
        } catch (e) {}
        
        return { id, isDeleted: true };
    } catch (error) {
        throw new Error('Gagal hapus produk: ' + error.message);
    }
}

async function getProductDetail(id) {
    const localProduct = userAddedProducts.find(p => p.id == id);
    if (localProduct) return localProduct;
    if (userUpdatedProducts[id]) return { id, ...userUpdatedProducts[id] };
    return await fetchAPI(`/products/${id}`);
}

// ========== RENDER FUNCTIONS (TANPA GAMBAR) ==========
function renderProducts(products) {
    const grid = document.getElementById('productsGrid');
    if (!grid) return;
    
    if (!products.length) {
        grid.innerHTML = '<div class="loading-text">Tidak ada produk</div>';
        return;
    }
    
    grid.innerHTML = products.map(p => `
        <div class="product-card" data-id="${p.id}">
            <div class="product-info">
                <div class="product-title">${escapeHtml(p.title)}</div>
                <div class="product-price">$${p.price}</div>
                <div class="product-rating">⭐ ${p.rating || 0}/5</div>
                <div class="product-actions">
                    <button class="add-to-cart-btn" data-id="${p.id}" data-title="${escapeHtml(p.title)}" data-price="${p.price}">🛒 Beli</button>
                    <button class="edit-btn" data-id="${p.id}">✏️ Edit</button>
                    <button class="delete-btn" data-id="${p.id}">🗑️ Hapus</button>
                </div>
            </div>
        </div>
    `).join('');
}

function renderCategories(categories) {
    const container = document.getElementById('categoryList');
    if (!container) return;
    
    const allHtml = `<div class="category-item ${state.currentCategory === 'all' ? 'active' : ''}" data-cat="all">📋 Semua Produk</div>`;
    const catsHtml = categories.map(c => `
        <div class="category-item ${state.currentCategory === c.slug ? 'active' : ''}" data-cat="${c.slug}">🏷️ ${escapeHtml(c.name)}</div>
    `).join('');
    container.innerHTML = allHtml + catsHtml;
    
    document.querySelectorAll('.category-item').forEach(el => {
        el.addEventListener('click', () => {
            state.currentCategory = el.dataset.cat;
            state.currentPage = 1;
            state.searchQuery = '';
            document.getElementById('searchInput').value = '';
            loadAll();
        });
    });
}

function renderPagination(total) {
    const totalPages = Math.ceil(total / state.limit);
    const container = document.getElementById('pagination');
    if (!container) return;
    
    if (totalPages <= 1) {
        container.innerHTML = '';
        return;
    }
    
    let html = '';
    for (let i = 1; i <= Math.min(totalPages, 5); i++) {
        html += `<button class="page-btn ${i === state.currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
    }
    container.innerHTML = html;
    
    document.querySelectorAll('.page-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            state.currentPage = parseInt(btn.dataset.page);
            loadAll();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    });
}

// ========== MAIN FUNCTIONS ==========
async function loadAll() {
    const grid = document.getElementById('productsGrid');
    if (grid) grid.innerHTML = '<div class="loading-text">Loading...</div>';
    
    const { products, total } = await getProducts();
    renderProducts(products);
    renderPagination(total);
    
    let title = '';
    if (state.searchQuery) title = `Hasil: "${state.searchQuery}"`;
    else if (state.currentCategory !== 'all') title = `Kategori: ${state.currentCategory}`;
    else title = 'Semua Produk';
    
    if (userAddedProducts.length > 0) title += ` (+${userAddedProducts.length} produk Anda)`;
    
    const pageTitle = document.getElementById('pageTitle');
    if (pageTitle) pageTitle.innerText = title;
}

async function loadCategories() {
    const cats = await getCategories();
    state.categories = cats;
    renderCategories(cats);
}

// ========== CRUD HANDLERS ==========
async function handleAddEditProduct(e) {
    e.preventDefault();
    
    const id = document.getElementById('editId').value;
    const data = {
        title: document.getElementById('productName').value,
        price: parseFloat(document.getElementById('productPrice').value),
        description: document.getElementById('productDesc').value || 'No description',
        brand: document.getElementById('productBrand').value || 'Unknown',
        category: state.currentCategory !== 'all' ? state.currentCategory : 'general',
        rating: 4.0,
        stock: 100
    };
    
    if (!data.title || isNaN(data.price) || data.price <= 0) {
        showToast('Isi nama dan harga dengan benar');
        return;
    }
    
    try {
        if (id) {
            await updateProduct(id, data);
            closeFormModal();
            await loadAll();
        } else {
            const newProduct = await addProduct(data);
            if (!newProduct.id || newProduct.id > 100) newProduct.id = Date.now();
            newProduct.isUserAdded = true;
            userAddedProducts.unshift(newProduct);
            showToast(`✅ "${newProduct.title}" berhasil ditambahkan!`, 'success');
            closeFormModal();
            state.currentPage = 1;
            await loadAll();
        }
    } catch (error) {
        showToast(error.message, 'error');
    }
}

async function handleDelete(productId) {
    if (!confirm('Yakin hapus produk ini?')) return;
    try {
        await deleteProduct(productId);
        showToast('Produk dihapus!', 'success');
        await loadAll();
    } catch (error) {
        showToast(error.message);
    }
}

async function handleEdit(productId) {
    try {
        const product = await getProductDetail(productId);
        document.getElementById('editId').value = product.id;
        document.getElementById('productName').value = product.title;
        document.getElementById('productPrice').value = product.price;
        document.getElementById('productDesc').value = product.description || '';
        document.getElementById('productBrand').value = product.brand || '';
        document.getElementById('formTitle').innerText = 'Edit Produk';
        document.querySelector('.btn-submit').innerText = 'Simpan Perubahan';
        document.getElementById('formModal').style.display = 'flex';
    } catch (error) {
        showToast(error.message);
    }
}

async function handleDetail(productId) {
    try {
        const p = await getProductDetail(productId);
        
        document.getElementById('modalBody').innerHTML = `
            <h2>${escapeHtml(p.title)}</h2>
            <p>${escapeHtml(p.description || 'Tidak ada deskripsi')}</p>
            <div style="font-size:24px;color:#e94560;margin:15px 0;">$${p.price}</div>
            <div>⭐ Rating: ${p.rating || 0}/5</div>
            <div>📦 Stock: ${p.stock || 100}</div>
            <div>🏷️ Brand: ${p.brand || '-'}</div>
            <button onclick="addToCart({id:${p.id}, title:'${escapeHtml(p.title)}', price:${p.price}})" style="margin-top:20px; width:100%; background:#0f3460; color:white; border:none; padding:12px; border-radius:8px; cursor:pointer;">🛒 Tambah ke Keranjang</button>
            ${p.isUserAdded ? '<div style="color:#0f3460;margin-top:10px;">🟢 Produk tambahan Anda</div>' : ''}
        `;
        document.getElementById('detailModal').style.display = 'flex';
    } catch (error) {
        showToast(error.message);
    }
}

// ========== MODAL CONTROLS ==========
function openAddForm() {
    document.getElementById('editId').value = '';
    document.getElementById('productForm').reset();
    document.getElementById('formTitle').innerText = 'Tambah Produk Baru';
    document.querySelector('.btn-submit').innerText = '+ Tambah Produk';
    document.getElementById('formModal').style.display = 'flex';
}

function closeFormModal() {
    document.getElementById('formModal').style.display = 'none';
}

function closeDetailModal() {
    document.getElementById('detailModal').style.display = 'none';
}

// ========== SEARCH & FILTER ==========
function handleSearch() {
    const searchTerm = document.getElementById('searchInput').value.trim();
    if (searchTerm === '') {
        state.searchQuery = '';
        state.currentPage = 1;
        loadAll();
        return;
    }
    
    const localResults = userAddedProducts.filter(p => p.title.toLowerCase().includes(searchTerm.toLowerCase()));
    if (localResults.length > 0) {
        renderProducts(localResults);
        document.getElementById('pageTitle').innerHTML = `Hasil: "${searchTerm}" <span style="font-size:12px;">(dari produk Anda)</span>`;
        document.getElementById('pagination').innerHTML = '';
        showToast(`Ditemukan ${localResults.length} produk`, 'success');
        return;
    }
    
    state.searchQuery = searchTerm;
    state.currentCategory = 'all';
    state.currentPage = 1;
    loadAll();
}

function resetFilters() {
    state.searchQuery = '';
    state.currentCategory = 'all';
    state.currentPage = 1;
    state.sortBy = 'default';
    document.getElementById('searchInput').value = '';
    document.getElementById('sortSelect').value = 'default';
    loadAll();
    renderCategories(state.categories);
    showToast('Filter direset', 'info');
}

// ========== EXPOSE GLOBAL FUNCTIONS ==========
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.updateCartQuantity = updateCartQuantity;
window.openCartModal = openCartModal;
window.closeCartModal = closeCartModal;
window.checkout = checkout;

// ========== INIT ==========
function init() {
    console.log('App started - Tanpa Gambar');
    loadCartFromStorage();
    loadCategories();
    loadAll();
    
    // Event Listeners
    document.getElementById('searchBtn').addEventListener('click', handleSearch);
    document.getElementById('searchInput').addEventListener('keypress', (e) => { if (e.key === 'Enter') handleSearch(); });
    document.getElementById('resetFilterBtn').addEventListener('click', resetFilters);
    document.getElementById('openAddBtn').addEventListener('click', openAddForm);
    document.getElementById('cancelFormBtn').addEventListener('click', closeFormModal);
    document.getElementById('closeFormBtn').addEventListener('click', closeFormModal);
    document.getElementById('closeDetailBtn').addEventListener('click', closeDetailModal);
    document.getElementById('closeCartBtn').addEventListener('click', closeCartModal);
    document.getElementById('closeCartModalBtn').addEventListener('click', closeCartModal);
    document.getElementById('checkoutBtn').addEventListener('click', checkout);
    document.getElementById('cartIcon').addEventListener('click', openCartModal);
    document.getElementById('productForm').addEventListener('submit', handleAddEditProduct);
    document.getElementById('sortSelect').addEventListener('change', (e) => {
        state.sortBy = e.target.value;
        state.currentPage = 1;
        loadAll();
    });
    
    // Event delegation untuk tombol di grid
    document.getElementById('productsGrid').addEventListener('click', (e) => {
        const addBtn = e.target.closest('.add-to-cart-btn');
        const editBtn = e.target.closest('.edit-btn');
        const deleteBtn = e.target.closest('.delete-btn');
        const card = e.target.closest('.product-card');
        
        if (addBtn) {
            const product = {
                id: parseInt(addBtn.dataset.id),
                title: addBtn.dataset.title,
                price: parseFloat(addBtn.dataset.price)
            };
            addToCart(product);
        } else if (editBtn) {
            handleEdit(editBtn.dataset.id);
        } else if (deleteBtn) {
            handleDelete(deleteBtn.dataset.id);
        } else if (card) {
            handleDetail(card.dataset.id);
        }
    });
    
    // Modal klik luar
    window.onclick = (e) => {
        if (e.target === document.getElementById('detailModal')) closeDetailModal();
        if (e.target === document.getElementById('formModal')) closeFormModal();
        if (e.target === document.getElementById('cartModal')) closeCartModal();
    };
}

// Start
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}