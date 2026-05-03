import { clientOnly } from "@solidjs/start";
import { createSignal } from "solid-js";
import { LogIn, Lock, Mail, Eye, EyeOff } from "lucide-solid";

export default function LoginPage() {
  const [showPassword, setShowPassword] = createSignal(false);
  const [email, setEmail] = createSignal("");
  const [password, setPassword] = createSignal("");

  return (
    <div class="min-h-screen flex items-center justify-center p-4 bg-sand relative overflow-hidden">
      {/* Decorative blobs */}
      <div class="absolute -top-24 -left-24 w-96 h-96 bg-green-100 rounded-full blur-3xl opacity-50"></div>
      <div class="absolute -bottom-24 -right-24 w-96 h-96 bg-green-50 rounded-full blur-3xl opacity-50"></div>

      <div class="w-full max-w-md relative z-10">
        <div class="text-center mb-8">
          <div class="inline-flex items-center justify-center w-16 h-16 bg-green-500 rounded-2xl shadow-xl shadow-green-500/20 mb-4">
            <LogIn class="text-white" size={32} />
          </div>
          <h1 class="text-3xl font-bold text-ink mb-2">Welcome Back</h1>
          <p class="text-ink-light">Manage your store with ease</p>
        </div>

        <div class="bg-white p-8 rounded-3xl shadow-xl border border-border/40">
          <form class="space-y-6" onsubmit={(e) => e.preventDefault()}>
            <div class="space-y-2">
              <label class="text-sm font-semibold text-ink-light ml-1">Email Address</label>
              <div class="relative group">
                <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-muted transition-colors group-focus-within:text-green-500">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  value={email()}
                  onInput={(e) => setEmail(e.currentTarget.value)}
                  class="block w-full pl-11 pr-4 py-3.5 bg-cream border border-border rounded-2xl focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all outline-none"
                  placeholder="admin@aminahjaya.com"
                />
              </div>
            </div>

            <div class="space-y-2">
              <div class="flex justify-between items-center ml-1">
                <label class="text-sm font-semibold text-ink-light">Password</label>
                <a href="#" class="text-xs font-bold text-green-500 hover:text-green-700 transition-colors">Forgot?</a>
              </div>
              <div class="relative group">
                <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-muted transition-colors group-focus-within:text-green-500">
                  <Lock size={18} />
                </div>
                <input
                  type={showPassword() ? "text" : "password"}
                  value={password()}
                  onInput={(e) => setPassword(e.currentTarget.value)}
                  class="block w-full pl-11 pr-12 py-3.5 bg-cream border border-border rounded-2xl focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all outline-none"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword())}
                  class="absolute inset-y-0 right-0 pr-4 flex items-center text-muted hover:text-ink transition-colors"
                >
                  {showPassword() ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div class="flex items-center gap-2 ml-1">
              <input type="checkbox" id="remember" class="w-4 h-4 accent-green-500 rounded border-border" />
              <label for="remember" class="text-sm text-ink-light cursor-pointer">Remember me</label>
            </div>

            <button
              type="submit"
              class="w-full py-4 bg-green-500 text-white rounded-2xl font-bold text-lg shadow-lg shadow-green-500/30 hover:bg-green-700 hover:-translate-y-0.5 transition-all active:scale-95"
            >
              Sign In
            </button>
          </form>
        </div>

        <p class="text-center mt-8 text-sm text-ink-light">
          &copy; 2026 Aminah Jaya Store. All rights reserved.
        </p>
      </div>
    </div>
  );
}
