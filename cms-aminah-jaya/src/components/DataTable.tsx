import { For, createSignal, JSX, Show, createEffect, createMemo } from "solid-js";
import { Search, Check, ChevronLeft, ChevronRight } from "lucide-solid";

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
  pagination?: boolean;
  defaultItemsPerPage?: number;
  
  // External/Server-side pagination props
  serverSide?: boolean;
  totalItems?: number;
  currentPage?: number;
  itemsPerPage?: number;
  onPageChange?: (page: number) => void;
  onItemsPerPageChange?: (size: number) => void;
}

export default function DataTable<T extends Record<string, any>>(props: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = createSignal("");
  const [activeFilters, setActiveFilters] = createSignal<Record<string, string[]>>({});
  const [dateRange, setDateRange] = createSignal({ start: "", end: "" });

  // Local pagination states (used if serverSide is false)
  const [localCurrentPage, setLocalCurrentPage] = createSignal(1);
  const [localItemsPerPage, setLocalItemsPerPage] = createSignal(props.defaultItemsPerPage || 10);

  // Unified pagination accessors
  const currentPage = () => props.serverSide ? (props.currentPage ?? 1) : localCurrentPage();
  const itemsPerPage = () => props.serverSide ? (props.itemsPerPage ?? 10) : localItemsPerPage();

  const setCurrentPage = (page: number | ((prev: number) => number)) => {
    const nextVal = typeof page === 'function' ? page(currentPage()) : page;
    if (props.serverSide) {
      props.onPageChange?.(nextVal);
    } else {
      setLocalCurrentPage(nextVal);
    }
  };

  const setItemsPerPage = (size: number) => {
    if (props.serverSide) {
      props.onItemsPerPageChange?.(size);
    } else {
      setLocalItemsPerPage(size);
      setLocalCurrentPage(1);
    }
  };

  // Reset current page when filters or search query changes
  createEffect(() => {
    searchQuery();
    activeFilters();
    dateRange();
    setCurrentPage(1);
  });

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

  const isPaginationEnabled = () => props.pagination !== false;

  const totalItems = () => props.serverSide ? (props.totalItems ?? props.data.length) : filteredData().length;

  const totalPages = () => Math.max(1, Math.ceil(totalItems() / itemsPerPage()));

  const paginatedData = () => {
    if (!isPaginationEnabled()) return filteredData();
    if (props.serverSide) return props.data; // Server already sliced/paginated the data
    const start = (currentPage() - 1) * itemsPerPage();
    const end = start + itemsPerPage();
    return filteredData().slice(start, end);
  };

  const pageNumbers = () => {
    const total = totalPages();
    const current = currentPage();
    const range: (number | string)[] = [];

    if (total <= 7) {
      for (let i = 1; i <= total; i++) {
        range.push(i);
      }
    } else {
      if (current <= 4) {
        range.push(1, 2, 3, 4, 5, "...", total);
      } else if (current >= total - 3) {
        range.push(1, "...", total - 4, total - 3, total - 2, total - 1, total);
      } else {
        range.push(1, "...", current - 1, current, current + 1, "...", total);
      }
    }
    return range;
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
              when={totalItems() > 0} 
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
              <For each={paginatedData()}>
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

      {/* Pagination Footer */}
      <Show when={isPaginationEnabled() && totalItems() > 0}>
        <div class="data-table-pagination">
          <div style={{ display: "flex", "align-items": "center", gap: "1rem", "flex-wrap": "wrap" }}>
            <div class="data-table-pagination-info">
              Menampilkan <strong>{Math.min((currentPage() - 1) * itemsPerPage() + 1, totalItems())}</strong> hingga <strong>{Math.min(currentPage() * itemsPerPage(), totalItems())}</strong> dari <strong>{totalItems()}</strong> entri
            </div>
            <div style={{ display: "flex", "align-items": "center", gap: "0.5rem" }}>
              <span style={{ "font-size": "0.875rem", color: "var(--color-muted)" }}>Tampilkan:</span>
              <select
                class="pagination-size-select"
                value={itemsPerPage()}
                onChange={(e) => {
                  setItemsPerPage(parseInt(e.currentTarget.value));
                }}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>
          <div class="data-table-pagination-controls">
            <button 
              class="pagination-btn" 
              disabled={currentPage() === 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              title="Halaman Sebelumnya"
            >
              <ChevronLeft size={16} />
              <span>Sebelumnya</span>
            </button>
            <div class="pagination-pages">
              <For each={pageNumbers()}>
                {(num) => (
                  <button
                    class={`pagination-page-btn ${num === currentPage() ? 'active' : ''} ${num === '...' ? 'dots' : ''}`}
                    disabled={num === '...'}
                    onClick={() => typeof num === 'number' && setCurrentPage(num)}
                  >
                    {num}
                  </button>
                )}
              </For>
            </div>
            <button 
              class="pagination-btn" 
              disabled={currentPage() >= totalPages()}
              onClick={() => setCurrentPage(p => Math.min(totalPages(), p + 1))}
              title="Halaman Berikutnya"
            >
              <span>Berikutnya</span>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </Show>
    </div>
  );
}
