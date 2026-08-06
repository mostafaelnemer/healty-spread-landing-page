import logo from '../assets/logo.webp';
import product1 from '../assets/1.webp';
import product2 from '../assets/2.webp';
import product3 from '../assets/3.webp';
import product4 from '../assets/4.webp';
import product5 from '../assets/5.webp';
import product6 from '../assets/prestiege.webp';
import product7 from '../assets/coconut.webp';
import product8 from '../assets/beanut_butter_high_protien.webp';
import product9 from '../assets/beanut_butter.webp';

/** Product shots in carousel / gallery order: أطفال، أوجينال، بروتين، فيجن، بريستيج، جوز هند، زبدة فول سوداني، زبدة فول سوداني عالي البروتين، زبدة فول سوداني شيكولاتة */
export const productImages = [product4, product1, product2, product3, product6, product7, product5, product8, product9];

export const spreadFlavors = [
  { id: 'kids',    label: 'سبريد شيكولاتة أطفال 375 جرام',   shortLabel: 'أطفال',          emoji: '🧒', weight: '375 جرام', image: product4 },
  { id: 'original',label: 'سبريد شيكولاتة أوجينال 375 جرام',  shortLabel: 'أوجينال',        emoji: '🍫', weight: '375 جرام', image: product1 },
  { id: 'protein', label: 'سبريد شيكولاتة بروتين 375 جرام',   shortLabel: 'بروتين',         emoji: '💪', weight: '375 جرام', image: product2 },
  { id: 'vegan',   label: 'سبريد شيكولاتة فيجن 375 جرام',     shortLabel: 'فيجن',           emoji: '🌱', weight: '375 جرام', image: product3 },
  { id: 'prestige', label: 'سبريد شيكولاتة بريستيج 375 جرام', shortLabel: 'بريستيج', emoji: '👑', weight: '375 جرام', badge: '(بندق أكتر)', featured: true, image: product6 },
  { id: 'coconut', label: 'سبريد جوز هند 375 جرام',            shortLabel: 'جوز هند',        emoji: '🥥', weight: '375 جرام', image: product7 },
  { id: 'peanut',  label: 'زبدة فول سوداني 375 جرام',         shortLabel: 'زبدة فول سوداني', emoji: '🥜', weight: '375 جرام', image: product5 },
  { id: 'highProtein', label: 'زبدة فول سوداني عالي البروتين 375 جرام', shortLabel: 'زبدة فول سوداني عالي البروتين', emoji: '💪', weight: '375 جرام', image: product8 },
  { id: 'chocolatePeanut', label: 'زبدة فول سوداني شيكولاتة 375 جرام', shortLabel: 'زبدة فول سوداني شيكولاتة', emoji: '🍫', weight: '375 جرام', image: product9 },
];

export const heroImages = productImages;

export const egyptGovs = ['القاهرة', 'الجيزة', 'الإسكندرية', 'طنطا', 'المنصورة', 'السويس', 'دمياط'];

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
      { title: 'بريستيج', note: 'نكهة فاخرة وغنية ببندق أكتر' },
      { title: 'جوز هند', note: 'نكهة جوز هند استوائية منعشة' },
      { title: 'زبدة فول سوداني', note: 'نكهة فول سوداني غنية بدون سكر مضاف' },
      { title: 'زبدة فول سوداني عالي البروتين', note: 'مثالي للرياضيين ومحبي البروتين' },
      { title: 'زبدة فول سوداني شيكولاتة', note: 'مزيج مثالي من فول السوداني والشوكولاتة' },
    ],
  },
  offersIntro: {
    eyebrow: 'اختار العرض المناسب ليك 👇',
    title: 'الحق العروض قبل ما تخلص',
    description: 'كل العروض شاملة الدفع عند الاستلام 💳 + التوصيل مجاناً 🚚',
  },
  offers: [
    {
      id: 'two-jars',
      title: 'العرض الأول',
      amount: 'عرض القطعتين ب 450 جنيه بدلاً من 600 جنيه',
      description: '',
      price: 450,
      originalPrice: 600,
      saving: 150,
      unitsPerPack: 2,
      maxFlavors: 9,
      badge: 'توفير 🔥',
      accent: '#5f2d91',
      note: '',
    },
    {
      id: 'three-jars',
      title: 'العرض الثاني',
      amount: 'عرض ال 3 قطع ب 650 جنيه بدلاً من 900 جنيه',
      description: '',
      price: 650,
      originalPrice: 900,
      saving: 250,
      unitsPerPack: 3,
      maxFlavors: 9,
      badge: '⭐ الأكثر طلبًا',
      accent: '#b11730',
      note: '',
    },
    {
      id: 'four-jars',
      title: 'العرض الثالث',
      amount: 'عرض ال 4 قطع ب 850 بدلاً من 1200 جنيه',
      description: '',
      price: 850,
      originalPrice: 1200,
      saving: 350,
      unitsPerPack: 4,
      maxFlavors: 9,
      badge: 'أكبر توفير 🔥',
      accent: '#0f766e',
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
