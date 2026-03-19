'use client'

import { motion } from 'framer-motion'

const reviews = [
  {
    name: "Amina K.",
    role: "Data Analyst at Remote Tech Co",
    avatar: "https://images.unsplash.com/photo-1494790108757-2c5e18c5fd5?auto=format&fit=crop&w=100&q=80",
    content: "WDC Labs changed my life. I went from unemployed to landing a remote data analyst job in 4 months. The portfolio projects were exactly what recruiters wanted to see.",
    rating: 5
  },
  {
    name: "David O.",
    role: "Digital Marketing Specialist",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80",
    content: "The practical experience I gained was invaluable. I was able to show real campaign results in my interviews, not just certificates.",
    rating: 5
  },
  {
    name: "Chioma E.",
    role: "Cybersecurity Analyst",
    avatar: "https://images.unsplash.com/photo-1438761681033-6c1a2d82c6e?auto=format&fit=crop&w=100&q=80",
    content: "The SOC simulation was exactly like real work. I felt confident walking into any security interview after completing the program.",
    rating: 5
  },
  {
    name: "Tunde A.",
    role: "Full Stack Developer",
    avatar: "https://images.unsplash.com/photo-1500648587775-f20e6981d8f5?auto=format&fit=crop&w=100&q=80",
    content: "Best investment I ever made. The tech visa support letter helped me secure a position with a Canadian company.",
    rating: 5
  },
]

interface ReviewsScrollProps {
  variant?: 'v3';
}

const ReviewsScroll = ({ variant = 'v3' }: ReviewsScrollProps) => {
  if (variant !== 'v3') return null;

  return (
    <div className="space-y-4">
      {reviews.map((review, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: index * 0.2 }}
          className="bg-white rounded-2xl p-6 shadow-lg border border-slate-100"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
              <img
                src={review.avatar}
                alt={`${review.name} avatar`}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <h4 className="font-bold text-[#12263f] text-sm">{review.name}</h4>
                <span className="text-xs text-slate-500">{review.role}</span>
              </div>
              <div className="flex items-center gap-1 mb-3">
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    className={`w-4 h-4 ${i < review.rating ? 'text-yellow-400' : 'text-slate-300'}`}
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2l3.09 6.26L22 9l-1 1-1 1-1-1-1H4l-1 1-1 1-1-1h1l3.09 6.26L22 9l-1 1-1 1-1-1-1H4l-1 1-1 1-1-1h1z"/>
                  </svg>
                ))}
              </div>
              <p className="text-sm text-slate-700 leading-relaxed">{review.content}</p>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default ReviewsScroll;
