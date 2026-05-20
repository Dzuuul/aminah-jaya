import {
  createSignal,
  createEffect,
  onCleanup,
  Show,
  mergeProps,
} from "solid-js";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import "./MapPicker.css";

interface Location {
  lat: number;
  lng: number;
  address: string;
}

interface AreaOption {
  label: string;
  lat: number | null;
  lng: number | null;
  raw: any;
}

interface MapPickerProps {
  initialLat?: number;
  initialLng?: number;
  initialAddress?: string;
  onLocationSelect: (location: Location) => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function MapPicker(rawProps: MapPickerProps) {
  const props = mergeProps(
    {
      initialLat: -6.2088,
      initialLng: 106.8456,
      initialAddress: "",
    },
    rawProps,
  );

  const [selectedLocation, setSelectedLocation] = createSignal<Location | null>(
    null,
  );

  const [map, setMap] = createSignal<maplibregl.Map | null>(null);

  const [marker, setMarker] = createSignal<maplibregl.Marker | null>(null);

  const [dropdownOptions, setDropdownOptions] = createSignal<AreaOption[]>([]);

  const [isLoading, setIsLoading] = createSignal(false);

  const [loadError, setLoadError] = createSignal<string | null>(null);

  const [mapContainer, setMapContainer] = createSignal<HTMLDivElement | null>(
    null,
  );

  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  createEffect(() => {
    if (!props.isOpen) {
      cleanupMap();
      return;
    }

    setSelectedLocation({
      lat: props.initialLat,
      lng: props.initialLng,
      address: props.initialAddress,
    });

    if (!map() && mapContainer()) {
      const mapInstance = new maplibregl.Map({
        container: mapContainer()!,
        style: {
          version: 8,
          sources: {
            osm: {
              type: "raster",
              tiles: [
                "https://a.tile.openstreetmap.org/{z}/{x}/{y}.png",
                "https://b.tile.openstreetmap.org/{z}/{x}/{y}.png",
                "https://c.tile.openstreetmap.org/{z}/{x}/{y}.png",
              ],
              tileSize: 256,
              attribution: "&copy; OpenStreetMap Contributors",
            },
          },
          layers: [
            {
              id: "osm-tiles",
              type: "raster",
              source: "osm",
            },
          ],
        },
        center: [props.initialLng, props.initialLat],
        zoom: 13,
      });

      mapInstance.on("load", () => {
        mapInstance.resize();

        const location = selectedLocation();

        if (location) {
          updateMarker(location.lng, location.lat, location.address);
        }
      });

      mapInstance.on("click", (e) => {
        const { lng, lat } = e.lngLat;

        setSelectedLocation({
          lat,
          lng,
          address: selectedLocation()?.address || "Lokasi dipilih dari peta",
        });
      });

      setMap(mapInstance);
    }

    if (map()) {
      map()?.resize();
    }
  });

  createEffect(() => {
    const location = selectedLocation();

    if (location && map()) {
      updateMarker(location.lng, location.lat, location.address);
    }
  });

  onCleanup(() => {
    cleanupMap();

    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
  });

  const cleanupMap = () => {
    if (marker()) {
      marker()?.remove();
      setMarker(null);
    }

    if (map()) {
      map()?.remove();
      setMap(null);
    }
  };

  const updateMarker = (lng: number, lat: number, address = "") => {
    if (Number.isNaN(lng) || Number.isNaN(lat)) return;

    if (!map()) return;

    let markerInstance = marker();

    if (!markerInstance) {
      markerInstance = new maplibregl.Marker({
        color: "#10b981",
        draggable: true,
      });

      markerInstance.on("dragend", () => {
        const lngLat = markerInstance!.getLngLat();

        setSelectedLocation({
          lat: lngLat.lat,
          lng: lngLat.lng,
          address: selectedLocation()?.address || address || "Lokasi dipilih",
        });
      });

      setMarker(markerInstance);
    }

    markerInstance.setLngLat([lng, lat]).addTo(map()!);

    map()?.flyTo({
      center: [lng, lat],
      zoom: 14,
      speed: 0.8,
    });
  };

  const fetchDropdownOptions = async (query: string) => {
    const trimmedQuery = query.trim();

    setLoadError(null);

    if (trimmedQuery.length < 4) {
      setDropdownOptions([]);
      return;
    }

    try {
      setIsLoading(true);

      const apiKey = import.meta.env.VITE_BITESHIP_API_KEY;

      if (!apiKey) {
        throw new Error("VITE_BITESHIP_API_KEY belum diset");
      }

      const response = await fetch(
        `https://api.biteship.com/v1/maps/areas?countries=ID&input=${encodeURIComponent(
          trimmedQuery,
        )}&type=all`,
        {
          method: "GET",
          headers: {
            Authorization: apiKey.trim(),
          },
        },
      );

      if (!response.ok) {
        throw new Error("Gagal mengambil area dari Biteship");
      }

      const data = await response.json();

      const areas = Array.isArray(data?.areas) ? data.areas : [];

      const options: AreaOption[] = await Promise.all(
        areas.map(async (item: any) => {
          const label = item.name || "Area tidak diketahui";

          let lat: number | null = null;
          let lng: number | null = null;

          try {
            // geocoding gratis OpenStreetMap
            const geoResponse = await fetch(
              `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
                label,
              )}&format=json&limit=1`,
            );

            const geoData = await geoResponse.json();

            if (Array.isArray(geoData) && geoData.length > 0) {
              lat = Number(geoData[0].lat);
              lng = Number(geoData[0].lon);
            }
          } catch (geoError) {
            console.error("Geocoding error:", geoError);
          }

          return {
            label,
            lat,
            lng,
            raw: item,
          };
        }),
      );

      setDropdownOptions(options);
    } catch (error: any) {
      console.error(error);

      setLoadError(error?.message || "Terjadi kesalahan");

      setDropdownOptions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchInput = (value: string) => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    debounceTimer = setTimeout(() => {
      fetchDropdownOptions(value);
    }, 500);
  };

  const handleDropdownSelect = (label: string) => {
    const selected = dropdownOptions().find((option) => option.label === label);

    if (!selected) return;

    // fallback jika koordinat kosong
    const lat =
      typeof selected.lat === "number" && !Number.isNaN(selected.lat)
        ? selected.lat
        : props.initialLat;

    const lng =
      typeof selected.lng === "number" && !Number.isNaN(selected.lng)
        ? selected.lng
        : props.initialLng;

    setSelectedLocation({
      lat,
      lng,
      address: selected.label,
    });

    // update marker
    updateMarker(lng, lat, selected.label);

    // auto geser map
    map()?.flyTo({
      center: [lng, lat],
      zoom: 16,
      speed: 1.2,
      essential: true,
    });
  };

  const handleConfirm = () => {
    const location = selectedLocation();

    if (!location) return;

    props.onLocationSelect(location);
    props.onClose();
  };

return (
  <Show when={props.isOpen}>
    <div class="map-picker-overlay">
      <div class="map-picker-modal">
        <div class="map-picker-header">
          <h2>Pilih Lokasi Pengiriman</h2>

          <button
            onClick={props.onClose}
            class="map-picker-close"
          >
            ✕
          </button>
        </div>

        <div class="map-picker-search-section">
          <p class="map-picker-description">
            Cari area atau pilih langsung pada peta.
          </p>

          <div class="map-picker-input-wrapper">
            <input
              type="text"
              placeholder="Cari area..."
              class="map-picker-input"
              onInput={(e) =>
                handleSearchInput(
                  e.currentTarget.value
                )
              }
            />
          </div>

          <Show when={isLoading()}>
            <div class="map-picker-loading">
              Mencari area...
            </div>
          </Show>

          <Show when={dropdownOptions().length > 0}>
            <div class="map-picker-select-wrapper">
              <select
                class="map-picker-select"
                onChange={(e) =>
                  handleDropdownSelect(
                    e.currentTarget.value
                  )
                }
              >
                <option value="">
                  Pilih area
                </option>

                {dropdownOptions().map((option) => (
                  <option value={option.label}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </Show>

          <Show when={loadError()}>
            <div class="map-picker-error">
              {loadError()}
            </div>
          </Show>
        </div>

        <div class="map-picker-map-wrapper">
          <div
            ref={(el) => setMapContainer(el)}
            class="map-picker-map"
          />
        </div>

        <div class="map-picker-footer">
          <div class="map-picker-location-info">
            <p class="map-picker-location-title">
              Lokasi terpilih:
            </p>

            <p class="map-picker-location-text">
              {selectedLocation()
                ? `${
                    selectedLocation()?.address ||
                    "Lokasi dipilih"
                  } — ${selectedLocation()?.lat.toFixed(
                    5
                  )}, ${selectedLocation()?.lng.toFixed(
                    5
                  )}`
                : "Belum ada lokasi dipilih"}
            </p>
          </div>

          <button
            onClick={handleConfirm}
            disabled={!selectedLocation()}
            class="map-picker-confirm-btn"
          >
            Pilih Lokasi
          </button>
        </div>
      </div>
    </div>
  </Show>
);
}
