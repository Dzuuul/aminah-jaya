import { Router, useLocation, useNavigate } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";
import { Suspense, createEffect, createSignal, Show, onMount, on } from "solid-js";
import "./app.css";
import { authToken } from "./lib/api";

function AuthGuard(props: { children: any }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [checking, setChecking] = createSignal(true);
  const [navigated, setNavigated] = createSignal(false);

  // Fungsi cek auth yang konsisten dengan guard agar tidak menavigasi berulang
  const checkAuth = (path: string) => {
    const token = authToken();
    const isLoginPage = path === '/login';

    console.log('[AuthGuard] checkAuth', { path, hasToken: !!token });

    if (!token && !isLoginPage && !navigated()) {
      console.log('[AuthGuard] redirect to /login');
      setNavigated(true);
      navigate('/login', { replace: true });
    } else if (token && isLoginPage && !navigated()) {
      console.log('[AuthGuard] redirect to dashboard');
      setNavigated(true);
      navigate('/', { replace: true });
    }
  };

  onMount(() => {
    // Perform auth check first
    checkAuth(location.pathname);
    // Hide loading overlay after auth handling
    setChecking(false);
  });

  createEffect(
    on(
      () => location.pathname,
      (path) => {
        // Reset navigation guard when path changes to allow new redirects
        setNavigated(false);
        checkAuth(path);
      },
      { defer: true }
    )
  );

  return (
    <div class="auth-wrapper">
      <Show when={checking()}>
        <div class="loading-overlay">
          <div class="spinner"></div>
          <p class="loading-text">Memverifikasi sesi...</p>
        </div>
      </Show>
      {props.children}
    </div>
  );
}

import ToastContainer from "./components/ToastContainer";

export default function App() {
  return (
    <Router
      root={(props) => (
        <main id="cms-app">
          <Suspense fallback={
            <div class="min-h-screen flex items-center justify-center bg-[#f7f4ef]">
              <div class="w-8 h-8 border-3 border-green-500/30 border-t-green-500 rounded-full animate-spin"></div>
            </div>
          }>
            <AuthGuard>
              {props.children}
            </AuthGuard>
          </Suspense>
          <ToastContainer />
        </main>
      )}
    >
      <FileRoutes />
    </Router>
  );
}

