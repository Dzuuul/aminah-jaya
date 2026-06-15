use crate::duitku::models::DuitkuInquiryResponse;
use reqwest::Client;
use serde_json::json;
use tracing::{error, info};

fn format_currency(amount: &str) -> String {
    let num_str = amount.trim();
    if num_str.is_empty() {
        return "Rp 0".to_string();
    }

    let mut result = String::new();
    let chars: Vec<char> = num_str.chars().rev().collect();
    for (i, c) in chars.iter().enumerate() {
        if i > 0 && i % 3 == 0 {
            result.push('.');
        }
        result.push(*c);
    }
    format!("Rp {}", result.chars().rev().collect::<String>())
}

pub async fn send_payment_instruction(
    api_key: String,
    to_email: String,
    order_id: String,
    response: DuitkuInquiryResponse,
) {
    if to_email.is_empty() {
        return;
    }

    let client = Client::new();

    // Construct HTML template components
    let mut instructions = String::new();

    if let Some(va) = &response.va_number {
        if !va.is_empty() {
            instructions.push_str(&format!(
                r#"
                <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin-bottom: 20px; text-align: center;">
                    <p style="margin: 0; color: #4b5563; font-size: 14px;">Nomor Virtual Account</p>
                    <h2 style="margin: 5px 0 0 0; color: #111827; letter-spacing: 2px;">{}</h2>
                </div>
                "#,
                va
            ));
        }
    }

    if let Some(qr) = &response.qr_string {
        if !qr.is_empty() && response.va_number.as_ref().map_or(true, |v| v.is_empty()) {
            instructions.push_str(
                r#"
                <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin-bottom: 20px; text-align: center;">
                    <p style="margin: 0; color: #4b5563; font-size: 14px;">Scan QR Code</p>
                    <p style="margin: 5px 0 0 0; color: #111827;">Silakan buka tautan pembayaran di bawah untuk melakukan scan QRIS.</p>
                </div>
                "#,
            );
        }
    }

    let payment_url_html = if let Some(url) = &response.payment_url {
        if !url.is_empty() {
            format!(
                r#"
                <div style="text-align: center; margin-top: 30px;">
                    <a href="{}" style="display: inline-block; background-color: #e11d48; color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold;">Bayar Sekarang</a>
                </div>
                "#,
                url
            )
        } else {
            String::new()
        }
    } else {
        String::new()
    };

    let amount = response.amount.as_deref().unwrap_or("0");
    let formatted_amount = format_currency(amount);

    let html_content = format!(
        r#"
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Instruksi Pembayaran</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #e11d48; margin-bottom: 5px;">Aminah Jaya</h1>
                <p style="color: #6b7280; margin-top: 0;">Menunggu Pembayaran Pesanan #{order_id}</p>
            </div>

            <div style="background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 30px;">
                <h2 style="margin-top: 0; font-size: 20px; color: #111827;">Halo,</h2>
                <p>Terima kasih telah berbelanja di Aminah Jaya! Pesanan Anda telah kami terima dan saat ini sedang menunggu pembayaran.</p>
                
                <div style="margin: 30px 0;">
                    <p style="margin-bottom: 5px; color: #6b7280;">Total yang harus dibayar:</p>
                    <h3 style="margin-top: 0; font-size: 24px; color: #e11d48;">{formatted_amount}</h3>
                </div>

                {instructions}

                <p style="font-size: 14px; color: #4b5563;">
                    Harap selesaikan pembayaran sesuai nominal di atas. Pesanan Anda akan otomatis diproses setelah pembayaran berhasil dikonfirmasi.
                </p>

                {payment_url_html}
            </div>

            <div style="text-align: center; margin-top: 30px; color: #9ca3af; font-size: 12px;">
                <p>Email ini dikirim secara otomatis, mohon tidak membalas email ini.</p>
                <p>&copy; 2026 Toko Aminah Jaya</p>
            </div>
        </body>
        </html>
        "#,
        order_id = order_id,
        formatted_amount = formatted_amount,
        instructions = instructions,
        payment_url_html = payment_url_html
    );

    let payload = json!({
        "from": "Aminah Jaya <halo@aminahjaya.com>",
        "to": [to_email],
        "subject": format!("Instruksi Pembayaran Pesanan #{}", order_id),
        "html": html_content
    });

    let res = client
        .post("https://api.resend.com/emails")
        .bearer_auth(api_key)
        .json(&payload)
        .send()
        .await;

    match res {
        Ok(r) if r.status().is_success() => {
            info!("Email instruksi pembayaran untuk pesanan {} berhasil dikirim", order_id);
        }
        Ok(r) => {
            let status = r.status();
            let text = r.text().await.unwrap_or_default();
            error!("Gagal mengirim email (Resend API err): {} - {}", status, text);
        }
        Err(e) => {
            error!("Koneksi ke Resend API gagal: {}", e);
        }
    }
}
