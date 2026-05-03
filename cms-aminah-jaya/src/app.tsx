import { Router, useLocation, useNavigate } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";
import { Suspense, onMount, createSignal, Show } from "solid-js";
import "./app.css";

function AuthGuard(props: { children: any }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [isReady, setIsReady] = createSignal(false);

  onMount(() => {
    const token = localStorage.getItem("token");
    const isLoginPage = location.pathname === "/login";

    if (!token && !isLoginPage) {
      navigate("/login", { replace: true });
    } else {
      setIsReady(true);
    }
  });

  return (
    <Show when={isReady() || location.pathname === "/login"}>
      {props.children}
    </Show>
  );
}

export default function App() {
  return (
    <Router
      root={(props) => (
        <Suspense>
          <AuthGuard>
            {props.children}
          </AuthGuard>
        </Suspense>
      )}
    >
      <FileRoutes />
    </Router>
  );
}
