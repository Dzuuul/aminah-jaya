import { createSignal, JSX } from "solid-js";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

export default function Layout(props: { children: JSX.Element, title?: string }) {
  const [isSidebarOpen, setIsSidebarOpen] = createSignal(false);

  return (
    <div class="min-h-screen bg-[#fdfcfa] flex font-sans">
      {/* Mobile Sidebar Overlay */}
      <div 
        class={`fixed inset-0 bg-ink/20 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300 ${isSidebarOpen() ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsSidebarOpen(false)}
      ></div>

      <Sidebar isOpen={isSidebarOpen()} onClose={() => setIsSidebarOpen(false)} />

      <main class="flex-1 min-w-0 flex flex-col">
        <Navbar onOpenSidebar={() => setIsSidebarOpen(true)} title={props.title} />
        <div class="p-4 lg:p-8 space-y-8 overflow-x-hidden">
          {props.children}
        </div>
      </main>
    </div>
  );
}
