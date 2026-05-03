import { For, createSignal, JSX, Show } from "solid-js";
import { Search, Check } from "lucide-solid";

export interface Column<T> {
  header: string;
  accessor: keyof T | string;
  render?: (item: T) => JSX.Element;
}

export interface FilterOption {
  label: string;
  value: string;
}

export interface FilterDef {
  key: string;
  label: string;
  options: FilterOption[];
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  searchPlaceholder?: string;
  searchable?: boolean;
  filters?: FilterDef[];
  dateFilter?: { key: keyof T | string; label?: string };
}

export default function DataTable<T extends Record<string, any>>(props: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = createSignal("");
  const [activeFilters, setActiveFilters] = createSignal<Record<string, string[]>>({});
  const [dateRange, setDateRange] = createSignal({ start: "", end: "" });

  const filteredData = () => {
    return props.data.filter((item) => {
      // Search logic
      const matchesSearch = searchQuery() === "" || Object.values(item).some((val) => 
        String(val).toLowerCase().includes(searchQuery().toLowerCase())
      );

      // Filter logic
      const matchesFilters = Object.entries(activeFilters()).every(([key, values]) => {
        if (!values || values.length === 0) return true;
        return values.includes(String(item[key]));
      });

      // Date logic
      let matchesDate = true;
      if (props.dateFilter && (dateRange().start || dateRange().end)) {
        const itemDateStr = item[props.dateFilter.key];
        if (itemDateStr) {
          const itemDate = new Date(itemDateStr).getTime();
          const start = dateRange().start ? new Date(dateRange().start).getTime() : null;
          const end = dateRange().end ? new Date(dateRange().end).setHours(23, 59, 59, 999) : null;
          
          if (start && itemDate < start) matchesDate = false;
          if (end && itemDate > end) matchesDate = false;
        }
      }

      return matchesSearch && matchesFilters && matchesDate;
    });
  };

  const toggleFilter = (key: string, value: string) => {
    setActiveFilters((prev) => {
      const newFilters = { ...prev };
      if (!newFilters[key]) {
        newFilters[key] = [value];
      } else {
        if (newFilters[key].includes(value)) {
          newFilters[key] = newFilters[key].filter(v => v !== value);
          if (newFilters[key].length === 0) delete newFilters[key];
        } else {
          newFilters[key] = [...newFilters[key], value];
        }
      }
      return newFilters;
    });
  };

  const clearFilters = () => {
    setActiveFilters({});
    setDateRange({ start: "", end: "" });
    setSearchQuery("");
  };

  return (
    <div class="bg-white rounded-3xl border border-border/40 shadow-sm overflow-hidden">
      {/* Toolbar */}
      <div class="p-4 border-b border-border/40">
        <div class="flex flex-wrap gap-2.5 items-center">

          {/* Search */}
          <Show when={props.searchable !== false}>
            <div class="relative flex-1 min-w-48">
              <Search class="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" size={16} />
              <input
                type="text"
                placeholder={props.searchPlaceholder || "Search..."}
                value={searchQuery()}
                onInput={(e) => setSearchQuery(e.currentTarget.value)}
                class="filter-input pl-9"
              />
            </div>
          </Show>

          {/* Date Range */}
          <Show when={props.dateFilter}>
            <div class="filter-control flex-shrink-0">
              <span class="filter-label">{props.dateFilter?.label || "Date"}:</span>
              <input
                type="date"
                value={dateRange().start}
                onInput={(e) => setDateRange(p => ({ ...p, start: e.currentTarget.value }))}
                class="filter-date-input"
              />
              <span class="text-muted/60 font-medium text-xs">–</span>
              <input
                type="date"
                value={dateRange().end}
                onInput={(e) => setDateRange(p => ({ ...p, end: e.currentTarget.value }))}
                class="filter-date-input"
              />
            </div>
          </Show>

          {/* Checklist Filters */}
          <Show when={props.filters && props.filters.length > 0}>
            <For each={props.filters}>
              {(filterGroup) => (
                <div class="filter-control flex-shrink-0">
                  <span class="filter-label">{filterGroup.label}:</span>
                  <div class="flex items-center gap-4">
                    <For each={filterGroup.options}>
                      {(opt) => {
                        const isActive = () => activeFilters()[filterGroup.key]?.includes(opt.value);
                        return (
                          <label
                            class="filter-checkbox-label"
                            onClick={() => toggleFilter(filterGroup.key, opt.value)}
                          >
                            <div class={`filter-checkbox-box ${isActive() ? 'active' : ''}`}>
                              <Show when={isActive()}>
                                <Check size={11} class="text-white" />
                              </Show>
                            </div>
                            <span class={`filter-checkbox-text ${isActive() ? 'active' : ''}`}>
                              {opt.label}
                            </span>
                          </label>
                        );
                      }}
                    </For>
                  </div>
                </div>
              )}
            </For>
          </Show>

        </div>
      </div>

      {/* Table Area */}
      <div class="overflow-x-auto relative z-10">
        <table class="w-full text-left">
          <thead class="bg-cream text-muted text-xs font-bold uppercase tracking-wider">
            <tr>
              <For each={props.columns}>
                {(col) => (
                  <th class="px-6 py-4">{col.header}</th>
                )}
              </For>
            </tr>
          </thead>
          <tbody class="divide-y divide-border/30">
            <Show 
              when={filteredData().length > 0} 
              fallback={
                <tr>
                  <td colspan={props.columns.length} class="px-6 py-12 text-center text-muted">
                    <div class="flex flex-col items-center justify-center gap-3">
                      <div class="w-16 h-16 bg-cream rounded-full flex items-center justify-center">
                        <Search size={24} class="text-muted" />
                      </div>
                      <p class="font-medium text-ink-light">No results found for your filters.</p>
                      <button onClick={clearFilters} class="text-sm font-bold text-green-500 hover:text-green-700">Clear all filters</button>
                    </div>
                  </td>
                </tr>
              }
            >
              <For each={filteredData()}>
                {(row) => (
                  <tr class="hover:bg-cream/50 transition-colors group">
                    <For each={props.columns}>
                      {(col) => (
                        <td class="px-6 py-4">
                          {col.render ? col.render(row) : row[col.accessor as keyof T]}
                        </td>
                      )}
                    </For>
                  </tr>
                )}
              </For>
            </Show>
          </tbody>
        </table>
      </div>
    </div>
  );
}
