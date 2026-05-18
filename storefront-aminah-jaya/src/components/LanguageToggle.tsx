import { createSignal, createEffect, onMount, createRoot } from "solid-js";

export type Language = "id" | "en";

const { lang, setLang } = createRoot(() => {
  const [lang, setLang] = createSignal<Language>("id");
  return { lang, setLang };
});

export { lang, setLang };

export default function LanguageToggle() {
  onMount(() => {
    const saved = localStorage.getItem("lang") as Language;
    if (saved && (saved === 'id' || saved === 'en')) {
      setLang(saved);
    }
  });

  createEffect(() => {
    localStorage.setItem("lang", lang());
  });

  return (
    <div class="lang-toggle">
      <button 
        class={`lang-btn ${lang() === 'id' ? 'active' : ''}`} 
        onClick={() => setLang('id')}
      >
        ID
      </button>
      <button 
        class={`lang-btn ${lang() === 'en' ? 'active' : ''}`} 
        onClick={() => setLang('en')}
      >
        EN
      </button>
    </div>
  );
}
