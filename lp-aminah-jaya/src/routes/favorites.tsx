import { createSignal, createResource, For, Show, Suspense, onMount } from "solid-js";
import { A, useNavigate } from "@solidjs/router";
import { getFavorites, removeFavorite, getFavoriteFolders, addToCart, formatCurrency, CustomerFavorite } from "~/lib/api";
import { refetchCartCount } from "~/lib/cart-store";
import Navbar from "~/components/Navbar";
import Footer from "~/components/Footer";
import Loading from "~/components/ui/Loading";

export default function Favorites() {
  const navigate = useNavigate();
  const [favorites, { mutate, refetch }] = createResource(
    () => typeof window !== "undefined",
    async (isClient) => {
      if (!isClient) return [];
      return await getFavorites();
    }
  );
  const [folders, setFolders] = createSignal<string[]>([]);
  const [selectedFolder, setSelectedFolder] = createSignal<string>("All");
  const [removing, setRemoving] = createSignal<string | null>(null);
  const [addingCart, setAddingCart] = createSignal<string | null>(null);
  const [toastMsg, setToastMsg] = createSignal("");
  const [showToast, setShowToast] = createSignal(false);

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const loadFolders = async () => {
    try {
      const data = await getFavoriteFolders();
      setFolders(data);
    } catch (e) {
      console.error("Failed to load favorite folders", e);
    }
  };

  onMount(() => {
    // Check if logged in
    const token = localStorage.getItem("customer_token");
    if (!token) {
      navigate("/login?redirect=/favorites");
      return;
    }
    loadFolders();
  });

  const handleRemoveFavorite = async (id: string, name: string) => {
    setRemoving(id);
    try {
      await removeFavorite(id);
      mutate(prev => prev?.filter(item => item.id !== id));
      triggerToast(`"${name}" dihapus dari favorit.`);
      // Reload folders in case a folder became empty
      loadFolders();
    } catch (e: any) {
      triggerToast(`Gagal menghapus favorit: ${e.message}`);
    } finally {
      setRemoving(null);
    }
  };

  const handleAddToCart = async (productId: string, name: string) => {
    setAddingCart(productId);
    try {
      await addToCart(productId, 1);
      await refetchCartCount();
      triggerToast(`"${name}" berhasil ditambahkan ke keranjang belanja!`);
    } catch (e: any) {
      triggerToast(`Gagal menambahkan ke keranjang: ${e.message}`);
    } finally {
      setAddingCart(null);
    }
  };

  // Filtered favorites based on selected folder
  const filteredFavorites = () => {
    const list = favorites() || [];
    if (selectedFolder() === "All") return list;
    return list.filter(item => item.folder_name === selectedFolder());
  };

  return (
    <div class="min-h-screen bg-[#fcfcfc]">
      <Navbar />
      
      <main class="pd-container" style="padding-top: 40px; padding-bottom: 80px; min-height: 70vh;">
        <div class="cart-header-main" style="margin-bottom: 30px;">
          <h1 class="cart-title-main" style="font-family: 'Lora', serif; font-size: 2.5rem; font-weight: 700;">Favorit Saya</h1>
          <p class="cart-subtitle-main" style="font-size: 1.1rem; color: var(--muted);">Kelola koleksi produk favorit Anda berdasarkan folder kustom</p>
        </div>

        {/* Folders Tab Navigation */}
        <div class="folder-tabs-row" style="display: flex; gap: 10px; margin-bottom: 40px; overflow-x: auto; padding-bottom: 10px; border-bottom: 1px solid var(--border);">
          <button 
            onClick={() => setSelectedFolder("All")}
            style={`padding: 10px 20px; border-radius: 20px; font-weight: 700; border: none; cursor: pointer; transition: all 0.2s; white-space: nowrap; ${selectedFolder() === "All" ? "background: var(--green-700); color: white;" : "background: var(--sand); color: var(--ink-light);"}`}
          >
            📂 Semua Folder ({favorites()?.length || 0})
          </button>
          
          <For each={folders()}>
            {(folderName) => {
              const count = favorites()?.filter(item => item.folder_name === folderName).length || 0;
              return (
                <button 
                  onClick={() => setSelectedFolder(folderName)}
                  style={`padding: 10px 20px; border-radius: 20px; font-weight: 700; border: none; cursor: pointer; transition: all 0.2s; white-space: nowrap; ${selectedFolder() === folderName ? "background: var(--green-700); color: white;" : "background: var(--sand); color: var(--ink-light);"}`}
                >
                  📁 {folderName} ({count})
                </button>
              );
            }}
          </For>
        </div>

        {/* Favorites Grid */}
        <Suspense fallback={<div class="py-20"><Loading message="Memuat produk favorit Anda..." /></div>}>
          <Show when={filteredFavorites().length > 0} fallback={
            <div class="empty-favorites" style="text-align: center; padding: 80px 20px; background: white; border-radius: 24px; border: 1px solid var(--border); box-shadow: 0 4px 20px rgba(0,0,0,0.02);">
              <div class="empty-icon" style="font-size: 4rem; margin-bottom: 20px;">💖</div>
              <h2 style="font-family: 'Lora', serif; font-size: 1.8rem; font-weight: 700; margin-bottom: 10px;">Folder Ini Kosong</h2>
              <p style="color: var(--muted); margin-bottom: 30px; max-width: 400px; margin-left: auto; margin-right: auto;">Belum ada barang di folder ini. Cari produk impian Anda dan tandai sebagai favorit!</p>
              <A href="/shop" class="btn-shop-now" style="display: inline-block; background: var(--green-700); color: white; padding: 14px 28px; border-radius: 30px; font-weight: 700; text-decoration: none; transition: background 0.2s;">Jelajahi Shop</A>
            </div>
          }>
            <div class="favorites-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 30px;">
              <For each={filteredFavorites()}>
                {(item) => (
                  <div class="favorite-card" style="background: white; border-radius: 24px; border: 1px solid var(--border); overflow: hidden; display: flex; flex-direction: column; transition: transform 0.2s, box-shadow 0.2s; box-shadow: 0 4px 12px rgba(0,0,0,0.02);" onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.06)'; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.02)'; }}>
                    
                    {/* Thumbnail Image */}
                    <div style="position: relative; aspect-ratio: 1/1; background: var(--sand); overflow: hidden;">
                      <img 
                        src={item.product_thumbnail || "/placeholder.jpg"} 
                        alt={item.product_name} 
                        style="width: 100%; height: 100%; object-fit: cover;"
                      />
                      
                      {/* Delete from Favorite Button Overlay */}
                      <button 
                        onClick={() => handleRemoveFavorite(item.id, item.product_name || "Produk")}
                        disabled={removing() === item.id}
                        style="position: absolute; top: 15px; right: 15px; width: 40px; height: 40px; border-radius: 50%; border: none; background: white; box-shadow: 0 4px 10px rgba(0,0,0,0.1); display: flex; align-items: center; justify-content: center; cursor: pointer; color: var(--red-500); transition: scale 0.2s;"
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1.0)'}
                      >
                        <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">favorite</span>
                      </button>

                      {/* Folder Name Badge */}
                      <span style="position: absolute; bottom: 15px; left: 15px; background: rgba(0, 0, 0, 0.6); color: white; font-size: 0.75rem; font-weight: 700; padding: 4px 10px; border-radius: 20px; backdrop-filter: blur(4px);">
                        📁 {item.folder_name}
                      </span>
                    </div>

                    {/* Card Body */}
                    <div style="padding: 24px; display: flex; flex-direction: column; flex: 1;">
                      <A href={`/product/${item.product_slug}`} style="font-family: 'Lora', serif; font-size: 1.25rem; font-weight: 700; color: var(--ink); text-decoration: none; margin-bottom: 8px; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; height: 3.5rem;">
                        {item.product_name}
                      </A>
                      
                      <div style="font-size: 1.15rem; font-weight: 800; color: var(--green-700); margin-bottom: 20px;">
                        {item.product_price ? formatCurrency(item.product_price) : "-"}
                      </div>
                      
                      {/* Action buttons */}
                      <div style="display: flex; gap: 8px; margin-top: auto;">
                        <A href={`/product/${item.product_slug}`} style="flex: 1; text-align: center; border: 1px solid var(--border); color: var(--ink-light); padding: 12px; border-radius: 12px; font-weight: 700; text-decoration: none; font-size: 0.9rem; transition: background 0.2s;" onMouseEnter={(e) => e.currentTarget.style.background = 'var(--sand)'} onMouseLeave={(e) => e.currentTarget.style.background = 'none'}>
                          Detail
                        </A>
                        <button 
                          onClick={() => handleAddToCart(item.product_id, item.product_name || "Produk")}
                          disabled={addingCart() === item.product_id}
                          style="flex: 1.5; background: var(--green-700); color: white; border: none; padding: 12px; border-radius: 12px; font-weight: 700; font-size: 0.9rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; transition: background 0.2s;"
                          onMouseEnter={(e) => e.currentTarget.style.background = 'var(--green-800)'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'var(--green-700)'}
                        >
                          <span class="material-symbols-outlined" style="font-size: 1.1rem;">shopping_cart</span>
                          {addingCart() === item.product_id ? "Memproses..." : "Keranjang"}
                        </button>
                      </div>
                    </div>

                  </div>
                )}
              </For>
            </div>
          </Show>
        </Suspense>
      </main>

      {/* Toast Notification */}
      <div class={`toast ${showToast() ? 'show' : ''}`} style="position: fixed; bottom: 30px; left: 50%; transform: translateX(-50%) translateY(100px); background: #333; color: white; padding: 16px 30px; border-radius: 30px; font-weight: 700; box-shadow: 0 10px 30px rgba(0,0,0,0.15); display: flex; align-items: center; gap: 10px; z-index: 10000; transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); opacity: 0; pointer-events: none;">
        <span class="material-symbols-outlined" style="color: var(--green-500);">check_circle</span>
        {toastMsg()}
      </div>

      <style>{`
        .toast.show {
          transform: translateX(-50%) translateY(0) !important;
          opacity: 1 !important;
          pointer-events: auto !important;
        }
      `}</style>

      <Footer />
    </div>
  );
}
