import { productImages } from '../data/landingData.js';

export default function ProductShowcase({ product }) {
  return (
    <section className="section product-section section-below-fold" id="product">
      <div className="section-intro">
        <span className="eyebrow">Healthy lifestyle</span>
        <h2>{product.title}</h2>
        <p>{product.description}</p>
      </div>
      <div className="product-grid">
        {product.gallery.map((item, index) => (
          <article
            className={`product-card${index === 4 ? ' product-card--featured' : ''}`}
            key={item.title}
          >
            <div className="product-card__media">
              <img
                src={productImages[index]}
                alt={item.title}
                loading="lazy"
                decoding="async"
                width={400}
                height={400}
              />
            </div>
            <div className="product-card__body">
              <h3>{item.title}</h3>
              <p>{item.note}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
