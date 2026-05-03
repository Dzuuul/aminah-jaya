import { createResource, Show } from "solid-js";
import { Eye, Phone, Users, ShoppingBag, TrendingUp, MapPin } from "lucide-solid";
import Layout from "../components/Layout";
import DataTable, { Column, FilterDef } from "../components/DataTable";
import StatCard from "../components/StatCard";
import { getCustomers, getCustomerStats, Customer, formatCurrency } from "../lib/api";

export default function Customers() {
  const [customers] = createResource(getCustomers);
  const [stats] = createResource(getCustomerStats);

  const columns: Column<Customer>[] = [
    {
      header: "Name",
      accessor: "name",
      render: (item) => (
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-sm flex-shrink-0">
            {item.name.split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase() || "?"}
          </div>
          <span class="font-semibold text-ink">{item.name}</span>
        </div>
      )
    },
    {
      header: "Contact",
      accessor: "phone",
      render: (item) => (
        <div class="space-y-0.5">
          <div class="flex items-center gap-1.5 text-ink-light text-sm">
            <Phone size={13} class="text-muted flex-shrink-0" />
            <span>{item.phone}</span>
          </div>
          <Show when={item.city}>
            <div class="flex items-center gap-1.5 text-ink-light text-sm">
              <MapPin size={13} class="text-muted flex-shrink-0" />
              <span>{item.city}</span>
            </div>
          </Show>
        </div>
      )
    },
    {
      header: "Orders",
      accessor: "total_orders",
      render: (item) => <span class="font-bold text-ink">{item.total_orders}</span>
    },
    {
      header: "Total Spent",
      accessor: "total_spent",
      render: (item) => <span class="font-bold text-green-600">{formatCurrency(item.total_spent)}</span>
    },
    {
      header: "Status",
      accessor: "is_blocked",
      render: (item) => {
        const isBlocked = item.is_blocked;
        return (
          <span class={`px-3 py-1 rounded-full text-xs font-bold ${
            !isBlocked ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
          }`}>
            {!isBlocked ? "Active" : "Blocked"}
          </span>
        );
      }
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
      key: "is_blocked",
      label: "Status",
      options: [
        { label: "Active", value: "false" },
        { label: "Blocked", value: "true" },
      ]
    }
  ];

  return (
    <Layout title="Customers">
      <div class="mb-6">
        <h1 class="text-2xl lg:text-3xl font-bold text-ink">Customers</h1>
        <p class="text-ink-light mt-1">View and manage your customer base.</p>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6 mb-6">
        <Show when={stats()} fallback={<div class="col-span-3 p-4 text-center text-muted">Loading stats...</div>}>
          <StatCard label="Total Contacts" value={stats()!.total_customers.toString()} icon={Users} color="text-purple-500" bg="bg-purple-50" />
          <StatCard label="Active (30 Days)" value={stats()!.active_customers.toString()} icon={ShoppingBag} color="text-green-500" bg="bg-green-50" />
          <StatCard label="Total Revenue" value={formatCurrency(stats()!.total_revenue)} icon={TrendingUp} color="text-blue-500" bg="bg-blue-50" />
        </Show>
      </div>

      <Show when={customers()} fallback={<div class="p-8 text-center text-muted">Loading customers...</div>}>
        <DataTable
          columns={columns}
          data={customers()!}
          searchPlaceholder="Search customers..."
          filters={filters}
        />
      </Show>
    </Layout>
  );
}
