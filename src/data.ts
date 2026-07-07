import { Product, Category } from './types';

export const CATEGORIES: Category[] = [
  { id: 'all', name: 'For You', iconName: 'grid', count: 12 },
  { id: 'toys', name: 'Toys', iconName: 'smart_toy', count: 3 },
  { id: 'chocolates', name: 'Chocolates', iconName: 'cake', count: 3 },
  { id: 'dresses', name: 'Dresses', iconName: 'apparel', count: 2 },
  { id: 'cosmetics', name: 'Cosmetics', iconName: 'face_6', count: 2 },
  { id: 'gifts', name: 'Gifts', iconName: 'featured_seasonal_and_gifts', count: 2 },
  { id: 'accessories', name: 'Accessories', iconName: 'watch', count: 3 },
  { id: 'frames', name: 'Frames', iconName: 'photo_frame', count: 1 },
];

export const PRODUCTS: Product[] = [
  {
    id: 'turbo-racer-ultra',
    name: 'Turbo Racer Ultra X1',
    category: 'toys',
    price: 2499,
    originalPrice: 3999,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAr1kVV-OmIzEPtsuST6HkkC6rG4_Iz2BddLjanpH58LGj8bwlP9SkbnLB6eXcgOu4pww62K2LSCMhz_aBiDnGJC_fXbfaBkARNp0Keye0pKrron96HWXLwd7wfIj-OfUPJsIzKt5QM6VD3JNWssSigyPI9MpGmFjr-nf25LbTfLSFFyFJe8L0GaGXKHERh4As9ZY6sAnHFq-QcwqgVVIYfUkdpOrF_UH4tg9GhUn_VNoqKFl6cO5vY9holovKx5XlTZJLTixjnFz4',
    rating: 4.8,
    reviewCount: 142,
    tags: ['Premium', 'Electronic', 'Top Seller'],
    isDeal: true,
    dealDiscount: '-40% OFF',
    description: 'A premium, ultra-high-speed electronic remote controlled car with metallic crimson finish, multi-link active suspension, and precision servo-steering. Specially calibrated for high torque and exceptional drifting capabilities on both indoor and outdoor surfaces.',
    features: [
      'Top speed up to 25 km/h with proportional acceleration',
      'Dual active metallic shock absorbers',
      'Long-range 2.4GHz interference-free transmitter',
      'Rechargeable 1200mAh Li-ion battery (up to 40 mins runtime)'
    ]
  },
  {
    id: 'velvet-truffle-box',
    name: 'Velvet Truffle Box',
    category: 'chocolates',
    price: 1125,
    originalPrice: 1500,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDxskm2hhE4zfofjTGvDdjHGK5bpoXBdH3sg3UfyBwgmfi-di7uWOMyzQ5d9LRc9wHfppQngV80z6Af7Uro0s7aIsXzblry2shbsCjG0UQBJTNsFXSKSACMu6ynZ47vUrHCs4dDuGH1bNo38UtSWiQJOekMvbQie92zdpuGgRfusjzmmSQEIr9RYuGH7gqYqdUvDcbQhzG32OS1ovCtkddAdHUR2q3fUmLPFhWV8xU4L_zC50XAWMmg7BoVKecz32Ty9lKhTyB7BB8',
    rating: 4.9,
    reviewCount: 88,
    tags: ['Organic', 'Gourmet', 'Handmade'],
    isDeal: true,
    dealDiscount: '-25% OFF',
    description: 'An exceptional assortment of single-origin luxury chocolates, hand-rolled truffles, and rich pralines. Presented in an elegant, gold-embossed textured rigid box, each piece is a celebration of fine Belgian cocoa and organic ingredients.',
    features: [
      'Includes 16 unique handcrafted gourmet truffles',
      '100% organic and ethically-sourced cocoa bean base',
      'Flavors: Sea Salt Caramel, Himalayan Dark, Pistachio Rose, Champagne Silk',
      'Premium linen-finish gifting box with greeting card slot'
    ]
  },
  {
    id: 'aura-leather-tote',
    name: 'Aura Leather Tote',
    category: 'dresses',
    price: 4999,
    originalPrice: 6500,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAbGA_a-G9l9XvMHfYnRXKYMhCGg2ODU7z65eeVj2Z2k-BiR5LKDmirw5lrStTq0WkUHJsZ1qz2tH1BcctyQgJKnsWror8P8seFdH629i0yVOxV6EXhr-6bIbnIpyJh8zyRDlTzQ1MgStWRdKmVK7xPsNPjxLol2Y9JLXRh5S1IH_gILckt0sqYTkRLFq-zNSvoX50kI-LUlUykEiCK0y6r6OWbJP1kTIUSkGVE3jUJPiFObsuTD7eA4Mr80j3ebVqpxW_9W2DNvMk',
    rating: 4.7,
    reviewCount: 210,
    tags: ['Designer', 'Genuine Leather', 'Minimalist'],
    isDeal: false,
    description: 'A classic silhouette redefined for the modern connoisseur. This structural handbag is meticulously crafted from pastel pink full-grain Italian calfskin, featuring reinforced dual-handles and polished silver hardware.',
    features: [
      '100% full-grain calfskin pebbled leather',
      'Signature micro-suede interior lining with dual slip pockets',
      'Detachable, fully adjustable crossbody strap',
      'Protective silver studs at base'
    ]
  },
  {
    id: 'glow-radiance-kit',
    name: 'Glow Radiance Kit',
    category: 'cosmetics',
    price: 3200,
    originalPrice: 4000,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBkUX74_OAvO7sc1g2YRcp787RNMUf4Xpkv10P5WResqaj9QpxpQk5UbRDWLLVM0oeK3dyKhrvycdq1ibOKCW4G0gcxl7o2AlniNAnuzi1LQhF_ya09GlbM5Hh2EPoUtKDe_YaySc73OjF9-c-PDcbZAgc4u8TJNAOMlHyQH4--4ts78CRcUE4oCMsgOJTCYulwaVVd31b7fHm7eqb7q0bNi5soWBmdXrJlh08YfseTWaw1UlnTuX0G4_wqaWNSeAJd74RtMAW8fp4',
    rating: 4.6,
    reviewCount: 95,
    tags: ['Eco-friendly', 'Sulfate-Free', 'Luminous'],
    isDeal: false,
    description: 'A curated three-step clinical regime to restore glass-like transparency and natural radiance. Contains a pH-balancing cleanser, vitamin C corrective serum, and an ultra-nourishing botanical barrier cream.',
    features: [
      'Sulfate-free, paraben-free, and vegan certified',
      'Dermatologically tested for hyper-sensitive skin',
      'Enriched with wild rosehip seed oil and niacinamide',
      'Stored in UV-protective heavy frosted glass apothecary bottles'
    ]
  },
  {
    id: 'architect-block-set',
    name: 'Architect Block Set',
    category: 'toys',
    price: 3450,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBT8bdSogwGe2_qcyU8DuWayd-Xv-tEGICV90-C0Rg3htzS4F7Hlpc7_Oil1vQXeTgHzz-BkHRs58XorqRle1sZw0Z1ARt9QHWqThFuS4hCTNIB4yDN7RfwY5I8bpFeADM2_bblhiKxJMKbvannB9hGxz7P3Y3QUt0xOHYaB2vBNT4Elwq5fntA0rQmtUL3NnGGpdau5HHLjUl9JQUF5gjv14q6Is_YIubBLlrtqlKHrielMdGUbAYTMxgeSlPfeY9wLIM5LwQx0DA',
    rating: 4.9,
    reviewCount: 120,
    tags: ['Artisanal', 'Educational', 'Non-Toxic'],
    description: 'Premium wooden blocks made from sustainable solid maple and ash. Features structural arches, columns, and cylinders stained with water-based organic pigments. Helps develop motor, architectural, and spatial reasoning skills.',
    features: [
      '42 solid heirloom-quality wooden blocks',
      'Sanded repeatedly for seamless, splinter-free touch',
      'Organic food-grade beeswax protective finish',
      'Includes a heavy-canvas storage draw-sack'
    ]
  },
  {
    id: 'rose-glow-palette',
    name: 'Rose Glow Palette',
    category: 'cosmetics',
    price: 1850,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCjbgZjgFMrfqPKdLYGLo5VMZspNkfGmCMNHEDvubiBtWnyHkFT2GpsNDz6BTR-cMrEaxuDlSSHu1hk51-dzAN9ANkzOTLSINHKIQxxq2yryMHWO0KRK5asrrjLuaY6pbhK_e10_qRW23FicedF4Rq8gXyJuYbWxNgzdXB-0Rg8N3Ntjp4Tki8kJmu60fvxP6K0QHOPjHaUBY12A3HjEx6Wx12n3RsATFgvCiYYeMarkXYArLzn6CXof0o7gnNbSuphFUKedYHbEtQ',
    rating: 4.8,
    reviewCount: 85,
    tags: ['Highly Pigmented', 'Cruelty-Free', 'Velvet Shimmer'],
    description: 'A boutique cosmetic eyeshadow palette featuring 12 buttery neutral and metallic rose-gold shades. Formulated with ultra-fine mineral micas that diffuse light for a multidimensional, long-wear finish.',
    features: [
      '12 buttery shades (6 warm mattes, 4 intense shimmers, 2 metallic foils)',
      'Wet-dry formula for custom color-density controls',
      'Infused with skin-soothing jojoba oil extract',
      'Luxe magnetic compact case with premium HD glass mirror'
    ]
  },
  {
    id: 'lunar-cloud-sneakers',
    name: 'Lunar Cloud Sneakers',
    category: 'accessories',
    price: 5200,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAFJ-rsMJOQsi6DSWXFhVRNKJeTfEf_vitLGEBXWYrE2uplfxLE7B1enE_vBuqjf0EXVm__NHdmbBCQr0aK_d49RidlGQahK6R5h2KSxg1Y2bxGRVI3gJwLwZaUFt0HekoXkxCTrhT73uFc4cwgtm5JSdjd_d05NqbkXcYenY0ZPU6Z1QRp96ejqHVH_JtlonJ8sB9VgwoFGNjBy2V7QoJyplIJJYGJrs0By_lH-DzdD5fVf_mhzA5px96KWUquQGvxBxYBQTkMJLY',
    rating: 4.7,
    reviewCount: 200,
    tags: ['Ergonomic', 'Mesh Breathable', 'Ultralight'],
    description: 'Bespoke daily lifestyle trainers featuring structural mesh paneling, full-grain micro-nubuck counters, and highly responsive foam midsole. Engineered for optimal arch support and shock dispersion.',
    features: [
      'Engineered multi-layered mesh for high air ventilation',
      'Dual-density energy-returning foam outsoles',
      'Reinforced thermo-plastic heel support counters',
      'OrthoLite premium comfort-fit orthotic insoles'
    ]
  },
  {
    id: 'amber-oud-set',
    name: 'Amber & Oud Set',
    category: 'gifts',
    price: 2299,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAy1S-Do97pldyFuqG7i-JluQ4rbDo6sNaS21E_WTx0I8x5MbgqtbWp9icQEAnHy-Oxn1nEFlFNu8auhgw4FmM6Wz5dmFTRevbR6cot3-vSdXbzLelTTQyKO_DsALA65j8v1KN170lWNKJF52LjhzfRugCPCvAP1cf7TuBY023DR3lm1XZBLKFIR-oM2K4UOHzYrEwn4JAYuZQOGdIh6zEGvBZE6XaYvgj_f7s_zUhuk4RKo4N7WDcSovhmbuRcjxVuVcadb4HYcD0',
    rating: 5.0,
    reviewCount: 50,
    tags: ['Aromatherapy', 'Natural Oils', 'Sophisticated'],
    description: 'An opulent home scent experience combining a wood-reed reed diffuser and a heavy hand-poured soy wax candle. Notes of precious Indian oudwood, smooth Baltic amber resins, cardamom, and soft vanilla pod.',
    features: [
      '150ml premium reed diffuser with 8 natural rattan reeds',
      '220g clean-burning soy wax candle (up to 48 hours burn time)',
      'Formulated with 100% natural, therapeutic-grade essential oils',
      'Stunning matte amber glass apothecary vessels'
    ]
  },
  {
    id: 'summer-luxe-lehenga',
    name: 'Summer Luxe Lehenga',
    category: 'dresses',
    price: 12500,
    originalPrice: 15000,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDNYfEXK_7rLU83L70-1o6lkY-fzswn4nVWOSq68iDwQlgizS_-6l2r7xqHojeTiYP9pDAVc6sH_m9TYKlhWOzTzlfKQ9GQmH4SKX0M6ZoYWctx8Oy6PMqi3IDWIcFOi5Q4w0KvCZEWNlJAYt0UnhnxBjiUUEeBkm2ikYZQ-sMxXSnUkIIamqWxwdUTBnoPyVDLRD64sB8MnbXxqUwEPRT6uL9PYmA9S6jiveUiNMFFfG0clM11-RBMOuvSzDsbtazfyF7cm5QTCfM',
    rating: 4.9,
    reviewCount: 65,
    tags: ['Couture', 'Embroidery', 'Festive'],
    description: 'A breathtaking contemporary ethnic Indian lehenga choli set featuring custom sequined embroidery in deep red and opulent rose-gold colors. Styled for the modern luxury festive season with airy georgette drapes.',
    features: [
      'Premium lightweight georgette with micro-satin lining',
      'Intricate, hand-guided heavy thread zardozi and gota patti work',
      'Complete set: unstitched blouse piece, tiered lehenga skirt, sheer dupatta',
      'Designed exclusively for the PurnimaCart couture collection'
    ]
  },
  {
    id: 'caramel-sweets-box',
    name: 'Gourmet Sweets Box',
    category: 'chocolates',
    price: 1800,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAlJ-VVyeEVY0-1rO_pA2W9mxzfPnLaVyYXv7yJSxhXy2yg1SwgXwdfLMpMSbrk6RtT6AckZXZVvwfAMp3-d6tlXJDWNH1HlVrMch1GKVgH0v7fCqPNO6tL7mSAbM7F0Iun23glZ9x459ao31XU03tQvkPphVilG4MY_mBUhPZRMHmkdWtnaFuQXaoToWYiSOuazPMgIFMaYDpk-YhGfbEpWgjWzBFP84ffM0Kjvwh66CXOHrGUwphcz5mNnrbIC10nt2cKP8gLgbM',
    rating: 4.8,
    reviewCount: 43,
    tags: ['Gourmet', 'Handmade', 'Caramel'],
    description: 'A collection of soft, liquid-caramel filled dark chocolate pralines and caramelized nuts. Drizzled in warm buttery caramel and packaged for the ultimate confectionery connoisseur.',
    features: [
      'Includes 12 signature caramel-centered pralines',
      'Made with rich, raw Demerara sugar and sea salt flakes',
      'Coated in single-origin 72% Madagascar dark chocolate',
      'Packed with premium wood wool inside a luxury rustic crate box'
    ]
  },
  {
    id: 'timeless-watch-set',
    name: 'Timeless Leather Watch Set',
    category: 'accessories',
    price: 6500,
    originalPrice: 7999,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAERFGeaAZipt_fLG-VOHdfor_-Z3fYTZI445fQkfirPe9Lvy3EtfPtFGc9y7znjcOygJ2_xR-AthCDtwIj-pQg3Y9oJlubdIxNIgB-2cdv6awg5AHyThPXzkc9eaQk2V7BoO2fMc0Dz_5k-0xGukFL20z-a7ObBdslwBie17pAtGra6Vv8iz2yr6PNPEVJzAATLM-ingR-ucc8DAPlJwMaqJqrjxkJ2pmqpBYJsLm6kOxzSViw5LaWflw-p65AAYpnmmT-u4XNuTU',
    rating: 4.9,
    reviewCount: 112,
    tags: ['Swiss Quartz', 'Genuine Leather', 'Minimalist'],
    description: 'A collection of minimalist leather-strapped luxury watches and companion accessories. Featuring low-profile sandblasted stainless steel casings and mineral scratchproof lens.',
    features: [
      'High-precision Swiss quartz movement',
      'Strap made from hand-waxed vegetable tanned leather',
      'Waterproof up to 5 ATM (50 meters)',
      'Includes interchangeable straps (Tan Brown & Classic Charcoal)'
    ]
  },
  {
    id: 'gallery-wall-frames',
    name: 'Wall Art Gallery Set',
    category: 'frames',
    price: 3999,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDmS4Kgvp2R-vE-mI7ZMasMO2DAss7YwFiQ9Ru9OrBvwGG_0RPy_0e11rLx3wj1ilJYpQnPkrN9BJTcOlkqsvuh-pxO_yeIMCK2E_1U8IcGntLNqpFuWbjHZFziJoLxPnVUXHBqlZKji9my0VmPI_L25CgWjFbQKDBCno6CbaPN1traR4v4WaLKOgpt1VU5gT4ZayP-cujt1JpC6Qbtht0tQFx2R_kZRZQFCEDMPMdTcR61KrCRWt-IKfFCubGzjzqvunfKu8G3gnE',
    rating: 4.7,
    reviewCount: 39,
    tags: ['Gallery-Quality', 'Teak Wood', 'Modernist'],
    description: 'An elegant selection of modern art frames in solid black timber, brushed bronze, and natural white oak. Includes mounting templates and high-definition abstract graphic prints.',
    features: [
      'Set of 9 multi-size solid timber frames',
      'Passepartout acid-free conservation mount boards',
      'Easy-hang dual tooth metal brackets pre-installed',
      'Ultra-clear polished plexiglass protection'
    ]
  }
];

export const MOCK_REVIEWS = [
  { id: '1', userName: 'Ananya Sharma', rating: 5, date: 'June 18, 2026', comment: 'Absolutely stunning quality! Highly recommended. The product matches the photos perfectly and feels incredibly luxurious.' },
  { id: '2', userName: 'Rahul Verma', rating: 4, date: 'May 29, 2026', comment: 'Very premium build, fast delivery, and overall really beautiful packaging. Will buy again!' },
  { id: '3', userName: 'Priya Patel', rating: 5, date: 'May 12, 2026', comment: 'Gorgeous! Exceeded all my expectations. The colors are so elegant.' }
];

export const TRENDING_SEARCHES: string[] = [
  'Turbo Racer Ultra X1',
  'Velvet Truffle Box',
  'Festive Dresses',
  'Glow Radiance Kit',
  'Gifts under ₹1,500',
  'Photo Frames',
];

export const SPECIAL_OFFERS = [
  { code: 'PCART20', discount: '20% Off', description: 'Unlock 20% Extra discount on your first order above ₹4,999!', minSpend: 4999 },
  { code: 'LUXURYTOY', discount: '15% Off', description: 'Special 15% discount on all wooden toys in the Artisanal category!', minSpend: 0 },
  { code: 'SWEETS10', discount: '10% Off', description: 'Gourmet sweets and chocolates additional 10% discount.', minSpend: 0 },
];
