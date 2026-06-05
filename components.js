// Helper function untuk mencegah XSS
function escapeHtml(str) {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// Rendering Components
export function renderProductCard(product, isLocal = false) {
    try {
        return `
            <div class="product-card" data-product-id="${product.id}" data-local="${isLocal}">
                <img class="product-image" src="${product.thumbnail || 'https://placehold.co/400x300?text=No+Image'}" 
                     alt="${escapeHtml(product.title)}" loading="lazy"
                     onerror="this.src='https://placehold.co/400x300?text=Image+Error'">
                <div class="product-info">
                    <h3 class="product-title">${escapeHtml(product.title)}</h3>
                    <div class="product-price">$${Number(product.price).toLocaleString()}</div>
                    <div class="product-rating">⭐ ${product.rating || '0'} / 5</div>
                    <div class="product-stock">📦 Stock: ${product.stock || 'N/A'}</div>
                    <div class="product-actions">
                        <button class="edit-btn" data-id="${product.id}">✏️ Edit</button>
                        <button class="delete-btn" data-id="${product.id}">🗑️ Hapus</button>
                    </div>
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Render product card error:', error);
        return `<div class="error-state">Gagal menampilkan produk</div>`;
    }
}

export function renderProductsGrid(products, containerId) {
    try {
        const container = document.getElementById(containerId);
        if (!container) {
            throw new Error(`Container dengan id "${containerId}" tidak ditemukan`);
        }
        
        if (!products || products.length === 0) {
            container.innerHTML = '<div class="no-products">😞 Tidak ada produk ditemukan</div>';
            return;
        }
        
        container.innerHTML = products.map(p => renderProductCard(p)).join('');
    } catch (error) {
        console.error('Render products grid error:', error);
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = `<div class="error-state">❌ ${error.message}</div>`;
        }
    }
}

export function renderCategories(categories, currentCategory) {
    try {
        const container = document.getElementById('categoryList');
        if (!container) {
            throw new Error('Category container tidak ditemukan');
        }
        
        if (!categories || categories.length === 0) {
            container.innerHTML = '<div class="loading-categories">Tidak ada kategori</div>';
            return;
        }
        
        const allCatHtml = `<div class="category-item ${currentCategory === 'all' ? 'active' : ''}" data-category="all">📋 Semua Produk</div>`;
        const catsHtml = categories.map(cat => `
            <div class="category-item ${currentCategory === cat.slug ? 'active' : ''}" data-category="${cat.slug}">
                🏷️ ${escapeHtml(cat.name)}
            </div>
        `).join('');
        
        container.innerHTML = allCatHtml + catsHtml;
    } catch (error) {
        console.error('Render categories error:', error);
        const container = document.getElementById('categoryList');
        if (container) {
            container.innerHTML = `<div class="error-state">Gagal memuat kategori: ${error.message}</div>`;
        }
    }
}

export function renderPagination(currentPage, totalPages, onPageChange) {
    try {
        const container = document.getElementById('pagination');
        if (!container) return;
        
        if (totalPages <= 1) {
            container.innerHTML = '';
            return;
        }
        
        let pagesHtml = '';
        const maxVisible = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
        let endPage = Math.min(totalPages, startPage + maxVisible - 1);
        
        if (endPage - startPage + 1 < maxVisible) {
            startPage = Math.max(1, endPage - maxVisible + 1);
        }
        
        if (startPage > 1) {
            pagesHtml += `<button class="page-btn" data-page="1">1</button>`;
            if (startPage > 2) pagesHtml += `<span class="page-dots">...</span>`;
        }
        
        for (let i = startPage; i <= endPage; i++) {
            pagesHtml += `<button class="page-btn ${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
        }
        
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) pagesHtml += `<span class="page-dots">...</span>`;
            pagesHtml += `<button class="page-btn" data-page="${totalPages}">${totalPages}</button>`;
        }
        
        container.innerHTML = pagesHtml;
        
        // Attach event listeners
        document.querySelectorAll('.page-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const page = parseInt(btn.dataset.page);
                if (!isNaN(page) && onPageChange) onPageChange(page);
            });
        });
    } catch (error) {
        console.error('Render pagination error:', error);
    }
}

export function renderProductModal(product) {
    try {
        if (!product) return '<div class="error-state">Data produk tidak valid</div>';
        
        return `
            <h2>${escapeHtml(product.title)}</h2>
            <img class="modal-product-img" src="${product.thumbnail || 'https://placehold.co/400x300?text=No+Image'}" 
                 alt="${escapeHtml(product.title)}"
                 onerror="this.src='https://placehold.co/400x300?text=Image+Error'">
            <p>${escapeHtml(product.description || 'Tidak ada deskripsi')}</p>
            <div class="modal-price">$${Number(product.price).toLocaleString()}</div>
            <div>⭐ Rating: ${product.rating || 0} / 5 (${product.reviews?.length || 0} ulasan)</div>
            <div>📦 Stock tersisa: ${product.stock || 0}</div>
            <div>🏷️ Brand: ${escapeHtml(product.brand || '-')}</div>
            <div>📂 Kategori: ${escapeHtml(product.category || '-')}</div>
            <button id="modalAddToCart" class="submit-btn" style="margin-top: 20px; width: 100%;">➕ Tambah ke Keranjang</button>
        `;
    } catch (error) {
        console.error('Render modal error:', error);
        return `<div class="error-state">Gagal menampilkan detail produk: ${error.message}</div>`;
    }
}

// DOM manipulation utilities
export function updateProductInGrid(productId, updatedData) {
    try {
        const productCard = document.querySelector(`.product-card[data-product-id="${productId}"]`);
        if (productCard) {
            const titleEl = productCard.querySelector('.product-title');
            const priceEl = productCard.querySelector('.product-price');
            
            if (titleEl) titleEl.innerText = escapeHtml(updatedData.title);
            if (priceEl) priceEl.innerText = `$${Number(updatedData.price).toLocaleString()}`;
            
            if (updatedData.thumbnail) {
                const imgEl = productCard.querySelector('.product-image');
                if (imgEl) imgEl.src = updatedData.thumbnail;
            }
        }
    } catch (error) {
        console.error('Update product in grid error:', error);
        throw new Error(`Gagal mengupdate tampilan: ${error.message}`);
    }
}

export function removeProductFromGrid(productId) {
    try {
        const productCard = document.querySelector(`.product-card[data-product-id="${productId}"]`);
        if (productCard) {
            productCard.remove();
        }
    } catch (error) {
        console.error('Remove product from grid error:', error);
        throw new Error(`Gagal menghapus dari tampilan: ${error.message}`);
    }
}