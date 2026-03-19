'use client'

import { motion } from 'framer-motion';
import ChatInterface from './ChatInterface';

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
          <h2 className="text-2xl md:text-4xl font-bold text-[#1a2744] mb-4 font-inter">
            Can You Pass Tolu's HR Screening?
          </h2>
          <p className="text-base text-[#4a5568] max-w-2xl mx-auto font-inter">
            Most applicants fail this in under 60 seconds.
          </p>
        </motion.div>

        <div className="flex justify-center items-center max-w-2xl mx-auto">
          {/* Chat Interface - Centered */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="w-full max-w-md"
          >
            <ChatInterface variant="v3" onJoinClick={onJoinClick} />
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default ChatSectionV3;
