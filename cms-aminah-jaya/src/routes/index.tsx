import { createResource, For, Show } from "solid-js";
import {
  ShoppingBag,
  Users,
  TrendingUp,
  ArrowUpRight,
  Package
} from "lucide-solid";
import Layout from "../components/Layout";
import StatCard from "../components/StatCard";
import { getDashboardStats, getRecentOrders, getPerformanceStats, getUserProfile, formatCurrency, authToken } from "../lib/api";

export default function Dashboard() {
  const [stats] = createResource(authToken, () => getDashboardStats());
  const [recentOrders] = createResource(authToken, () => getRecentOrders());
  const [performance] = createResource(authToken, () => getPerformanceStats());
  const [user] = createResource(authToken, () => getUserProfile());

  // Debug log
  console.log("User resource state:", { 
    data: user(), 
    loading: user.loading, 
    error: user.error 
  });

  const formatChange = (val?: number) => {
    if (val === undefined) return "+0%";
    return val > 0 ? `+${val}%` : `${val}%`;
  };

  return (
    <Layout title="Overview">
      {/* Welcome Text */}
      <div>
        <h1 class="text-2xl lg:text-3xl font-bold text-ink">
          Welcome back, <Show when={user()} fallback="Aminah">{user()!.name}</Show>! 👋
        </h1>
        <p class="text-ink-light mt-1">Here's what's happening with your store today.</p>
      </div>

      {/* Stats Grid */}
      <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6 mt-6">
        <Show when={stats()} fallback={<div class="col-span-4 p-8 text-center text-muted">Loading stats...</div>}>
          <StatCard
            label="Total Revenue"
            value={formatCurrency(stats()!.total_revenue)}
            change={formatChange(stats()!.revenue_change)}
            icon={TrendingUp}
            color="text-green-500"
            bg="bg-green-50"
          />
          <StatCard
            label="Orders"
            value={stats()!.total_orders.toString()}
            change={formatChange(stats()!.orders_change)}
            icon={ShoppingBag}
            color="text-blue-500"
            bg="bg-blue-50"
          />
          <StatCard
            label="New Customers"
            value={stats()!.new_customers.toString()}
            change={formatChange(stats()!.customers_change)}
            icon={Users}
            color="text-purple-500"
            bg="bg-purple-50"
          />
          <StatCard
            label="Stock Items"
            value={stats()!.stock_items.toString()}
            change={formatChange(stats()!.stock_change)}
            icon={Package}
            color="text-orange-500"
            bg="bg-orange-50"
          />
        </Show>
      </div>

      {/* Table & Chart placeholder section */}
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* Recent Orders Table */}
        <div class="lg:col-span-2 bg-white rounded-3xl border border-border/40 shadow-sm overflow-hidden flex flex-col">
          <div class="p-6 border-b border-border/40 flex justify-between items-center">
            <h3 class="text-lg font-bold text-ink">Recent Orders</h3>
            <a href="/orders" class="text-sm font-bold text-green-500 hover:text-green-700 transition-colors">View All</a>
          </div>
          <div class="overflow-x-auto flex-1">
            <Show when={recentOrders()} fallback={<div class="p-8 text-center text-muted">Loading recent orders...</div>}>
              <table class="w-full text-left">
                <thead class="bg-cream text-muted text-xs font-bold uppercase tracking-wider">
                  <tr>
                    <th class="px-6 py-4">Order ID</th>
                    <th class="px-6 py-4">Customer</th>
                    <th class="px-6 py-4">Product</th>
                    <th class="px-6 py-4">Amount</th>
                    <th class="px-6 py-4">Status</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-border/30">
                  <For each={recentOrders()}>
                    {(order) => (
                      <tr class="hover:bg-cream/50 transition-colors cursor-pointer group">
                        <td class="px-6 py-4 font-bold text-ink">{order.order_number}</td>
                        <td class="px-6 py-4 text-ink-light">{order.customer_name}</td>
                        <td class="px-6 py-4 text-ink-light truncate max-w-[200px]" title={order.product_name}>{order.product_name}</td>
                        <td class="px-6 py-4 font-bold text-ink">{formatCurrency(order.grand_total)}</td>
                        <td class="px-6 py-4">
                          <span class={`px-3 py-1 rounded-full text-xs font-bold capitalize ${order.status === 'paid' ? 'bg-green-100 text-green-700' :
                            order.status === 'shipped' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'
                            }`}>
                            {order.status}
                          </span>
                        </td>
                      </tr>
                    )}
                  </For>
                </tbody>
              </table>
            </Show>
          </div>
        </div>

        {/* Side Card / Activity */}
        <div class="bg-green-900 rounded-3xl p-8 text-white relative overflow-hidden flex flex-col">
          <div class="relative z-10">
            <h3 class="text-xl font-bold mb-2">Performance Boost</h3>
            <Show when={performance()} fallback={<p class="text-green-100/70 text-sm mb-8 leading-relaxed">Loading performance...</p>}>
              <p class="text-green-100/70 text-sm mb-8 leading-relaxed">
                Your sales are up {performance()!.sales_growth.toFixed(0)}% compared to last month. Keep it up!
              </p>

              <div class="mt-auto space-y-6">
                <div class="flex items-center gap-4">
                  <div class="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                    <TrendingUp size={24} class="text-green-400" />
                  </div>
                  <div>
                    <p class="text-sm font-bold">Top Selling</p>
                    <p class="text-xs text-green-100/50">{performance()!.top_selling_product}</p>
                  </div>
                </div>
                <div class="flex items-center gap-4">
                  <div class="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                    <ArrowUpRight size={24} class="text-blue-400" />
                  </div>
                  <div>
                    <p class="text-sm font-bold">Conversion Rate</p>
                    <p class="text-xs text-green-100/50">
                      {performance()!.conversion_rate.toFixed(1)}% ({performance()!.conversion_rate > 3 ? 'High' : 'Average'} Average)
                    </p>
                  </div>
                </div>
              </div>
            </Show>
          </div>

          {/* Background accent */}
          <div class="absolute -bottom-10 -right-10 w-40 h-40 bg-green-500 rounded-full blur-3xl opacity-20"></div>
        </div>
      </div>
    </Layout>
  );
}
