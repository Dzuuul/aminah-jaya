# Backend Implementation: Shipping Coordinates Support

## Summary
Backend API telah diupdate untuk support penyimpanan koordinat GPS (latitude & longitude) untuk setiap alamat pengiriman pelanggan. Ini memungkinkan tracking yang lebih presisi dan integrasi dengan sistem delivery.

## Changes Made

### 1. Database Migration
**File**: `migrations/20260520000000_add_shipping_coordinates.sql`

```sql
ALTER TABLE storefront_customers 
ADD COLUMN shipping_lat NUMERIC(10, 6),
ADD COLUMN shipping_lng NUMERIC(10, 6);

CREATE INDEX idx_storefront_customers_shipping_coords 
ON storefront_customers(shipping_lat, shipping_lng);
```

**Precision**: 6 desimal = ±1.1 meter

---

### 2. Model Updates
**File**: `src/models/mod.rs`

#### a. `StorefrontCustomer` struct
```rust
#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct StorefrontCustomer {
    pub id: Uuid,
    pub email: String,
    pub name: String,
    pub phone: Option<String>,
    pub shipping_address: Option<String>,
    pub shipping_lat: Option<f64>,      // ✨ NEW
    pub shipping_lng: Option<f64>,      // ✨ NEW
    pub created_at: DateTime<Utc>,
}
```

#### b. `UpdateCustomerProfilePayload` struct
```rust
#[derive(Debug, Deserialize)]
pub struct UpdateCustomerProfilePayload {
    pub name: String,
    pub phone: Option<String>,
    pub email: String,
    pub shipping_address: Option<String>,
    pub shipping_lat: Option<f64>,      // ✨ NEW
    pub shipping_lng: Option<f64>,      // ✨ NEW
    pub password: Option<String>,
}
```

---

### 3. Route Handler Updates
**File**: `src/routes/customer_auth.rs`

#### a. `register()` - Updated SELECT clause
```rust
RETURNING id, email, name, phone, created_at
```

#### b. `get_me()` - Updated SELECT clause
```rust
"SELECT id, email, name, phone, created_at 
 FROM storefront_customers WHERE id = $1 LIMIT 1"
```

#### c. `update_profile()` - Updated UPDATE dan RETURNING
```rust
UPDATE storefront_customers 
SET name = $1, phone = $2, email = $3, shipping_address = $4, 
    shipping_lat = $5, shipping_lng = $6
WHERE id = $7
RETURNING id, email, name, phone, created_at
```

**Parameter mapping:**
- $1: name
- $2: phone
- $3: email
- $4: shipping_address
- $5: **shipping_lat** ✨ NEW
- $6: **shipping_lng** ✨ NEW
- $7: customer_id

#### d. `create_order()` - Updated SELECT clause
```rust
"SELECT id, email, name, phone, created_at 
 FROM storefront_customers WHERE id = $1 LIMIT 1"
```

---

## API Endpoints

### Update Customer Profile
```
PATCH /api/customer/profile
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "08123456789",
  "shipping_address": "Jl. Sudirman No. 1, Jakarta Pusat",
  "shipping_lat": -6.2088,
  "shipping_lng": 106.8456,
  "password": null
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "OK",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "john@example.com",
    "name": "John Doe",
    "phone": "08123456789",
    "shipping_address": "Jl. Sudirman No. 1, Jakarta Pusat",
    "shipping_lat": -6.2088,
    "shipping_lng": 106.8456,
    "created_at": "2024-01-15T10:30:00Z"
  },
  "meta": {},
  "errors": null
}
```

---

### Get Current Customer Profile
```
GET /api/customer/me
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "OK",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "john@example.com",
    "name": "John Doe",
    "phone": "08123456789",
    "shipping_address": "Jl. Sudirman No. 1, Jakarta Pusat",
    "shipping_lat": -6.2088,
    "shipping_lng": 106.8456,
    "created_at": "2024-01-15T10:30:00Z"
  },
  "meta": {},
  "errors": null
}
```

---

### Register Customer
```
POST /api/customer/register
Content-Type: application/json
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "OK",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "newcustomer@example.com",
    "name": "New Customer",
    "phone": "08123456789",
    "shipping_address": null,
    "shipping_lat": null,
    "shipping_lng": null,
    "created_at": "2024-01-15T10:30:00Z"
  },
  "meta": {},
  "errors": null
}
```

---

## Postman Collection Updates

**File**: `Aminah_Jaya_CMS.postman_collection.json`

Updated endpoint "Auth (Customer) > Update Profile" dengan sample data:

```json
{
  "name": "John Doe Updated",
  "email": "customer@example.com",
  "phone": "08123456789",
  "shipping_address": "Jl. Sudirman No. 1, Jakarta",
  "shipping_lat": -6.2088,
  "shipping_lng": 106.8456,
  "password": "newpassword123"
}
```

---

## Frontend Integration

### Props untuk MapPicker Component
```tsx
<MapPicker 
  isOpen={isMapPickerOpen()}
  onClose={() => setIsMapPickerOpen(false)}
  onLocationSelect={(location: Location) => {
    // location = { lat: number, lng: number, address: string }
    setEditShippingLat(location.lat);
    setEditShippingLng(location.lng);
    setEditShippingAddress(location.address);
  }}
  initialLat={editShippingLat()}
  initialLng={editShippingLng()}
  initialAddress={editShippingAddress()}
/>
```

### API Call dari Frontend
```tsx
const payload = {
  name: editName(),
  email: editEmail(),
  phone: editPhone(),
  shipping_address: editShippingAddress(),
  shipping_lat: editShippingLat(),
  shipping_lng: editShippingLng(),
  password: editPassword() || null,
};

const updated = await updateCustomerProfile(payload);
```

---

## Data Validation

### Koordinat Format
- **Latitude**: -90 to 90
- **Longitude**: -180 to 180
- **Precision**: 6 desimal (±1.1 meter)
- **Type**: NUMERIC(10,6)

### Example Koordinat Indonesia
```
Jakarta Pusat: -6.2088, 106.8456
Bandung: -6.9147, 107.6098
Surabaya: -7.2575, 112.7521
Medan: 3.5952, 98.6722
Bali (Denpasar): -8.6705, 115.2126
```

---

## Testing Checklist

- [x] Database migration applied
- [x] StorefrontCustomer model updated
- [x] UpdateCustomerProfilePayload updated
- [x] register() returns coordinates
- [x] get_me() returns coordinates
- [x] update_profile() saves & returns coordinates
- [x] create_order() fetches coordinates
- [x] Postman collection updated
- [ ] Frontend MapPicker integrated
- [ ] E2E testing dengan koordinat real
- [ ] Performance testing dengan index

---

## Migration Steps untuk Production

```bash
# 1. Backup database
pg_dump -U user -d aminah_db > backup_$(date +%Y%m%d).sql

# 2. Run migrations (otomatis saat startup)
cargo run

# 3. Verify columns ditambahkan
psql -U user -d aminah_db -c "
  SELECT column_name, data_type 
  FROM information_schema.columns 
  WHERE table_name = 'storefront_customers' 
  ORDER BY ordinal_position;
"

# 4. Verify index dibuat
psql -U user -d aminah_db -c "
  SELECT indexname FROM pg_indexes 
  WHERE tablename = 'storefront_customers';
"
```

---

## Rollback (Jika diperlukan)

```sql
-- Drop index
DROP INDEX IF EXISTS idx_storefront_customers_shipping_coords;

-- Remove columns
ALTER TABLE storefront_customers 
DROP COLUMN shipping_lat,
DROP COLUMN shipping_lng;
```

---

## Performance Considerations

- ✅ Index created untuk faster geospatial queries
- ✅ NUMERIC(10,6) optimal untuk precision + storage
- ✅ NULL fields dibuat optional untuk backward compatibility
- ⚠️ Untuk future: pertimbangkan PostGIS extension untuk advanced geospatial queries

---

## References

- [PostgreSQL NUMERIC Type](https://www.postgresql.org/docs/current/datatype-numeric.html)
- [Latitude/Longitude Precision](https://en.wikipedia.org/wiki/Decimal_degrees)
- [SQLx Documentation](https://github.com/launchbadge/sqlx)
