import { useEffect, useState } from 'react';
import {
  api,
  formatMoney,
  type PerkIcon,
  type ProductWithCategory,
  type StoreSettings,
} from '../lib/api';
import { haptic } from '../lib/telegram';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { useRouter } from '../App';
import { PastelThumb } from '../components/PastelThumb';
import { QuantityStepper } from '../components/QuantityStepper';

type Props = { id: string };

type State =
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'ready'; product: ProductWithCategory; store: StoreSettings };

const PERK_ICONS: Record<PerkIcon, JSX.Element> = {
  shipping: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7h11v10H3zM14 10h4l3 3v4h-7z" />
      <circle cx="7" cy="17.5" r="1.8" />
      <circle cx="17.5" cy="17.5" r="1.8" />
    </svg>
  ),
  returns: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 9a8 8 0 0 1 14.9-2M20 15a8 8 0 0 1-14.9 2" />
      <path d="M18.5 3.5V7H15M5.5 20.5V17H9" />
    </svg>
  ),
  secure: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3 4.5 6v5c0 4.6 3.2 8.2 7.5 10 4.3-1.8 7.5-5.4 7.5-10V6L12 3z" />
      <path d="m9 11.5 2.2 2.2L15.5 9" />
    </svg>
  ),
  download: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 4v12m0 0-4-4m4 4 4-4" />
      <path d="M4 18h16" />
    </svg>
  ),
  support: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 12a8 8 0 1 1 16 0" />
      <rect x="3" y="12" width="4" height="7" rx="1.5" />
      <rect x="17" y="12" width="4" height="7" rx="1.5" />
      <path d="M17 19v1a3 3 0 0 1-3 3h-2" />
    </svg>
  ),
  gift: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="9" width="18" height="12" rx="1.5" />
      <path d="M3 13h18" />
      <path d="M12 9v12" />
      <path d="M12 9c-1.5 0-4-1-4-3.5C8 4 9.5 3 11 3c1.5 0 2 1.5 2 3V9h1V6c0-1.5.5-3 2-3 1.5 0 3 1 3 2.5C19 8 16.5 9 15 9" />
    </svg>
  ),
};

export function ProductDetail({ id }: Props) {
  const { back, navigate } = useRouter();
  const { wishlist, toggleWishlist, replace } = useCart();
  const toast = useToast();
  const [state, setState] = useState<State>({ kind: 'loading' });
  const [qty, setQty] = useState(1);

  useEffect(() => {
    let cancelled = false;
    Promise.all([api.product(id), api.store(), api.categories()])
      .then(([p, s, c]) => {
        if (cancelled) return;
        const categoryName =
          c.categories.find((cat) => cat.id === p.product.category_id)?.name ?? '—';
        setState({
          kind: 'ready',
          product: { ...p.product, category_name: categoryName },
          store: s.store,
        });
        setQty(1);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setState({
          kind: 'error',
          message: err instanceof Error ? err.message : 'Failed to load.',
        });
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (state.kind === 'loading')
    return (
      <div className="screen cta-screen active">
        <div className="center-state">Loading…</div>
      </div>
    );
  if (state.kind === 'error')
    return (
      <div className="screen cta-screen active">
        <div className="center-state">{state.message}</div>
      </div>
    );

  const { product, store } = state;
  const currency = store.currency_symbol;
  const isDigital = product.delivery_type === 'digital';
  const isNone = product.delivery_type === 'none';
  const inStock = isNone || isDigital || product.stock > 0;
  const maxQty = isDigital || isNone ? 1 : Math.min(product.stock, 9);
  const saved = wishlist.has(product.id);

  const activePerks = [
    { icon: store.perk_1_icon, text: store.perk_1_text },
    { icon: store.perk_2_icon, text: store.perk_2_text },
    { icon: store.perk_3_icon, text: store.perk_3_text },
  ].filter((p) => p.text.trim().length > 0);

  const stockLabel = !inStock
    ? 'Out of stock'
    : isDigital
      ? 'Instant download after purchase'
      : isNone
        ? 'Available for order'
        : product.stock <= 10
          ? `Only ${product.stock} left in stock`
          : 'In stock';

  return (
    <section className="screen cta-screen active">
      <div className="topbar">
        <button type="button" className="icon-btn" aria-label="Back" onClick={back}>
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
            <path d="m14.5 6-6 6 6 6" />
          </svg>
        </button>
        <span className="topbar-title">Product Detail</span>
        <button
          type="button"
          className={`icon-btn${saved ? ' heart-on' : ''}`}
          aria-label="Save"
          onClick={() => {
            toggleWishlist(product.id);
            toast(saved ? 'Removed from wishlist' : 'Saved to wishlist');
          }}
        >
          <svg width="19" height="19" viewBox="0 0 24 24" fill={saved ? '#111111' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
            <path d="M12 20.5s-7.5-4.7-9.3-9.2C1.3 7.7 3.6 4.5 6.9 4.5c2 0 3.6 1.1 4.6 2.7.2.4.4.4.6 0 1-1.6 2.6-2.7 4.6-2.7 3.3 0 5.6 3.2 4.2 6.8-1.8 4.5-9.4 9.2-9.4 9.2z" />
          </svg>
        </button>
      </div>

      <div className="detail-thumb">
        <PastelThumb product={product} className="thumb" />
      </div>

      <span className="p-cat">{product.category_name}</span>
      <div className="detail-head">
        <h2 className="detail-name h-display">{product.name}</h2>
        <span className="detail-price">{formatMoney(product.price, currency)}</span>
      </div>
      <p className="detail-desc">{product.description || 'No description yet.'}</p>

      <div className="stock-line">
        <span className={`dot${inStock ? '' : ' out'}`} />
        <span className="muted">{stockLabel}</span>
      </div>

      {!isNone && !isDigital && (
        <div className="qty-row">
          <span className="section-title">Quantity</span>
          <QuantityStepper value={qty} min={1} max={Math.max(1, maxQty)} onChange={setQty} />
        </div>
      )}

      {store.perks_enabled && activePerks.length > 0 && (
        <div className="perks">
          {activePerks.map((p, i) => (
            <div className="perk" key={i}>
              {PERK_ICONS[p.icon]}
              {p.text}
            </div>
          ))}
        </div>
      )}

      <div className="ctabar">
        <button
          type="button"
          className="btn-primary"
          disabled={!inStock}
          onClick={() => {
            if (!inStock) return;
            haptic('medium');
            replace(product, isDigital || isNone ? 1 : Math.min(qty, product.stock || 1));
            navigate({ name: 'checkout' });
          }}
        >
          {inStock
            ? isDigital || isNone
              ? `Buy Now · ${formatMoney(product.price, currency)}`
              : `Buy Now · ${formatMoney(product.price * qty, currency)}`
            : 'Out of stock'}
        </button>
      </div>
    </section>
  );
  }
