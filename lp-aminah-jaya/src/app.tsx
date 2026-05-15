import { Router } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";
import { Suspense } from "solid-js";
import "./app.css";
import Loading from "./components/ui/Loading";

export default function App() {
  return (
    <Router
      root={(props) => (
        <Suspense fallback={
          <div style="display: flex; align-items: center; justify-content: center; height: 100vh; background: var(--white);">
            <Loading />
          </div>
        }>
          {props.children}
        </Suspense>
      )}
    >
      <FileRoutes />
    </Router>
  );
}
