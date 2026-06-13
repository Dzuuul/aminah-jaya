import { Title, Meta } from "@solidjs/meta";
import Navbar from "~/components/Navbar";
import Hero from "~/components/Hero";
import Categories from "~/components/Categories";
import Products from "~/components/Products";
import About from "~/components/About";
import WhyUs from "~/components/WhyUs";
import Contact from "~/components/Contact";
import Footer from "~/components/Footer";
import FlashSale from "~/components/FlashSale";
import BlogSection from "~/components/BlogSection";
import { createEffect, onCleanup } from "solid-js";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export default function Home() {
  let mainRef: HTMLElement | undefined;

  createEffect(() => {
    requestAnimationFrame(() => {
      if (!mainRef) return;

      // Hero load animation
      const hero = mainRef.querySelector(".hero");
      if (hero) {
        const heroEls = hero.querySelectorAll(".hero-badge, .hero-title, .hero-desc, .hero-actions, .hero-stats, .hero-visual");
        if (heroEls.length > 0) {
          gsap.fromTo(
            heroEls,
            { opacity: 0, y: 40 },
            { opacity: 1, y: 0, duration: 1, stagger: 0.1, ease: "power3.out", clearProps: "all" }
          );
        } else {
          // Fallback if hero inner classes are different
          gsap.fromTo(
            hero,
            { opacity: 0, y: 30 },
            { opacity: 1, y: 0, duration: 1, ease: "power3.out", clearProps: "all" }
          );
        }
      }

      // Scroll trigger animations for other sections
      const scrollSections = mainRef.querySelectorAll(".categories, .flash-sale-section, .products, .blog-section, .about, .why, .contact");

      scrollSections.forEach((section) => {
        // Find cards or columns to stagger
        const cards = section.querySelectorAll(".cat-card, .cat-pill, .flash-prod-card, .prod-card, .blog-card, .why-card");
        const cols = section.querySelectorAll(".about-visual, .about-content, .contact-info, .contact-card");
        const header = section.querySelector(".section-header, .flash-sale-header, h2:first-child");

        if (cards.length > 0) {
          if (header) {
            gsap.fromTo(
              header,
              { opacity: 0, y: 30 },
              {
                opacity: 1, y: 0, duration: 0.8, ease: "power3.out",
                scrollTrigger: { trigger: section, start: "top 85%", toggleActions: "play none none none" },
                clearProps: "all"
              }
            );
          }
          gsap.fromTo(
            cards,
            { opacity: 0, y: 40 },
            {
              opacity: 1, y: 0, duration: 0.8, stagger: 0.1, ease: "power3.out",
              scrollTrigger: { trigger: section, start: "top 80%", toggleActions: "play none none none" },
              clearProps: "all"
            }
          );
        } else if (cols.length > 0) {
          gsap.fromTo(
            cols,
            { opacity: 0, y: 40 },
            {
              opacity: 1, y: 0, duration: 1, stagger: 0.2, ease: "power3.out",
              scrollTrigger: { trigger: section, start: "top 85%", toggleActions: "play none none none" },
              clearProps: "all"
            }
          );
        } else {
          // Fallback whole section fade
          gsap.fromTo(
            section,
            { opacity: 0, y: 50 },
            {
              opacity: 1, y: 0, duration: 1, ease: "power3.out",
              scrollTrigger: { trigger: section, start: "top 85%", toggleActions: "play none none none" },
              clearProps: "all"
            }
          );
        }
      });
    });

    onCleanup(() => {
      ScrollTrigger.getAll().forEach(t => t.kill());
    });
  });

  return (
    <>
      <Title>Aminah Jaya | Toko Online Herbal, Kosmetik & Fashion Premium Terpercaya</Title>

      {/* SEO & Standard Meta Tags */}
      <Meta name="description" content="Belanja produk kesehatan herbal premium (Laili WAITEU), fashion muslim berkualitas, kosmetik kecantikan, dan kebutuhan harian terbaik hanya di Aminah Jaya. Transaksi cepat dan mudah langsung via WhatsApp!" />
      <Meta name="keywords" content="aminah jaya, toko online aminah jaya, laili waiteu reseller, herbal premium, fashion muslimah, busana muslim, kosmetik kecantikan, belanja whatsapp" />
      <Meta name="author" content="Aminah Jaya" />
      <Meta name="theme-color" content="#1a5c42" />

      {/* Open Graph (Facebook / WA / Telegram) */}
      <Meta property="og:title" content="Aminah Jaya — Toko Online Herbal, Kosmetik & Fashion Premium" />
      <Meta property="og:description" content="Belanja produk herbal premium, fashion muslim, dan kosmetik berkualitas terbaik di Aminah Jaya. Cepat, aman, dan mudah langsung via WhatsApp!" />
      <Meta property="og:image" content="https://aminahjaya.com/ogv2.jpg" />
      <Meta property="og:image:width" content="1200" />
      <Meta property="og:image:height" content="630" />
      <Meta property="og:type" content="website" />
      <Meta property="og:url" content="https://aminahjaya.com" />
      <Meta property="og:site_name" content="Aminah Jaya" />

      {/* Twitter Card */}
      <Meta name="twitter:card" content="summary_large_image" />
      <Meta name="twitter:title" content="Aminah Jaya — Toko Online Herbal & Fashion Premium" />
      <Meta name="twitter:description" content="Belanja herbal premium, fashion muslim, dan kosmetik berkualitas terbaik. Transaksi cepat & mudah via WhatsApp." />
      <Meta name="twitter:image" content="https://aminahjaya.com/ogv2.jpg" />
      <Meta property="og:image:width" content="1200" />
      <Meta property="og:image:height" content="630" />

      <Navbar />
      <main ref={mainRef}>
        <Hero />
        <Categories />
        <FlashSale />
        <Products />
        <BlogSection />
        <About />
        <WhyUs />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
