
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
      setError(err.message || "Failed to sign in. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Show when={!isChecking()}>
      <div class="min-h-screen flex items-center justify-center p-4 bg-sand relative overflow-hidden">
        {/* Decorative blobs */}
        <div class="absolute -top-24 -left-24 w-96 h-96 bg-green-100 rounded-full blur-3xl opacity-50"></div>
        <div class="absolute -bottom-24 -right-24 w-96 h-96 bg-green-50 rounded-full blur-3xl opacity-50"></div>

        <div class="w-full max-w-md relative z-10">
          <div class="text-center mb-8">
            <div class="inline-flex items-center justify-center mb-4">
              <img src="/logo.png" alt="Logo" class="w-16" />
            </div>
            <h1 class="text-3xl font-bold text-ink mb-2">Assalamu'alaikum</h1>
            <p class="text-ink-light">Masuk ke akun anda untuk melanjutkan</p>
          </div>

          <div class="bg-white p-8 rounded-3xl shadow-xl border border-border/40">
            <form class="space-y-6" onSubmit={handleSubmit}>
              <Show when={error()}>
                <div class="p-4 bg-red-50 border border-red-100 text-red-600 text-sm rounded-2xl animate-in fade-in slide-in-from-top-1">
                  {error()}
                </div>
              </Show>

              <div class="space-y-2">
                <label class="text-sm font-semibold text-ink-light ml-1 block">Email</label>
                <div class="relative group">
                  <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-muted transition-colors group-focus-within:text-green-500">
                    <Mail size={18} />
                  </div>
                  <input
                    type="email"
                    value={email()}
                    required
                    onInput={(e) => setEmail(e.currentTarget.value)}
                    class="block w-full pl-11 pr-4 py-3.5 bg-cream border border-border rounded-2xl focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all outline-none disabled:opacity-50"
                    placeholder="admin@aminahjaya.com"
                    disabled={isLoading()}
                  />
                </div>
              </div>

              <div class="space-y-2">
                <div class="flex justify-between items-center ml-1">
                  <label class="text-sm font-semibold text-ink-light">Password</label>
                  <a href="#" class="text-xs font-bold text-green-500 hover:text-green-700 transition-colors">Lupa?</a>
                </div>
                <div class="relative group">
                  <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-muted transition-colors group-focus-within:text-green-500">
                    <Lock size={18} />
                  </div>
                  <input
                    type={showPassword() ? "text" : "password"}
                    value={password()}
                    required
                    onInput={(e) => setPassword(e.currentTarget.value)}
                    class="block w-full pl-11 pr-12 py-3.5 bg-cream border border-border rounded-2xl focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all outline-none disabled:opacity-50"
                    placeholder="••••••••"
                    disabled={isLoading()}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword())}
                    class="absolute inset-y-0 right-0 pr-4 flex items-center text-muted hover:text-ink transition-colors"
                    disabled={isLoading()}
                  >
                    {showPassword() ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div class="flex items-center gap-2 ml-1">
                <input type="checkbox" id="remember" class="w-4 h-4 accent-green-500 rounded border-border" disabled={isLoading()} />
                <label for="remember" class="text-sm text-ink-light cursor-pointer">Ingat saya</label>
              </div>

              <button
                type="submit"
                disabled={isLoading()}
                class="w-full py-4 bg-green-500 text-white rounded-2xl font-bold text-lg shadow-lg shadow-green-500/30 hover:bg-green-700 hover:-translate-y-0.5 transition-all active:scale-95 disabled:opacity-70 disabled:hover:translate-y-0 flex items-center justify-center gap-2"
              >
                <Show when={isLoading()}>
                  <Loader2 class="animate-spin" size={20} />
                </Show>
                {isLoading() ? "Signing In..." : "Sign In"}
              </button>
            </form>
          </div>

          <p class="text-center mt-8 text-sm text-ink-light">
            &copy; 2026 Aminah Jaya. Hak Cipta Dilindungi.
          </p>
        </div>
      </div>
    </Show>
  );
}
