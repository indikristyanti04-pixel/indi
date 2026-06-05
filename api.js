// API Configuration
const API_BASE = 'https://dummyjson.com';

// Generic fetch dengan error handling
async function fetchAPI(endpoint, options = {}) {
    try {
        const response = await fetch(`${API_BASE}${endpoint}`, options);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        throw new Error(`Gagal terhubung ke server: ${error.message}`);
    }
}

// Product APIs dengan async/await dan try-catch
export async function getProducts({ limit = 12, skip = 0, category = '', search = '', sortBy = '' } = {}) {
    try {
        let endpoint = '';
        
        if (search) {
            endpoint = `/products/search?q=${encodeURIComponent(search)}&limit=${limit}&skip=${skip}`;
        } else if (category && category !== 'all') {
            endpoint = `/products/category/${encodeURIComponent(category)}?limit=${limit}&skip=${skip}`;
        } else {
            endpoint = `/products?limit=${limit}&skip=${skip}`;
        }
        
        const data = await fetchAPI(endpoint);
        
        // Apply sorting client-side
        let products = [...data.products];
        if (sortBy === 'price-asc') {
            products.sort((a, b) => a.price - b.price);
        } else if (sortBy === 'price-desc') {
            products.sort((a, b) => b.price - a.price);
        } else if (sortBy === 'title-asc') {
            products.sort((a, b) => a.title.localeCompare(b.title));
        }
        
        return {
            products,
            total: data.total,
            limit,
            skip
        };
    } catch (error) {
        console.error('Get products error:', error);
        throw new Error(`Tidak dapat memuat produk: ${error.message}`);
    }
}

export async function getProductDetail(id) {
    try {
        if (!id) throw new Error('ID produk tidak valid');
        return await fetchAPI(`/products/${id}`);
    } catch (error) {
        console.error('Get product detail error:', error);
        throw new Error(`Gagal memuat detail produk: ${error.message}`);
    }
}

export async function getAllCategories() {
    try {
        return await fetchAPI('/products/categories');
    } catch (error) {
        console.error('Get categories error:', error);
        throw new Error(`Gagal memuat kategori: ${error.message}`);
    }
}

// CREATE (POST) - Add new product
export async function addProduct(productData) {
    try {
        const response = await fetch(`${API_BASE}/products/add`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(productData)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Product added (simulated):', data);
        return data;
    } catch (error) {
        console.error('Add product error:', error);
        throw new Error(`Gagal menambah produk: ${error.message}. Ingat, DummyJSON hanya simulasi, data akan hilang setelah refresh.`);
    }
}

// UPDATE (PUT) - Edit existing product
export async function updateProduct(id, productData) {
    try {
        if (!id) throw new Error('ID produk tidak valid');
        
        const response = await fetch(`${API_BASE}/products/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(productData)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Product updated (simulated):', data);
        return data;
    } catch (error) {
        console.error('Update product error:', error);
        throw new Error(`Gagal mengupdate produk: ${error.message}`);
    }
}

// DELETE - Remove product
export async function deleteProduct(id) {
    try {
        if (!id) throw new Error('ID produk tidak valid');
        
        const response = await fetch(`${API_BASE}/products/${id}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Product deleted (simulated):', data);
        return data;
    } catch (error) {
        console.error('Delete product error:', error);
        throw new Error(`Gagal menghapus produk: ${error.message}`);
    }
}

// Cart simulation (localStorage)
export function getCart() {
    try {
        const cart = localStorage.getItem('ecommerce_cart');
        return cart ? JSON.parse(cart) : [];
    } catch (error) {
        console.error('Get cart error:', error);
        return [];
    }
}

export function addToCart(productId, productTitle, price) {
    try {
        const cart = getCart();
        const existing = cart.find(item => item.id === productId);
        
        if (existing) {
            existing.quantity += 1;
        } else {
            cart.push({
                id: productId,
                title: productTitle,
                price: price,
                quantity: 1
            });
        }
        
        localStorage.setItem('ecommerce_cart', JSON.stringify(cart));
        updateCartCount();
        return cart;
    } catch (error) {
        console.error('Add to cart error:', error);
        throw new Error('Gagal menambah ke keranjang');
    }
}

export function updateCartCount() {
    try {
        const cart = getCart();
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        const cartCountEl = document.getElementById('cartCount');
        if (cartCountEl) cartCountEl.innerText = totalItems;
    } catch (error) {
        console.error('Update cart count error:', error);
    }
}

export function clearCart() {
    try {
        localStorage.removeItem('ecommerce_cart');
        updateCartCount();
    } catch (error) {
        console.error('Clear cart error:', error);
    }
}