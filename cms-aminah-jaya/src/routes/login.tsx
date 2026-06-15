
import { createSignal, Show, onMount } from "solid-js";
import { LogIn, Lock, Mail, Eye, EyeOff, Loader2, Quote } from "lucide-solid";
import { login, updateToken } from "../lib/api";
import { useNavigate } from "@solidjs/router";
import gsap from "gsap";

const getHadith = () => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 11) {
    return {
      time: "Pagi",
      text: "Sesungguhnya agama itu mudah. Dan tidaklah seseorang mempersulit agama melainkan ia akan dikalahkan (gagal). Maka bertindaklah lurus, mendekatlah (kepada kesempurnaan), berilah kabar gembira, dan manfaatkanlah waktu pagi, sore, serta sebagian malam (untuk beribadah/berbuat baik).",
      ref: "(HR. Bukhari no. 39)"
    };
  } else if (hour >= 11 && hour < 15) {
    return {
      time: "Siang",
      text: "Tidak ada seseorang yang memakan makanan yang lebih baik daripada hasil usahanya sendiri. Dan sesungguhnya Nabi Allah Daud AS dahulu makan dari hasil usahanya sendiri.",
      ref: "(HR. Bukhari no. 2072)"
    };
  } else if (hour >= 15 && hour < 18) {
    return {
      time: "Sore",
      text: "Lakukanlah amalan sesuai kemampuan kalian, karena sesungguhnya Allah tidak akan bosan hingga kalian sendiri yang bosan. Dan sesungguhnya amalan yang paling dicintai oleh Allah adalah yang konsisten (istiqamah) meskipun sedikit.",
      ref: "(HR. Bukhari no. 43)"
    };
  } else {
    return {
      time: "Malam",
      text: "Jika kamu berada di sore hari janganlah menunggu pagi, dan jika kamu berada di pagi hari janganlah menunggu sore. Gunakanlah waktu sehatmu sebelum sakitmu, dan hidupmu sebelum matimu.",
      ref: "(HR. Bukhari no. 6416)"
    };
  }
};

export default function LoginPage() {
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = createSignal(true);
  const hadith = getHadith();

  onMount(() => {
    const token = localStorage.getItem("token");
    if (token) {
      navigate("/", { replace: true });
    } else {
      setIsChecking(false);
      
      // Wait for SolidJS to render the UI before animating
      setTimeout(() => {
        const tl = gsap.timeline();
        
        tl.fromTo(".login-bg-pattern", 
          { opacity: 0 }, 
          { opacity: 1, duration: 1, ease: "power2.inOut" }
        )
        .fromTo(".login-content", 
          { opacity: 0, y: 40 }, 
          { opacity: 1, y: 0, duration: 0.8, ease: "back.out(1.2)" },
          "-=0.5"
        )
        .fromTo(".login-logo-container", 
          { scale: 0, rotation: -180 }, 
          { scale: 1, rotation: 0, duration: 0.8, ease: "back.out(1.5)" },
          "-=0.6"
        )
        .fromTo(".login-title, .login-subtitle", 
          { opacity: 0, y: 20 }, 
          { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: "power2.out" },
          "-=0.4"
        )
        .fromTo(".login-card", 
          { opacity: 0, y: 30, scale: 0.95 }, 
          { opacity: 1, y: 0, scale: 1, duration: 0.6, ease: "power3.out" },
          "-=0.3"
        )
        .fromTo(".login-field, .login-remember-row, .login-btn", 
          { opacity: 0, x: -20 }, 
          { opacity: 1, x: 0, duration: 0.4, stagger: 0.1, ease: "power2.out" },
          "-=0.2"
        )
        .fromTo(".login-quote-box", 
          { opacity: 0, y: 20 }, 
          { opacity: 1, y: 0, duration: 0.6, ease: "power3.out" },
          "-=0.1"
        )
        .fromTo(".login-footer-text", 
          { opacity: 0 }, 
          { opacity: 1, duration: 0.5, ease: "power2.out" },
          "-=0.2"
        );
      }, 50);
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

      // Use updateToken to sync state
      updateToken(data.token);
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

          <div class="login-quote-box">
            <div class="login-quote-icon">
              <Quote size={20} />
            </div>
            <div class="login-quote-content">
              <span class="login-quote-time">Nasihat {hadith.time}</span>
              <p class="login-quote-text">"{hadith.text}"</p>
              <span class="login-quote-ref">{hadith.ref}</span>
            </div>
          </div>

          <p class="login-footer-text">
            &copy; 2026 Aminah Jaya. Hak Cipta Dilindungi.
          </p>
        </div>
      </div>
    </Show>
  );
}
