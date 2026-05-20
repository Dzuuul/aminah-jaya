# Maps Integration Guide - Shipping Address with Biteship Maps Widget

## Overview
Pelanggan dapat memilih lokasi pengiriman mereka secara presisi menggunakan Biteship Maps Widget langsung dari dashboard Biteship.

## Technology Stack
- **Biteship Maps Widget** - Embedded map picker untuk pinpoint alamat
- **SolidJS** - Frontend framework
- **api-cms-aminah-jaya** - Backend customer profile and address persistence
- **PostgreSQL / SQLx** - Store coordinate fields

## Setup
1. Tambahkan `VITE_BITESHIP_MAPS_API_KEY` ke file `.env` di `storefront-aminah-jaya`.
2. Pastikan frontend dapat memuat script widget Biteship secara dinamis.
3. Simpan `shipping_lat` dan `shipping_lng` bersama `shipping_address` di backend.

## MapPicker Component
File: `src/components/MapPicker.tsx`

`MapPicker` sekarang memuat widget Biteship secara dinamis dan menerima lokasi terpilih dari event widget.

```tsx
<MapPicker
  isOpen={isMapPickerOpen()}
  onClose={() => setIsMapPickerOpen(false)}
  onLocationSelect={(location) => handleMapLocationSelect(location)}
  initialLat={editShippingLat() || undefined}
  initialLng={editShippingLng() || undefined}
  initialAddress={editShippingAddress() || undefined}
/>
```

## Usage in Profile Page
```tsx
const handleMapLocationSelect = (location) => {
  setEditShippingAddress(location.address);
  setEditShippingLat(location.lat);
  setEditShippingLng(location.lng);
};

const payload = {
  name: profile()?.name || "",
  phone: profile()?.phone || null,
  email: profile()?.email || "",
  shipping_address: editShippingAddress().trim() || null,
  shipping_lat: editShippingLat(),
  shipping_lng: editShippingLng(),
  password: null,
};
await updateCustomerProfile(payload);
```

## Environment Variable
Tambahkan ke `storefront-aminah-jaya/.env`:

```env
VITE_BITESHIP_MAPS_API_KEY=your_biteship_maps_api_key_here
```

## Database Schema

```sql
ALTER TABLE storefront_customers 
ADD COLUMN shipping_lat NUMERIC(10, 6),
ADD COLUMN shipping_lng NUMERIC(10, 6);
```

- **shipping_lat**: Latitude, 6 desimal
- **shipping_lng**: Longitude, 6 desimal
- Presisi yang digunakan = ±1.1 meter (6 desimal)

## API Endpoint

### Update Customer Profile
```
PATCH /api/customer/profile
```

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "08123456789",
  "shipping_address": "Jl. Sudirman No. 1, Jakarta",
  "shipping_lat": -6.2088,
  "shipping_lng": 106.8456,
  "password": null
}
```

## Default Coordinates
Jika tidak ada lokasi terpilih, default coordinate untuk widget adalah:
- Latitude: -6.2088
- Longitude: 106.8456

## Implementation Checklist

- [x] Convert MapPicker component to Biteship Maps Widget
- [x] Integrate MapPicker into profile shipping address flow
- [x] Persist `shipping_lat` and `shipping_lng` on backend
- [x] Add `VITE_BITESHIP_MAPS_API_KEY` support
- [ ] Verify actual Biteship widget script URL and constructor if required
- [ ] Test widget load and selection on staging

## Troubleshooting

### Widget tidak muncul
- Pastikan `VITE_BITESHIP_MAPS_API_KEY` sudah diset
- Pastikan widget script dari Biteship dapat dimuat di browser
- Periksa console browser untuk error script atau CORS

### Lokasi tidak terpilih
- Pastikan widget mengirim event `location:selected`
- Pastikan komponen MapPicker memanggil `onLocationSelect`

## Notes

- Backend `api-cms-aminah-jaya` tetap menjadi tempat terbaik untuk menyimpan alamat pengiriman dan koordinat pelanggan.
- `api-integrasi-aminah-jaya` lebih cocok jika nantinya ingin menambahkan integrasi logistik pihak ketiga seperti perhitungan ongkir atau Biteship shipping API.
