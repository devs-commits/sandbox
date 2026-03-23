'use client'

const companies = [
  { name: "Andela", logo: "/logos/andela.svg", color: "#3dd08d" },
  { name: "Flutterwave", logo: "/logos/flutterwave.svg", color: "#f5a623" },
  { name: "Paystack", logo: "/logos/paystack.svg", color: "#00c3f7" },
  { name: "Kuda Bank", logo: "/logos/kuda-bank.svg", color: "#40196d" },
  { name: "Interswitch", logo: "/logos/interswitch.svg", color: "#d42e12" },
  { name: "MTN", logo: "/logos/mtn.svg", color: "#ffcc00" },
  { name: "Jumia", logo: "/logos/jumia.svg", color: "#f89420" },
  { name: "Carbon", logo: "/logos/carbon.svg", color: "#0c1e30" },
  { name: "Cowrywise", logo: "/logos/cowrywise.svg", color: "#2d6ff7" },
  { name: "PiggyVest", logo: "/logos/piggyvest.svg", color: "#083e9e" },
  { name: "Access Bank", logo: "/logos/access-bank.svg", color: "#ed7d31" },
  { name: "GTBank", logo: "/logos/gtbank.svg", color: "#ff6b00" },
  { name: "Google", logo: "/logos/google.svg", color: "#4285f4" },
  { name: "Microsoft", logo: "/logos/microsoft.svg", color: "#00a4ef" },
  { name: "Amazon", logo: "/logos/amazon.svg", color: "#ff9900" },
  { name: "Meta", logo: "/logos/meta.svg", color: "#0668e1" },
  { name: "Deloitte", logo: "/logos/deloitte.svg", color: "#0076a8" },
  { name: "PwC", logo: "/logos/pwc.svg", color: "#d93954" },
]

export default function CompanyLogoWall() {
  const duplicated = [...companies, ...companies]

  return (
    <section className="py-12 bg-white border-y border-slate-200">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#12263f] mb-2">
            Companies where our Alumni work
          </h2>
          <p className="text-sm sm:text-base text-slate-600">
            Our alumni are building careers at leading Nigerian and global companies
          </p>
        </div>

        <div className="relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-white to-transparent z-10" />
          <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-white to-transparent z-10" />

          <div className="flex gap-8 animate-marquee-logos py-6">
            {duplicated.map((company, index) => (
              <div
                key={`${company.name}-${index}`}
                className="flex-shrink-0 flex items-center justify-center bg-white rounded-xl border-2 border-slate-100 hover:border-slate-300 transition-all duration-300 hover:shadow-lg px-8 py-6 min-w-[180px] group"
                style={{ borderLeftColor: company.color, borderLeftWidth: "4px" }}
              >
                <img
                  src={company.logo}
                  alt={`${company.name} logo`}
                  className="h-10 w-auto object-contain transition-all duration-300 opacity-100"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="text-center mt-8">
          <p className="text-xs sm:text-sm text-slate-500">
            <span className="font-bold text-[#12263f]">1,247+ WDC alumni</span> working remotely across 15 countries
          </p>
        </div>
      </div>
    </section>
  )
}
