import { createSignal, Show, onMount, createEffect } from "solid-js";
import { A, useNavigate } from "@solidjs/router";
import { loginCustomer, googleLogin } from "~/lib/api";
import { showLoginModal, setShowLoginModal, setCustomerProfile } from "~/lib/auth-store";

export default function LoginModal() {
  const [step, setStep] = createSignal(1);
  const [identity, setIdentity] = createSignal("");
  const [password, setPassword] = createSignal("");
  const [loading, setLoading] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);
  const navigate = useNavigate();

  const handleNext = (e: Event) => {
    e.preventDefault();
    if (!identity()) {
      setError("Mohon masukkan email atau nomor telepon Anda.");
      return;
    }
    setError(null);
    setStep(2);
  };

  const handleLogin = async (e: Event) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const data = await loginCustomer({ identity: identity(), password: password() });
      localStorage.setItem("customer_token", data.token);
      localStorage.setItem("customer_profile", JSON.stringify(data.user));
      setCustomerProfile(data.user);
      setShowLoginModal(false);
    } catch (err: any) {
      const errMsg = err.message || "";
      if (
        errMsg.includes("401") ||
        errMsg.toLowerCase().includes("unauthorized") ||
        errMsg.toLowerCase().includes("invalid credentials")
      ) {
        setError("No. Telp/Email atau password salah");
      } else {
        setError(err.message || "Gagal masuk. Periksa kembali email/nomor telepon dan kata sandi Anda.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    if (step() === 1) {
      handleNext(e);
    } else {
      handleLogin(e);
    }
  };

  const handleGoogleSuccess = async (response: any) => {
    setLoading(true);
    setError(null);
    try {
      const data = await googleLogin(response.credential);
      localStorage.setItem("customer_token", data.token);
      localStorage.setItem("customer_profile", JSON.stringify(data.user));
      setCustomerProfile(data.user);
      setShowLoginModal(false);
    } catch (err: any) {
      setError(err.message || "Gagal masuk dengan Google.");
    } finally {
      setLoading(false);
    }
  };

  let googleBtnRef: HTMLDivElement | undefined;

  const initGoogle = () => {
    if ((window as any).google && googleBtnRef) {
      (window as any).google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        callback: handleGoogleSuccess,
      });
      (window as any).google.accounts.id.renderButton(
        googleBtnRef,
        { theme: "outline", size: "large", width: "100%", text: "continue_with" }
      );
    }
  };

  onMount(() => {
    if (!(window as any).google) {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = initGoogle;
      document.head.appendChild(script);
    } else {
      initGoogle();
    }
  });

  // Re-init Google button when modal opens
  createEffect(() => {
    if (showLoginModal()) {
      // Small delay to ensure DOM is ready after Show becomes true
      setTimeout(initGoogle, 0);
    }
  });

  return (
    <Show when={showLoginModal()}>
      <div class="modal-overlay" onClick={() => setShowLoginModal(false)}>
        <div class="modal-content auth-card modern" onClick={(e) => e.stopPropagation()}>
          <button class="modal-close" onClick={() => setShowLoginModal(false)}>
            <span class="material-symbols-outlined">close</span>
          </button>
          
          <div class="auth-header modern">
            <h1 class="auth-title modern">Masuk</h1>
            <p class="auth-subtitle modern">
              Belum punya akun Aminah Jaya? <A href="/register" onClick={() => setShowLoginModal(false)}>Daftar</A>
            </p>
          </div>

          <div ref={googleBtnRef} class="oauth-btn-container" style="margin-bottom: 0;"></div>

          <div class="divider-modern">
            <span>atau</span>
          </div>

          <Show when={error()}>
            <div class="auth-error" style="margin-bottom: 20px;">
              <span class="material-symbols-outlined">error</span>
              {error()}
            </div>
          </Show>

          <form class="auth-form" onSubmit={handleSubmit}>
            <Show when={step() === 1}>
              <div class="form-group modern">
                <input
                  type="text"
                  class="form-input-modern"
                  placeholder="Nomor HP atau E-mail"
                  value={identity()}
                  onInput={(e) => setIdentity(e.currentTarget.value)}
                  required
                />
              </div>
              <button 
                type="submit" 
                class={`auth-btn-modern ${identity().length > 0 ? 'active' : ''}`}
                disabled={identity().length === 0}
              >
                Selanjutnya
              </button>
            </Show>

            <Show when={step() === 2}>
              <div class="form-group" style="margin-bottom: 16px;">
                <div class="selected-identity-box">
                  <span class="material-symbols-outlined">account_circle</span>
                  <span>{identity()}</span>
                  <button type="button" class="btn-change-identity" onClick={() => setStep(1)}>Ubah</button>
                </div>
              </div>
              <div class="form-group modern">
                <div class="form-label-row">
                  <A href="/forgot-password" class="auth-link-sm" style="margin-bottom: 8px; color: var(--green-500); font-weight: 700;">Lupa kata sandi?</A>
                </div>
                <input
                  type="password"
                  class="form-input-modern"
                  placeholder="Kata Sandi"
                  value={password()}
                  onInput={(e) => setPassword(e.currentTarget.value)}
                  required
                />
              </div>

              <button 
                type="submit" 
                class={`auth-btn-modern active`}
                disabled={loading()}
              >
                {loading() ? "Memproses..." : "Masuk"}
              </button>
            </Show>
          </form>
        </div>
      </div>
    </Show>
  );
}
