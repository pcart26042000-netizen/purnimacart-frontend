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
      title="How PurnimaCart handles your data"
      intro="We collect only the information needed to process orders, deliver products, support your account, and improve the shopping experience. This draft policy matches the current storefront and can be replaced with your final legal text later."
      icon={LockKeyhole}
      note="Draft policy content. If you want, I can tailor it to your exact legal/business details next."
      sections={[
        {
          title: 'Information we collect',
          body: [
            'We may collect your name, email address, phone number, delivery address, order history, and payment-related metadata when you shop or contact us.',
            'We also collect basic device and usage information to keep the site secure and understand how customers use the store.',
          ],
        },
        {
          title: 'How we use your information',
          body: [
            'We use your information to process orders, send order updates, provide support, prevent fraud, and improve the store experience.',
            'We may also use your contact information to respond to questions, share service notifications, or send promotional updates if you have opted in.',
          ],
        },
        {
          title: 'Sharing and security',
          body: [
            'We do not sell your personal information. We only share data with trusted service providers that help us run the store, such as payment, shipping, or cloud services.',
            'We use reasonable administrative and technical safeguards to protect your data, but no online system can be guaranteed 100% secure.',
          ],
        },
        {
          title: 'Cookies and retention',
          body: [
            'Cookies and similar technologies may be used for login sessions, cart storage, and basic analytics.',
            'We keep order and support data only as long as needed for business, legal, and security purposes.',
          ],
        },
        {
          title: 'Contact',
          body: [
            'If you have a privacy request or want us to update/delete your information, contact us using the details on the Contact page.',
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
      title="Terms that apply when you shop with us"
      intro="These terms explain how orders, pricing, accounts, and store usage work on PurnimaCart. Please review them before placing an order."
      icon={Scale}
      sections={[
        {
          title: 'Acceptance of terms',
          body: [
            'By using this website, you agree to these terms and to the policies linked in the footer.',
            'If you do not agree, please stop using the site and do not place an order.',
          ],
        },
        {
          title: 'Orders, pricing, and availability',
          body: [
            'Prices, offers, stock, and product details may change without notice.',
            'An order is confirmed only when payment is completed or a valid COD order is accepted by the system.',
          ],
        },
        {
          title: 'Accounts and communication',
          body: [
            'You are responsible for keeping your account details accurate and for reviewing order information before checkout.',
            'We may contact you by email, phone, or WhatsApp for order-related communication.',
          ],
        },
        {
          title: 'Intellectual property and misuse',
          body: [
            'All website content, logos, images, and product presentation belong to PurnimaCart or its partners unless stated otherwise.',
            'You may not copy, scrape, resell, or misuse the site or its content without permission.',
          ],
        },
        {
          title: 'Limitation of liability',
          body: [
            'We work hard to keep the site accurate and available, but we are not responsible for delays or issues outside our reasonable control.',
            'Our liability is limited to the amount paid for the affected order, where permitted by law.',
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
      title="When items can be returned or refunded"
      intro="This policy explains when a return, replacement, or refund may be available. You can adjust the timelines and eligibility rules later if you want a stricter store policy."
      icon={RotateCcw}
      sections={[
        {
          title: 'Eligibility',
          body: [
            'Returns are generally accepted for damaged, defective, missing, or wrong items reported soon after delivery.',
            'Please contact us with your order number and clear photos/video so we can review the issue quickly.',
          ],
        },
        {
          title: 'Return window and inspection',
          body: [
            'A return request should normally be raised within 7 days of delivery unless the product page states a different return window.',
            'After we receive the returned item, it may be inspected before a refund or replacement is approved.',
          ],
        },
        {
          title: 'Non-returnable items',
          body: [
            'Items that are used, damaged after delivery, missing original packaging, or clearly not in resellable condition may not qualify for a return.',
            'Certain hygiene-sensitive or custom items may also be non-returnable if the product description says so.',
          ],
        },
        {
          title: 'Refund timing',
          body: [
            'Approved refunds are usually sent back to the original payment method or handled as directed by support.',
            'Refund timelines may vary based on your bank, card issuer, or payment method.',
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
      title="How orders are packed and delivered"
      intro="This page explains processing times, delivery charges, and what to expect once you place an order."
      icon={Truck}
      sections={[
        {
          title: 'Processing time',
          body: [
            'Orders are usually processed after payment confirmation or COD acceptance, depending on the order type.',
            'Processing times may vary by product availability, order volume, and delivery area.',
          ],
        },
        {
          title: 'Delivery timelines',
          body: [
            'Estimated delivery time depends on your location, the selected products, and courier availability.',
            'We may show special delivery badges for serviceable fast-delivery areas when available.',
          ],
        },
        {
          title: 'Shipping charges',
          body: [
            'Delivery charges are shown at checkout. Orders above the free-shipping threshold may qualify for free delivery.',
            'Any special delivery fee or promotion will be shown clearly before you place the order.',
          ],
        },
        {
          title: 'Tracking and delays',
          body: [
            'Where tracking is available, you can use your order details page to review status updates.',
            'Delays caused by weather, courier disruption, remote locations, or other outside factors may happen occasionally.',
          ],
        },
      ]}
    />
  );
}

export function CancellationPolicyPage() {
  return (
    <PageShell
      eyebrow="Cancellation Policy"
      title="How and when orders can be cancelled"
      intro="If you need to cancel an order, the best time is before dispatch. Once a parcel is packed or shipped, cancellation may no longer be possible."
      icon={Ban}
      sections={[
        {
          title: 'Before dispatch',
          body: [
            'Orders can usually be cancelled before they are packed or handed to the delivery partner.',
            'If cancellation is approved, any eligible refund will follow the original payment method or support instructions.',
          ],
        },
        {
          title: 'After dispatch',
          body: [
            'Once an order has been dispatched, cancellation may not be possible.',
            'If the package is already in transit, you may need to wait for delivery and then use the return policy if applicable.',
          ],
        },
        {
          title: 'Support contact',
          body: [
            'If you need help with cancellation, contact us with your order number as soon as possible.',
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
