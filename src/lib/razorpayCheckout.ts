import { getBrandTheme } from './theme';

const SCRIPT_SRC = 'https://checkout.razorpay.com/v1/checkout.js';

let scriptPromise: Promise<void> | null = null;

function loadRazorpayScript(): Promise<void> {
  if (typeof window !== 'undefined' && (window as any).Razorpay) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Could not load the Razorpay checkout script. Check your connection.'));
    document.body.appendChild(script);
  });
  return scriptPromise;
}

export interface RazorpayCheckoutOptions {
  keyId: string;
  amount: number; // paise
  currency: string;
  razorpayOrderId: string;
  name: string;
  description: string;
  prefillName?: string;
  prefillEmail?: string;
  prefillContact?: string;
  onSuccess: (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => void;
  onDismiss: () => void;
}

export async function openRazorpayCheckout(options: RazorpayCheckoutOptions): Promise<void> {
  await loadRazorpayScript();
  const RazorpayCtor = (window as any).Razorpay;
  if (!RazorpayCtor) {
    throw new Error('Razorpay is unavailable right now. Please try again in a moment.');
  }

  const rzp = new RazorpayCtor({
    key: options.keyId,
    amount: options.amount,
    currency: options.currency,
    order_id: options.razorpayOrderId,
    name: options.name,
    description: options.description,
    prefill: {
      name: options.prefillName,
      email: options.prefillEmail,
      contact: options.prefillContact,
    },
    theme: { color: getBrandTheme().primary },
    handler: (response: any) => options.onSuccess(response),
    modal: {
      ondismiss: () => options.onDismiss(),
    },
  });

  rzp.on('payment.failed', () => options.onDismiss());
  rzp.open();
}
