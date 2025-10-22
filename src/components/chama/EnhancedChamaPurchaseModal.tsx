import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { 
  Users, CreditCard, CheckCircle2, Loader2, 
  Sparkles, TrendingUp, Shield, Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChamaPurchase } from '@/hooks/useChamaPurchase';
import { useAuth } from '@/hooks/useAuth';

interface Chama {
  id: string;
  name: string;
  description: string;
  max_members: number;
  current_members: number;
  contribution_amount: number;
  contribution_frequency: string;
}

interface EnhancedChamaPurchaseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chama: Chama | null;
  onSuccess: () => void;
}

export const EnhancedChamaPurchaseModal: React.FC<EnhancedChamaPurchaseModalProps> = ({
  open,
  onOpenChange,
  chama,
  onSuccess
}) => {
  const { user } = useAuth();
  const { purchaseChama, isPurchasing } = useChamaPurchase();
  const [step, setStep] = useState<'details' | 'payment' | 'success'>('details');
  const [frequency, setFrequency] = useState('monthly');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState('');
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (open) {
      setStep('details');
      setShowConfetti(false);
    }
  }, [open]);

  const calculatePrice = () => {
    return chama ? chama.max_members * 20 : 0;
  };

  const membershipProgress = chama 
    ? ((chama.current_members || 0) / chama.max_members) * 100 
    : 0;

  const handleProceedToPayment = () => {
    if (!fullName || !email || !phone) {
      return;
    }
    setStep('payment');
  };

  const handlePayment = () => {
    if (!chama) return;

    purchaseChama({
      chamaId: chama.id,
      expectedAmount: calculatePrice(),
      email: email
    });

    // Simulate payment processing
    setTimeout(() => {
      setStep('success');
      setShowConfetti(true);
      setTimeout(() => {
        onSuccess();
        onOpenChange(false);
      }, 4000);
    }, 2000);
  };

  if (!chama) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0 overflow-hidden flex flex-col">
        <AnimatePresence mode="wait">
          {step === 'details' && (
            <motion.div
              key="details"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="p-6"
            >
              {/* Header */}
              <div className="text-center mb-4">
                <h2 className="text-2xl font-bold mb-1">
                  {chama.name}
                </h2>
                <p className="text-sm text-muted-foreground italic">
                  "Building wealth together, one contribution at a time"
                </p>
              </div>

              {/* Max Members and Monthly Contribution Box */}
              <div className="bg-primary/20 rounded-lg p-4 mb-4 grid grid-cols-2 gap-4">
                <div className="text-center">
                  <p className="text-sm font-semibold mb-1">Max Members</p>
                  <p className="text-2xl font-bold">{chama.max_members}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold mb-1">Monthly Contribution</p>
                  <p className="text-2xl font-bold">KES {chama.contribution_amount}</p>
                </div>
              </div>

              {/* Ownership Fee Calculation */}
              <div className="bg-muted/50 rounded-lg p-4 mb-5">
                <p className="font-semibold mb-2">Ownership Fee</p>
                <p className="text-lg mb-1">
                  {chama.max_members} members × KES 20 = <span className="font-bold">KES {calculatePrice()}</span>
                </p>
                <p className="text-sm text-muted-foreground">
                  One-time payment · Lifetime ownership
                </p>
              </div>

              {/* Form Fields */}
              <div className="space-y-3 mb-5">
                <div>
                  <Label htmlFor="fullName" className="text-sm font-medium">Full Name *</Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your full name"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="email" className="text-sm font-medium">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="phone" className="text-sm font-medium">Phone Number *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="07XXXXXXXXX"
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Action Button */}
              <Button
                onClick={handleProceedToPayment}
                disabled={!fullName || !email || !phone}
                className="w-full h-12 text-base font-semibold"
                size="lg"
              >
                Proceed to Payment
              </Button>
            </motion.div>
          )}

          {step === 'payment' && (
            <motion.div
              key="payment"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              className="flex flex-col max-h-[90vh]"
            >
              <div className="overflow-y-auto flex-1 p-6">
              <div className="text-center mb-6">
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center mx-auto mb-4">
                  <CreditCard className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Secure Payment</h2>
                <p className="text-muted-foreground">Complete your purchase to own {chama.name}</p>
              </div>

              {/* Payment Summary */}
              <div className="bg-muted/50 p-6 rounded-lg mb-6 space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Chama:</span>
                  <span className="font-semibold">{chama.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Members:</span>
                  <span className="font-semibold">{chama.max_members}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Payment To:</span>
                  <span className="font-semibold">{email}</span>
                </div>
                <div className="border-t pt-3 mt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-medium">Total Amount:</span>
                    <span className="text-2xl font-bold text-primary">KES {calculatePrice()}</span>
                  </div>
                </div>
              </div>

              {/* Security Badge */}
              <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 p-4 rounded-lg mb-6">
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-green-600 dark:text-green-400" />
                  <div>
                    <p className="font-semibold text-green-900 dark:text-green-100">Secure Payment Verification</p>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      Payment verified server-side. Ownership granted only after exact amount confirmation.
                    </p>
                  </div>
                </div>
              </div>

              </div>

              {/* Payment Button - Sticky at bottom */}
              <div className="border-t bg-background px-6 py-3">
                <Button
                  onClick={handlePayment}
                  disabled={isPurchasing}
                  className="w-full h-11 text-base font-semibold"
                >
                  {isPurchasing ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Processing Payment...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-5 w-5 mr-2" />
                      Pay KES {calculatePrice()} Securely
                    </>
                  )}
                </Button>
                
                <p className="text-xs text-center text-muted-foreground mt-2">
                  Supports M-Pesa, Cards, Bank Transfer & USSD
                </p>
              </div>
            </motion.div>
          )}

          {step === 'success' && (
            <motion.div
              key="success"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="p-6 text-center relative overflow-hidden"
            >
              {showConfetti && (
                <div className="absolute inset-0 pointer-events-none">
                  {[...Array(50)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ 
                        y: -20, 
                        x: Math.random() * 400,
                        opacity: 1,
                        rotate: 0
                      }}
                      animate={{ 
                        y: 600, 
                        opacity: 0,
                        rotate: 360
                      }}
                      transition={{ 
                        duration: 2 + Math.random() * 2,
                        delay: Math.random() * 0.5
                      }}
                      className="absolute h-3 w-3 rounded-full"
                      style={{
                        backgroundColor: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8'][Math.floor(Math.random() * 5)]
                      }}
                    />
                  ))}
                </div>
              )}

              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="h-24 w-24 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center mx-auto mb-6 relative z-10"
              >
                <CheckCircle2 className="h-12 w-12 text-white" />
              </motion.div>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="relative z-10"
              >
                <h2 className="text-3xl font-bold mb-3">
                  Congratulations {fullName.split(' ')[0]}! 🎉
                </h2>
                <p className="text-xl mb-2">You now own <span className="font-bold text-primary">{chama.name}</span></p>
                <p className="text-muted-foreground italic mb-6">
                  "Building wealth together, one contribution at a time"
                </p>

                <div className="bg-gradient-to-br from-primary/10 to-primary/5 p-6 rounded-lg border border-primary/20">
                  <p className="text-sm text-muted-foreground mb-2">Next Steps:</p>
                  <ul className="text-left space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span>Invite members to join your chama</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span>Set up contribution schedules</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span>Start building wealth together</span>
                    </li>
                  </ul>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};
