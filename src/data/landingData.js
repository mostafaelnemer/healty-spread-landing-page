import logo from '../assets/logo.webp';
import product1 from '../assets/1.webp';
import product2 from '../assets/2.webp';
import product3 from '../assets/3.webp';
import product4 from '../assets/4.webp';
import product5 from '../assets/5.webp';

/** Product shots in carousel / gallery order: أوجينال، بروتين، فيجن، أطفال، زبدة فول سوداني */
export const productImages = [product1, product2, product3, product4, product5];

export const spreadFlavors = [
  { id: 'kids',    label: 'سبريد شيكولاتة أطفال 375 جرام',   shortLabel: 'أطفال',          emoji: '🧒', image: product4 },
  { id: 'original',label: 'سبريد شيكولاتة أوجينال 375 جرام',  shortLabel: 'أوجينال',        emoji: '🍫', image: product1 },
  { id: 'protein', label: 'سبريد شيكولاتة بروتين 375 جرام',   shortLabel: 'بروتين',         emoji: '💪', image: product2 },
  { id: 'vegan',   label: 'سبريد شيكولاتة فيجن 375 جرام',     shortLabel: 'فيجن',           emoji: '🌱', image: product3 },
  { id: 'peanut',  label: 'زبدة فول سوداني 375 جرام',         shortLabel: 'زبدة فول سوداني', emoji: '🥜', image: product5 },
];

export const heroImages = productImages;

export const egyptGovs = ['القاهرة', 'الجيزة', 'الإسكندرية'];

export const landingData = {
  brand: {
    logo,
    name: 'Healthy & Tasty',
    tagline: 'Healthy food for all people',
  },
  nav: [
    { label: 'المميزات', href: '#benefits' },
    { label: 'العروض',   href: '#offers'   },
    { label: 'اطلب الآن', href: '#offers'  },
  ],
  hero: {
    eyebrow: 'Healthy Spread',
    title: 'استمتع بـ Healthy Spread اللي بتحبها... بطريقة تناسب حياتك الصحية',
    subtitle:
      'طعم غني ولذيذ من غير سكر مضاف، مناسب لنظامك الصحي من غير ما تحرم نفسك.',
    primaryCta: 'اطلب دلوقتي',
    secondaryCta: 'شوف العروض',
    images: heroImages,
    stats: [
      { value: '0%', label: 'سكر مضاف' },
      { value: 'Keto', label: 'مناسب للدايت' },
      { value: 'Stevia', label: 'محلى بالاستيفيا' },
    ],
  },
  benefits: [
    'مناسب للدايت والكيتو',
    'مناسب لمرضى السكر',
    'محلى بالاستيفيا',
    'منخفض السعرات الحرارية',
    'بدون سكر مضاف',
    'خالية من الزيوت المهدرجة',
  ],
  audience: {
    title: 'مناسب لمين؟',
    description: 'Healthy Spread اختيار ذكي لأكتر من روتين صحي، من غير حرمان ومن غير تعقيد.',
    items: [
      { label: 'الرياضيين',                  icon: '🏋️' },
      { label: 'مرضى السكر',                 icon: '🩺' },
      { label: 'متبعي الكيتو دايت',           icon: '🥑' },
      { label: 'متبعي نظام منخفض السعرات',    icon: '⚖️' },
    ],
  },
  product: {
    title: 'طعم حلو من غير إحساس بالذنب',
    description:
      'سبريد غني يناسب الفطار، السناك، والحلويات الصحية. معمول عشان يديك إحساس الشوكولاتة اللي بتحبه بشكل أخف وأنسب للاستخدام اليومي.',
    gallery: [
      { title: 'طعم غني', note: 'قوام كريمي وطعم شوكولاتة واضح' },
      { title: 'مكونات أخف', note: 'مناسب للاستخدام اليومي بدون سكر مضاف' },
      { title: 'سناك سريع', note: 'ينفع مع الفطار أو بين الوجبات' },
      { title: 'اختيار صحي', note: 'مناسب لأسلوب حياة أخف' },
      { title: 'زبدة فول سوداني', note: 'نكهة فول سوداني غنية بدون سكر مضاف' },
    ],
  },
  offersIntro: {
    eyebrow: 'اختار العرض المناسب ليك 👇',
    title: 'عروض Healthy Spread قبل ما تخلص',
    description: 'كل العروض شاملة الدفع عند الاستلام 💳 + التوصيل مجاناً 🚚',
  },
  offers: [
    {
      id: 'two-jars',
      title: 'العرض الأول',
      amount: '2 Healthy Spread',
      description: 'اشتري ٢ شيكولاتة سبريد بسعر مخفض',
      price: 450,
      originalPrice: 600,
      saving: 150,
      unitsPerPack: 2,
      giftUnits: 0,
      maxFlavors: 2,
      maxGiftFlavors: 0,
      badge: 'توفير 🔥',
      accent: '#5f2d91',
      note: '',
    },
    {
      id: 'three-jars',
      title: 'العرض الثاني',
      amount: '3 Healthy Spread + 1 مجاناً',
      description: 'اشتري ٣ شيكولاتة سبريد واحصل على قطعة مجاناً',
      price: 900,
      originalPrice: 1200,
      saving: 300,
      unitsPerPack: 3,
      giftUnits: 1,
      maxFlavors: 4,
      maxGiftFlavors: 1,
      badge: '⭐ الأكثر طلبًا',
      accent: '#b11730',
      note: '',
    },
  ],
  loveReasons: {
    eyebrow: 'ليه العملاء بيحبوا Healthy Spread؟',
    title: 'لأنها بتديك الطعم اللي بتحبه بشكل أخف',
    items: [
      { label: 'طعم حلو من غير إحساس بالذنب',              icon: '😍' },
      { label: 'اختيار يناسب أسلوب الحياة الصحي',           icon: '🌿' },
      { label: 'مكونات أخف وأنسب للاستخدام اليومي',         icon: '✅' },
      { label: 'حل مثالي للحلويات والسناك الصحية',           icon: '🍽️' },
    ],
  },
  form: {
    title: 'بياناتك',
    subtitle: 'أدخل بياناتك وهنكلمك لتأكيد الطلب',
    submitLabel: 'تأكيد الطلب',
    successMessage: 'تم تسجيل طلبك! سيتم التواصل معاك في أقرب وقت لتأكيد الطلب والتوصيل.',
    validationMessage: 'من فضلك املأ كل الحقول المطلوبة بشكل صحيح.',
  },
  footer: {
    note: 'Healthy Spread بطعم غني يناسب حياتك الصحية.',
  },
};

export const SHIPPING_FEE = 0; // free shipping

export const formatPrice = (amount) => `${amount} جنيه`;
