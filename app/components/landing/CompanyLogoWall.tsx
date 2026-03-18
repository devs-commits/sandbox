'use client'

const companies = [
  { name: "Andela", logo: "https://logo.clearbit.com/andela.com", color: "#3dd08d" },
  { name: "Flutterwave", logo: "https://logo.clearbit.com/flutterwave.com", color: "#f5a623" },
  { name: "Paystack", logo: "https://logo.clearbit.com/paystack.com", color: "#00c3f7" },
  { name: "Kuda Bank", logo: "https://logo.clearbit.com/kuda.com", color: "#40196d" },
  { name: "Interswitch", logo: "https://logo.clearbit.com/interswitchgroup.com", color: "#d42e12" },
  { name: "MTN", logo: "https://cdn.simpleicons.org/mtn/ffcc00", color: "#ffcc00" },
  { name: "Jumia", logo: "https://logo.clearbit.com/jumia.com.ng", color: "#f89420" },
  { name: "Carbon", logo: "https://logo.clearbit.com/carbon.ng", color: "#0c1e30" },
  { name: "Cowrywise", logo: "https://logo.clearbit.com/cowrywise.com", color: "#2d6ff7" },
  { name: "PiggyVest", logo: "https://logo.clearbit.com/piggyvest.com", color: "#083e9e" },
  { name: "Access Bank", logo: "https://logo.clearbit.com/accessbankplc.com", color: "#ed7d31" },
  { name: "GTBank", logo: "https://logo.clearbit.com/gtbank.com", color: "#ff6b00" },
  { name: "Google", logo: "https://cdn.simpleicons.org/google", color: "#4285f4" },
  { name: "Microsoft", logo: "https://cdn.simpleicons.org/microsoft/00a4ef", color: "#00a4ef" },
  { name: "Amazon", logo: "https://cdn.simpleicons.org/amazon/ff9900", color: "#ff9900" },
  { name: "Meta", logo: "https://cdn.simpleicons.org/meta/0668e1", color: "#0668e1" },
  { name: "Deloitte", logo: "https://cdn.simpleicons.org/deloitte/0076a8", color: "#0076a8" },
  { name: "PwC", logo: "https://cdn.simpleicons.org/pwc/d93954", color: "#d93954" },
]

export default function CompanyLogoWall() {
  const duplicated = [...companies, ...companies]

  return (
    <section className="py-12 bg-white border-y border-slate-200">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#12263f] mb-2">
            Tech companies where our Alumni work
          </h2>
          <p className="text-sm sm:text-base text-slate-600">
            Our alumni are building careers at leading Nigerian and global companies
          </p>
        </div>

        <div className="relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-white to-transparent z-10" />
          <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-white to-transparent z-10" />

          <div className="flex gap-8 animate-marquee py-6">
            {duplicated.map((company, index) => (
              <div
                key={`${company.name}-${index}`}
                className="flex-shrink-0 flex items-center justify-center bg-white rounded-xl border-2 border-slate-100 hover:border-slate-300 transition-all duration-300 hover:shadow-lg px-8 py-6 min-w-[180px] group"
                style={{ borderLeftColor: company.color, borderLeftWidth: "4px" }}
              >
                <img
                  src={company.logo}
                  alt={`${company.name} logo`}
                  className="h-10 w-auto object-contain grayscale group-hover:grayscale-0 transition-all duration-300 opacity-70 group-hover:opacity-100"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.style.display = "none"
                    const parent = target.parentElement
                    if (parent && !parent.querySelector(".logo-text-fallback")) {
                      const fallback = document.createElement("span")
                      fallback.className = "logo-text-fallback font-bold text-lg"
                      fallback.style.color = company.color
                      fallback.textContent = company.name
                      parent.appendChild(fallback)
                    }
                  }}
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="text-center mt-8">
          <p className="text-xs sm:text-sm text-slate-500">
            <span className="font-bold text-[#12263f]">1,247+ WDC Labs alumni</span> working remotely across 15 countries
          </p>
        </div>
      </div>
    </section>
  )
}
