pub fn generate_reply(message: &str) -> String {
    let msg = message.to_lowercase();
    match msg.trim() {
        "halo" | "hi" => "Halo 👋 Selamat datang di Aminah Jaya Store\nKetik:\n1. produk\n2. harga".to_string(),
        "produk" | "1" => "Berikut adalah daftar produk kami:\n- Produk A\n- Produk B\n- Produk C".to_string(),
        "harga" | "2" => "Berikut adalah informasi harga:\n- Produk A: Rp 10.000\n- Produk B: Rp 20.000\n- Produk C: Rp 30.000".to_string(),
        _ => "Maaf, saya tidak mengerti. Ketik 'halo' untuk melihat menu utama.".to_string(),
    }
}
