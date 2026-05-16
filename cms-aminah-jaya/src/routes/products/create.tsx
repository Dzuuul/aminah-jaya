import { useNavigate } from "@solidjs/router";
import Layout from "../../components/Layout";
import ProductForm from "../../components/ProductForm";

export default function CreateProduct() {
  const navigate = useNavigate();
  
  return (
    <Layout title="Tambah Produk" onBack={() => navigate("/products")}>
      <div class="page-header" style={{ "margin-bottom": "1.5rem" }}>
        <div>
          <h1 class="page-title">Tambah Produk Baru</h1>
          <p class="page-subtitle">Masukkan detail produk yang ingin ditambahkan.</p>
        </div>
      </div>
      <ProductForm />
    </Layout>
  );
}
