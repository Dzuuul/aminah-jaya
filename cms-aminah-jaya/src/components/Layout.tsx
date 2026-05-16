import { createSignal, JSX } from "solid-js";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import { sidebarFolded } from "../lib/sidebarStore";

export default function Layout(props: { children: JSX.Element, title?: string, onBack?: () => void }) {
  const [isSidebarOpen, setIsSidebarOpen] = createSignal(false);

  return (
    <div class="app-container">
      {/* Mobile Sidebar Overlay */}
      <div 
        class={`fixed inset-0 z-40 lg:hidden transition-opacity duration-300 ${isSidebarOpen() ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        style={{ "background-color": "rgba(26, 26, 26, 0.2)", "backdrop-filter": "blur(4px)", "-webkit-backdrop-filter": "blur(4px)" }}
        onClick={() => setIsSidebarOpen(false)}
      ></div>

      <Sidebar isOpen={isSidebarOpen()} onClose={() => setIsSidebarOpen(false)} />

      <main class={`main-content ${sidebarFolded() ? 'is-folded' : ''}`}>
        <Navbar 
          onOpenSidebar={() => setIsSidebarOpen(true)} 
          title={props.title} 
          onBack={props.onBack}
        />
        <div class="content-area">
          {props.children}
        </div>
      </main>
    </div>
  );
}
