import { createResource, Show } from "solid-js";
import { useParams, useNavigate } from "@solidjs/router";
import Layout from "../../components/Layout";
import ProductForm from "../../components/ProductForm";
import { fetchApi, Product } from "../../lib/api";

const getProduct = async (id: string) => {
  return await fetchApi<Product>(`/products/${id}`);
};

export default function EditProduct() {
  const params = useParams();
  const navigate = useNavigate();
  const [product] = createResource(() => params.id, getProduct);

  return (
    <Layout title="Edit Produk" onBack={() => navigate("/products")}>
      <div class="page-header" style={{ "margin-bottom": "1.5rem" }}>
        <div>
          <h1 class="page-title">Edit Produk</h1>
          <p class="page-subtitle">Ubah informasi produk Anda di sini.</p>
        </div>
      </div>
      <Show when={product()} fallback={<div style={{ padding: "2rem", "text-align": "center", color: "var(--color-muted)" }}>Memuat produk...</div>}>
        <ProductForm initialData={product()!} />
      </Show>
    </Layout>
  );
}
