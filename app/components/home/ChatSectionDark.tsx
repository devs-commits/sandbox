import { motion } from 'framer-motion';
import ChatInterface from './ChatInterface';
import ReviewsScroll from './ReviewsScroll';

interface ChatSectionDarkProps {
  onChatStart?: () => void;
}

const ChatSectionDark = ({ onChatStart }: ChatSectionDarkProps) => {
  return (
    <section className="section-darker py-16 md:py-24">
      <div className="container mx-auto px-4">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-2xl md:text-4xl font-bold text-foreground mb-4">
            Meet Tolu. <span className="text-gradient-coral">Your Nightmare.</span>
          </h2>
          <p className="text-sm text-muted-foreground max-w-xl mx-auto">
            Tolu is our AI HR Manager. She doesn't care about your "passion". She cares about output. You have exactly{' '}
            <span className="text-coral font-semibold">3 chances</span> to impress her before she blocks you.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-start">
          {/* Chat Interface - Left on desktop */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="order-2 lg:order-1"
          >
            <ChatInterface variant="dark" />
          </motion.div>

          {/* Reviews - Right on desktop */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="order-1 lg:order-2"
          >
            <ReviewsScroll variant="dark" />
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default ChatSectionDark;