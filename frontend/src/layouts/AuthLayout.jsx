import { FaHandshake } from "react-icons/fa";

export default function AuthLayout({ children, title, subtitle }) {
  return (
    <div className="min-h-screen flex bg-cream dark:bg-navy-950">
      {/* Brand Panel (left side) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-navy-700 via-navy-800 to-navy-950 relative overflow-hidden items-center justify-center p-12">
        {/* Kente-inspired pattern overlay */}
        <div className="absolute inset-0 opacity-5">
          <div
            className="w-full h-full"
            style={{
              backgroundImage: `
                repeating-linear-gradient(45deg, #F97316 0, #F97316 2px, transparent 2px, transparent 20px),
                repeating-linear-gradient(-45deg, #1E3A5F 0, #1E3A5F 2px, transparent 2px, transparent 20px)
              `,
            }}
          />
        </div>
        {/* Decorative circles */}
        <div className="absolute top-20 left-20 w-64 h-64 bg-gold-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-48 h-48 bg-navy-400/10 rounded-full blur-3xl" />

        <div className="relative z-10 text-center max-w-md">
          <div className="text-6xl mb-6 text-gold-500"><FaHandshake /></div>
          <h2 className="font-heading text-3xl font-bold text-white mb-4">
            Promesapay
          </h2>
          <p className="text-navy-200 text-lg leading-relaxed">
            Fund together, rise together. Join thousands of Ghanaians using the power of collective giving to change lives and build futures.
          </p>
          <div className="mt-8 flex justify-center gap-8">
            <div className="text-center">
              <p className="font-heading text-2xl font-bold text-gold-500">GH₵4.2M+</p>
              <p className="text-navy-300 text-sm">Total Raised</p>
            </div>
            <div className="text-center">
              <p className="font-heading text-2xl font-bold text-gold-500">1,800+</p>
              <p className="text-navy-300 text-sm">Campaigns</p>
            </div>
            <div className="text-center">
              <p className="font-heading text-2xl font-bold text-gold-500">42K+</p>
              <p className="text-navy-300 text-sm">Contributors</p>
            </div>
          </div>
        </div>
      </div>

      {/* Form Panel (right side) */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <h2 className="font-heading text-2xl font-bold text-navy-700 dark:text-navy-100">
              Promesapay
            </h2>
            <p className="text-muted text-sm mt-1">Fund together, rise together</p>
          </div>

          {title && (
            <h1 className="font-heading text-2xl font-bold text-navy-900 dark:text-navy-50 mb-2">
              {title}
            </h1>
          )}
          {subtitle && (
            <p className="text-muted mb-8">{subtitle}</p>
          )}
          {children}
        </div>
      </div>
    </div>
  );
}