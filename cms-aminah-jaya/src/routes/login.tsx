
import { createSignal, Show, onMount } from "solid-js";
import { LogIn, Lock, Mail, Eye, EyeOff, Loader2 } from "lucide-solid";
import { login } from "~/lib/api";
import { useNavigate } from "@solidjs/router";

export default function LoginPage() {
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = createSignal(true);

  onMount(() => {
    const token = localStorage.getItem("token");
    if (token) {
      navigate("/", { replace: true });
    } else {
      setIsChecking(false);
    }
  });
  const [showPassword, setShowPassword] = createSignal(false);
  const [email, setEmail] = createSignal("");
  const [password, setPassword] = createSignal("");
  const [isLoading, setIsLoading] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);



  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const data = await login(email(), password());

      // Store token and user info
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      // Use Solid router navigation after a tick to ensure owner context
      setTimeout(() => navigate("/"), 0);
    } catch (err: any) {
      setError(err.message || "Gagal masuk. Silakan periksa kredensial Anda.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Show when={!isChecking()}>
      <div class="login-wrapper">
        {/* Pattern Background */}
        <div class="absolute inset-0 login-bg-pattern"></div>

        <div class="login-content">
          <div class="login-header">
            <div class="login-logo-container">
              <img src="/logo.png" alt="Logo" class="login-logo" />
            </div>
            <h1 class="login-title">Assalamu'alaikum</h1>
            <p class="login-subtitle">Masuk ke akun anda untuk melanjutkan</p>
          </div>

          <div class="login-card">
            <form class="login-form" onSubmit={handleSubmit}>
              <Show when={error()}>
                <div class="login-error">
                  {error()}
                </div>
              </Show>

              <div class="login-field">
                <label class="login-label">Email</label>
                <div class="login-input-group">
                  <div class="login-icon">
                    <Mail size={18} />
                  </div>
                  <input
                    type="email"
                    value={email()}
                    required
                    onInput={(e) => setEmail(e.currentTarget.value)}
                    class="login-input"
                    placeholder="admin@aminahjaya.com"
                    disabled={isLoading()}
                  />
                </div>
              </div>

              <div class="login-field">
                <div class="login-label-row">
                  <label class="login-label" style={{ "margin-left": 0 }}>Kata Sandi</label>
                  <a href="#" class="login-forgot-link">Lupa?</a>
                </div>
                <div class="login-input-group">
                  <div class="login-icon">
                    <Lock size={18} />
                  </div>
                  <input
                    type={showPassword() ? "text" : "password"}
                    value={password()}
                    required
                    onInput={(e) => setPassword(e.currentTarget.value)}
                    class="login-input login-password-input"
                    placeholder="••••••••"
                    disabled={isLoading()}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword())}
                    class="login-password-toggle"
                    disabled={isLoading()}
                  >
                    {showPassword() ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div class="login-remember-row">
                <input type="checkbox" id="remember" class="login-checkbox" disabled={isLoading()} />
                <label for="remember" class="login-checkbox-label">Ingat saya</label>
              </div>

              <button
                type="submit"
                disabled={isLoading()}
                class="login-btn"
              >
                <Show when={isLoading()}>
                  <Loader2 class="animate-spin" size={20} />
                </Show>
                {isLoading() ? "Masuk..." : "Masuk"}
              </button>
            </form>
          </div>

          <p class="login-footer-text">
            &copy; 2026 Aminah Jaya. Hak Cipta Dilindungi.
          </p>
        </div>
      </div>
    </Show>
  );
}
