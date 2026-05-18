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

export default function Home() {
  return (
    <>
      <Title>Aminah Jaya — Toko Online Herbal, Kosmetik & Fashion Premium Terpercaya</Title>
      
      {/* SEO & Standard Meta Tags */}
      <Meta name="description" content="Belanja produk kesehatan herbal premium (Laili WAITEU), fashion muslim berkualitas, kosmetik kecantikan, dan kebutuhan harian terbaik hanya di Aminah Jaya. Transaksi cepat dan mudah langsung via WhatsApp!" />
      <Meta name="keywords" content="aminah jaya, toko online aminah jaya, laili waiteu reseller, herbal premium, fashion muslimah, busana muslim, kosmetik kecantikan, belanja whatsapp" />
      <Meta name="author" content="Aminah Jaya" />
      <Meta name="theme-color" content="#1a5c42" />
      
      {/* Open Graph (Facebook / WA / Telegram) */}
      <Meta property="og:title" content="Aminah Jaya — Toko Online Herbal, Kosmetik & Fashion Premium" />
      <Meta property="og:description" content="Belanja produk herbal premium, fashion muslim, dan kosmetik berkualitas terbaik di Aminah Jaya. Cepat, aman, dan mudah langsung via WhatsApp!" />
      <Meta property="og:image" content="http://103.103.20.58:3002/hero.png" />
      <Meta property="og:type" content="website" />
      <Meta property="og:url" content="http://103.103.20.58:3002" />
      <Meta property="og:site_name" content="Aminah Jaya" />
      
      {/* Twitter Card */}
      <Meta name="twitter:card" content="summary_large_image" />
      <Meta name="twitter:title" content="Aminah Jaya — Toko Online Herbal & Fashion Premium" />
      <Meta name="twitter:description" content="Belanja herbal premium, fashion muslim, dan kosmetik berkualitas terbaik. Transaksi cepat & mudah via WhatsApp." />
      <Meta name="twitter:image" content="http://103.103.20.58:3002/hero.png" />

      <Navbar />
      <main>
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
