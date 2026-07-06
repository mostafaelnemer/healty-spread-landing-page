import { lazy, Suspense, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { landingData } from './data/landingData.js';
import OffersSection from './components/OffersSection.jsx';

const StepConfirm = lazy(() => import('./components/StepConfirm.jsx'));

function getRoute() {
  return window.location.pathname;
}

function navigate(path) {
  window.history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

function useRoute() {
  const [route, setRoute] = useState(getRoute);
  useEffect(() => {
    const handler = () => setRoute(getRoute());
    window.addEventListener('popstate', handler);
    return () => window.removeEventListener('popstate', handler);
  }, []);
  return route;
}

function SectionFallback({ minHeight = 200 }) {
  return <div className="section-fallback" aria-hidden="true" style={{ minHeight }} />;
}

function Header({ brand, nav }) {
  return (
    <>
      <div className="promo-bar">
        <span>🚚 توصيل مجاناً</span>
        <span>•</span>
        <span>Healthy Spread بدون سكر مضاف</span>
        <span>•</span>
        <span>اطلب قبل نفاد الكمية</span>
      </div>
      <header className="site-header">
        <a className="brand-link" href="/" aria-label={brand.name}>
          <img src={brand.logo} alt={brand.name} decoding="async" width={160} height={40} />
        </a>
        <nav className="main-nav" aria-label="روابط الصفحة">
          {nav.map((item) => (
            <a key={item.label} href={item.href}>
              {item.label}
            </a>
          ))}
        </nav>
        <a className="header-cta" href="#offers">
          اطلب الآن 🛒
        </a>
      </header>
    </>
  );
}

function Hero({ hero }) {
  const images = hero.images || [hero.image];
  const [activeIdx, setActiveIdx] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (images.length <= 1 || paused) return undefined;
    const timer = setInterval(() => {
      setActiveIdx((i) => (i + 1) % images.length);
    }, 1800);
    return () => clearInterval(timer);
  }, [images.length, paused]);

  useEffect(() => {
    images.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, [images]);

  useEffect(() => {
    let scrollTimer;
    const onScroll = () => {
      setPaused(true);
      clearTimeout(scrollTimer);
      scrollTimer = window.setTimeout(() => setPaused(false), 1200);
    };
    const onVisibility = () => setPaused(document.hidden);

    window.addEventListener('scroll', onScroll, { passive: true });
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('scroll', onScroll);
      document.removeEventListener('visibilitychange', onVisibility);
      clearTimeout(scrollTimer);
    };
  }, []);

  const flavorLabels = ['أوجينال', 'بروتين', 'فيجن', 'أطفال', 'زبدة فول سوداني'];

  return (
    <section className="hero" id="top">
      <div className="hero-copy">
        <span className="eyebrow">{hero.eyebrow}</span>
        <h1>{hero.title}</h1>
        <p>{hero.subtitle}</p>
        <div className="hero-actions">
          <a className="primary-button" href="#offers">
            {hero.primaryCta}
          </a>
          <a className="secondary-button" href="#offers">
            {hero.secondaryCta}
          </a>
        </div>
        <div className="hero-stats" aria-label="معلومات سريعة">
          {hero.stats.map((stat) => (
            <div key={stat.label}>
              <strong>{stat.value}</strong>
              <span>{stat.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="hero-visual" aria-label="صور المنتج">
        <div className="product-glow" />
        <div className="hero-carousel">
          {images.map((src, i) => (
            <img
              key={`hero-slide-${i}`}
              src={src}
              alt={`Healthy Spread - ${flavorLabels[i] || i + 1}`}
              decoding="async"
              fetchPriority={i === 0 ? 'high' : 'auto'}
              loading="eager"
              width={520}
              height={520}
              className={`hero-carousel-img${i === activeIdx ? ' active' : ''}`}
            />
          ))}
        </div>
        <div className="hero-flavor-label" aria-live="polite">
          {flavorLabels[activeIdx]}
        </div>
        <div className="hero-dots" role="tablist" aria-label="اختار النكهة">
          {images.map((_, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={i === activeIdx}
              aria-label={flavorLabels[i]}
              className={`hero-dot${i === activeIdx ? ' active' : ''}`}
              onClick={() => setActiveIdx(i)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function Benefits({ benefits }) {
  return (
    <section className="section benefits-section section-below-fold" id="benefits" aria-label="ليه Healthy Spread؟">
      <div className="section-intro centered">
        <span className="eyebrow">ليه Healthy Spread؟</span>
        <h2>اختيار صحي من غير ما تتنازل عن الطعم</h2>
      </div>
      <div className="benefits-band">
        {benefits.map((benefit) => (
          <div className="benefit-pill" key={benefit}>
            <span aria-hidden="true">✓</span>
            {benefit}
          </div>
        ))}
      </div>
    </section>
  );
}

function Audience({ audience }) { return null; }
function LoveReasons({ loveReasons }) { return null; }

function Footer({ brand, footer }) {
  return (
    <footer className="site-footer">
      <img src={brand.logo} alt={brand.name} loading="lazy" decoding="async" width={260} height={64} />
      <p>{brand.tagline}</p>
      <span>{footer.note}</span>
    </footer>
  );
}

function PurchaseSuccess({ onBack }) {
  return (
    <main className="funnel" dir="rtl">
      <div className="funnel-header">
        <button className="funnel-back-btn" type="button" onClick={onBack}>
          → رجوع للرئيسية
        </button>
        <img
          src={landingData.brand.logo}
          alt={landingData.brand.name}
          className="funnel-logo"
          decoding="async"
          width={160}
          height={40}
        />
      </div>
      <section className="step-screen">
        <div className="order-success">
          <div className="success-anim">
            <div className="success-circle" aria-hidden="true">✓</div>
          </div>
          <h2>تم تسجيل طلبك بنجاح! 🎉</h2>
          <p className="success-msg">{landingData.form.successMessage}</p>
          <div className="success-steps">
            <div className="success-step">
              <span className="success-step-num">1</span>
              <div>
                <strong>تأكيد الطلب</strong>
                <p>هيتواصل معاك فريقنا خلال ساعات لتأكيد الطلب</p>
              </div>
            </div>
            <div className="success-step">
              <span className="success-step-num">2</span>
              <div>
                <strong>التجهيز والشحن</strong>
                <p>بنجهز طلبك ونبعته مع أقرب شحنة</p>
              </div>
            </div>
            <div className="success-step">
              <span className="success-step-num">3</span>
              <div>
                <strong>الاستلام والدفع</strong>
                <p>تستلم طلبك وتدفع عند الباب</p>
              </div>
            </div>
          </div>
          <button type="button" className="confirm-order-btn" onClick={onBack}>
            العودة للرئيسية
          </button>
        </div>
      </section>
    </main>
  );
}

export default function App() {
  const route = useRoute();
  const cartRef = useRef([]);
  const [, setCartItems] = useState([]);

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, [route]);

  useEffect(() => {
    if (route === '/add_to_cart' && cartRef.current.length === 0) {
      navigate('/');
    }
  }, [route]);

  const goToCart = (items) => {
    cartRef.current = items;
    setCartItems(items);
    navigate('/add_to_cart');
  };

  const goToPurchase = () => {
    navigate('/purchase');
  };

  const goHome = () => {
    cartRef.current = [];
    setCartItems([]);
    navigate('/');
  };

  if (route === '/purchase') {
    return <PurchaseSuccess onBack={goHome} />;
  }

  if (route === '/add_to_cart') {
    if (cartRef.current.length === 0) return null;

    return (
      <main className="funnel" dir="rtl">
        <div className="funnel-header">
          <button className="funnel-back-btn" type="button" onClick={goHome}>
            → رجوع
          </button>
          <img
            src={landingData.brand.logo}
            alt={landingData.brand.name}
            className="funnel-logo"
            decoding="async"
            width={160}
            height={40}
          />
        </div>
        <Suspense fallback={<SectionFallback minHeight={200} />}>
          <StepConfirm
            form={landingData.form}
            cartItems={cartRef.current}
            onBack={goHome}
            onSuccess={goToPurchase}
          />
        </Suspense>
      </main>
    );
  }

  return (
    <>
      <Header brand={landingData.brand} nav={landingData.nav} />
      <main>
        <Hero hero={landingData.hero} />
        <OffersSection intro={landingData.offersIntro} offers={landingData.offers} onCheckout={goToCart} />
        <Benefits benefits={landingData.benefits} />
      </main>
      <Footer brand={landingData.brand} footer={landingData.footer} />
    </>
  );
}
