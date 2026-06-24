import { FaUserCircle } from "react-icons/fa";

export default function Testimonials() {
  const testimonials = [
    {
      quote: "I raised GH₵18,000 for my son's surgery in just 4 days. I shared it on WhatsApp and strangers across Ghana stepped up. I cried.",
      author: "Abena Owusu",
      location: "Kumasi, Ashanti Region",
    },
    {
      quote: "As a startup founder, finding early investors in Ghana was impossible. Promesapay connected me with 80 backers in 6 weeks. We're live now.",
      author: "Kwame Asante",
      location: "Accra, Greater Accra",
    },
    {
      quote: "Our school raised funds for 40 scholarships. The MoMo integration meant even grandmothers in the village could donate GH₵5. Powerful tool.",
      author: "Ms. Adjoa Mensah",
      location: "Tamale, Northern Region",
    },
  ];

  return (
    <section id="testimonials" className="py-24 px-4 sm:px-6 lg:px-8 bg-gold-50 dark:bg-navy-900">
      <div className="max-w-6xl mx-auto">
        <div className="section-label">Stories</div>
        <h2 className="font-heading text-3xl sm:text-4xl font-extrabold tracking-tight text-navy-700 dark:text-navy-50 mb-12">
          Real people, real<br />community support
        </h2>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t) => (
            <div
              key={t.author}
              className="bg-white dark:bg-navy-800 rounded-2xl p-7 border border-gold-500/15"
            >
              <div className="text-3xl text-gold-500 mb-3 font-heading leading-none">"</div>
              <p className="text-sm text-muted leading-relaxed mb-5 italic">
                {t.quote}
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl bg-gradient-to-br from-navy-600 to-gold-500 text-white flex-shrink-0">
                  <FaUserCircle />
                </div>
                <div>
                  <p className="font-heading text-sm font-bold text-navy-700 dark:text-navy-200">
                    {t.author}
                  </p>
                  <p className="text-xs text-muted">{t.location}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}