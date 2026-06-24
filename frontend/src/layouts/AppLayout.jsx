import Navbar from "../components/common/Navbar";
import Footer from "../components/common/Footer";

export default function AppLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-cream dark:bg-navy-950 text-navy-900 dark:text-navy-50">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}