export default function Loading(props: { message?: string }) {
  return (
    <div class="loading-wrapper">
      {/* Spinner */}
      <div class="spinner-container">
        <div class="spinner-outer-ring"></div>
        <div class="spinner-inner-ring"></div>
        <img src="/logo_new.png" class="spinner-logo" alt="Logo" />
      </div>

      {/* Teks + dots */}
      <div class="loading-text-group">
        <p class="loading-text">
          {props.message || "Memuat halaman..."}
        </p>
        <div class="loading-dots">
          <div class="dot" style="animation-delay: 0s;"></div>
          <div class="dot" style="animation-delay: 0.2s;"></div>
          <div class="dot" style="animation-delay: 0.4s;"></div>
        </div>
      </div>
    </div>
  );
}
