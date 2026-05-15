-- Create legal_pages table
CREATE TABLE IF NOT EXISTS legal_pages (
    key TEXT PRIMARY KEY,
    title_id TEXT NOT NULL,
    content_id TEXT NOT NULL,
    title_en TEXT NOT NULL,
    content_en TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert default legal pages with Midtrans compliant content for Retail
INSERT INTO legal_pages (key, title_id, content_id, title_en, content_en) VALUES
('terms', 'Syarat & Ketentuan', 
'# Syarat & Ketentuan Aminah Jaya

Selamat datang di Aminah Jaya. Dengan menggunakan situs ini, Anda setuju untuk mematuhi syarat dan ketentuan berikut:

## 1. Umum
Layanan kami ditujukan untuk pembelian produk retail kesehatan dan fashion muslim.

## 2. Pemesanan
- Pesanan dianggap sah setelah pembayaran diverifikasi.
- Harga yang tertera sudah termasuk pajak kecuali disebutkan lain.

## 3. Pembayaran
Kami menggunakan **Midtrans** sebagai gerbang pembayaran resmi. Kami menerima berbagai metode pembayaran elektronik.

## 4. Pengiriman
- Barang akan dikirim dalam 1-3 hari kerja setelah pembayaran.
- Biaya pengiriman ditanggung pembeli kecuali ada promo khusus.

## 5. Hubungi Kami
WhatsApp: 0812-3456-7890
Email: admin@aminahjaya.com', 
'Terms & Conditions', 
'# Aminah Jaya Terms & Conditions

Welcome to Aminah Jaya. By using this site, you agree to comply with the following terms:

## 1. General
Our services are intended for the purchase of retail health and muslim fashion products.

## 2. Ordering
- Orders are valid once payment is verified.
- Listed prices include tax unless stated otherwise.

## 3. Payment
We use **Midtrans** as our official payment gateway. We accept various electronic payment methods.

## 4. Shipping
- Items will be shipped within 1-3 business days after payment.
- Shipping costs are borne by the buyer unless there is a special promo.

## 5. Contact Us
WhatsApp: +62 812-3456-7890
Email: admin@aminahjaya.com'),

('privacy', 'Kebijakan Privasi', 
'# Kebijakan Privasi Aminah Jaya

Kami menghargai privasi Anda. Informasi yang kami kumpulkan digunakan semata-mata untuk proses transaksi.

## 1. Data yang Dikumpulkan
Nama, alamat pengiriman, nomor telepon, dan email.

## 2. Keamanan Pembayaran
Data kartu kredit/debit diproses secara aman oleh **Midtrans**. Kami tidak menyimpan data kartu Anda di server kami.

## 3. Penggunaan Data
Kami menggunakan data Anda untuk pengiriman barang dan komunikasi terkait pesanan.', 
'Privacy Policy', 
'# Aminah Jaya Privacy Policy

We value your privacy. Information we collect is used solely for the transaction process.

## 1. Data Collected
Name, shipping address, phone number, and email.

## 2. Payment Security
Credit/debit card data is processed securely by **Midtrans**. We do not store your card data on our servers.

## 3. Data Usage
We use your data for shipping and order-related communication.'),

('refund', 'Kebijakan Pengembalian & Pembatalan', 
'# Kebijakan Pengembalian & Pembatalan

## 1. Pengembalian Barang
- Barang dapat dikembalikan jika cacat produksi atau salah kirim.
- Harus menyertakan video unboxing tanpa jeda.

## 2. Pengembalian Dana (Refund)
- Dana akan dikembalikan jika stok habis setelah pembayaran.
- Proses refund mengikuti ketentuan Midtrans (1-14 hari kerja tergantung metode).

## 3. Pembatalan
Pesanan dapat dibatalkan sebelum proses pengiriman dilakukan.', 
'Refund & Cancellation Policy', 
'# Refund & Cancellation Policy

## 1. Returns
- Items can be returned if there is a manufacturing defect or wrong item sent.
- Must include a continuous unboxing video.

## 2. Refund
- Funds will be refunded if stock is unavailable after payment.
- Refund process follows Midtrans terms (1-14 business days depending on method).

## 3. Cancellation
Orders can be cancelled before the shipping process has started.');
