import { FaLock, FaCheckCircle, FaMobileAlt, FaGlobeAfrica, FaBolt } from "react-icons/fa";

export default function TrustSection() {
  const items = [
    { icon: FaLock, name: "Secure Payments", sub: "PCI-DSS compliant" },
    { icon: FaCheckCircle, name: "Verified Campaigns", sub: "Manual review process" },
    { icon: FaMobileAlt, name: "MoMo Friendly", sub: "MTN, Vodafone, AirtelTigo" },
    { icon: FaGlobeAfrica, name: "Africa-First", sub: "GHS, USD & GBP supported" },
    { icon: FaBolt, name: "Fast Withdrawals", sub: "Within 24 hours" },
  ];

  return (
    <section id="trust" className="py-24 px-4 sm:px-6 lg:px-8 bg-cream dark:bg-navy-950 text-center">
      <div className="max-w-6xl mx-auto">
        <div className="section-label">Why Promesapay</div>
        <h2 className="font-heading text-3xl sm:text-4xl font-extrabold tracking-tight text-navy-700 dark:text-navy-50 mb-16">
          Built with trust<br />at the core
        </h2>

        <div className="flex flex-wrap justify-center gap-12 sm:gap-16">
          {items.map((item) => {
            const IconComponent = item.icon;
            return (
              <div key={item.name} className="flex flex-col items-center gap-3">
                <div className="w-16 h-16 rounded-2xl bg-gold-500/10 flex items-center justify-center text-3xl text-gold-500">
                  <IconComponent />
                </div>
                <div>
                  <p className="font-heading text-sm font-bold text-navy-700 dark:text-navy-200">
                    {item.name}
                  </p>
                  <p className="text-xs text-muted mt-0.5">{item.sub}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}