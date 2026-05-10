import { For, createResource, Show } from "solid-js";

const fetchCategories = async () => {
  const response = await fetch(`${import.meta.env.VITE_API_URL}/api/categories`);
  const json = await response.json();
  return json.data || [];
};

export default function Categories() {
  const [categories] = createResource(fetchCategories);

  return (
    <section class="categories-new" id="kategori" style={{ padding: "40px 0" }}>
      <div class="container">
        <div class="cat-pill-container">
          <Show when={!categories.loading} fallback={
            <div class="flex justify-center w-full py-10 text-muted">Loading categories...</div>
          }>
            <For each={categories()}>
              {(cat) => (
                <div class="cat-pill">
                  <div class="cat-pill-img">
                    <Show when={cat.image_url} fallback={
                      <div class="w-full h-full flex items-center justify-center bg-cream text-muted/30">
                         <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                           <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                           <circle cx="8.5" cy="8.5" r="1.5"></circle>
                           <polyline points="21 15 16 10 5 21"></polyline>
                         </svg>
                      </div>
                    }>
                      <img src={cat.image_url} alt={cat.name} style={{ width: "80%", height: "80%", "object-fit": "contain" }} />
                    </Show>
                  </div>
                  <div class="cat-pill-label">{cat.name}</div>
                </div>
              )}
            </For>
          </Show>
        </div>
      </div>
    </section>
  );
}
