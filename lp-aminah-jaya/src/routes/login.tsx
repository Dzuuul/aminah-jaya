import { createSignal, Show, onMount } from "solid-js";
import { A, useNavigate } from "@solidjs/router";
import { loginCustomer, googleLogin } from "~/lib/api";

export default function Login() {
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
      navigate("/profile");
    } catch (err: any) {
      setError(err.message || "Gagal masuk. Periksa kembali email/nomor telepon dan kata sandi Anda.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (response: any) => {
    setLoading(true);
    setError(null);
    try {
      const data = await googleLogin(response.credential);
      localStorage.setItem("customer_token", data.token);
      localStorage.setItem("customer_profile", JSON.stringify(data.user));
      navigate("/profile");
    } catch (err: any) {
      setError(err.message || "Gagal masuk dengan Google.");
    } finally {
      setLoading(false);
    }
  };

  onMount(() => {
    // Load Google SDK
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if ((window as any).google) {
        (window as any).google.accounts.id.initialize({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
          callback: handleGoogleSuccess,
        });
        (window as any).google.accounts.id.renderButton(
          document.getElementById("google-btn"),
          { theme: "outline", size: "large", width: "100%", text: "continue_with" }
        );
      }
    };
    document.head.appendChild(script);
  });

  return (
    <div class="auth-layout">
      <main class="auth-page">
        <div class="auth-container" style="max-width: 450px;">
          <div class="auth-card modern">
            <div class="auth-header modern">
              <h1 class="auth-title modern">Masuk</h1>
              <p class="auth-subtitle modern">
                Belum punya akun Aminah Jaya? <A href="/register">Daftar</A>
              </p>
            </div>

            <div id="google-btn" class="oauth-btn-container" style="margin-bottom: 0;"></div>

            <div class="divider-modern">
              <span>atau</span>
            </div>

            <Show when={error()}>
              <div class="auth-error" style="margin-bottom: 20px;">
                <span class="material-symbols-outlined">error</span>
                {error()}
              </div>
            </Show>

            <form class="auth-form" onSubmit={step() === 1 ? handleNext : handleLogin}>
              <Show when={step() === 1}>
                <div class="form-group modern">
                  <input
                    type="text"
                    class="form-input-modern"
                    id="identity"
                    placeholder="Nomor HP atau E-mail"
                    value={identity()}
                    onInput={(e) => setIdentity(e.currentTarget.value)}
                    required
                    autofocus
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
                    id="password"
                    placeholder="Kata Sandi"
                    value={password()}
                    onInput={(e) => setPassword(e.currentTarget.value)}
                    required
                    autofocus
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
      </main>
    </div>
  );
}
