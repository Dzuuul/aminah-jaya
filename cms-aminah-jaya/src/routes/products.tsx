import { createResource, Show } from "solid-js";
import { Plus, Edit, Trash2 } from "lucide-solid";
import Layout from "../components/Layout";
import DataTable, { Column, FilterDef } from "../components/DataTable";
import { getProducts, Product, formatCurrency } from "../lib/api";

export default function Products() {
  const [products] = createResource(getProducts);

  const columns: Column<Product>[] = [
    { 
      header: "SKU / ID", 
      accessor: "id",
      render: (item) => <span class="font-bold text-ink">{item.sku || item.id.substring(0, 8).toUpperCase()}</span>
    },
    { 
      header: "Name", 
      accessor: "name",
      render: (item) => <span class="font-semibold text-ink">{item.name}</span>
    },
    { 
      header: "Category", 
      accessor: "category_name",
      render: (item) => <span class="text-ink-light">{item.category_name}</span>
    },
    { 
      header: "Price", 
      accessor: "price",
      render: (item) => <span class="font-bold text-ink">{formatCurrency(item.price)}</span>
    },
    { 
      header: "Stock", 
      accessor: "stock",
      render: (item) => <span class="text-ink-light">{item.stock}</span>
    },
    { 
      header: "Status", 
      accessor: "status",
      render: (item) => (
        <span class={`px-3 py-1 rounded-full text-xs font-bold ${
          item.status === 'In Stock' ? 'bg-green-100 text-green-700' : 
          item.status === 'Low Stock' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'
        }`}>
          {item.status}
        </span>
      )
    },
    { 
      header: "Actions", 
      accessor: "id",
      render: () => (
        <div class="flex items-center gap-2">
          <button class="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors">
            <Edit size={18} />
          </button>
          <button class="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
            <Trash2 size={18} />
          </button>
        </div>
      )
    },
  ];

  const filters: FilterDef[] = [
    {
      key: "status",
      label: "Status",
      options: [
        { label: "In Stock", value: "In Stock" },
        { label: "Low Stock", value: "Low Stock" },
        { label: "Out of Stock", value: "Out of Stock" },
      ]
    }
  ];

  return (
    <Layout title="Products">
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 class="text-2xl lg:text-3xl font-bold text-ink">Products</h1>
          <p class="text-ink-light mt-1">Manage your product inventory and catalog.</p>
        </div>
        <button class="bg-green-500 text-white p-2.5 rounded-xl shadow-lg shadow-green-500/20 hover:bg-green-700 transition-all flex items-center gap-2 px-4">
          <Plus size={20} />
          <span class="font-bold">Add Product</span>
        </button>
      </div>

      <Show when={products()} fallback={<div class="p-8 text-center text-muted">Loading products...</div>}>
        <DataTable 
          columns={columns} 
          data={products()!} 
          searchPlaceholder="Search products..."
          filters={filters}
        />
      </Show>
    </Layout>
  );
}
