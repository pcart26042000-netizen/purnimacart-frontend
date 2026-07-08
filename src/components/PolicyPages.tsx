import React from 'react';
import { Mail, MapPin, Phone, MessageCircle, Truck, RotateCcw, Ban, Scale, LockKeyhole, BadgeInfo } from 'lucide-react';

type Section = {
  title: string;
  body: string[];
  bullets?: string[];
};

const CONTACT = {
  whatsapp: '+91 93329 61712',
  phone: '+91 93329 61712',
  email: 'Support.pcart@gmail.com',
  address: 'Purnima store, Jalpaiguri Kadamtala, Jalpaiguri 735101, West Bengal, India',
};

function PageShell({
  eyebrow,
  title,
  intro,
  icon: Icon,
  sections,
  note,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  icon: React.ElementType;
  sections: Section[];
  note?: string;
}) {
  return (
    <div className="max-w-4xl mx-auto py-4 md:py-8 px-0 sm:px-2 space-y-6">
      <div className="rounded-[32px] bg-white border border-[#e8bcb7]/20 shadow-sm p-6 md:p-8 overflow-hidden relative">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-[#ef5350] to-[#fb641b]" />
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Icon size={28} />
          </div>
          <div className="space-y-2">
            <span className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-primary bg-primary/10 px-3 py-1 rounded-full">
              <BadgeInfo size={12} /> {eyebrow}
            </span>
            <h1 className="font-display font-bold text-3xl md:text-4xl text-[#291715] tracking-tight">{title}</h1>
            <p className="text-sm md:text-base text-[#5e3f3b] leading-7 max-w-3xl">{intro}</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {sections.map((section) => (
          <section key={section.title} className="bg-white border border-[#e8bcb7]/20 rounded-[28px] p-6 md:p-7 shadow-sm space-y-3">
            <h2 className="font-display font-semibold text-xl text-[#291715]">{section.title}</h2>
            <div className="space-y-3 text-sm text-[#5e3f3b] leading-7">
              {section.body.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
              {section.bullets && (
                <ul className="space-y-2 pl-5 list-disc">
                  {section.bullets.map((bullet) => (
                    <li key={bullet}>{bullet}</li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        ))}
      </div>

      {note && (
        <div className="rounded-2xl border border-primary/15 bg-primary/5 px-5 py-4 text-xs text-[#5e3f3b]">
          {note}
        </div>
      )}
    </div>
  );
}

function ContactTile({ icon: Icon, label, value, href }: { icon: React.ElementType; label: string; value: string; href: string }) {
  return (
    <a href={href} className="rounded-[24px] bg-white border border-[#e8bcb7]/20 p-5 shadow-sm hover:border-primary transition-colors flex items-start gap-4">
      <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
        <Icon size={20} />
      </div>
      <div className="space-y-1">
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#5e3f3b]/60">{label}</p>
        <p className="text-sm font-semibold text-[#291715]">{value}</p>
      </div>
    </a>
  );
}

export function PrivacyPolicyPage() {
  return (
    <PageShell
      eyebrow="Privacy Policy"
      title="Privacy Policy"
      intro="At PurnimaCart, we prioritize your privacy. This policy outlines how we collect, process, secure, and manage your personal data when you shop or interact with us."
      icon={LockKeyhole}
      sections={[
        {
          title: '1. Information We Collect',
          body: [
            'To process your transactions and support your shopping experience, we collect the following information:',
          ],
          bullets: [
            'Personal Identifiers: Full name, phone number, email address, and shipping/billing addresses.',
            'Authentication Data: Basic account indicators retrieved when you log in via Google Authentication.',
            'Order History: Products bought, pricing details, color/size selections, and transaction metadata.',
            'Technical Logs: Device IP address, browser type, and navigation activity to maintain platform security.',
          ],
        },
        {
          title: '2. How We Use Your Data',
          body: [
            'Your data is processed in accordance with legal and operational guidelines for the following purposes:',
          ],
          bullets: [
            'Order Processing & Fulfilment: Verifying payments, preparing packages, and delivering items via shipping partners.',
            'Service Communication: Sending order confirmations, dispatch updates, and delivery alerts.',
            'Customer Support: Answering queries, addressing concerns, and managing return/refund tickets.',
            'Fraud Prevention: Safeguarding transactions, preventing unauthorized checkouts, and verifying COD orders.',
          ],
        },
        {
          title: '3. Data Security & Storage',
          body: [
            'We implement advanced security controls to protect your data:',
            'Secure Cloud Servers: All client data, addresses, and carts are stored on encrypted Firebase Cloud Firestore databases.',
            'Payment Gateway Protection: All online payment processing is handled securely by Razorpay. We do not store or process card numbers or banking passwords on our local servers.',
          ],
        },
        {
          title: '4. Third-Party Sharing',
          body: [
            'We do not sell, rent, or trade your personal data. We only share information with trusted third-party providers required for store operations:',
            'Shipping Partners: Shared delivery address and phone number for parcel transport.',
            'Razorpay: Transaction details for payment processing and verification.',
            'Firebase (Google Cloud): Database hosting, authentication, and security logging.',
          ],
        },
        {
          title: '5. Cookies & Local Storage',
          body: [
            'PurnimaCart uses cookies and local storage tokens to keep you logged in, save items in your shopping cart, and preserve settings. You can manage or disable cookies through your browser settings, though some storefront features may stop working.',
          ],
        },
      ]}
    />
  );
}

export function TermsConditionsPage() {
  return (
    <PageShell
      eyebrow="Terms & Conditions"
      title="Terms of Service"
      intro="Please review these terms carefully. By accessing PurnimaCart or placing an order, you agree to comply with and be bound by these Terms and Conditions."
      icon={Scale}
      sections={[
        {
          title: '1. Account & Use Eligibility',
          body: [
            'To place orders on PurnimaCart, you must be eligible to form legally binding contracts under the Indian Contract Act, 1872. You are responsible for keeping your login credentials secure and for all actions taken under your account.',
          ],
        },
        {
          title: '2. Product Pricing & Availability',
          body: [
            'We strive to display accurate stock levels and pricing. However:',
            'Price Adjustments: Prices are subject to change without notice.',
            'Order Acceptance: We reserve the right to cancel any order if a product is out of stock, incorrectly listed, or suspected of fraud.',
          ],
        },
        {
          title: '3. Billing & Payments',
          body: [
            'PurnimaCart offers online payments via Razorpay (UPI, Credit/Debit cards, Net Banking) and Cash on Delivery (COD). All orders are re-verified securely before checkout. COD orders are subject to address confirmation by our support team before dispatch.',
          ],
        },
        {
          title: '4. 5-Minute Delivery Terms',
          body: [
            'The 5-Minute Delivery service is available only for select, serviceable pincodes and is subject to the following rules:',
            'Pincode Verification: You must enter a serviceable pincode to unlock 5-Minute Delivery. If you enter an unserviceable pincode, standard shipping applies.',
            'Minimum Order Value: 5-Minute Delivery orders require your cart subtotal to meet the minimum amount set by the administrator. Checkout is blocked until this minimum value is met.',
          ],
        },
        {
          title: '5. Intellectual Property',
          body: [
            'All text, graphics, logos, brand elements, button icons, images, and code on this site are the property of PurnimaCart. You may not copy, scrape, modify, or resell any content without express written consent.',
          ],
        },
        {
          title: '6. Limitation of Liability',
          body: [
            'PurnimaCart is not liable for delayed delivery due to force majeure events (unavoidable courier delays, extreme weather, strikes, or transport disruptions). In all cases, our maximum liability is limited strictly to the amount paid by you for the specific order.',
          ],
        },
      ]}
    />
  );
}

export function RefundReturnPolicyPage() {
  return (
    <PageShell
      eyebrow="Refund & Return"
      title="Cancellation, Return & Refund Policy"
      intro="We want you to love your purchases. This policy outlines our terms for returns, replacements, and refunds in accordance with e-commerce guidelines."
      icon={RotateCcw}
      sections={[
        {
          title: '1. Return Window',
          body: [
            'You may request a return or replacement within 7 days of delivery. Requests made after 7 days will not be accepted.',
          ],
        },
        {
          title: '2. Valid Return Reasons',
          body: [
            'Returns and replacements are accepted under the following conditions:',
          ],
          bullets: [
            'The product was delivered in a damaged or broken condition.',
            'The product is defective or not working correctly.',
            'Parts, accessories, or items are missing from the package.',
            'The wrong item (incorrect size, model, or color) was delivered.',
          ],
        },
        {
          title: '3. Return Conditions',
          body: [
            'To qualify for a return or replacement, the product must meet the following guidelines:',
            'Unused Condition: The product must be unused and in the same condition that you received it.',
            'Original Packaging: The product must be returned with all original tags, boxes, manuals, and accessories intact.',
            'Verification: Our delivery agent will inspect the item at the time of pickup.',
          ],
        },
        {
          title: '4. Refund Process & Timelines',
          body: [
            'Once we receive and inspect the returned item, we will notify you of the approval or rejection of your refund.',
            'Approved Refunds: The refund amount will be credited back to your original payment method (via Razorpay) within 5 to 7 business days.',
            'COD Refunds: For Cash on Delivery orders, we will contact you to request bank account details or a UPI ID to transfer the refund amount directly.',
          ],
        },
      ]}
    />
  );
}

export function ShippingPolicyPage() {
  return (
    <PageShell
      eyebrow="Shipping Policy"
      title="Shipping & Delivery Policy"
      intro="This policy explains our shipping options, processing times, and shipping fees so you know exactly when your order will arrive."
      icon={Truck}
      sections={[
        {
          title: '1. Shipping Locations',
          body: [
            'PurnimaCart ships products to addresses all across India. We offer standard shipping nationwide, and express 5-Minute Delivery for select local areas in Jalpaiguri, West Bengal.',
          ],
        },
        {
          title: '2. Shipping Charges',
          body: [
            'Standard Shipping: A standard shipping fee of ₹49 per item applies at checkout.',
            'Free Delivery: We offer free standard shipping on orders exceeding ₹999.',
            '5-Minute Delivery: Express shipping rates apply as shown at checkout.',
          ],
        },
        {
          title: '3. Delivery Timelines',
          body: [
            'Standard Delivery: Orders are dispatched within 24 to 48 hours and typically arrive within 3 to 7 business days depending on the shipping destination.',
            '5-Minute Delivery: Orders are packed instantly and dispatched for immediate local delivery within 5 minutes of payment/COD verification.',
          ],
        },
        {
          title: '4. Order Tracking',
          body: [
            'Once your order is shipped, you can track its progress directly through the "My Orders" and "Order Details" pages in your account dashboard.',
          ],
        },
        {
          title: '5. Shipping Delays',
          body: [
            'While we make every effort to deliver on time, shipping delays can occasionally happen due to weather conditions, transport strikes, festivals, or courier route issues. We appreciate your patience during such delays.',
          ],
        },
      ]}
    />
  );
}

export function CancellationPolicyPage() {
  return (
    <PageShell
      eyebrow="Cancellation"
      title="Cancellation Policy"
      intro="If you change your mind, you can cancel your order before it is prepared or shipped out."
      icon={Ban}
      sections={[
        {
          title: '1. Cancellation Window',
          body: [
            'Standard Orders: You can cancel your order at any time before it enters the "Dispatched" state by contacting customer support.',
            '5-Minute Delivery Orders: Because 5-minute orders are dispatched immediately, cancellation requests must be raised within 1 minute of placing the order.',
          ],
        },
        {
          title: '2. Cancellation Process',
          body: [
            'To cancel an order, go to the "Order Details" page and click the "Cancel Order" button if available, or contact our customer support via phone or WhatsApp at +91 93329 61712 immediately.',
          ],
        },
        {
          title: '3. Refund on Cancellation',
          body: [
            'Prepaid Orders: If you cancel a prepaid order, the transaction will be refunded in full back to your original payment method (via Razorpay) within 5 to 7 business days.',
            'COD Orders: No cancellation fees apply for COD orders cancelled before dispatch. If a user repeatedly cancels COD orders at the doorstep, we reserve the right to disable COD for that user account.',
          ],
        },
      ]}
    />
  );
}

export function ContactPage() {
  return (
    <div className="max-w-4xl mx-auto py-4 md:py-8 px-0 sm:px-2 space-y-6">
      <div className="rounded-[32px] bg-white border border-[#e8bcb7]/20 shadow-sm p-6 md:p-8 overflow-hidden relative">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-[#ef5350] to-[#fb641b]" />
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <MessageCircle size={28} />
          </div>
          <div className="space-y-2">
            <span className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-primary bg-primary/10 px-3 py-1 rounded-full">
              <BadgeInfo size={12} /> Contact Us
            </span>
            <h1 className="font-display font-bold text-3xl md:text-4xl text-[#291715] tracking-tight">We’re here to help</h1>
            <p className="text-sm md:text-base text-[#5e3f3b] leading-7 max-w-3xl">
              For order help, shipping questions, returns, or product support, reach us using the details below.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ContactTile icon={MessageCircle} label="WhatsApp" value={CONTACT.whatsapp} href="https://wa.me/919332961712" />
        <ContactTile icon={Phone} label="Call Us" value={CONTACT.phone} href={`tel:${CONTACT.phone.replace(/\s+/g, '')}`} />
        <ContactTile icon={Mail} label="Email" value={CONTACT.email} href={`mailto:${CONTACT.email}`} />
      </div>

      <section className="rounded-[28px] bg-white border border-[#e8bcb7]/20 p-6 md:p-7 shadow-sm space-y-4">
        <h2 className="font-display font-semibold text-xl text-[#291715]">Store Address</h2>
        <div className="flex items-start gap-3 text-sm text-[#5e3f3b] leading-7">
          <MapPin size={18} className="text-primary mt-1 shrink-0" />
          <p>{CONTACT.address}</p>
        </div>
      </section>
    </div>
  );
}
