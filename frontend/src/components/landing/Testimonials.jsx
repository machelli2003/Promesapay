import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    id: 1,
    name: "KwesiKay",
    role: "Content Creator",
    content: "Promesapay has completely transformed how I receive support from my community. The coffee tips feature is genius - my audience loves treating me to virtual coffee!",
    rating: 5,
  },
  {
    id: 2,
    name: "Ali",
    role: "Indie Developer",
    content: "I've tried many crowdfunding platforms, but Promesapay stands out. The clean interface and instant payments make it a joy to use.",
    rating: 5,
  },
  {
    id: 3,
    name: "Roland",
    role: "Digital Artist",
    content: "The funding campaign feature helped me raise money for my art studio equipment. The progress tracking kept my supporters engaged throughout!",
    rating: 5,
  },
  {
    id: 4,
    name: "David",
    role: "Podcast Host",
    content: "My listeners love being able to buy me coffee between episodes. It's created a wonderful sense of community and connection.",
    rating: 5,
  },
  {
    id: 5,
    name: "Akwesi",
    role: "Tech Blogger",
    content: "As someone who writes about crowdfunding tools, I can confidently say Promesapay is one of the best. The UX is intuitive and payments are instant.",
    rating: 5,
  },
  {
    id: 6,
    name: "Richie",
    role: "Musician",
    content: "Promesapay helped me fund my first album! The combination of donations and coffee tips gave my fans flexible ways to support my music.",
    rating: 5,
  }
];

export default function Testimonials() {
  return (
    <section className="py-20 bg-slate-50 dark:bg-slate-900">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">
            Loved by creators
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            See what our community has to say about Promesapay
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.id}
              className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700"
            >
              {/* Rating Stars */}
              <div className="flex gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star
                    key={i}
                    className="h-4 w-4 text-yellow-400 fill-current"
                  />
                ))}
              </div>

              {/* Testimonial Content */}
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-6">
                "{testimonial.content}"
              </p>

              {/* Author Info */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-violet-100 dark:bg-violet-900/30 rounded-full flex items-center justify-center">
                  <span className="text-violet-600 dark:text-violet-400 font-semibold text-sm">
                    {testimonial.name.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white text-sm">
                    {testimonial.name}
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    {testimonial.role}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}