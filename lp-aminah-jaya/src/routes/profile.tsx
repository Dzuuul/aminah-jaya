import { createSignal, createResource, Show, onMount, For, createEffect } from "solid-js";
import { A, useNavigate, useSearchParams } from "@solidjs/router";
import { getMeCustomer, updateCustomerProfile, getCustomerOrders, getFavorites, removeFavorite, formatCurrency } from "~/lib/api";
import Navbar from "~/components/Navbar";
import Footer from "~/components/Footer";
import Loading from "~/components/ui/Loading";

import { setCustomerProfile } from "~/lib/auth-store";

export default function Profile() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Tab control: 'profile' | 'orders' | 'wishlist' | 'shipping'
  const [activeTab, setActiveTab] = createSignal<"profile" | "orders" | "wishlist" | "shipping">("profile");

  createEffect(() => {
    const tab = searchParams.tab;
    if (tab === "profile" || tab === "orders" || tab === "wishlist" || tab === "shipping") {
      setActiveTab(tab);
    }
  });

  // Profile data resource
  const [profile, { refetch: refetchProfile }] = createResource(
    () => typeof window !== "undefined",
    async (isClient) => {
      if (!isClient) return null;
      return await getMeCustomer();
    }
  );

  // Orders data resource
  const [orders] = createResource(
    () => activeTab() === "orders",
    async () => {
      try {
        return await getCustomerOrders();
      } catch (err) {
        console.error(err);
        return [];
      }
    }
  );

  // Wishlist data resource
  const [favorites, { refetch: refetchFavorites }] = createResource(
    () => activeTab() === "wishlist",
    async () => {
      try {
        return await getFavorites();
      } catch (err) {
        console.error(err);
        return [];
      }
    }
  );

  // Form edit states for personal info
  const [isEditingProfile, setIsEditingProfile] = createSignal(false);
  const [editName, setEditName] = createSignal("");
  const [editPhone, setEditPhone] = createSignal("");
  const [editEmail, setEditEmail] = createSignal("");
  const [editPassword, setEditPassword] = createSignal("");
  const [profileError, setProfileError] = createSignal("");
  const [profileSuccess, setProfileSuccess] = createSignal("");
  const [savingProfile, setSavingProfile] = createSignal(false);

  // Shipping edit states
  const [isEditingShipping, setIsEditingShipping] = createSignal(false);
  const [editShippingAddress, setEditShippingAddress] = createSignal("");
  const [shippingError, setShippingError] = createSignal("");
  const [shippingSuccess, setShippingSuccess] = createSignal("");
  const [savingShipping, setSavingShipping] = createSignal(false);

  onMount(() => {
    if (!localStorage.getItem("customer_token")) {
      navigate("/login");
    }
  });

  const handleLogout = () => {
    localStorage.removeItem("customer_token");
    localStorage.removeItem("customer_profile");
    setCustomerProfile(null);
    navigate("/login");
  };

  const startEditingProfile = () => {
    const data = profile();
    if (data) {
      setEditName(data.name || "");
      setEditPhone(data.phone || "");
      setEditEmail(data.email || "");
      setEditPassword("");
      setProfileError("");
      setProfileSuccess("");
      setIsEditingProfile(true);
    }
  };

  const handleSaveProfile = async (e: Event) => {
    e.preventDefault();
    if (!editName().trim()) {
      setProfileError("Nama lengkap tidak boleh kosong");
      return;
    }
    if (!editEmail().trim()) {
      setProfileError("Email tidak boleh kosong");
      return;
    }

    setSavingProfile(true);
    setProfileError("");
    setProfileSuccess("");

    try {
      const payload = {
        name: editName().trim(),
        phone: editPhone().trim() || null,
        email: editEmail().trim(),
        shipping_address: profile()?.shipping_address || null,
        password: editPassword().trim() || null,
      };

      const updated = await updateCustomerProfile(payload);
      localStorage.setItem("customer_profile", JSON.stringify(updated));
      setCustomerProfile(updated);
      
      await refetchProfile();
      setProfileSuccess("Profil berhasil diperbarui!");
      setTimeout(() => {
        setIsEditingProfile(false);
        setProfileSuccess("");
      }, 1500);
    } catch (err: any) {
      setProfileError(err.message || "Gagal memperbarui profil");
    } finally {
      setSavingProfile(false);
    }
  };

  const startEditingShipping = () => {
    const data = profile();
    setEditShippingAddress(data?.shipping_address || "");
    setShippingError("");
    setShippingSuccess("");
    setIsEditingShipping(true);
  };

  const handleSaveShipping = async (e: Event) => {
    e.preventDefault();
    setSavingShipping(true);
    setShippingError("");
    setShippingSuccess("");

    try {
      const payload = {
        name: profile()?.name || "",
        phone: profile()?.phone || null,
        email: profile()?.email || "",
        shipping_address: editShippingAddress().trim() || null,
        password: null,
      };

      const updated = await updateCustomerProfile(payload);
      localStorage.setItem("customer_profile", JSON.stringify(updated));
      setCustomerProfile(updated);

      await refetchProfile();
      setShippingSuccess("Alamat pengiriman berhasil diperbarui!");
      setTimeout(() => {
        setIsEditingShipping(false);
        setShippingSuccess("");
      }, 1500);
    } catch (err: any) {
      setShippingError(err.message || "Gagal memperbarui alamat");
    } finally {
      setSavingShipping(false);
    }
  };

  const handleRemoveFavorite = async (favId: string) => {
    try {
      await removeFavorite(favId);
      await refetchFavorites();
    } catch (err) {
      console.error("Gagal menghapus wishlist:", err);
    }
  };

  return (
    <div class="min-h-screen bg-[#f8f9fa]">
      <Navbar />
      <main class="profile-page-container">
        <Show when={!profile.loading} fallback={<div class="py-20"><Loading message="Memuat profil..." /></div>}>
          <div class="profile-content">
            {/* Sidebar Column */}
            <div class="profile-sidebar">
              <div class="profile-user-card">
                <div class="user-avatar-large">
                  {profile()?.name?.charAt(0) || "U"}
                </div>
                <div class="profile-user-details">
                  <h2 class="user-name-display">{profile()?.name}</h2>
                  <p class="user-email-display">{profile()?.email}</p>
                  <div class="user-badge-premium">Member Gold</div>
                </div>
              </div>

              <nav class="profile-nav">
                <button 
                  class={`profile-nav-item ${activeTab() === "profile" ? "active" : ""}`}
                  onClick={() => { setActiveTab("profile"); setIsEditingProfile(false); }}
                >
                  <span class="material-symbols-outlined">person</span>
                  Profil Saya
                </button>
                <button 
                  class={`profile-nav-item ${activeTab() === "orders" ? "active" : ""}`}
                  onClick={() => setActiveTab("orders")}
                >
                  <span class="material-symbols-outlined">shopping_bag</span>
                  Pesanan Saya
                </button>
                <button 
                  class={`profile-nav-item ${activeTab() === "wishlist" ? "active" : ""}`}
                  onClick={() => setActiveTab("wishlist")}
                >
                  <span class="material-symbols-outlined">favorite</span>
                  Wishlist
                </button>
                <button 
                  class={`profile-nav-item ${activeTab() === "shipping" ? "active" : ""}`}
                  onClick={() => { setActiveTab("shipping"); setIsEditingShipping(false); }}
                >
                  <span class="material-symbols-outlined">location_on</span>
                  Alamat Pengiriman
                </button>
                <div class="nav-divider"></div>
                <button class="profile-nav-item text-red-500" onClick={handleLogout}>
                  <span class="material-symbols-outlined">logout</span>
                  Keluar
                </button>
              </nav>
            </div>

            {/* Main Area Column */}
            <div class="profile-main-area">
              
              {/* TAB 1: PROFILE TAB */}
              <Show when={activeTab() === "profile"}>
                <div class="profile-section-card">
                  <h3 class="section-card-title">Informasi Pribadi</h3>
                  
                  <Show when={isEditingProfile()} fallback={
                    <div>
                      <div class="info-grid">
                        <div class="info-item">
                          <label>Nama Lengkap</label>
                          <p>{profile()?.name}</p>
                        </div>
                        <div class="info-item">
                          <label>Alamat Email</label>
                          <p>{profile()?.email}</p>
                        </div>
                        <div class="info-item">
                          <label>Nomor Telepon</label>
                          <p>{profile()?.phone || "Belum diatur"}</p>
                        </div>
                        <div class="info-item">
                          <label>Tanggal Bergabung</label>
                          <p>{profile()?.created_at ? new Date(profile()!.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : "-"}</p>
                        </div>
                      </div>
                      <button class="btn-edit-profile" onClick={startEditingProfile}>Ubah Profil</button>
                    </div>
                  }>
                    
                    {/* EDIT PROFILE FORM */}
                    <form onSubmit={handleSaveProfile}>
                      <Show when={profileError()}>
                        <div style={{ background: "#fee2e2", color: "#dc2626", padding: "12px 20px", "border-radius": "10px", "margin-bottom": "20px", "font-weight": "600" }}>
                          {profileError()}
                        </div>
                      </Show>
                      <Show when={profileSuccess()}>
                        <div style={{ background: "#dcfce7", color: "#16a34a", padding: "12px 20px", "border-radius": "10px", "margin-bottom": "20px", "font-weight": "600" }}>
                          {profileSuccess()}
                        </div>
                      </Show>

                      <div class="profile-form-group">
                        <label>Nama Lengkap</label>
                        <input 
                          type="text" 
                          class="profile-input" 
                          value={editName()} 
                          onInput={(e) => setEditName(e.currentTarget.value)} 
                          placeholder="Masukkan nama lengkap Anda"
                        />
                      </div>
                      
                      <div class="profile-form-group">
                        <label>Alamat Email</label>
                        <input 
                          type="email" 
                          class="profile-input" 
                          value={editEmail()} 
                          onInput={(e) => setEditEmail(e.currentTarget.value)} 
                          placeholder="Masukkan alamat email Anda"
                        />
                      </div>

                      <div class="profile-form-group">
                        <label>Nomor Telepon</label>
                        <input 
                          type="tel" 
                          class="profile-input" 
                          value={editPhone()} 
                          onInput={(e) => setEditPhone(e.currentTarget.value)} 
                          placeholder="Masukkan nomor telepon Anda"
                        />
                      </div>

                      <div class="profile-form-group">
                        <label>Kata Sandi Baru (Opsional)</label>
                        <input 
                          type="password" 
                          class="profile-input" 
                          value={editPassword()} 
                          onInput={(e) => setEditPassword(e.currentTarget.value)} 
                          placeholder="Kosongkan jika tidak ingin mengubah kata sandi"
                        />
                      </div>

                      <div class="profile-form-actions">
                        <button type="submit" class="profile-btn-primary" disabled={savingProfile()}>
                          {savingProfile() ? "Menyimpan..." : "Simpan Perubahan"}
                        </button>
                        <button type="button" class="profile-btn-secondary" onClick={() => setIsEditingProfile(false)}>
                          Batal
                        </button>
                      </div>
                    </form>
                  </Show>
                </div>
              </Show>

              {/* TAB 2: ORDERS TAB */}
              <Show when={activeTab() === "orders"}>
                <div class="profile-section-card">
                  <h3 class="section-card-title">Pesanan Saya</h3>
                  
                  <Show when={!orders.loading} fallback={<div class="py-10"><Loading message="Memuat riwayat pesanan..." /></div>}>
                    <Show when={orders() && orders()!.length > 0} fallback={
                      <div class="empty-state-small">
                        <span class="material-symbols-outlined">receipt_long</span>
                        <p>Anda belum memiliki riwayat pesanan.</p>
                        <A href="/shop" class="text-green-600 font-bold">Mulai belanja sekarang</A>
                      </div>
                    }>
                      <div class="profile-orders-list">
                        <For each={orders()}>
                          {(order) => (
                            <div class="profile-order-card">
                              <div class="profile-order-header">
                                <div>
                                  <div class="profile-order-num">{order.order_number}</div>
                                  <div class="profile-order-date">
                                    {new Date(order.ordered_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                  </div>
                                </div>
                                <span class={`profile-order-badge ${order.status.toLowerCase()}`}>
                                  {order.status === "pending" ? "Menunggu" : 
                                   order.status === "confirmed" ? "Dikonfirmasi" : 
                                   order.status === "processing" ? "Diproses" : 
                                   order.status === "shipped" ? "Dikirim" : 
                                   order.status === "delivered" ? "Selesai" : 
                                   order.status === "cancelled" ? "Dibatalkan" : "Refund"}
                                </span>
                              </div>

                              <div class="profile-order-items">
                                <For each={order.items}>
                                  {(item) => (
                                    <div class="profile-order-item">
                                      <div>
                                        <span class="profile-order-item-qty">{item.quantity}x</span>
                                        <span class="profile-order-item-name">
                                          {item.product_name}
                                          {item.variant_label && <span class="text-xs text-gray-500 ml-2">({item.variant_label})</span>}
                                        </span>
                                      </div>
                                      <span class="profile-order-item-price">{formatCurrency(item.subtotal)}</span>
                                    </div>
                                  )}
                                </For>
                              </div>

                              <div class="profile-order-footer">
                                <div class="profile-order-total-label">Total Pembayaran</div>
                                <div class="profile-order-total-price">{formatCurrency(order.grand_total)}</div>
                              </div>
                            </div>
                          )}
                        </For>
                      </div>
                    </Show>
                  </Show>
                </div>
              </Show>

              {/* TAB 3: WISHLIST TAB */}
              <Show when={activeTab() === "wishlist"}>
                <div class="profile-section-card">
                  <h3 class="section-card-title">Wishlist</h3>
                  
                  <Show when={!favorites.loading} fallback={<div class="py-10"><Loading message="Memuat wishlist..." /></div>}>
                    <Show when={favorites() && favorites()!.length > 0} fallback={
                      <div class="empty-state-small">
                        <span class="material-symbols-outlined">favorite_border</span>
                        <p>Wishlist Anda masih kosong.</p>
                        <A href="/shop" class="text-green-600 font-bold">Cari produk menarik</A>
                      </div>
                    }>
                      <div class="profile-wishlist-grid">
                        <For each={favorites()}>
                          {(item) => (
                            <div class="profile-wishlist-card">
                              <button class="wishlist-remove-btn" onClick={() => handleRemoveFavorite(item.id)}>
                                <span class="material-symbols-outlined" style={{ "font-size": "18px" }}>delete</span>
                              </button>
                              
                              <A href={`/product/${item.product_slug || item.product_id}`} class="wishlist-card-img" style={{ "text-decoration": "none" }}>
                                <Show when={item.product_thumbnail} fallback={
                                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--green-500)" stroke-width="1.5">
                                     <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
                                  </svg>
                                }>
                                  <img src={item.product_thumbnail!} alt={item.product_name} />
                                </Show>
                              </A>
                              
                              <div class="wishlist-card-body">
                                <A href={`/product/${item.product_slug || item.product_id}`} class="wishlist-card-name" style={{ "text-decoration": "none" }}>
                                  {item.product_name || "Produk"}
                                </A>
                                <div class="wishlist-card-price">
                                  {item.product_price ? formatCurrency(item.product_price) : "-"}
                                </div>
                              </div>
                            </div>
                          )}
                        </For>
                      </div>
                    </Show>
                  </Show>
                </div>
              </Show>

              {/* TAB 4: SHIPPING TAB */}
              <Show when={activeTab() === "shipping"}>
                <div class="profile-section-card">
                  <h3 class="section-card-title">Alamat Pengiriman</h3>
                  
                  <Show when={isEditingShipping()} fallback={
                    <div>
                      <div style={{ background: "#f8f9fa", border: "1px solid var(--border)", padding: "25px", "border-radius": "16px", "margin-bottom": "25px", "line-height": "1.6" }}>
                        <Show when={profile()?.shipping_address} fallback={
                          <span style={{ color: "var(--muted)", "font-style": "italic" }}>Belum ada alamat pengiriman yang diatur. Silakan tambahkan alamat pengiriman untuk mempermudah proses checkout.</span>
                        }>
                          <p style={{ "font-weight": "600", color: "var(--ink)", "white-space": "pre-line" }}>{profile()?.shipping_address}</p>
                        </Show>
                      </div>
                      <button class="btn-edit-profile" onClick={startEditingShipping}>
                        {profile()?.shipping_address ? "Ubah Alamat" : "Tambah Alamat"}
                      </button>
                    </div>
                  }>
                    {/* EDIT SHIPPING FORM */}
                    <form onSubmit={handleSaveShipping}>
                      <Show when={shippingError()}>
                        <div style={{ background: "#fee2e2", color: "#dc2626", padding: "12px 20px", "border-radius": "10px", "margin-bottom": "20px", "font-weight": "600" }}>
                          {shippingError()}
                        </div>
                      </Show>
                      <Show when={shippingSuccess()}>
                        <div style={{ background: "#dcfce7", color: "#16a34a", padding: "12px 20px", "border-radius": "10px", "margin-bottom": "20px", "font-weight": "600" }}>
                          {shippingSuccess()}
                        </div>
                      </Show>

                      <div class="profile-form-group">
                        <label>Alamat Pengiriman Lengkap</label>
                        <textarea 
                          class="profile-textarea" 
                          value={editShippingAddress()} 
                          onInput={(e) => setEditShippingAddress(e.currentTarget.value)} 
                          placeholder="Masukkan nama penerima, nomor HP aktif, nama jalan, RT/RW, kelurahan, kecamatan, kota, provinsi, dan kode pos"
                        ></textarea>
                      </div>

                      <div class="profile-form-actions">
                        <button type="submit" class="profile-btn-primary" disabled={savingShipping()}>
                          {savingShipping() ? "Menyimpan..." : "Simpan Alamat"}
                        </button>
                        <button type="button" class="profile-btn-secondary" onClick={() => setIsEditingShipping(false)}>
                          Batal
                        </button>
                      </div>
                    </form>
                  </Show>
                </div>
              </Show>

            </div>
          </div>
        </Show>
      </main>
      <Footer />
    </div>
  );
}
