# 🛍️ ShopCatalog - E-Commerce Product Catalog

Aplikasi web satu halaman (SPA) untuk mengelola katalog produk e-commerce.

---

## ✨ Fitur Aplikasi

| Fitur | Method HTTP |
|-------|-------------|
| Lihat daftar produk | GET |
| Cari produk | GET |
| Filter kategori | GET |
| Sorting harga & nama | GET |
| Pagination | GET |
| Tambah produk baru | POST |
| Edit produk | PUT |
| Hapus produk | DELETE |
| Keranjang belanja | LocalStorage |

---

## 📂 Struktur Project
ecommerce-catalog/
├── index.html
├── style.css
├── app.js
└── README.md

---

## 🚀 Cara Membuka Aplikasi

### Cara 1: Langsung Buka File
1. Download atau clone repository ini
2. Buka folder `shopcatalog`
3. Klik dua kali file `index.html`
4. Aplikasi akan terbuka di browser default Anda

### Cara 2: Menggunakan Live Server
1. Buka folder project di **VS Code**
2. Install ekstensi **Live Server**
3. Klik kanan file `index.html`
4. Pilih **Open with Live Server**

---

## 📝 Cara Penggunaan

**Tambah Produk:**
- Isi nama, harga, deskripsi, brand → klik Tambah Produk

**Edit Produk:**
- Klik Edit → ubah data → klik Simpan Perubahan

**Hapus Produk:**
- Klik Hapus → konfirmasi Ya → produk terhapus

**Cari Produk:**
- Ketik nama produk di kotak search → klik Cari

**Filter Kategori:**
- Klik kategori yang diinginkan di sidebar

**Beli Produk:**
- Klik Beli → buka keranjang → checkout

---

## ⚠️ Catatan

Data tidak permanen karena menggunakan mock API DummyJSON. Refresh akan mengembalikan data ke awal. Keranjang tersimpan di LocalStorage.

---
