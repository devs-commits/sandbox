'use client'
import { useState } from "react"
import { BellRing, ArrowRight, ShieldCheck } from "lucide-react"
import { toast } from "sonner"

export default function WaitlistSection() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    whatsapp: "",
    linkedin: "",
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const validateForm = () => {
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.whatsapp) {
      toast.error("Please fill all required fields")
      return false
    }

    if (!formData.email.includes("@")) {
      toast.error("Enter a valid email address")
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    try {
      setIsSubmitting(true)

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/add-subscriber`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify(formData),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to join waitlist");
      }

      toast.success("Successfully joined the waitlist!");

      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        whatsapp: "",
        linkedin: "",
      });

    } catch (error) {
      console.error(error);
      toast.error("Failed to join waitlist.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="waitlist" className="py-16 bg-white relative overflow-hidden border-t border-slate-200">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#12263f] rounded-3xl p-6 sm:p-10 shadow-2xl flex flex-col lg:flex-row items-center justify-between gap-10 relative overflow-hidden">

          <div className="lg:w-5/12 text-center lg:text-left relative z-10 w-full">
            <div className="inline-flex items-center gap-2 bg-blue-600 text-white text-[10px] sm:text-xs font-bold px-3 py-1.5 rounded-full mb-4 shadow-sm">
              <BellRing className="w-3 h-3" /> JOIN WAITLIST
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold mb-3 text-white">Stay in the Loop.</h2>
            <p className="text-slate-300 text-sm leading-relaxed max-w-md mx-auto lg:mx-0">
              Join our waitlist and get notified when new opportunities open.
            </p>
          </div>

          <div className="lg:w-7/12 w-full relative z-10">
            <form
              onSubmit={handleSubmit}
              className="bg-white/10 p-5 sm:p-6 rounded-2xl backdrop-blur-md border border-white/10 shadow-xl"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">

                <input
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  placeholder="First Name *"
                  className="w-full bg-slate-900/50 border border-slate-600 text-white px-4 py-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder:text-slate-400 text-sm font-medium"
                />

                <input
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  placeholder="Surname *"
                  className="w-full bg-slate-900/50 border border-slate-600 text-white px-4 py-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder:text-slate-400 text-sm font-medium"
                />

                <input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="Email Address *"
                  className="w-full bg-slate-900/50 border border-slate-600 text-white px-4 py-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder:text-slate-400 text-sm font-medium"
                />

                <input
                  name="whatsapp"
                  type="tel"
                  value={formData.whatsapp}
                  onChange={handleChange}
                  required
                  placeholder="WhatsApp Number *"
                  className="w-full bg-slate-900/50 border border-slate-600 text-white px-4 py-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder:text-slate-400 text-sm font-medium"
                />

                <input
                  name="linkedin"
                  type="url"
                  value={formData.linkedin}
                  onChange={handleChange}
                  placeholder="LinkedIn Profile URL (optional)"
                  className="w-full bg-slate-900/50 border border-slate-600 text-white px-4 py-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder:text-slate-400 text-sm font-medium sm:col-span-2"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-blue-600 text-white px-6 py-4 rounded-xl font-bold hover:bg-blue-500 transition-all text-sm flex justify-center items-center gap-2 uppercase disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Submitting..." : "Join the Waitlist"}
                <ArrowRight className="w-4 h-4" />
              </button>

              <p className="text-[10px] sm:text-[11px] text-slate-400 mt-4 text-center flex items-center justify-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Your data is protected.
              </p>
            </form>
          </div>
        </div>
      </div>
    </section>
  )
}