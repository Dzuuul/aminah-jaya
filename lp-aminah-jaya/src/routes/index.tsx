import Navbar from "~/components/Navbar";
import Hero from "~/components/Hero";
import Categories from "~/components/Categories";
import Products from "~/components/Products";
import About from "~/components/About";
import WhyUs from "~/components/WhyUs";
import Contact from "~/components/Contact";
import Footer from "~/components/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Categories />
        <Products />
        <About />
        <WhyUs />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
