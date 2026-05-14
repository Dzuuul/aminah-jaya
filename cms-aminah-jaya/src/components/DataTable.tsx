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
    <div class="data-table-container">
      {/* Toolbar */}
      <div class="data-table-toolbar">
        <div class="data-table-toolbar-inner">

          {/* Search */}
          <Show when={props.searchable !== false}>
            <div class="data-table-search">
              <Search class="data-table-search-icon" size={16} />
              <input
                type="text"
                placeholder={props.searchPlaceholder || "Cari..."}
                value={searchQuery()}
                onInput={(e) => setSearchQuery(e.currentTarget.value)}
                class="data-table-search-input"
              />
            </div>
          </Show>

          {/* Date Range */}
          <Show when={props.dateFilter}>
            <div style={{ display: "flex", "align-items": "center", gap: "0.5rem", "flex-shrink": 0 }}>
              <span style={{ "font-size": "0.75rem", "font-weight": "700", color: "var(--color-muted)", "text-transform": "uppercase", "letter-spacing": "0.05em" }}>{props.dateFilter?.label || "Tanggal"}:</span>
              <input
                type="date"
                value={dateRange().start}
                onInput={(e) => setDateRange(p => ({ ...p, start: e.currentTarget.value }))}
                style={{ padding: "0.5rem 0.75rem", "border-radius": "0.5rem", border: "1px solid var(--color-border)", "background-color": "var(--color-cream)", "font-size": "0.875rem", outline: "none", "color": "var(--color-ink)" }}
              />
              <span style={{ color: "var(--color-muted)", "font-weight": "500", "font-size": "0.75rem" }}>–</span>
              <input
                type="date"
                value={dateRange().end}
                onInput={(e) => setDateRange(p => ({ ...p, end: e.currentTarget.value }))}
                style={{ padding: "0.5rem 0.75rem", "border-radius": "0.5rem", border: "1px solid var(--color-border)", "background-color": "var(--color-cream)", "font-size": "0.875rem", outline: "none", "color": "var(--color-ink)" }}
              />
            </div>
          </Show>

          {/* Checklist Filters */}
          <Show when={props.filters && props.filters.length > 0}>
            <For each={props.filters}>
              {(filterGroup) => (
                <div style={{ display: "flex", "align-items": "center", gap: "0.75rem", "flex-shrink": 0 }}>
                  <span style={{ "font-size": "0.75rem", "font-weight": "700", color: "var(--color-muted)", "text-transform": "uppercase", "letter-spacing": "0.05em" }}>{filterGroup.label}:</span>
                  <div style={{ display: "flex", "align-items": "center", gap: "1rem" }}>
                    <For each={filterGroup.options}>
                      {(opt) => {
                        const isActive = () => activeFilters()[filterGroup.key]?.includes(opt.value);
                        return (
                          <label
                            style={{ display: "flex", "align-items": "center", gap: "0.375rem", cursor: "pointer" }}
                            onClick={() => toggleFilter(filterGroup.key, opt.value)}
                          >
                            <div style={{ 
                              width: "1rem", 
                              height: "1rem", 
                              "border-radius": "0.25rem", 
                              border: isActive() ? "1px solid var(--color-green-500)" : "1px solid var(--color-border)",
                              "background-color": isActive() ? "var(--color-green-500)" : "var(--color-cream)",
                              display: "flex",
                              "align-items": "center",
                              "justify-content": "center",
                              transition: "all 0.2s"
                            }}>
                              <Show when={isActive()}>
                                <Check size={11} color="#ffffff" />
                              </Show>
                            </div>
                            <span style={{ 
                              "font-size": "0.875rem", 
                              "font-weight": isActive() ? "600" : "500", 
                              color: isActive() ? "var(--color-ink)" : "var(--color-ink-light)",
                              transition: "all 0.2s"
                            }}>
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
      <div class="data-table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <For each={props.columns}>
                {(col) => (
                  <th>{col.header}</th>
                )}
              </For>
            </tr>
          </thead>
          <tbody>
            <Show 
              when={filteredData().length > 0} 
              fallback={
                <tr>
                  <td colspan={props.columns.length} class="data-table-empty">
                    <div class="data-table-empty-inner">
                      <div class="data-table-empty-icon">
                        <Search size={24} color="var(--color-muted)" />
                      </div>
                      <p class="data-table-empty-text">Tidak ada hasil yang ditemukan.</p>
                      <button onClick={clearFilters} class="data-table-empty-btn">Bersihkan semua filter</button>
                    </div>
                  </td>
                </tr>
              }
            >
              <For each={filteredData()}>
                {(row) => (
                  <tr>
                    <For each={props.columns}>
                      {(col) => (
                        <td>
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
