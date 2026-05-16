import { createSignal, createResource, Show, onMount } from "solid-js";
import { A, useNavigate } from "@solidjs/router";
import { getMeCustomer } from "~/lib/api";
import Navbar from "~/components/Navbar";
import Footer from "~/components/Footer";
import Loading from "~/components/ui/Loading";

export default function Profile() {
  const navigate = useNavigate();
  const [profile, { refetch }] = createResource(getMeCustomer);

  onMount(() => {
    if (!localStorage.getItem("customer_token")) {
      navigate("/login");
    }
  });

  const handleLogout = () => {
    localStorage.removeItem("customer_token");
    localStorage.removeItem("customer_profile");
    navigate("/login");
  };

  return (
    <div class="min-h-screen bg-[#f8f9fa]">
      <Navbar />
      <main class="profile-page-container">
        <Show when={!profile.loading} fallback={<div class="py-20"><Loading message="Memuat profil..." /></div>}>
          <div class="profile-content">
            <div class="profile-sidebar">
              <div class="profile-user-card">
                <div class="user-avatar-large">
                  {profile()?.name?.charAt(0) || "U"}
                </div>
                <h2 class="user-name-display">{profile()?.name}</h2>
                <p class="user-email-display">{profile()?.email}</p>
                <div class="user-badge-premium">Member Gold</div>
              </div>

              <nav class="profile-nav">
                <button class="profile-nav-item active">
                  <span class="material-symbols-outlined">person</span>
                  Profil Saya
                </button>
                <button class="profile-nav-item">
                  <span class="material-symbols-outlined">shopping_bag</span>
                  Pesanan Saya
                </button>
                <button class="profile-nav-item">
                  <span class="material-symbols-outlined">favorite</span>
                  Wishlist
                </button>
                <button class="profile-nav-item">
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

            <div class="profile-main-area">
              <div class="profile-section-card">
                <h3 class="section-card-title">Informasi Pribadi</h3>
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
                <button class="btn-edit-profile">Ubah Profil</button>
              </div>

              <div class="profile-section-card">
                <h3 class="section-card-title">Pesanan Terakhir</h3>
                <div class="empty-state-small">
                  <span class="material-symbols-outlined">receipt_long</span>
                  <p>Anda belum memiliki riwayat pesanan.</p>
                  <A href="/shop" class="text-green-600 font-bold">Mulai belanja sekarang</A>
                </div>
              </div>
            </div>
          </div>
        </Show>
      </main>
      <Footer />
    </div>
  );
}
