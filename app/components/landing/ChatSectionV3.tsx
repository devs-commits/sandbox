'use client'

import { motion } from 'framer-motion';
import ChatInterface from './ChatInterface';
import { Zap } from 'lucide-react';

const chatBgCircle = "/circle.png";

interface ChatSectionV3Props {
  onJoinClick?: () => void;
}

const ChatSectionV3 = ({ onJoinClick }: ChatSectionV3Props) => {
  return (
    <section className="max-w-7xl mx-auto py-8 md:py-12 bg-[hsla(205,98%,16%,0.42)] relative overflow-hidden" id="chat-with-tolu">
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <img 
          src={chatBgCircle} 
          alt="" 
          className="w-full h-full object-contain opacity-100"
        />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1.5 rounded-full mb-4">
            <Zap className="w-4 h-4" /> FREE DAY-1 PREVIEW
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold text-[#12263f] mb-4">Try the Free AI Career Audit</h2>
          <p className="text-slate-600 text-lg">Chat with Tolu, our strict AI HR Manager. See if you can survive her questions.</p>
        </div>
        </motion.div>

        <div className="flex justify-center items-center max-w-2xl mx-auto">
          {/* Chat Interface - Centered */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="w-full max-w-l"
          >
            <ChatInterface variant="v3" onJoinClick={onJoinClick} />
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default ChatSectionV3;
