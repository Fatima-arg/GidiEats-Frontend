import { useState, useEffect } from 'react';
import {
  CreditCard,
  Building2,
  PhoneCall,
  CheckCircle2,
  Lock,
  Copy,
  Check,
  ShieldCheck,
  X,
  AlertCircle,
  Clock,
  Sparkles
} from 'lucide-react';
import { api, apiMessage, unwrap } from '../../api/client';
import type { Payment } from '../../api/types';
import { naira } from '../../lib/format';

export interface FlutterwaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: number;
  orderNumber: string;
  amount: number;
  phone?: string;
  email?: string;
  customerName?: string;
  onSuccess: (payment: Payment) => void;
}

const TEST_CARDS = [
  {
    label: 'Mastercard (Success)',
    number: '4242 4242 4242 4242',
    expiry: '08/27',
    cvv: '123',
    name: 'GidiEats Demo Customer',
    brand: 'Mastercard'
  },
  {
    label: 'Verve Card (Success)',
    number: '5061 0000 0000 0000',
    expiry: '11/26',
    cvv: '456',
    name: 'Fatima Adam Aminu',
    brand: 'Verve'
  }
];

const USSD_BANKS = [
  { name: 'Guaranty Trust Bank (GTBank)', code: '*737*2*0001#' },
  { name: 'Zenith Bank', code: '*966*00*0001#' },
  { name: 'United Bank for Africa (UBA)', code: '*919*00*0001#' },
  { name: 'Access Bank', code: '*901*00*0001#' },
  { name: 'First Bank of Nigeria', code: '*894*00*0001#' }
];

export function FlutterwaveModal({
  isOpen,
  onClose,
  orderId,
  orderNumber,
  amount,
  phone,
  email,
  customerName,
  onSuccess
}: FlutterwaveModalProps) {
  const [tab, setTab] = useState<'card' | 'transfer' | 'ussd'>('card');
  const [step, setStep] = useState<'form' | 'otp' | 'processing' | 'success' | 'failed'>('form');

  // Card form state
  const [cardNumber, setCardNumber] = useState('4242 4242 4242 4242');
  const [cardExpiry, setCardExpiry] = useState('08/27');
  const [cardCvv, setCardCvv] = useState('123');
  const [cardName, setCardName] = useState(customerName || 'Demo Customer');

  // OTP state
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState<string | null>(null);

  // USSD state
  const [selectedUssdBank, setSelectedUssdBank] = useState(USSD_BANKS[0].name);

  // Transaction state
  const [txRef, setTxRef] = useState<string>(`FLW-${orderNumber}-${Date.now().toString().slice(-6)}`);
  const [transactionId, setTransactionId] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [completedPayment, setCompletedPayment] = useState<Payment | null>(null);

  // Transfer countdown timer (30 mins demo)
  const [secondsLeft, setSecondsLeft] = useState(1800);

  useEffect(() => {
    if (!isOpen) return;
    setStep('form');
    setError(null);
    setOtp('');
    setOtpError(null);
    const newRef = `FLW-${orderNumber}-${Date.now().toString().slice(-6)}`;
    setTxRef(newRef);

    // Call backend initiate to register the intent & verify keys
    api
      .post('/payments/flutterwave/initiate', {
        orderId,
        phone,
        email,
        name: customerName
      })
      .then((res) => {
        const data = unwrap<{ txRef?: string }>(res as never);
        if (data?.txRef) setTxRef(data.txRef);
      })
      .catch(() => {
        // Safe to proceed with client-generated ref
      });
  }, [isOpen, orderId, orderNumber, phone, email, customerName]);

  useEffect(() => {
    if (!isOpen || tab !== 'transfer' || secondsLeft <= 0) return;
    const interval = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(interval);
  }, [isOpen, tab, secondsLeft]);

  if (!isOpen) return null;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const fillTestCard = (card: typeof TEST_CARDS[0]) => {
    setCardNumber(card.number);
    setCardExpiry(card.expiry);
    setCardCvv(card.cvv);
    setCardName(card.name);
  };

  const handleCardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNum = cardNumber.replace(/\s+/g, '');
    if (cleanNum.length < 15) {
      setError('Please enter a valid card number');
      return;
    }
    setError(null);
    // Proceed to Flutterwave 3D-Secure simulated OTP verification
    setStep('otp');
  };

  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!otp.trim()) {
      setOtpError('Please enter the OTP verification code');
      return;
    }
    setOtpError(null);
    executeVerify();
  };

  const executeVerify = async () => {
    setStep('processing');
    setError(null);

    const generatedTxId = `flw_txn_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    setTransactionId(generatedTxId);

    try {
      const res = await api.post('/payments/flutterwave/verify', {
        orderId,
        transactionId: generatedTxId,
        txRef,
        amount,
        phone
      });
      const payment = unwrap<Payment>(res as never);
      setCompletedPayment(payment);
      setStep('success');
      onSuccess(payment);
    } catch (err) {
      setError(apiMessage(err));
      setStep('failed');
    }
  };

  const handleTransferSent = () => {
    executeVerify();
  };

  const handleUssdSent = () => {
    executeVerify();
  };

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header with Flutterwave Styling */}
        <div className="relative bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center font-bold text-white text-lg shadow-inner border border-white/20">
                FW
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-base tracking-tight">Flutterwave</span>
                  <span className="text-[10px] font-semibold uppercase tracking-wider bg-black/25 text-amber-100 px-1.5 py-0.5 rounded">
                    Test Sandbox
                  </span>
                </div>
                <p className="text-xs text-amber-100/90">GidiEats Kano · BUK Campus Checkout</p>
              </div>
            </div>

            {step !== 'processing' && (
              <button
                onClick={onClose}
                className="h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition text-white/90"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Amount Hero */}
          <div className="mt-4 pt-3 border-t border-white/15 flex items-end justify-between">
            <div>
              <p className="text-xs text-amber-100/80 uppercase font-medium tracking-wider">Amount Due</p>
              <p className="text-2xl font-black text-white tracking-tight">{naira(amount)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-amber-100/80 font-medium">Order Number</p>
              <p className="text-sm font-semibold font-mono text-white/95">{orderNumber}</p>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto flex-1">
          {step === 'form' && (
            <div>
              {/* Payment Channel Tabs */}
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-xl mb-4 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setTab('card')}
                  className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg transition ${
                    tab === 'card'
                      ? 'bg-white text-slate-900 shadow-sm font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <CreditCard className="h-3.5 w-3.5 text-orange-500" />
                  <span>Card</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTab('transfer')}
                  className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg transition ${
                    tab === 'transfer'
                      ? 'bg-white text-slate-900 shadow-sm font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Building2 className="h-3.5 w-3.5 text-orange-500" />
                  <span>Transfer</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTab('ussd')}
                  className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg transition ${
                    tab === 'ussd'
                      ? 'bg-white text-slate-900 shadow-sm font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <PhoneCall className="h-3.5 w-3.5 text-orange-500" />
                  <span>USSD</span>
                </button>
              </div>

              {/* CARD CHANNEL */}
              {tab === 'card' && (
                <div>
                  {/* Quick Test Cards Picker */}
                  <div className="mb-4 p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wide flex items-center gap-1">
                        <Sparkles className="h-3.5 w-3.5 text-amber-600" />
                        Flutterwave Demo Cards (1-Click Fill)
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {TEST_CARDS.map((tc) => (
                        <button
                          key={tc.brand}
                          type="button"
                          onClick={() => fillTestCard(tc)}
                          className="text-[11px] font-medium bg-white hover:bg-amber-100/60 text-slate-800 border border-amber-300/80 px-2.5 py-1 rounded-md transition flex items-center gap-1.5 shadow-sm"
                        >
                          <CreditCard className="h-3 w-3 text-amber-600" />
                          <span>{tc.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Card Visual Badge */}
                  <div className="mb-4 bg-gradient-to-tr from-slate-900 via-slate-800 to-slate-900 text-white p-4 rounded-xl shadow-md border border-slate-700/60">
                    <div className="flex justify-between items-start mb-4">
                      <div className="h-6 w-9 rounded bg-amber-400/80" />
                      <span className="text-xs font-mono font-semibold tracking-widest text-slate-300 uppercase">
                        {cardNumber.startsWith('5') ? 'VERVE' : 'MASTERCARD'}
                      </span>
                    </div>
                    <p className="font-mono text-base tracking-widest font-medium mb-3">
                      {cardNumber || '•••• •••• •••• ••••'}
                    </p>
                    <div className="flex justify-between text-[11px] text-slate-300 uppercase">
                      <div>
                        <p className="text-[9px] text-slate-400">Cardholder</p>
                        <p className="font-medium truncate max-w-[150px]">{cardName || 'GidiEats Customer'}</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-slate-400">Expires</p>
                        <p className="font-medium">{cardExpiry || 'MM/YY'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Card Form */}
                  <form onSubmit={handleCardSubmit} className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Card Number</label>
                      <input
                        type="text"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        placeholder="1234 5678 9012 3456"
                        maxLength={19}
                        required
                        className="w-full text-sm font-mono px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Expiration (MM/YY)</label>
                        <input
                          type="text"
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(e.target.value)}
                          placeholder="08/27"
                          maxLength={5}
                          required
                          className="w-full text-sm font-mono px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">CVV Security Code</label>
                        <input
                          type="password"
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value)}
                          placeholder="123"
                          maxLength={4}
                          required
                          className="w-full text-sm font-mono px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Cardholder Name</label>
                      <input
                        type="text"
                        value={cardName}
                        onChange={(e) => setCardName(e.target.value)}
                        placeholder="John Doe"
                        required
                        className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition"
                      />
                    </div>

                    {error && (
                      <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600 flex items-center gap-1.5">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        <span>{error}</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      className="w-full mt-2 py-3 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-bold text-sm rounded-xl shadow-md transition flex items-center justify-center gap-2"
                    >
                      <Lock className="h-4 w-4" />
                      <span>Pay {naira(amount)}</span>
                    </button>
                  </form>
                </div>
              )}

              {/* TRANSFER CHANNEL */}
              {tab === 'transfer' && (
                <div className="space-y-4">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
                    <p className="text-xs text-slate-500 mb-1">Transfer exact amount to the Flutterwave Virtual Account</p>
                    <p className="text-2xl font-black text-slate-900 mb-2">{naira(amount)}</p>

                    <div className="bg-white p-3 rounded-lg border border-slate-200/90 text-left space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500">Bank Name</span>
                        <span className="text-xs font-bold text-slate-800">Wema Bank / Flutterwave</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500">Account Number</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-mono font-bold text-slate-900 tracking-wider">0123456789</span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard('0123456789')}
                            className="p-1 hover:bg-slate-100 rounded text-slate-500"
                            title="Copy Account Number"
                          >
                            {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500">Beneficiary</span>
                        <span className="text-xs font-semibold text-slate-800 truncate max-w-[200px]">
                          GidiEats Kano - {orderNumber}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-center gap-1.5 text-xs text-amber-700 font-medium">
                      <Clock className="h-3.5 w-3.5" />
                      <span>Account expires in: {formatTimer(secondsLeft)}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleTransferSent}
                    className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-sm rounded-xl shadow-md transition flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span>I have made this transfer (Simulate Confirmation)</span>
                  </button>
                </div>
              )}

              {/* USSD CHANNEL */}
              {tab === 'ussd' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Select Your Bank</label>
                    <select
                      value={selectedUssdBank}
                      onChange={(e) => setSelectedUssdBank(e.target.value)}
                      className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition"
                    >
                      {USSD_BANKS.map((b) => (
                        <option key={b.name} value={b.name}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-center space-y-2">
                    <p className="text-xs text-amber-900 font-medium">Dial the USSD string on your registered mobile line:</p>
                    <p className="text-lg font-mono font-black text-amber-950 tracking-wider">
                      {USSD_BANKS.find((b) => b.name === selectedUssdBank)?.code || '*737*2*0001#'}
                    </p>
                    <p className="text-[11px] text-amber-700">Enter your USSD PIN when prompted to authorize {naira(amount)}</p>
                  </div>

                  <button
                    type="button"
                    onClick={handleUssdSent}
                    className="w-full py-3 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-bold text-sm rounded-xl shadow-md transition flex items-center justify-center gap-2"
                  >
                    <PhoneCall className="h-4 w-4" />
                    <span>I have dialed the USSD code (Simulate Confirmation)</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* STEP: 3D SECURE OTP SIMULATION */}
          {step === 'otp' && (
            <div className="space-y-4 text-center py-2">
              <div className="mx-auto h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                <ShieldCheck className="h-7 w-7" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Flutterwave 3D-Secure Verification</h3>
                <p className="text-xs text-slate-500 mt-1">
                  A one-time security code (OTP) was dispatched to your phone number to authenticate this payment.
                </p>
              </div>

              {/* Sandbox helper hint */}
              <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-xs text-amber-900">
                <span>
                  Demo Mode OTP: <strong>12345</strong>
                </span>
                <button
                  type="button"
                  onClick={() => setOtp('12345')}
                  className="px-2 py-0.5 bg-amber-200/70 hover:bg-amber-200 text-amber-900 font-bold rounded text-[11px]"
                >
                  Auto-fill
                </button>
              </div>

              <form onSubmit={handleVerifyOtp} className="space-y-3">
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter 5-digit OTP"
                  maxLength={6}
                  autoFocus
                  className="w-full text-center tracking-[0.5em] font-mono text-xl py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500"
                />

                {otpError && <p className="text-xs text-red-600 font-medium">{otpError}</p>}

                <div className="grid grid-cols-2 gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep('form')}
                    className="py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition"
                  >
                    Back to Card
                  </button>
                  <button
                    type="submit"
                    className="py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-bold text-xs rounded-xl shadow-md transition"
                  >
                    Confirm & Authorize
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* STEP: PROCESSING GATEWAY VERIFICATION */}
          {step === 'processing' && (
            <div className="text-center py-8 space-y-4">
              <div className="relative mx-auto h-16 w-16">
                <div className="absolute inset-0 rounded-full border-4 border-orange-200 border-t-orange-600 animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center font-bold text-xs text-orange-600">
                  FW
                </div>
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Verifying with Flutterwave...</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Connecting to payment gateway, securing transaction #{txRef}
                </p>
              </div>
            </div>
          )}

          {/* STEP: SUCCESS */}
          {step === 'success' && (
            <div className="text-center py-6 space-y-4">
              <div className="mx-auto h-14 w-14 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 animate-in zoom-in duration-300">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">Payment Confirmed!</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Your payment of <strong>{naira(amount)}</strong> has been successfully received by Flutterwave.
                </p>
              </div>

              {/* Receipt Snippet */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-left text-xs space-y-1.5 font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Gateway</span>
                  <span className="font-bold text-orange-600 font-sans">Flutterwave</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Payment Ref</span>
                  <span className="font-semibold text-slate-800">{completedPayment?.reference || txRef}</span>
                </div>
                {transactionId && (
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-sans">Transaction ID</span>
                    <span className="text-slate-700">{transactionId}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Status</span>
                  <span className="font-bold text-emerald-600 font-sans uppercase">SUCCESSFUL</span>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-sm rounded-xl shadow-md transition"
              >
                Track My Order Now
              </button>
            </div>
          )}

          {/* STEP: FAILED */}
          {step === 'failed' && (
            <div className="text-center py-6 space-y-4">
              <div className="mx-auto h-14 w-14 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                <AlertCircle className="h-8 w-8" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Payment Could Not Be Verified</h3>
                <p className="text-xs text-red-600 mt-1">{error || 'An error occurred while confirming payment.'}</p>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => setStep('form')}
                  className="flex-1 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer / Trust Badge */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-1.5 text-slate-600 font-medium">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            <span>256-bit Encrypted SSL Gateway</span>
          </div>
          <span className="font-mono text-slate-400">Ref: {txRef.slice(0, 16)}...</span>
        </div>
      </div>
    </div>
  );
}

