"use client";
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Loader2, RefreshCw, Target, DollarSign, Users } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { useOffice } from '../../../contexts/OfficeContext';
import { Bounty } from './types';
import ReactMarkdown from 'react-markdown';

export function BountyBoard() {
    const { bounties, acceptBounty, isLoadingTasks } = useOffice();
    const [selectedBounty, setSelectedBounty] = useState<Bounty | null>(null);
    const [acceptingId, setAcceptingId] = useState<number | null>(null);

    const handleAccept = async (bounty: Bounty) => {
        if (!confirm(`Are you sure you want to accept "${bounty.title}"? It will be added to your desk.`)) return;

        setAcceptingId(bounty.id);
        await acceptBounty(bounty);
        setAcceptingId(null);
        setSelectedBounty(null);
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);
    };

    return (
        <div className="h-full flex flex-col bg-gradient-to-b from-transparent to-secondary/10">
            {/* Header */}
            <div className="p-6 border-b border-border/50">
                <div>
                    <h2 className="text-xl font-bold text-foreground">Bounty Hunter Board</h2>
                    <p className="text-sm text-muted-foreground">Extra credit work. High risk, high reward.</p>
                </div>
            </div>

            {/* Bounty List */}
            <div className="flex-1 overflow-y-auto p-6">
                {isLoadingTasks ? (
                    <div className="flex flex-col items-center justify-center h-full text-center py-12">
                        <Loader2 className="text-primary animate-spin mb-4" size={36} />
                        <p className="text-sm text-muted-foreground">Scanning for bounties...</p>
                    </div>
                ) : bounties.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col items-center justify-center h-full text-center py-12"
                    >
                        <div className="w-20 h-20 rounded-2xl bg-secondary/50 flex items-center justify-center mb-6">
                            <Target className="text-muted-foreground" size={36} />
                        </div>
                        <h3 className="text-lg font-semibold text-foreground mb-2">
                            No active bounties
                        </h3>
                        <p className="text-sm text-muted-foreground max-w-xs">
                            The board is empty right now. Check back later for new opportunities.
                        </p>
                    </motion.div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {bounties.map((bounty, index) => (
                            <motion.div
                                key={bounty.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl p-5 cursor-pointer transition-all hover:border-primary/50 hover:shadow-lg flex flex-col h-full"
                                onClick={() => setSelectedBounty(bounty)}
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <span className="text-xs font-medium bg-primary/20 text-primary px-3 py-1 rounded-full">
                                        {bounty.type}
                                    </span>
                                    <span className="text-xs font-medium bg-emerald-500/10 text-emerald-500 px-3 py-1 rounded-full flex items-center gap-1">
                                        <DollarSign size={12} />
                                        {formatCurrency(bounty.reward)}
                                    </span>
                                </div>

                                <h3 className="font-semibold text-foreground mb-2 line-clamp-2">{bounty.title}</h3>

                                <div className="text-sm text-muted-foreground line-clamp-3 mb-4 flex-1">
                                    <ReactMarkdown>{bounty.description}</ReactMarkdown>
                                </div>

                                <div className="flex items-center justify-between text-xs text-muted-foreground mt-auto pt-4 border-t border-border/30">
                                    <span className="flex items-center gap-1.5">
                                        <Clock size={12} /> {bounty.duration || 'Flexible'}
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <Users size={12} /> {bounty.slots_total - (bounty.slots_filled || 0)} slots left
                                    </span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            {/* Bounty Detail Modal */}
            <AnimatePresence>
                {selectedBounty && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                        onClick={() => setSelectedBounty(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="w-full max-w-2xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="p-6 border-b border-border/50 flex justify-between items-start">
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-xs font-medium bg-primary/20 text-primary px-3 py-1 rounded-full">
                                            {selectedBounty.type}
                                        </span>
                                        <span className="text-xs font-medium bg-emerald-500/10 text-emerald-500 px-3 py-1 rounded-full flex items-center gap-1">
                                            <DollarSign size={12} />
                                            {formatCurrency(selectedBounty.reward)}
                                        </span>
                                    </div>
                                    <h2 className="text-2xl font-bold text-foreground">{selectedBounty.title}</h2>
                                </div>
                                <Button variant="ghost" size="icon" onClick={() => setSelectedBounty(null)}>
                                    <span className="sr-only">Close</span>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                                </Button>
                            </div>

                            <div className="p-6 overflow-y-auto">
                                <div className="prose prose-invert max-w-none text-sm text-muted-foreground">
                                    <h4 className="text-foreground font-semibold mb-2">Description</h4>
                                    <ReactMarkdown>{selectedBounty.description}</ReactMarkdown>

                                    {selectedBounty.instructions && selectedBounty.instructions.length > 0 && (
                                        <>
                                            <h4 className="text-foreground font-semibold mt-4 mb-2">Instructions</h4>
                                            <ul className="list-disc pl-5 space-y-1">
                                                {selectedBounty.instructions.map((inst, i) => (
                                                    <li key={i}>{inst}</li>
                                                ))}
                                            </ul>
                                        </>
                                    )}

                                    {selectedBounty.deliverables && selectedBounty.deliverables.length > 0 && (
                                        <>
                                            <h4 className="text-foreground font-semibold mt-4 mb-2">Deliverables</h4>
                                            <ul className="list-disc pl-5 space-y-1">
                                                {selectedBounty.deliverables.map((del, i) => (
                                                    <li key={i}>{del}</li>
                                                ))}
                                            </ul>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="p-6 border-t border-border/50 bg-secondary/5">
                                <div className="flex justify-end gap-3">
                                    <Button variant="outline" onClick={() => setSelectedBounty(null)}>
                                        Close
                                    </Button>
                                    <Button
                                        onClick={() => handleAccept(selectedBounty)}
                                        disabled={acceptingId === selectedBounty.id}
                                        className="bg-primary hover:bg-primary/90 min-w-32"
                                    >
                                        {acceptingId === selectedBounty.id ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Accepting...
                                            </>
                                        ) : (
                                            <>
                                                <Target className="mr-2 h-4 w-4" />
                                                Accept Bounty
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
