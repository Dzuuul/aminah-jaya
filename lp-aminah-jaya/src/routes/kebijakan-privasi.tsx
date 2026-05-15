import { createSignal, onMount, Show } from "solid-js";
import Navbar from "~/components/Navbar";
import Footer from "~/components/Footer";
import Loading from "~/components/ui/Loading";

export default function KebijakanPrivasi() {
  const [data, setData] = createSignal<any>(null);
  const [loading, setLoading] = createSignal(true);

  onMount(async () => {
    try {
      const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:8001";
      const res = await fetch(`${baseUrl}/api/legal/privacy`);
      const json = await res.json();
      setData(json.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  });

  return (
    <>
      <Navbar />
      <main class="legal-page">
        <div class="legal-container">
          <Show when={!loading()} fallback={<Loading />}>
            <Show when={data()} fallback={<p class="legal-status">Konten tidak ditemukan.</p>}>
              <h1 class="legal-title">
                {data().title_id}
              </h1>
              <div class="legal-content">
                {data().content_id}
              </div>
            </Show>
          </Show>
        </div>
      </main>
      <Footer />
    </>
  );
}
