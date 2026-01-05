import { motion, AnimatePresence } from 'framer-motion';
import { X, Award, TrendingUp, Clock, CheckCircle, FileText, MessageSquare } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { Progress } from '../../../../components/ui/progress';
import { useOffice } from '../../../../contexts/OfficeContext';
import { useState } from 'react';
import { MockInterviewModal } from './MockInterviewModal';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const { userLevel, tasks, portfolio } = useOffice();
  const [showMockInterview, setShowMockInterview] = useState(false);

  const completedTasks = tasks.filter(t => t.status === 'approved').length;
  const totalTasks = tasks.length;
  const progressPercent = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  // Mock performance metrics
  const metrics = {
    technicalAccuracy: 78,
    deliverySpeed: 65,
    communication: 82,
    overallRating: 'Junior Intern',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-card border border-border rounded-2xl shadow-2xl"
          >
            <div className="sticky top-0 bg-card border-b border-border p-6 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-foreground">Performance Profile</h2>
              <button onClick={onClose} className="p-1 hover:bg-muted rounded">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Current Level */}
              <div className="bg-primary/10 border border-primary/20 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <Award className="text-primary" size={24} />
                  <div>
                    <p className="text-sm text-muted-foreground">Current Level</p>
                    <p className="text-lg font-semibold text-foreground">
                      {userLevel || 'Not Assessed'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Task Progress */}
              <div className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-foreground">Task Completion</span>
                  <span className="text-sm text-muted-foreground">
                    {completedTasks}/{totalTasks} tasks
                  </span>
                </div>
                <Progress value={progressPercent} className="h-2" />
              </div>

              {/* Performance Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-card border border-border rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="text-primary" size={16} />
                    <span className="text-sm text-muted-foreground">Technical Accuracy</span>
                  </div>
                  <p className="text-2xl font-bold text-foreground">{metrics.technicalAccuracy}%</p>
                  <p className="text-xs text-muted-foreground">Reviewed by Sola</p>
                </div>
                <div className="bg-card border border-border rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="text-primary" size={16} />
                    <span className="text-sm text-muted-foreground">Delivery Speed</span>
                  </div>
                  <p className="text-2xl font-bold text-foreground">{metrics.deliverySpeed}%</p>
                  <p className="text-xs text-muted-foreground">Tracked by Emem</p>
                </div>
                <div className="bg-card border border-border rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="text-primary" size={16} />
                    <span className="text-sm text-muted-foreground">Communication</span>
                  </div>
                  <p className="text-2xl font-bold text-foreground">{metrics.communication}%</p>
                  <p className="text-xs text-muted-foreground">Sentiment Analysis</p>
                </div>
              </div>

              {/* Portfolio */}
              <div className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="text-primary" size={16} />
                  <span className="font-medium text-foreground">Your WDC Portfolio</span>
                </div>
                {portfolio.length > 0 ? (
                  <ul className="space-y-2">
                    {portfolio.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <span className="text-primary">•</span>
                        <span className="text-foreground">{item.bulletPoint}</span>
                        <span className="text-muted-foreground text-xs">
                          ({item.skillTag})
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Complete tasks to build your portfolio. Coach Kemi will translate your work into CV-ready bullet points.
                  </p>
                )}
              </div>

              {/* Appraisal */}
              <div className="bg-secondary/50 border border-border rounded-xl p-4">
                <p className="text-sm text-muted-foreground mb-1">Overall Rating</p>
                <p className="text-lg font-semibold text-foreground">{metrics.overallRating}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  Next appraisal in 14 days. Improve delivery speed to advance to Associate level.
                </p>
              </div>

              {/* Career Coaching with Kemi */}
              <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold" style={{ backgroundColor: 'hsl(142 70% 45%)' }}>
                    K
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Coach Kemi</p>
                    <p className="text-xs text-muted-foreground">Career Counsellor</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Practice interviews with Coach Kemi to prepare for real job opportunities.
                </p>
                <Button
                  onClick={() => setShowMockInterview(true)}
                  variant="outline"
                  className="w-full border-green-500/50 text-green-500 hover:bg-green-500/10"
                >
                  <MessageSquare className="mr-2" size={16} />
                  Start Mock Interview
                </Button>
              </div>
            </div>

            <div className="sticky bottom-0 bg-card border-t border-border p-4">
              <Button onClick={onClose} className="w-full">Close</Button>
            </div>
          </motion.div>
        </motion.div>
      )}

      <MockInterviewModal
        isOpen={showMockInterview}
        onClose={() => setShowMockInterview(false)}
      />
    </AnimatePresence>
  );
}