import {
  createSignal,
  createResource,
  Show,
  onMount,
  For,
  createEffect,
  createMemo,
} from "solid-js";
import { A, useNavigate, useSearchParams } from "@solidjs/router";

import {
  getMeCustomer,
  updateCustomerProfile,
  getCustomerOrders,
  getFavorites,
  removeFavorite,
  formatCurrency,
  getCustomerAddresses,
  updateCustomerAddress,
  createCustomerAddress,
  deleteCustomerAddress,
  setDefaultAddress,
  type CustomerAddress,
  type CreateCustomerAddressPayload,
  type UpdateCustomerAddressPayload,
  type CustomerFavorite,
} from "~/lib/api";

import Navbar from "~/components/Navbar";
import Footer from "~/components/Footer";
import Loading from "~/components/ui/Loading";
import MapPicker from "~/components/MapPicker";

import { setCustomerProfile } from "~/lib/auth-store";

type ProfileTab = "profile" | "orders" | "wishlist" | "shipping";

export default function Profile() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  /*
   |--------------------------------------------------------------------------
   | STATE
   |--------------------------------------------------------------------------
   */

  const [activeTab, setActiveTab] =
    createSignal<ProfileTab>("profile");

  const [isHydrated, setIsHydrated] = createSignal(false);

  // Profile form
  const [isEditingProfile, setIsEditingProfile] =
    createSignal(false);

  const [editName, setEditName] = createSignal("");
  const [editPhone, setEditPhone] = createSignal("");
  const [editEmail, setEditEmail] = createSignal("");
  const [editPassword, setEditPassword] = createSignal("");

  const [profileError, setProfileError] = createSignal("");
  const [profileSuccess, setProfileSuccess] = createSignal("");
  const [savingProfile, setSavingProfile] = createSignal(false);

  // Shipping form
  const [isEditingShipping, setIsEditingShipping] =
    createSignal(false);

  const [editingAddressId, setEditingAddressId] =
    createSignal<string | null>(null);

  const [editShippingLabel, setEditShippingLabel] =
    createSignal("");

  const [editReceiverName, setEditReceiverName] =
    createSignal("");

  const [editReceiverPhone, setEditReceiverPhone] =
    createSignal("");

  const [editShippingAddress, setEditShippingAddress] =
    createSignal("");

  const [editShippingProvince, setEditShippingProvince] =
    createSignal("");

  const [editShippingCity, setEditShippingCity] =
    createSignal("");

  const [editShippingLat, setEditShippingLat] =
    createSignal<number | null>(null);

  const [editShippingLng, setEditShippingLng] =
    createSignal<number | null>(null);

  const [shippingError, setShippingError] =
    createSignal("");

  const [shippingSuccess, setShippingSuccess] =
    createSignal("");

  const [savingShipping, setSavingShipping] =
    createSignal(false);

  const [isMapPickerOpen, setIsMapPickerOpen] =
    createSignal(false);

  const [addressSearch, setAddressSearch] =
    createSignal("");

  const [editIsDefault, setEditIsDefault] =
    createSignal(false);

  const openPaymentInstruction = (orderNumber: string) => {
    try {
      const cached = localStorage.getItem(`duitku_payment_${orderNumber}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.paymentUrl) {
          window.location.href = parsed.paymentUrl;
          return;
        }
      }
      alert("Halaman pembayaran tidak ditemukan untuk pesanan ini. Jika Anda masih ingin membayar, silakan hubungi admin.");
    } catch (e) {
      alert("Gagal memuat instruksi pembayaran.");
    }
  };

  /*
   |--------------------------------------------------------------------------
   | RESOURCES
   |--------------------------------------------------------------------------
   */

  const [profile, { refetch: refetchProfile }] =
    createResource(
      () => typeof window !== "undefined",
      async (isClient) => {
        if (!isClient) return null;
        return await getMeCustomer();
      },
    );

  const normalizeAddresses = (items: CustomerAddress[]) =>
    items.map((addr) => ({
      ...addr,
      is_default: Boolean(addr.is_default),
    }));

  const [addresses, { refetch: refetchAddresses, mutate: mutateAddresses }] =
    createResource(async () => {
      try {
        const data = await getCustomerAddresses();
        return normalizeAddresses(data);
      } catch (err) {
        console.error(err);
        return [];
      }
    });

  const [settingDefaultAddressId, setSettingDefaultAddressId] =
    createSignal<string | null>(null);

  const [orders] = createResource(
    () => activeTab() === "orders",
    async () => {
      try {
        return await getCustomerOrders();
      } catch (err) {
        console.error(err);
        return [];
      }
    },
  );

  const [favorites, { refetch: refetchFavorites }] =
    createResource(
      () => activeTab() === "wishlist",
      async () => {
        try {
          return await getFavorites();
        } catch (err) {
          console.error(err);
          return [];
        }
      },
    );

  /*
   |--------------------------------------------------------------------------
   | MEMOS
   |--------------------------------------------------------------------------
   */

  const filteredAddresses = createMemo(() => {
    const keyword = addressSearch().toLowerCase().trim();

    if (!keyword) return addresses() || [];

    return (addresses() || []).filter((item: CustomerAddress) => {
      return (
        item.address?.toLowerCase().includes(keyword) ||
        item.label?.toLowerCase().includes(keyword) ||
        item.recipient_name?.toLowerCase().includes(keyword) ||
        item.recipient_phone?.toLowerCase().includes(keyword) ||
        item.province?.toLowerCase().includes(keyword) ||
        item.city?.toLowerCase().includes(keyword)
      );
    });
  });

  /*
   |--------------------------------------------------------------------------
   | EFFECTS
   |--------------------------------------------------------------------------
   */

  createEffect(() => {
    const tab = searchParams.tab;

    if (
      tab === "profile" ||
      tab === "orders" ||
      tab === "wishlist" ||
      tab === "shipping"
    ) {
      setActiveTab(tab);
    }
  });

  onMount(() => {
    setIsHydrated(true);

    setTimeout(() => {
      if (!localStorage.getItem("customer_token")) {
        navigate("/");
      }
    }, 0);
  });

  /*
   |--------------------------------------------------------------------------
   | HELPERS
   |--------------------------------------------------------------------------
   */

  const resetShippingForm = () => {
    setEditingAddressId(null);

    setEditShippingLabel("");
    setEditReceiverName(profile()?.name || "");
    setEditReceiverPhone(profile()?.phone || "");

    setEditShippingAddress("");
    setEditShippingProvince("");
    setEditShippingCity("");

    setEditShippingLat(null);
    setEditShippingLng(null);
    setEditIsDefault((addresses() || []).length === 0);

    setShippingError("");
    setShippingSuccess("");
  };

  const formatOrderDate = (value: string) => {
    try {
      return new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(value));
    } catch {
      return value;
    }
  };

  const getOrderStatusClass = (status: string) =>
    (status || "pending").toLowerCase().replace(/\s+/g, "_");

  const getOrderStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: "Menunggu",
      confirmed: "Dikonfirmasi",
      processing: "Diproses",
      shipped: "Dikirim",
      delivered: "Selesai",
      cancelled: "Dibatalkan",
      refunded: "Dikembalikan",
      expired: "Kadaluarsa",
      failed: "Gagal",
    };
    return labels[getOrderStatusClass(status)] || status;
  };

  // Determines the label to display for an order, considering payment status for pending orders
  const getOrderDisplayLabel = (order: any) => {
    if (order.status === "pending") {
      if (order.payment_status === "expired") return "Kadaluarsa";
      if (order.payment_status === "failed") return "Gagal";
    }
    return getOrderStatusLabel(order.status);
  };

  const buildAddressPayload = (): CreateCustomerAddressPayload => ({
    label: editShippingLabel().trim() || null,
    recipient_name: editReceiverName().trim(),
    recipient_phone: editReceiverPhone().trim(),
    address: editShippingAddress().trim(),
    province: editShippingProvince().trim() || null,
    city: editShippingCity().trim() || null,
    lat: editShippingLat(),
    lng: editShippingLng(),
  });

  /*
   |--------------------------------------------------------------------------
   | AUTH
   |--------------------------------------------------------------------------
   */

  const handleLogout = () => {
    localStorage.removeItem("customer_token");
    localStorage.removeItem("customer_profile");

    setCustomerProfile(null);

    navigate("/login");
  };

  /*
   |--------------------------------------------------------------------------
   | PROFILE
   |--------------------------------------------------------------------------
   */

  const startEditingProfile = () => {
    const data = profile();

    if (!data) return;

    setEditName(data.name || "");
    setEditPhone(data.phone || "");
    setEditEmail(data.email || "");
    setEditPassword("");

    setProfileError("");
    setProfileSuccess("");

    setIsEditingProfile(true);
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
        password: editPassword().trim() || null,
      };

      const updated = await updateCustomerProfile(payload);

      localStorage.setItem(
        "customer_profile",
        JSON.stringify(updated),
      );

      setCustomerProfile(updated);

      await refetchProfile();

      setProfileSuccess("Profil berhasil diperbarui!");

      setTimeout(() => {
        setIsEditingProfile(false);
        setProfileSuccess("");
      }, 1500);
    } catch (err: any) {
      setProfileError(
        err.message || "Gagal memperbarui profil",
      );
    } finally {
      setSavingProfile(false);
    }
  };

  /*
   |--------------------------------------------------------------------------
   | SHIPPING
   |--------------------------------------------------------------------------
   */

  const startCreateAddress = () => {
    resetShippingForm();

    setIsEditingShipping(true);
    setIsMapPickerOpen(true);
  };

  const startEditingShipping = (address: CustomerAddress) => {
    setEditingAddressId(address.id);

    setEditShippingLabel(address.label || "");

    setEditReceiverName(
      address.recipient_name || profile()?.name || "",
    );

    setEditReceiverPhone(
      address.recipient_phone || profile()?.phone || "",
    );

    setEditShippingAddress(address.address || "");
    setEditShippingProvince(address.province || "");
    setEditShippingCity(address.city || "");

    setEditShippingLat(address.lat ?? null);

    setEditShippingLng(address.lng ?? null);

    setEditIsDefault(address.is_default);

    setShippingError("");
    setShippingSuccess("");

    setIsEditingShipping(true);
    setIsMapPickerOpen(false);
  };

  const handleSaveShipping = async (e: Event) => {
    e.preventDefault();

    if (!editReceiverName().trim()) {
      setShippingError("Nama penerima wajib diisi");
      return;
    }

    if (!editReceiverPhone().trim()) {
      setShippingError("Nomor telepon penerima wajib diisi");
      return;
    }

    if (!editShippingAddress().trim()) {
      setShippingError("Alamat wajib diisi");
      return;
    }

    if (!editShippingProvince().trim()) {
      setShippingError("Provinsi wajib diisi");
      return;
    }

    if (!editShippingCity().trim()) {
      setShippingError("Kota/Kabupaten wajib diisi");
      return;
    }

    setSavingShipping(true);

    setShippingError("");
    setShippingSuccess("");

    try {
      const basePayload = buildAddressPayload();
      const addressId = editingAddressId();

      if (addressId) {
        const updatePayload: UpdateCustomerAddressPayload = basePayload;
        await updateCustomerAddress(addressId, updatePayload);

        if (editIsDefault()) {
          await setDefaultAddress(addressId);
        }
      } else {
        const createPayload: CreateCustomerAddressPayload = {
          ...basePayload,
          is_default:
            editIsDefault() || (addresses() || []).length === 0,
        };
        await createCustomerAddress(createPayload);
      }

      await refetchAddresses();

      setShippingSuccess(
        addressId
          ? "Alamat berhasil diperbarui!"
          : "Alamat berhasil ditambahkan!",
      );

      setTimeout(() => {
        setIsEditingShipping(false);
        setIsMapPickerOpen(false);
        resetShippingForm();
        setShippingSuccess("");
      }, 1500);
    } catch (err: any) {
      setShippingError(
        err.message || "Gagal menyimpan alamat",
      );
    } finally {
      setSavingShipping(false);
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    if (!window.confirm("Hapus alamat ini?")) return;

    setShippingError("");
    setShippingSuccess("");

    try {
      await deleteCustomerAddress(addressId);
      await refetchAddresses();
      setShippingSuccess("Alamat berhasil dihapus!");
      setTimeout(() => setShippingSuccess(""), 1500);
    } catch (err: any) {
      setShippingError(err.message || "Gagal menghapus alamat");
    }
  };

  const handleSetDefaultAddress = async (addressId: string) => {
    if (settingDefaultAddressId()) return;

    setSettingDefaultAddressId(addressId);
    setShippingError("");
    setShippingSuccess("");

    try {
      await setDefaultAddress(addressId);

      mutateAddresses((prev) =>
        normalizeAddresses(
          (prev || []).map((addr) => ({
            ...addr,
            is_default: addr.id === addressId,
          })),
        ),
      );

      const refreshed = await getCustomerAddresses();
      mutateAddresses(normalizeAddresses(refreshed));

      setShippingSuccess("Alamat utama berhasil diubah!");
      setTimeout(() => setShippingSuccess(""), 2500);
    } catch (err: any) {
      setShippingError(
        err.message || "Gagal mengatur alamat utama",
      );
    } finally {
      setSettingDefaultAddressId(null);
    }
  };

  /*
   |--------------------------------------------------------------------------
   | FAVORITES
   |--------------------------------------------------------------------------
   */

  const handleRemoveFavorite = async (
    favId: string,
  ) => {
    try {
      await removeFavorite(favId);

      await refetchFavorites();
    } catch (err) {
      console.error(err);
    }
  };

  /*
   |--------------------------------------------------------------------------
   | MAP
   |--------------------------------------------------------------------------
   */

  const handleMapLocationSelect = (location: {
    lat: number;
    lng: number;
    address: string;
  }) => {
    setEditShippingAddress(location.address || "");

    setEditShippingLat(location.lat);

    setEditShippingLng(location.lng);
  };

  /*
   |--------------------------------------------------------------------------
   | UI
   |--------------------------------------------------------------------------
   */

  return (
    <div class="min-h-screen bg-[#f8f9fa]">
      <Navbar />

      <main class="profile-page-container">
        <Show
          when={isHydrated()}
          fallback={
            <div class="py-20">
              <Loading message="Memuat profil..." />
            </div>
          }
        >
          <Show
            when={!profile.loading}
            fallback={
              <div class="py-20">
                <Loading message="Memuat profil..." />
              </div>
            }
          >
            <div class="profile-content">
              {/* SIDEBAR */}
              <div class="profile-sidebar">
                <div class="profile-user-card">
                  <div class="user-avatar-large">
                    {profile()?.name?.charAt(0) || "U"}
                  </div>

                  <div class="profile-user-details">
                    <h2 class="user-name-display">
                      {profile()?.name}
                    </h2>

                    <p class="user-email-display">
                      {profile()?.email}
                    </p>

                    <div class="user-badge-premium">
                      Member Gold
                    </div>
                  </div>
                </div>

                <nav class="profile-nav">
                  <button
                    class={`profile-nav-item ${activeTab() === "profile"
                        ? "active"
                        : ""
                      }`}
                    onClick={() => {
                      setActiveTab("profile");
                      setIsEditingProfile(false);
                    }}
                  >
                    <span class="material-symbols-outlined">
                      person
                    </span>

                    Profil Saya
                  </button>

                  <button
                    class={`profile-nav-item ${activeTab() === "orders"
                        ? "active"
                        : ""
                      }`}
                    onClick={() =>
                      setActiveTab("orders")
                    }
                  >
                    <span class="material-symbols-outlined">
                      shopping_bag
                    </span>

                    Pesanan Saya
                  </button>

                  <button
                    class={`profile-nav-item ${activeTab() === "wishlist"
                        ? "active"
                        : ""
                      }`}
                    onClick={() =>
                      setActiveTab("wishlist")
                    }
                  >
                    <span class="material-symbols-outlined">
                      favorite
                    </span>

                    Wishlist
                  </button>

                  <button
                    class={`profile-nav-item ${activeTab() === "shipping"
                        ? "active"
                        : ""
                      }`}
                    onClick={() => {
                      setActiveTab("shipping");
                      setIsEditingShipping(false);
                    }}
                  >
                    <span class="material-symbols-outlined">
                      location_on
                    </span>

                    Alamat Pengiriman
                  </button>

                  <div class="nav-divider"></div>

                  <button
                    class="profile-nav-item profile-nav-item--danger"
                    onClick={handleLogout}
                  >
                    <span class="material-symbols-outlined">
                      logout
                    </span>

                    Keluar
                  </button>
                </nav>
              </div>

              {/* MAIN */}
              <div class="profile-main-area">
                {/* PROFILE TAB */}
                <Show when={activeTab() === "profile"}>
                  <div class="profile-section-card">
                    <h3 class="section-card-title">
                      Informasi Pribadi
                    </h3>

                    <Show
                      when={!isEditingProfile()}
                      fallback={
                        <form onSubmit={handleSaveProfile}>
                          <Show when={profileError()}>
                            <div class="profile-alert-error">
                              {profileError()}
                            </div>
                          </Show>

                          <Show when={profileSuccess()}>
                            <div class="profile-alert-success">
                              {profileSuccess()}
                            </div>
                          </Show>

                          <div class="profile-form-group">
                            <label>Nama Lengkap</label>
                            <input
                              type="text"
                              class="profile-input"
                              value={editName()}
                              onInput={(e) =>
                                setEditName(e.currentTarget.value)
                              }
                              placeholder="Nama lengkap"
                            />
                          </div>

                          <div class="profile-form-group">
                            <label>Nomor Telepon</label>
                            <input
                              type="tel"
                              class="profile-input"
                              value={editPhone()}
                              onInput={(e) =>
                                setEditPhone(e.currentTarget.value)
                              }
                              placeholder="628xxxxxxxxxx"
                            />
                          </div>

                          <div class="profile-form-group">
                            <label>Email</label>
                            <input
                              type="email"
                              class="profile-input"
                              value={editEmail()}
                              onInput={(e) =>
                                setEditEmail(e.currentTarget.value)
                              }
                              placeholder="email@contoh.com"
                            />
                          </div>

                          <div class="profile-form-group">
                            <label>Password Baru (Opsional)</label>
                            <input
                              type="password"
                              class="profile-input"
                              value={editPassword()}
                              onInput={(e) =>
                                setEditPassword(e.currentTarget.value)
                              }
                              placeholder="Kosongkan jika tidak diubah"
                            />
                          </div>

                          <div class="profile-form-actions">
                            <button
                              type="submit"
                              class="profile-btn-primary"
                              disabled={savingProfile()}
                            >
                              {savingProfile()
                                ? "Menyimpan..."
                                : "Simpan Perubahan"}
                            </button>
                            <button
                              type="button"
                              class="profile-btn-secondary"
                              onClick={() => {
                                setIsEditingProfile(false);
                                setProfileError("");
                                setProfileSuccess("");
                              }}
                            >
                              Batal
                            </button>
                          </div>
                        </form>
                      }
                    >
                      <div class="info-grid">
                        <div class="info-item">
                          <label>Nama Lengkap</label>
                          <p>{profile()?.name || "-"}</p>
                        </div>
                        <div class="info-item">
                          <label>Nomor Telepon</label>
                          <p>{profile()?.phone || "-"}</p>
                        </div>
                        <div class="info-item">
                          <label>Email</label>
                          <p>{profile()?.email || "-"}</p>
                        </div>
                      </div>

                      <button
                        type="button"
                        class="btn-edit-profile"
                        onClick={startEditingProfile}
                      >
                        Edit Profil
                      </button>
                    </Show>
                  </div>
                </Show>

                {/* ORDERS TAB */}
                <Show when={activeTab() === "orders"}>
                  <div class="profile-section-card">
                    <h3 class="section-card-title">
                      Pesanan Saya
                    </h3>

                    <Show
                      when={!orders.loading}
                      fallback={
                        <Loading message="Memuat pesanan..." />
                      }
                    >
                      <Show
                        when={(orders() || []).length > 0}
                        fallback={
                          <div class="empty-state-small">
                            <span class="material-symbols-outlined">
                              shopping_bag
                            </span>
                            <p>Belum ada pesanan.</p>
                          </div>
                        }
                      >
                        <div class="profile-orders-list">
                          <For each={orders() || []}>
                            {(order: any) => (
                              <div class="profile-order-card">
                                <div class="profile-order-header">
                                  <div>
                                    <div class="profile-order-num">
                                      #{order.order_number}
                                    </div>
                                    <div class="profile-order-date">
                                      {formatOrderDate(
                                        order.ordered_at,
                                      )}
                                    </div>
                                  </div>
                                  <span
                                    class={`profile-order-badge ${getOrderStatusClass(order.status)}`}
                                  >
                                    {getOrderDisplayLabel(order)}
                                  </span>
                                </div>

                                <div class="profile-order-items">
                                  <For each={order.items || []}>
                                    {(item: any) => (
                                      <div class="profile-order-item">
                                        <span class="profile-order-item-qty">
                                          {item.quantity}x
                                        </span>
                                        <span class="profile-order-item-name">
                                          {item.product_name}
                                          {item.variant_label
                                            ? ` (${item.variant_label})`
                                            : ""}
                                        </span>
                                        <span class="profile-order-item-price">
                                          {formatCurrency(
                                            item.subtotal,
                                          )}
                                        </span>
                                      </div>
                                    )}
                                  </For>
                                </div>

                                <div class="profile-order-footer" style={{ display: "flex", "justify-content": "space-between", "align-items": "center" }}>
                                  <div>
                                    <span class="profile-order-total-label" style={{ display: "block" }}>
                                      Total Pembayaran
                                    </span>
                                    <span class="profile-order-total-price" style={{ display: "block", "font-weight": "bold", "font-size": "16px", color: "#e11d48" }}>
                                      {formatCurrency(
                                        order.grand_total,
                                      )}
                                    </span>
                                  </div>
                                  <Show when={order.status === "pending" && order.payment_status !== "expired" && order.payment_status !== "failed"}>
                                    <button
                                      type="button"
                                      class="profile-btn-primary"
                                      style={{ padding: "8px 16px", "font-size": "14px", "border-radius": "8px", "background-color": "#e11d48" }}
                                      onClick={() => openPaymentInstruction(order.order_number)}
                                    >
                                      Bayar Sekarang
                                    </button>
                                  </Show>
                                </div>
                              </div>
                            )}
                          </For>
                        </div>
                      </Show>
                    </Show>
                  </div>
                </Show>

                {/* WISHLIST TAB */}
                <Show when={activeTab() === "wishlist"}>
                  <div class="profile-section-card">
                    <h3 class="section-card-title">
                      Wishlist
                    </h3>

                    <Show
                      when={!favorites.loading}
                      fallback={
                        <Loading message="Memuat wishlist..." />
                      }
                    >
                      <Show
                        when={(favorites() || []).length > 0}
                        fallback={
                          <div class="empty-state-small">
                            <span class="material-symbols-outlined">
                              favorite
                            </span>
                            <p>Wishlist masih kosong.</p>
                          </div>
                        }
                      >
                        <div class="profile-wishlist-grid">
                          <For each={favorites() || []}>
                            {(fav: CustomerFavorite) => (
                              <div class="profile-wishlist-card">
                                <A
                                  href={`/product/${fav.product_slug || fav.product_id}`}
                                  class="wishlist-card-img"
                                >
                                  <Show
                                    when={fav.product_thumbnail}
                                    fallback={
                                      <span class="material-symbols-outlined">
                                        image
                                      </span>
                                    }
                                  >
                                    <img
                                      src={fav.product_thumbnail!}
                                      alt={fav.product_name || "Produk"}
                                    />
                                  </Show>
                                </A>

                                <button
                                  type="button"
                                  class="wishlist-remove-btn"
                                  title="Hapus dari wishlist"
                                  onClick={() => {
                                    void handleRemoveFavorite(fav.id);
                                  }}
                                >
                                  <span class="material-symbols-outlined">
                                    close
                                  </span>
                                </button>

                                <div class="wishlist-card-body">
                                  <A
                                    href={`/product/${fav.product_slug || fav.product_id}`}
                                    class="wishlist-card-name"
                                  >
                                    {fav.product_name || "Produk"}
                                  </A>
                                  <div class="wishlist-card-price">
                                    {fav.product_price != null
                                      ? formatCurrency(
                                        fav.product_price,
                                      )
                                      : "-"}
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

                {/* SHIPPING TAB */}
                <Show when={activeTab() === "shipping"}>
                  <div class="profile-section-card">
                    <h3 class="section-card-title">
                      Alamat Pengiriman
                    </h3>

                    <Show when={shippingError() && !isEditingShipping()}>
                      <div class="profile-alert-error">
                        {shippingError()}
                      </div>
                    </Show>

                    <Show when={shippingSuccess() && !isEditingShipping()}>
                      <div class="profile-alert-success">
                        {shippingSuccess()}
                      </div>
                    </Show>

                    <Show
                      when={isEditingShipping()}
                      fallback={
                        <div>
                          {/* SEARCH + BUTTON */}
                          <div class="profile-address-toolbar">
                            <input
                              type="text"
                              class="profile-input profile-input--compact"
                              value={addressSearch()}
                              onInput={(e) =>
                                setAddressSearch(
                                  e.currentTarget.value,
                                )
                              }
                              placeholder="Cari alamat..."
                            />

                            <button
                              type="button"
                              class="profile-btn-primary"
                              onClick={
                                startCreateAddress
                              }
                            >
                              + Tambah Alamat
                            </button>
                          </div>

                          {/* EMPTY */}
                          <Show
                            when={
                              filteredAddresses()
                                .length > 0
                            }
                            fallback={
                              <div class="empty-state-small">
                                <span class="material-symbols-outlined">
                                  location_off
                                </span>

                                <p>
                                  Belum ada alamat
                                  pengiriman.
                                </p>
                              </div>
                            }
                          >
                            <div class="profile-address-list">
                              <For each={filteredAddresses()}>
                                {(address: CustomerAddress) => (
                                  <div class="profile-address-card">
                                    <div class="profile-address-card-header">
                                      <div class="profile-address-card-info">
                                        <div class="profile-address-card-label-row">
                                          <strong>
                                            {address.label ||
                                              "Alamat"}
                                          </strong>

                                          <Show
                                            when={
                                              address.is_default
                                            }
                                          >
                                            <span class="profile-address-badge-default">
                                              Utama
                                            </span>
                                          </Show>
                                        </div>

                                        <p>
                                          {address.recipient_name}
                                        </p>

                                        <p>
                                          {address.recipient_phone}
                                        </p>

                                        <Show
                                          when={
                                            address.city ||
                                            address.province
                                          }
                                        >
                                          <p class="profile-address-card-meta">
                                            {[
                                              address.city,
                                              address.province,
                                            ]
                                              .filter(Boolean)
                                              .join(", ")}
                                          </p>
                                        </Show>
                                      </div>

                                      <div class="profile-address-card-actions">
                                        <Show
                                          when={!address.is_default}
                                        >
                                          <button
                                            type="button"
                                            class="profile-btn-secondary profile-btn-secondary--default"
                                            disabled={
                                              settingDefaultAddressId() ===
                                              address.id
                                            }
                                            onClick={() => {
                                              void handleSetDefaultAddress(
                                                address.id,
                                              );
                                            }}
                                          >
                                            {settingDefaultAddressId() ===
                                              address.id
                                              ? "Memproses..."
                                              : "Jadikan Utama"}
                                          </button>
                                        </Show>

                                        <button
                                          type="button"
                                          class="profile-btn-secondary"
                                          disabled={
                                            !!settingDefaultAddressId()
                                          }
                                          onClick={() =>
                                            startEditingShipping(address)
                                          }
                                        >
                                          Ubah
                                        </button>

                                        <button
                                          type="button"
                                          class="profile-btn-secondary profile-btn-secondary--danger"
                                          disabled={
                                            !!settingDefaultAddressId()
                                          }
                                          onClick={() => {
                                            void handleDeleteAddress(
                                              address.id,
                                            );
                                          }}
                                        >
                                          Hapus
                                        </button>
                                      </div>
                                    </div>

                                    <p class="profile-address-card-address">
                                      {address.address}
                                    </p>

                                    <Show
                                      when={
                                        address.lat != null &&
                                        address.lng != null
                                      }
                                    >
                                      <div class="profile-address-coords">
                                        <span class="profile-address-coords-badge">
                                          📍{" "}
                                          {address.lat!.toFixed(4)}
                                          ,{" "}
                                          {address.lng!.toFixed(4)}
                                        </span>
                                      </div>
                                    </Show>
                                  </div>
                                )}
                              </For>
                            </div>
                          </Show>
                        </div>
                      }
                    >
                      {/* FORM */}
                      <form onSubmit={handleSaveShipping}>
                        <Show when={shippingError()}>
                          <div class="profile-alert-error">
                            {shippingError()}
                          </div>
                        </Show>

                        <Show when={shippingSuccess()}>
                          <div class="profile-alert-success">
                            {shippingSuccess()}
                          </div>
                        </Show>

                        <div class="profile-form-group">
                          <label>Label Alamat</label>
                          <input
                            type="text"
                            class="profile-input"
                            value={editShippingLabel()}
                            onInput={(e) =>
                              setEditShippingLabel(
                                e.currentTarget.value,
                              )
                            }
                            placeholder="Contoh: Rumah, Kantor"
                          />
                        </div>

                        <div class="profile-form-group">
                          <label>Nama Penerima</label>
                          <input
                            type="text"
                            class="profile-input"
                            value={editReceiverName()}
                            onInput={(e) =>
                              setEditReceiverName(
                                e.currentTarget.value,
                              )
                            }
                            placeholder="Nama penerima"
                          />
                        </div>

                        <div class="profile-form-group">
                          <label>Nomor HP Penerima</label>
                          <input
                            type="tel"
                            class="profile-input"
                            value={editReceiverPhone()}
                            onInput={(e) =>
                              setEditReceiverPhone(
                                e.currentTarget.value,
                              )
                            }
                            placeholder="628xxxxxxxxxx"
                          />
                        </div>

                        <div class="profile-form-row">
                          <div class="profile-form-group">
                            <label>Provinsi</label>
                            <input
                              type="text"
                              class="profile-input"
                              value={editShippingProvince()}
                              onInput={(e) =>
                                setEditShippingProvince(
                                  e.currentTarget.value,
                                )
                              }
                              placeholder="Contoh: Jawa Timur"
                            />
                          </div>

                          <div class="profile-form-group">
                            <label>Kota / Kabupaten</label>
                            <input
                              type="text"
                              class="profile-input"
                              value={editShippingCity()}
                              onInput={(e) =>
                                setEditShippingCity(
                                  e.currentTarget.value,
                                )
                              }
                              placeholder="Contoh: Surabaya"
                            />
                          </div>
                        </div>

                        <div class="profile-form-group">
                          <label class="profile-checkbox-label">
                            <input
                              type="checkbox"
                              checked={editIsDefault()}
                              onChange={(e) =>
                                setEditIsDefault(
                                  e.currentTarget.checked,
                                )
                              }
                            />
                            Jadikan alamat utama
                          </label>
                        </div>

                        <div class="profile-form-group">
                          <label>Alamat & Lokasi</label>
                          <MapPicker
                            isOpen={isMapPickerOpen()}
                            onClose={() =>
                              setIsMapPickerOpen(
                                false,
                              )
                            }
                            onLocationSelect={
                              handleMapLocationSelect
                            }
                            initialLat={
                              editShippingLat() ||
                              undefined
                            }
                            initialLng={
                              editShippingLng() ||
                              undefined
                            }
                            initialAddress={
                              editShippingAddress() ||
                              undefined
                            }
                          />

                          <div
                            style={{
                              display: "flex",
                              gap: "12px",
                              "margin-bottom":
                                "12px",
                            }}
                          >
                            <button
                              type="button"
                              class="profile-btn-primary"
                              onClick={() =>
                                setIsMapPickerOpen(
                                  true,
                                )
                              }
                            >
                              Pilih di Maps
                            </button>

                            <Show
                              when={
                                editShippingLat() &&
                                editShippingLng()
                              }
                            >
                              <div
                                style={{
                                  background:
                                    "#dbeafe",
                                  color:
                                    "#1e40af",
                                  padding:
                                    "10px 14px",
                                  "border-radius":
                                    "10px",
                                }}
                              >
                                📍{" "}
                                {editShippingLat()?.toFixed(
                                  4,
                                )}
                                ,{" "}
                                {editShippingLng()?.toFixed(
                                  4,
                                )}
                              </div>
                            </Show>
                          </div>

                          <textarea
                            class="profile-textarea"
                            value={editShippingAddress()}
                            onInput={(e) =>
                              setEditShippingAddress(
                                e.currentTarget.value,
                              )
                            }
                            placeholder="Masukkan alamat lengkap"
                          />
                        </div>

                        <div class="profile-form-actions">
                          <button
                            type="submit"
                            class="profile-btn-primary"
                            disabled={
                              savingShipping()
                            }
                          >
                            {savingShipping()
                              ? "Menyimpan..."
                              : editingAddressId()
                                ? "Update Alamat"
                                : "Tambah Alamat"}
                          </button>

                          <button
                            type="button"
                            class="profile-btn-secondary"
                            onClick={() => {
                              setIsEditingShipping(false);
                              setIsMapPickerOpen(false);
                              resetShippingForm();
                            }}
                          >
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
        </Show>
      </main>



      <Footer />
    </div>
  );
}