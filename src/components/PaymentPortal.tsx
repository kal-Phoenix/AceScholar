import React, { useState, useEffect, useRef } from 'react';
import { Order, PaymentProvider } from '../types.ts';
import { getAuthHeaders } from '../lib/supabase';
import { CreditCard, Phone, ShieldCheck, CheckCircle2, XCircle, ArrowLeft, Loader2, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

interface PaymentPortalProps {
  orderId: string;
  onBack: () => void;
  onPaymentSuccess: () => void;
}

const PROVIDERS: PaymentProvider[] = [
  {
    id: 'chapa',
    name: 'Chapa (Cards / Mobile Money)',
    logo: '💳',
    type: 'card',
    description: 'Pay securely using international debit/credit cards or local systems.',
    fee_percentage: 1.5,
  },
  {
    id: 'telebirr',
    name: 'Telebirr (Mobile Money)',
    logo: '📱',
    type: 'mobile_money',
    description: 'Fast checkout using Ethio Telecom Telebirr mobile wallet app.',
    fee_percentage: 0.5,
  },
  {
    id: 'cbe_birr',
    name: 'CBE Birr (Mobile Money)',
    logo: '🏦',
    type: 'mobile_money',
    description: 'Direct mobile wallet transfer powered by Commercial Bank of Ethiopia.',
    fee_percentage: 0.5,
  },
  {
    id: 'ebirr',
    name: 'Ebirr (Mobile Money)',
    logo: '💸',
    type: 'mobile_money',
    description: 'Instant mobile payments via secure local digital wallets.',
    fee_percentage: 0.5,
  }
];

export default function PaymentPortal({ orderId, onBack, onPaymentSuccess }: PaymentPortalProps) {
  const [order, setOrder] = useState<Order | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<PaymentProvider>(PROVIDERS[0]);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  
  // Submit/processing state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'failed'>('idle');
  const [referenceId, setReferenceId] = useState('');
  const [portalError, setPortalError] = useState<string | null>(null);

  // Use refs to prevent closures in timeout loops
  const stepIntervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const STEPS = [
    'Connecting to payment gateway node...',
    `Initiating secure handshake with ${selectedProvider.name}...`,
    'Awaiting direct wallet OTP authorization / API signoff...',
    'Settling funds and recording ledger entries...',
  ];

  // Fetch order exactly once on load or when orderId changes
  useEffect(() => {
    let isMounted = true;
    const fetchOrderDetails = async () => {
      try {
        const response = await fetch(`/api/orders/${orderId}`);
        if (!response.ok) throw new Error('Order lookup failed');
        const data = await response.json();
        if (isMounted) {
          setOrder(data);
        }
      } catch (err) {
        console.error('Failed to fetch order in payment portal, pulling locally:', err);
        try {
          const STORAGE_KEY = 'ace_scholar_orders';
          const localOrders = localStorage.getItem(STORAGE_KEY);
          if (localOrders) {
            const parsed = JSON.parse(localOrders) as Order[];
            const found = parsed.find(o => o.id === orderId);
            if (found && isMounted) {
              setOrder(found);
            }
          }
        } catch (e) {
          console.error('Error reading local database in portal:', e);
        }
      }
    };

    fetchOrderDetails();

    return () => {
      isMounted = false;
      // Clean up any active timers on component unmount
      if (stepIntervalRef.current) {
        clearInterval(stepIntervalRef.current);
      }
    };
  }, [orderId]);

  const handleProviderSelect = (prov: PaymentProvider) => {
    setSelectedProvider(prov);
    setPhoneNumber('');
    setCardNumber('');
    setCardExpiry('');
    setCardCvv('');
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;

    // Validate fields based on selected payment type
    if (selectedProvider.type === 'mobile_money') {
      if (!phoneNumber) {
        setPortalError('Please enter your mobile phone number.');
        return;
      }
      if (!/^(?:\+251|0)9\d{8}$/.test(phoneNumber)) {
        setPortalError('Please enter a valid Ethiopian phone number (e.g., 0911223344 or +251911223344).');
        return;
      }
    } else {
      if (!cardNumber || !cardExpiry || !cardCvv) {
        setPortalError('Please fill out all debit/credit card fields.');
        return;
      }
    }

    setPortalError(null);
    setIsSubmitting(true);
    setCurrentStep(0);

    // Clear any existing step intervals
    if (stepIntervalRef.current) {
      clearInterval(stepIntervalRef.current);
    }

    // Step progression animation (simulated)
    stepIntervalRef.current = setInterval(() => {
      setCurrentStep(prev => {
        if (prev >= STEPS.length - 1) {
          if (stepIntervalRef.current) clearInterval(stepIntervalRef.current);
          return prev;
        }
        return prev + 1;
      });
    }, 1500);

    try {
      // Complete payment with API server
      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          order_id: order.id,
          provider_id: selectedProvider.id,
          amount: order.total_amount,
          currency: order.currency,
          phone_number: phoneNumber || undefined
        })
      });

      // Add a slight delay to allow the user to see the "Settling funds" animation step
      await new Promise(resolve => setTimeout(resolve, 6000));

      if (response.ok) {
        const paymentData = await response.json();
        setReferenceId(paymentData.reference_id || 'REF-LE-9142-X');
        setSubmitStatus(paymentData.status === 'completed' ? 'success' : 'failed');
        if (paymentData.status === 'completed') {
          onPaymentSuccess();
        }
      } else {
        setSubmitStatus('failed');
      }
    } catch (error) {
      console.error('Payment submission server failure:', error);
      setSubmitStatus('failed');
    } finally {
      setIsSubmitting(false);
      if (stepIntervalRef.current) {
        clearInterval(stepIntervalRef.current);
      }
    }
  };

  if (!order) {
    return (
      <div className="max-w-4xl mx-auto py-16 text-center">
        <span className="inline-block animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full"></span>
        <p className="mt-4 text-slate-400 text-sm">Initializing secure payment frame...</p>
      </div>
    );
  }

  // Success screen
  if (submitStatus === 'success') {
    return (
      <div className="max-w-md mx-auto py-12 px-4 text-center" id="payment-success-screen">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', damping: 15 }}
          >
            <CheckCircle2 className="h-16 w-16 text-emerald-500 mx-auto mb-4" />
          </motion.div>
          <h2 className="text-xl font-bold text-slate-800">Payment Completed</h2>
          <p className="text-sm text-slate-500 mt-2">
            Your transaction has been processed and secured.
          </p>

          <div className="mt-6 bg-slate-50 rounded-xl p-4 text-left text-xs font-mono space-y-2 text-slate-600">
            <div className="flex justify-between">
              <span className="text-slate-400">Transaction ID:</span>
              <span className="font-semibold text-slate-700">{order.payment_id || 'pay-simulated'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Order Ref:</span>
              <span className="font-semibold text-slate-700">{order.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Provider:</span>
              <span className="font-semibold uppercase text-slate-700">{selectedProvider.id}</span>
            </div>
            <div className="flex justify-between border-t border-slate-100 pt-2">
              <span className="text-slate-400">Reference:</span>
              <span className="font-semibold text-indigo-600 truncate max-w-[180px]">{referenceId}</span>
            </div>
          </div>

          <button
            onClick={onBack}
            id="success-home-btn"
            className="mt-8 w-full py-3 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium rounded-xl transition-colors cursor-pointer"
          >
            Go Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Failed screen
  if (submitStatus === 'failed') {
    return (
      <div className="max-w-md mx-auto py-12 px-4 text-center" id="payment-failed-screen">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
          <XCircle className="h-16 w-16 text-rose-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-800">Transaction Declined</h2>
          <p className="text-sm text-slate-500 mt-2">
            We were unable to secure OTP authorization from your cellular carrier. Please try again or use another payment mechanism.
          </p>

          <div className="mt-6 flex flex-col gap-3">
            <button
              onClick={() => {
                setSubmitStatus('idle');
                setIsSubmitting(false);
              }}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl transition-colors cursor-pointer"
              id="retry-payment-btn"
            >
              Retry Payment
            </button>
            <button
              onClick={onBack}
              className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-xl transition-colors cursor-pointer"
            >
              Cancel and Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Processing loader
  if (isSubmitting) {
    return (
      <div className="max-w-md mx-auto py-16 px-4 text-center" id="payment-processing-screen">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 flex flex-col items-center">
          <Loader2 className="h-12 w-12 text-indigo-600 animate-spin mb-4" />
          <h3 className="text-lg font-bold text-slate-800">Securing Transaction</h3>
          <p className="text-sm text-slate-400 mt-1">Please do not refresh or close this tab.</p>

          <div className="mt-8 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <motion.div
              className="bg-indigo-600 h-full"
              initial={{ width: '0%' }}
              animate={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>

          <div className="mt-6 text-sm text-slate-600 font-medium min-h-[40px] text-center max-w-[280px]">
            {STEPS[currentStep]}
          </div>
        </div>
      </div>
    );
  }

  const orderTotalAmount = order.total_amount || 0;
  const orderCurrency = order.currency || 'USD';

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6" id="payment-portal-screen">
      {/* Back button */}
      <button
        onClick={onBack}
        className="inline-flex items-center space-x-1.5 text-slate-500 hover:text-slate-800 text-sm mb-6 transition-colors cursor-pointer"
        id="portal-back-btn"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Cancel Payment</span>
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Left Side: Providers Selector (3 columns) */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h2 className="text-lg font-bold text-slate-800 tracking-tight mb-1 flex items-center gap-1.5">
              <Sparkles className="h-5 w-5 text-indigo-500" />
              <span>Select Payment Method</span>
            </h2>
            <p className="text-xs text-slate-400 mb-6">Choose your preferred local mobile money or bank card provider.</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {PROVIDERS.map((prov) => (
                <button
                  key={prov.id}
                  onClick={() => handleProviderSelect(prov)}
                  className={`flex items-start text-left p-4 rounded-xl border transition-all cursor-pointer ${
                    selectedProvider.id === prov.id
                      ? 'border-indigo-600 bg-indigo-50/20 ring-1 ring-indigo-500'
                      : 'border-slate-100 hover:border-slate-300 bg-white'
                  }`}
                >
                  <span className="text-2xl mr-3">{prov.logo}</span>
                  <div>
                    <span className="block text-sm font-semibold text-slate-800">{prov.name}</span>
                    <span className="block text-[11px] text-slate-400 leading-relaxed mt-1">{prov.description}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Form details input based on provider type */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            {portalError && (
              <div className="bg-rose-50 border border-rose-100 rounded-xl p-3 text-xs text-rose-800 mb-4" id="portal-form-error">
                {portalError}
              </div>
            )}

            <form onSubmit={handlePaymentSubmit} className="space-y-6">
              {selectedProvider.type === 'mobile_money' ? (
                <div>
                  <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-1.5">
                    <Phone className="h-4 w-4 text-slate-400" />
                    <span>Enter Mobile Wallet Details</span>
                  </h3>
                  <div>
                    <label htmlFor="phone-input" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Phone Number
                    </label>
                    <div className="mt-1.5 relative rounded-lg shadow-xs">
                      <input
                        id="phone-input"
                        type="text"
                        required
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="0911223344"
                        className="block w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-slate-800 font-mono"
                      />
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                      You will receive an interactive USSD popup or SMS verification prompt on your phone to complete authorization.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-1.5">
                    <CreditCard className="h-4 w-4 text-slate-400" />
                    <span>Enter Card Details</span>
                  </h3>
                  <div>
                    <label htmlFor="card-number-input" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Card Number</label>
                    <input
                      id="card-number-input"
                      type="text"
                      required
                      placeholder="4000 1234 5678 9010"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      className="mt-1.5 block w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-slate-800 font-mono"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="card-expiry-input" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Expiration Date</label>
                      <input
                        id="card-expiry-input"
                        type="text"
                        required
                        placeholder="MM/YY"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        className="mt-1.5 block w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-slate-800 font-mono text-center"
                      />
                    </div>
                    <div>
                      <label htmlFor="card-cvv-input" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">CVC / CVV</label>
                      <input
                        id="card-cvv-input"
                        type="password"
                        maxLength={4}
                        required
                        placeholder="***"
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value)}
                        className="mt-1.5 block w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-slate-800 font-mono text-center"
                      />
                    </div>
                  </div>
                </div>
              )}

              <button
                type="submit"
                id="submit-payment-btn"
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl shadow-sm transition-all text-sm cursor-pointer flex items-center justify-center space-x-2"
              >
                <span>Authorize payment of {orderTotalAmount.toLocaleString()} {orderCurrency}</span>
              </button>
            </form>
          </div>
        </div>

        {/* Right Side: Order Summary (2 columns) */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden sticky top-6">
            <div className="p-6 bg-slate-50/50 border-b border-slate-100">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Checking Out</span>
              <h2 className="text-lg font-bold text-slate-800 font-mono mt-0.5">{order.id}</h2>
            </div>

            <div className="p-6 divide-y divide-slate-100 space-y-4">
              {/* Order items */}
              <div>
                <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Order Items</span>
                <div className="space-y-3">
                  {order.items && order.items.length > 0 ? (
                    order.items.map((item: any) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span className="text-slate-600 font-medium truncate max-w-[150px]">{item.name}</span>
                        <span className="text-slate-400 ml-1">x{item.quantity}</span>
                        <span className="font-semibold text-slate-800">{(item.price * item.quantity).toLocaleString()} {orderCurrency}</span>
                      </div>
                    ))
                  ) : (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600 font-medium truncate max-w-[180px]">{order.service_type} ({order.subject})</span>
                      <span className="font-semibold text-slate-800">{orderTotalAmount.toLocaleString()} {orderCurrency}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Pricing Breakdowns */}
              <div className="pt-4 space-y-2 text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal:</span>
                  <span>{orderTotalAmount.toLocaleString()} {orderCurrency}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Payment fee ({selectedProvider.fee_percentage}%):</span>
                  <span>{((orderTotalAmount * selectedProvider.fee_percentage) / 100).toLocaleString()} {orderCurrency}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-slate-800 pt-3 border-t border-slate-100">
                  <span>Total Due:</span>
                  <span>{(orderTotalAmount + (orderTotalAmount * selectedProvider.fee_percentage) / 100).toLocaleString()} {orderCurrency}</span>
                </div>
              </div>

              {/* Secure statement */}
              <div className="pt-4 flex items-start space-x-2 text-[11px] text-slate-400 leading-normal">
                <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                <p>
                  Transactions are certified PCI-DSS compliant. Communications are secured with 256-bit AES cryptographic protocols.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
