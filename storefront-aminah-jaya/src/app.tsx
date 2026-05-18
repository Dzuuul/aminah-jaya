import { Router } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";
import { MetaProvider } from "@solidjs/meta";
import { Suspense } from "solid-js";
import "./app.css";
import Loading from "./components/ui/Loading";
import LoginModal from "./components/LoginModal";

export default function App() {
  return (
    <Router
      root={(props) => (
        <MetaProvider>
          <Suspense fallback={
            <div style="display: flex; align-items: center; justify-content: center; height: 100vh; background: var(--white);">
              <Loading />
            </div>
          }>
            {props.children}
            <LoginModal />
          </Suspense>
        </MetaProvider>
      )}
    >
      <FileRoutes />
    </Router>
  );
}
