import { createResource, createSignal, Show, For } from "solid-js";
import { Plus, Trash2, Loader2, Calendar, Tag, Package } from "lucide-solid";
import Layout from "../components/Layout";
import Modal from "../components/Modal";
import ConfirmModal from "../components/ConfirmModal";
import DataTable, { Column } from "../components/DataTable";
import { toast } from "../lib/toast";
import { getFlashSales, FlashSale, createFlashSale, deleteFlashSale, getProducts, formatCurrency } from "../lib/api";

export default function FlashSales() {
  const [sales, { refetch }] = createResource(getFlashSales);
  const [products] = createResource(getProducts);

  const [isModalOpen, setIsModalOpen] = createSignal(false);
  const [isSaving, setIsSaving] = createSignal(false);
  const [isConfirmOpen, setIsConfirmOpen] = createSignal(false);
  const [saleToDelete, setSaleToDelete] = createSignal<string | null>(null);

  const [formData, setFormData] = createSignal({
    name: "",
    description: "",
    start_at: "",
    end_at: "",
    items: [] as { product_id: string; sale_price: number; stock_limit: number }[],
  });

  const columns: Column<FlashSale>[] = [
    {
      header: "Event Name",
      accessor: "name",
      render: (item) => <span class="font-bold text-ink">{item.name}</span>
    },
    {
      header: "Start Date",
      accessor: "start_at",
      render: (item) => <span class="text-ink-light">{new Date(item.start_at).toLocaleString()}</span>
    },
    {
      header: "End Date",
      accessor: "end_at",
      render: (item) => <span class="text-ink-light">{new Date(item.end_at).toLocaleString()}</span>
    },
    {
      header: "Status",
      accessor: "is_active",
      render: (item) => {
        const now = new Date();
        const start = new Date(item.start_at);
        const end = new Date(item.end_at);
        const isActive = now >= start && now <= end;

        return (
          <span class={`px-3 py-1 rounded-full text-xs font-bold ${isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
            {isActive ? 'Ongoing' : now < start ? 'Upcoming' : 'Ended'}
          </span>
        );
      }
    },
    {
      header: "Actions",
      accessor: "id",
      render: (item) => (
        <button
          onClick={() => { setSaleToDelete(item.id); setIsConfirmOpen(true); }}
          class="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
        >
          <Trash2 size={18} />
        </button>
      )
    },
  ];

  const addItem = () => {
    setFormData({
      ...formData(),
      items: [...formData().items, { product_id: "", sale_price: 0, stock_limit: 10 }]
    });
  };

  const removeItem = (index: number) => {
    const newItems = [...formData().items];
    newItems.splice(index, 1);
    setFormData({ ...formData(), items: newItems });
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...formData().items];
    (newItems[index] as any)[field] = value;
    setFormData({ ...formData(), items: newItems });
  };

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      await createFlashSale({
        ...formData(),
        start_at: new Date(formData().start_at).toISOString(),
        end_at: new Date(formData().end_at).toISOString(),
      });
      toast.success("Flash sale created successfully");
      setIsModalOpen(false);
      refetch();
    } catch (err: any) {
      toast.error(err.message || "Failed to create flash sale");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Layout title="Flash Sales">
      <div class="flex justify-between items-center mb-6">
        <div>
          <h1 class="text-3xl font-bold text-ink">Flash Sales</h1>
          <p class="text-ink-light mt-1">Manage limited-time promotion events.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          class="bg-red-500 text-white p-2.5 rounded-xl shadow-lg shadow-red-500/20 hover:bg-red-700 transition-all flex items-center gap-2 px-4"
        >
          <Plus size={20} />
          <span class="font-bold">New Event</span>
        </button>
      </div>

      <Show when={sales()} fallback={<div class="p-8 text-center text-muted">Loading events...</div>}>
        <DataTable columns={columns} data={sales()!} searchPlaceholder="Search events..." />
      </Show>

      <Modal isOpen={isModalOpen()} onClose={() => setIsModalOpen(false)} title="Create Flash Sale">
        <form onSubmit={handleSubmit} class="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          <div class="space-y-1">
            <label class="text-sm font-bold text-ink-light ml-1">Event Name</label>
            <input
              type="text" required placeholder="e.g. 5.5 Super Sale"
              class="w-full px-4 py-3 bg-cream border border-border rounded-2xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all"
              onInput={(e) => setFormData({ ...formData(), name: e.currentTarget.value })}
            />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-1">
              <label class="text-sm font-bold text-ink-light ml-1">Start Time</label>
              <input
                type="datetime-local" required
                class="w-full px-4 py-3 bg-cream border border-border rounded-2xl outline-none"
                onInput={(e) => setFormData({ ...formData(), start_at: e.currentTarget.value })}
              />
            </div>
            <div class="space-y-1">
              <label class="text-sm font-bold text-ink-light ml-1">End Time</label>
              <input
                type="datetime-local" required
                class="w-full px-4 py-3 bg-cream border border-border rounded-2xl outline-none"
                onInput={(e) => setFormData({ ...formData(), end_at: e.currentTarget.value })}
              />
            </div>
          </div>

          <div class="space-y-3 pt-4">
            <div class="flex justify-between items-center">
              <h3 class="font-bold text-ink">Products In Sale</h3>
              <button type="button" onClick={addItem} class="text-sm text-red-500 font-bold hover:underline flex items-center gap-1">
                <Plus size={14} /> Add Product
              </button>
            </div>

            <For each={formData().items}>
              {(item, index) => (
                <div class="p-4 bg-cream border border-border rounded-2xl space-y-3 relative">
                  <button type="button" onClick={() => removeItem(index())} class="absolute top-2 right-2 text-muted hover:text-red-500">
                    <Trash2 size={16} />
                  </button>
                  
                  <div class="space-y-1">
                    <label class="text-[10px] font-bold uppercase text-muted ml-1">Select Product</label>
                    <select
                      required class="w-full bg-white border border-border rounded-lg p-2 text-sm"
                      onChange={(e) => updateItem(index(), "product_id", e.currentTarget.value)}
                    >
                      <option value="">Choose product...</option>
                      <For each={products()}>
                        {(p) => <option value={p.id}>{p.name} ({formatCurrency(p.price)})</option>}
                      </For>
                    </select>
                  </div>

                  <div class="grid grid-cols-2 gap-3">
                    <div class="space-y-1">
                      <label class="text-[10px] font-bold uppercase text-muted ml-1">Sale Price</label>
                      <input
                        type="number" required placeholder="0"
                        class="w-full bg-white border border-border rounded-lg p-2 text-sm"
                        onInput={(e) => updateItem(index(), "sale_price", parseFloat(e.currentTarget.value))}
                      />
                    </div>
                    <div class="space-y-1">
                      <label class="text-[10px] font-bold uppercase text-muted ml-1">Stock Limit</label>
                      <input
                        type="number" required placeholder="0"
                        class="w-full bg-white border border-border rounded-lg p-2 text-sm"
                        onInput={(e) => updateItem(index(), "stock_limit", parseInt(e.currentTarget.value))}
                      />
                    </div>
                  </div>
                </div>
              )}
            </For>
          </div>

          <div class="pt-6 flex gap-3 sticky bottom-0 bg-white pb-2">
            <button
              type="button" onClick={() => setIsModalOpen(false)}
              class="flex-1 py-3 px-4 bg-cream text-ink font-bold rounded-2xl hover:bg-border transition-all"
            >
              Cancel
            </button>
            <button
              type="submit" disabled={isSaving() || formData().items.length === 0}
              class="flex-[2] py-3 px-4 bg-red-500 text-white font-bold rounded-2xl shadow-lg shadow-red-500/20 hover:bg-red-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Show when={isSaving()}>
                <Loader2 class="animate-spin" size={20} />
              </Show>
              {isSaving() ? "Saving..." : "Create Event"}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={isConfirmOpen()}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={async () => {
          if (!saleToDelete()) return;
          try {
            await deleteFlashSale(saleToDelete()!);
            toast.success("Event deleted");
            refetch();
          } catch (e: any) {
            toast.error(e.message);
          }
        }}
        title="Delete Flash Sale"
        message="Are you sure you want to delete this event? This will also remove the flash sale pricing for all associated products."
        confirmText="Delete"
        isDanger={true}
      />
    </Layout>
  );
}
