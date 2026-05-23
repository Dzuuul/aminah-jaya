import {
  createSignal,
  createEffect,
  onCleanup,
  Show,
  mergeProps,
} from "solid-js";
import type maplibregl from "maplibre-gl";
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

  const [fullAddress, setFullAddress] = createSignal("");
  const [courierNote, setCourierNote] = createSignal("");

  const [map, setMap] = createSignal<maplibregl.Map | null>(null);

  const [marker, setMarker] = createSignal<maplibregl.Marker | null>(null);

  let maplibreglClient: typeof maplibregl | null = null;

  const [dropdownOptions, setDropdownOptions] = createSignal<AreaOption[]>([]);

  const [isLoading, setIsLoading] = createSignal(false);
  const [isUsingCurrentLocation, setIsUsingCurrentLocation] = createSignal(false);

  const [loadError, setLoadError] = createSignal<string | null>(null);
  const [searchQuery, setSearchQuery] = createSignal("");

  const [mapContainer, setMapContainer] = createSignal<HTMLDivElement | null>(
    null,
  );

  const [step, setStep] = createSignal(1);

  const currentStep = () => step();

  const getHeaderTitle = () => {
    if (step() === 2) return "Tentukan Pinpoint Lokasi";
    if (step() === 3) return "Lengkapi Detail Alamat";
    return "Pilih Lokasi Pengiriman";
  };

  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  const initializeMap = async () => {
    if (!props.isOpen || map() || !mapContainer()) {
      return;
    }

    if (!maplibreglClient) {
      const imported = await import("maplibre-gl");
      maplibreglClient = (imported.default ?? imported) as typeof maplibregl;
    }

    const mapInstance = new maplibreglClient.Map({
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
  };

  createEffect(() => {
    if (!props.isOpen) {
      cleanupMap();
      return;
    }

    setStep(1);
    setSelectedLocation({
      lat: props.initialLat,
      lng: props.initialLng,
      address: props.initialAddress,
    });

    setFullAddress(props.initialAddress || "");
    setCourierNote("");
  });

  createEffect(() => {
    if (props.isOpen) {
      void initializeMap();
    }
  });

  createEffect(() => {
    const location = selectedLocation();

    if (location && map()) {
      updateMarker(location.lng, location.lat, location.address);
    }
  });

  createEffect(() => {
    if (step() === 2 && map()) {
      setTimeout(() => {
        map()?.resize();

        const location = selectedLocation();
        if (location) {
          map()?.flyTo({
            center: [location.lng, location.lat],
            zoom: 16,
            speed: 1.2,
            essential: true,
          });
        }
      }, 50);
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

  const closePicker = () => {
    cleanupMap();
    props.onClose();
  };

  const updateMarker = (lng: number, lat: number, address = "") => {
    if (Number.isNaN(lng) || Number.isNaN(lat)) return;

    if (!map()) return;

    let markerInstance = marker();

    if (!markerInstance) {
      markerInstance = new maplibreglClient!.Marker({
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

  const normalizeAreaCoordinates = (item: any): [number | null, number | null] => {
    if (!item) {
      return [null, null];
    }

    if (Array.isArray(item.geometry?.coordinates) && item.geometry.coordinates.length >= 2) {
      return [Number(item.geometry.coordinates[0]), Number(item.geometry.coordinates[1])];
    }

    if (Array.isArray(item.coordinates) && item.coordinates.length >= 2) {
      return [Number(item.coordinates[0]), Number(item.coordinates[1])];
    }

    if (typeof item.longitude === "number" && typeof item.latitude === "number") {
      return [item.longitude, item.latitude];
    }

    if (typeof item.lng === "number" && typeof item.lat === "number") {
      return [item.lng, item.lat];
    }

    if (typeof item.lon === "number" && typeof item.lat === "number") {
      return [item.lon, item.lat];
    }

    return [null, null];
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

      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("customer_token")
          : null;
      const apiBase =
        import.meta.env.VITE_API_BASE || "http://localhost:8001/api";

      const response = await fetch(
        `${apiBase}/shipping/maps/areas?input=${encodeURIComponent(trimmedQuery)}`,
        {
          method: "GET",
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        },
      );

      if (!response.ok) {
        throw new Error("Gagal mengambil area dari Biteship");
      }

      const json = await response.json();
      if (!json?.success) {
        throw new Error(json?.message || "Gagal mengambil area");
      }

      const areas = Array.isArray(json?.data) ? json.data : [];

      const options: AreaOption[] = await Promise.all(
        areas.map(async (item: any) => {
          const label = item.name || "Area tidak diketahui";
          let [lng, lat] = normalizeAreaCoordinates(item);

          if (lat === null || lng === null) {
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

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`,
      );

      if (!response.ok) {
        return "Lokasi saat ini";
      }

      const data = await response.json();
      return data.display_name || "Lokasi saat ini";
    } catch (error) {
      console.error("Reverse geocode error", error);
      return "Lokasi saat ini";
    }
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLoadError("Browser tidak mendukung lokasi saat ini");
      return;
    }

    setIsLoading(true);
    setLoadError(null);
    setIsUsingCurrentLocation(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const address = await reverseGeocode(lat, lng);

        setSelectedLocation({ lat, lng, address });

        if (step() === 1) {
          setStep(2);
        }

        updateMarker(lng, lat, address);

        setTimeout(() => {
          map()?.resize();
          updateMarker(lng, lat, address);
          map()?.flyTo({
            center: [lng, lat],
            zoom: 16,
            speed: 1.2,
            essential: true,
          });
        }, 120);

        setIsLoading(false);
        setIsUsingCurrentLocation(false);
      },
      (error) => {
        console.error(error);
        setLoadError("Gagal mengambil lokasi saat ini. Pastikan izin lokasi diberikan.");
        setIsLoading(false);
        setIsUsingCurrentLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
      },
    );
  };

  const handleSearchInput = (value: string) => {
    setSearchQuery(value);

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

    setSearchQuery(selected.label);
    setSelectedLocation({
      lat,
      lng,
      address: selected.label,
    });

    if (step() === 1) {
      setStep(2);
    }

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

  const getCombinedAddress = () => {
    const locationText =
      fullAddress().trim() || selectedLocation()?.address || "";
    const details: string[] = [];

    if (locationText) {
      details.push(locationText);
    }

    if (courierNote().trim()) {
      details.push(`Catatan untuk kurir: ${courierNote().trim()}`);
    }

    return details.join("\n");
  };

  const handlePrevious = () => {
    if (step() > 1) {
      setStep(step() - 1);
    }
  };

  const handleNext = () => {
    if (step() === 1 && !selectedLocation()) {
      setLoadError("Pilih lokasi terlebih dahulu sebelum lanjut.");
      return;
    }

    if (step() < 3) {
      setStep(step() + 1);
      setLoadError(null);
    }
  };

  const handleConfirm = () => {
    const location = selectedLocation();

    if (!location) return;

    const combinedAddress = getCombinedAddress();

    props.onLocationSelect({
      lat: location.lat,
      lng: location.lng,
      address: combinedAddress || location.address,
    });
    closePicker();
  };

return (
  <Show when={props.isOpen}>
    <div class="map-picker-overlay">
      <div class="map-picker-modal">
        <div class="map-picker-header">
          <button
            type="button"
            class="map-picker-back-mobile"
            onClick={() =>
              currentStep() === 1 ? closePicker() : handlePrevious()
            }
          >
            ←
          </button>

          <h2>{getHeaderTitle()}</h2>

          <button
            type="button"
            onClick={closePicker}
            class="map-picker-close"
          >
            ✕
          </button>
        </div>

        <div class="map-picker-body">
          <div class="map-picker-steps">
            <div class={`map-picker-step ${currentStep() === 1 ? "active" : ""}`}>
              <div class="map-picker-step-number">1</div>
              <div>
                <div class="map-picker-step-title">Cari lokasi</div>
                <div class="map-picker-step-desc">Pilih atau gunakan lokasi saat ini</div>
              </div>
            </div>
            <div class={`map-picker-step ${currentStep() === 2 ? "active" : ""}`}>
              <div class="map-picker-step-number">2</div>
              <div>
                <div class="map-picker-step-title">Tentukan pinpoint</div>
                <div class="map-picker-step-desc">Tarik pin pada peta</div>
              </div>
            </div>
            <div class={`map-picker-step ${currentStep() === 3 ? "active" : ""}`}>
              <div class="map-picker-step-number">3</div>
              <div>
                <div class="map-picker-step-title">Lengkapi detail</div>
                <div class="map-picker-step-desc">Simpan informasi alamat</div>
              </div>
            </div>
          </div>

          <Show when={currentStep() === 1}>
            <div class="map-picker-search-section">
              <p class="map-picker-description">
                Cari lokasi tujuan pengiriman atau gunakan lokasi saat ini.
              </p>

              <div class="map-picker-input-wrapper">
                <input
                  type="text"
                  placeholder="Tulis nama kecamatan"
                  class="map-picker-input"
                  value={searchQuery()}
                  onInput={(e) =>
                    handleSearchInput(
                      e.currentTarget.value
                    )
                  }
                />
              </div>

              <Show when={dropdownOptions().length > 0}>
                <div class="map-picker-select-wrapper">
                  <select
                    class="map-picker-select"
                    value={selectedLocation()?.address || ""}
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

              <div class="map-picker-actions-row">
                <button
                  type="button"
                  class="map-picker-current-btn"
                  onClick={handleUseCurrentLocation}
                  disabled={isLoading()}
                >
                  {isUsingCurrentLocation() ? "Mencari lokasi..." : "Gunakan Lokasi Saat Ini"}
                </button>
              </div>

              <Show when={isLoading()}>
                <div class="map-picker-loading">
                  Mencari area...
                </div>
              </Show>

              <Show when={loadError()}>
                <div class="map-picker-error">
                  {loadError()}
                </div>
              </Show>
            </div>
          </Show>

          <div
            class="map-picker-map-section"
            classList={{ "map-picker-hidden": currentStep() !== 2 }}
          >
            <div class="map-picker-map-wrapper">
              <div
                ref={(el) => setMapContainer(el)}
                class="map-picker-map"
              />
            </div>

            <div class="map-picker-location-preview">
              <p class="map-picker-section-header">Tentukan pinpoint</p>
              <p class="map-picker-description">
                Klik peta atau tarik pin untuk menyesuaikan titik lokasi.
              </p>
              <p class="map-picker-location-text">
                {selectedLocation()
                  ? `${selectedLocation()?.address || "Lokasi dipilih"}`
                  : "Belum ada lokasi dipilih"}
              </p>
            </div>
          </div>

          <Show when={currentStep() === 3}>
            <div class="map-picker-detail-section">
              <p class="map-picker-description">
                Label, nama penerima, dan nomor HP diisi di halaman profil.
                Di sini cukup lengkapi alamat dan catatan kurir.
              </p>

              <div class="map-picker-form-grid">
                <div class="map-picker-field map-picker-fullwidth">
                  <label>Alamat Lengkap</label>
                  <textarea
                    class="map-picker-textarea"
                    value={fullAddress()}
                    onInput={(e) => setFullAddress(e.currentTarget.value)}
                    placeholder="Nama jalan, RT/RW, kelurahan, kecamatan, kota, provinsi, kode pos"
                  />
                </div>

                <div class="map-picker-field map-picker-fullwidth">
                  <label>Catatan untuk Kurir (Opsional)</label>
                  <textarea
                    class="map-picker-textarea"
                    value={courierNote()}
                    onInput={(e) => setCourierNote(e.currentTarget.value)}
                    placeholder="Warna rumah, patokan, pesan khusus, dll."
                  />
                </div>
              </div>
            </div>
          </Show>
        </div>

        <div class="map-picker-footer">
          <div class="map-picker-footer-actions">
            <button
              type="button"
              class="map-picker-back-btn"
              onClick={() =>
                currentStep() === 1 ? closePicker() : handlePrevious()
              }
            >
              Kembali
            </button>

            {currentStep() < 3 ? (
              <button
                type="button"
                class="map-picker-next-btn"
                onClick={handleNext}
                disabled={currentStep() === 1 && !selectedLocation()}
              >
                Lanjut
              </button>
            ) : (
              <button
                type="button"
                class="map-picker-confirm-btn"
                onClick={handleConfirm}
                disabled={
                  !selectedLocation() || !getCombinedAddress().trim()
                }
              >
                Pilih Lokasi
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  </Show>
);
}
