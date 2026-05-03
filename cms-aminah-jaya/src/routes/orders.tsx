import { createResource, Show } from "solid-js";
import { Eye } from "lucide-solid";
import Layout from "../components/Layout";
import DataTable, { Column, FilterDef } from "../components/DataTable";
import { getOrders, Order, formatCurrency } from "../lib/api";

export default function Orders() {
  const [orders] = createResource(getOrders);

  const columns: Column<Order>[] = [
    {
      header: "Order ID",
      accessor: "order_number",
      render: (item) => <span class="font-bold text-ink">{item.order_number}</span>
    },
    {
      header: "Date",
      accessor: "ordered_at",
      render: (item) => {
        const d = new Date(item.ordered_at);
        return <span class="text-ink-light whitespace-nowrap">{d.toLocaleDateString('id-ID')} {d.toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'})}</span>
      }
    },
    {
      header: "Customer",
      accessor: "customer_name",
      render: (item) => <span class="font-semibold text-ink">{item.customer_name}</span>
    },
    {
      header: "Product",
      accessor: "product_name",
      render: (item) => <span class="text-ink-light truncate max-w-[200px]" title={item.product_name}>{item.product_name}</span>
    },
    {
      header: "Amount",
      accessor: "grand_total",
      render: (item) => <span class="font-bold text-ink">{formatCurrency(item.grand_total)}</span>
    },
    {
      header: "Status",
      accessor: "status",
      render: (item) => (
        <span class={`px-3 py-1 rounded-full text-xs font-bold capitalize ${
          item.status === 'paid' || item.status === 'delivered' ? 'bg-green-100 text-green-700' : 
          item.status === 'shipped' ? 'bg-blue-100 text-blue-700' : 
          item.status === 'pending' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'
        }`}>
          {item.status}
        </span>
      )
    },
    {
      header: "Actions",
      accessor: "id",
      render: () => (
        <button class="p-2 text-ink-light hover:text-green-500 hover:bg-green-50 rounded-lg transition-colors">
          <Eye size={18} />
        </button>
      )
    }
  ];

  const filters: FilterDef[] = [
    {
      key: "status",
      label: "Status",
      options: [
        { label: "Paid", value: "paid" },
        { label: "Pending", value: "pending" },
        { label: "Shipped", value: "shipped" },
        { label: "Delivered", value: "delivered" },
        { label: "Cancelled", value: "cancelled" },
      ]
    }
  ];

  return (
    <Layout title="Orders">
      <div class="mb-6">
        <h1 class="text-2xl lg:text-3xl font-bold text-ink">Orders</h1>
        <p class="text-ink-light mt-1">Track and manage customer orders.</p>
      </div>

      <Show when={orders()} fallback={<div class="p-8 text-center text-muted">Loading orders...</div>}>
        <DataTable 
          columns={columns} 
          data={orders()!} 
          searchPlaceholder="Search orders..."
          filters={filters}
          // The search/filter logic works on string values, so format it early if exact date matching is needed,
          // but for basic data passing it's fine.
        />
      </Show>
    </Layout>
  );
}
