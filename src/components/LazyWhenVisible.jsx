import { useEffect, useRef, useState } from 'react';

export default function LazyWhenVisible({ children, minHeight = 400, rootMargin = '0px 0px 200px 0px' }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  const [rendered, setRendered] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || visible) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          // keep minHeight until content is rendered to avoid layout shift
          requestAnimationFrame(() => setRendered(true));
          observer.disconnect();
        }
      },
      { rootMargin, threshold: 0.01 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [visible, rootMargin]);

  return (
    <div
      ref={ref}
      className="lazy-section-slot"
      style={{ minHeight: rendered ? undefined : minHeight }}
    >
      {visible ? children : null}
    </div>
  );
}
