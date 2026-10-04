import { useEffect, useState } from 'react';
import { api, type PerkIcon, type StoreSettings } from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import { Banner } from '../../components/Banner';

type Draft = Omit<StoreSettings, 'id' | 'updated_at'>;

const PERK_ICON_OPTIONS: PerkIcon[] = [
  'shipping', 'returns', 'secure', 'download', 'support', 'gift',
];

function perkIconPreview(icon: PerkIcon): JSX.Element {
  const common = {
    width: 18,
    height: 18,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.7,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };
  switch (icon) {
    case 'shipping':
      return (
        <svg {...common}>
          <path d="M3 7h11v10H3zM14 10h4l3 3v4h-7z" />
          <circle cx="7" cy="17.5" r="1.8" />
          <circle cx="17.5" cy="17.5" r="1.8" />
        </svg>
      );
    case 'returns':
      return (
        <svg {...common}>
          <path d="M4 9a8 8 0 0 1 14.9-2M20 15a8 8 0 0 1-14.9 2" />
          <path d="M18.5 3.5V7H15M5.5 20.5V17H9" />
        </svg>
      );
    case 'secure':
      return (
        <svg {...common}>
          <path d="M12 3 4.5 6v5c0 4.6 3.2 8.2 7.5 10 4.3-1.8 7.5-5.4 7.5-10V6L12 3z" />
          <path d="m9 11.5 2.2 2.2L15.5 9" />
        </svg>
      );
    case 'download':
      return (
        <svg {...common}>
          <path d="M12 4v12m0 0-4-4m4 4 4-4" />
          <path d="M4 18h16" />
        </svg>
      );
    case 'support':
      return (
        <svg {...common}>
          <path d="M4 12a8 8 0 1 1 16 0" />
          <rect x="3" y="12" width="4" height="7" rx="1.5" />
          <rect x="17" y="12" width="4" height="7" rx="1.5" />
          <path d="M17 19v1a3 3 0 0 1-3 3h-2" />
        </svg>
      );
    case 'gift':
      return (
        <svg {...common}>
          <rect x="3" y="9" width="18" height="12" rx="1.5" />
          <path d="M3 13h18" />
          <path d="M12 9v12" />
          <path d="M12 9c-1.5 0-4-1-4-3.5C8 4 9.5 3 11 3c1.5 0 2 1.5 2 3V9h1V6c0-1.5.5-3 2-3 1.5 0 3 1 3 2.5C19 8 16.5 9 15 9" />
        </svg>
      );
  }
}

export function Settings() {
  const toast = useToast();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    api
      .store()
      .then((s) => {
        const { id: _id, updated_at: _u, ...rest } = s.store;
        void _id;
        void _u;
        setDraft({
          ...rest,
          shipping_threshold: Number(rest.shipping_threshold),
          shipping_cost: Number(rest.shipping_cost),
          stars_rate: Number(rest.stars_rate),
        });
      })
      .catch((err: unknown) => toast(err instanceof Error ? err.message : 'Load failed'));
  }, [toast]);

  if (!draft) return <p className="muted" style={{ marginTop: 16 }}>Loading…</p>;

  const save = async (keys: (keyof Draft)[], card: string, okMsg: string) => {
    setSaving(card);
    try {
      const patch: Partial<Draft> = {};
      keys.forEach((k) => {
        (patch as Record<string, unknown>)[k] = draft[k];
      });
      const { store } = await api.updateSettings(patch);
      const { id: _id, updated_at: _u, ...rest } = store;
      void _id;
      void _u;
      setDraft({
        ...rest,
        shipping_threshold: Number(rest.shipping_threshold),
        shipping_cost: Number(rest.shipping_cost),
        stars_rate: Number(rest.stars_rate),
      });
      toast(okMsg);
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(null);
    }
  };

  const update = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft({ ...draft, [k]: v });

  const starsExample = Math.round(10 * (draft.stars_rate || 77));

  return (
    <>
      <span className="section-title" style={{ display: 'block', marginTop: 22 }}>Store</span>
      <div className="panel">
        <div className="field">
          <label>Store name</label>
          <input
            type="text"
            value={draft.store_name}
            onChange={(e) => update('store_name', e.target.value)}
          />
        </div>
        <div className="field">
          <label>Tagline</label>
          <input
            type="text"
            value={draft.store_tagline}
            onChange={(e) => update('store_tagline', e.target.value)}
          />
        </div>
        <div className="field-row">
          <div className="field">
            <label>Currency symbol</label>
            <input
              type="text"
              maxLength={4}
              value={draft.currency_symbol}
              onChange={(e) => update('currency_symbol', e.target.value)}
              placeholder="$"
            />
          </div>
          <div className="field">
            <label>Currency code</label>
            <input
              type="text"
              maxLength={3}
              value={draft.currency_code}
              onChange={(e) => update('currency_code', e.target.value.toLowerCase())}
              placeholder="usd"
            />
          </div>
        </div>
        <p className="muted" style={{ fontSize: 11.5, marginTop: -4, marginBottom: 8 }}>
          Currency code is used by Stripe (3-letter ISO, e.g. <code>usd</code>, <code>eur</code>, <code>gbp</code>).
        </p>
        <div className="field-row">
          <div className="field">
            <label>Free shipping above</label>
            <input
              type="number"
              min="0"
              step="1"
              value={draft.shipping_threshold}
              onChange={(e) => update('shipping_threshold', Number(e.target.value))}
            />
          </div>
          <div className="field">
            <label>Shipping cost</label>
            <input
              type="number"
              min="0"
              step="0.5"
              value={draft.shipping_cost}
              onChange={(e) => update('shipping_cost', Number(e.target.value))}
            />
          </div>
        </div>
        <button
          type="button"
          className="btn-primary"
          disabled={saving === 'store'}
          onClick={() =>
            save(
              ['store_name', 'store_tagline', 'currency_symbol', 'currency_code', 'shipping_threshold', 'shipping_cost'],
              'store',
              'Store saved',
            )
          }
        >
          {saving === 'store' ? 'Saving…' : 'Save store'}
        </button>
      </div>

      <span className="section-title" style={{ display: 'block', marginTop: 26 }}>Payments</span>

      <div className="panel">
        <div className="field" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14 }}>Telegram Stars</div>
            <p className="muted" style={{ fontSize: 11.5 }}>
              Buyers pay inside Telegram. Confirmation is automatic.
            </p>
          </div>
          <label className="switch">
            <input
              type="checkbox"
              checked={draft.stars_enabled}
              onChange={(e) => update('stars_enabled', e.target.checked)}
            />
            <span className="track" />
            <span className="knob" />
          </label>
        </div>
        {draft.stars_enabled && (
          <div className="field">
            <label>Stars per 1 {draft.currency_symbol}</label>
            <input
              type="number"
              min="1"
              step="1"
              value={draft.stars_rate}
              onChange={(e) => update('stars_rate', Number(e.target.value))}
            />
            <p className="muted" style={{ fontSize: 11.5, marginTop: 6 }}>
              Conversion rate. A {draft.currency_symbol}10 product will cost{' '}
              <b>{starsExample.toLocaleString()} Stars</b>.
            </p>
          </div>
        )}
      </div>

      <div className="panel">
        <div className="field" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14 }}>Card (Stripe)</div>
            <p className="muted" style={{ fontSize: 11.5 }}>
              Per-order Stripe Checkout. Requires server keys. Confirmation is automatic.
            </p>
          </div>
          <label className="switch">
            <input
              type="checkbox"
              checked={draft.stripe_enabled}
              onChange={(e) => update('stripe_enabled', e.target.checked)}
            />
            <span className="track" />
            <span className="knob" />
          </label>
        </div>
      </div>

      <div className="panel">
        <div className="field" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14 }}>Bank transfer</div>
            <p className="muted" style={{ fontSize: 11.5 }}>
              Buyer transfers money, uploads a receipt, you confirm manually.
            </p>
          </div>
          <label className="switch">
            <input
              type="checkbox"
              checked={draft.bank_enabled}
              onChange={(e) => update('bank_enabled', e.target.checked)}
            />
            <span className="track" />
            <span className="knob" />
          </label>
        </div>
        {draft.bank_enabled && (
          <div className="field">
            <label>Bank details (shown to buyer)</label>
            <textarea
              value={draft.bank_details}
              onChange={(e) => update('bank_details', e.target.value)}
              placeholder={`Bank: Chase\nAccount name: Your Store LLC\nIBAN / Account: GB29 NWBK …\nSWIFT / BIC: CHASUS33`}
              style={{ minHeight: 120 }}
            />
          </div>
        )}
      </div>

      <div className="panel">
        <div className="field" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14 }}>Cash on Delivery</div>
            <p className="muted" style={{ fontSize: 11.5 }}>
              Buyer pays cash when the order arrives. Only useful for physical goods.
            </p>
          </div>
          <label className="switch">
            <input
              type="checkbox"
              checked={draft.cod_enabled}
              onChange={(e) => update('cod_enabled', e.target.checked)}
            />
            <span className="track" />
            <span className="knob" />
          </label>
        </div>
      </div>

      <div className="panel">
        <div className="field" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14 }}>Crypto</div>
            <p className="muted" style={{ fontSize: 11.5 }}>
              Buyer sends to one of your wallets and submits a tx hash. Leave an address blank to hide it.
            </p>
          </div>
          <label className="switch">
            <input
              type="checkbox"
              checked={draft.crypto_enabled}
              onChange={(e) => update('crypto_enabled', e.target.checked)}
            />
            <span className="track" />
            <span className="knob" />
          </label>
        </div>
        {draft.crypto_enabled && (
          <>
            <div className="field">
              <label>BTC address</label>
              <input type="text" value={draft.crypto_btc} onChange={(e) => update('crypto_btc', e.target.value)} placeholder="bc1q…" />
            </div>
            <div className="field">
              <label>ETH address</label>
              <input type="text" value={draft.crypto_eth} onChange={(e) => update('crypto_eth', e.target.value)} placeholder="0x…" />
            </div>
            <div className="field">
              <label>USDT TRC20 address</label>
              <input type="text" value={draft.crypto_usdt_trc20} onChange={(e) => update('crypto_usdt_trc20', e.target.value)} placeholder="T…" />
            </div>
            <div className="field">
              <label>TON address</label>
              <input type="text" value={draft.crypto_ton} onChange={(e) => update('crypto_ton', e.target.value)} placeholder="UQ…" />
            </div>
          </>
        )}
      </div>

      <button
        type="button"
        className="btn-primary"
        disabled={saving === 'payments'}
        onClick={() =>
          save(
            [
              'stars_enabled',
              'stars_rate',
              'stripe_enabled',
              'bank_enabled',
              'bank_details',
              'cod_enabled',
              'crypto_enabled',
              'crypto_btc',
              'crypto_eth',
              'crypto_usdt_trc20',
              'crypto_ton',
            ],
            'payments',
            'Payment settings saved',
          )
        }
      >
        {saving === 'payments' ? 'Saving…' : 'Save payment settings'}
      </button>

      <span className="section-title" style={{ display: 'block', marginTop: 26 }}>Product perks</span>
      <div className="panel">
        <div className="field" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <label style={{ marginBottom: 0 }}>Show perks on product page</label>
          <label className="switch">
            <input
              type="checkbox"
              checked={draft.perks_enabled}
              onChange={(e) => update('perks_enabled', e.target.checked)}
            />
            <span className="track" />
            <span className="knob" />
          </label>
        </div>
        <p className="muted" style={{ fontSize: 11.5, marginBottom: 10 }}>
          These three bullets appear on every product page. Leave a text field blank to hide that line.
        </p>
        {draft.perks_enabled && (
          <>
            {([1, 2, 3] as const).map((n) => {
              const textKey = `perk_${n}_text` as const;
              const iconKey = `perk_${n}_icon` as const;
              return (
                <div
                  key={n}
                  style={{
                    border: '1px solid var(--line)',
                    borderRadius: 12,
                    padding: 12,
                    marginBottom: 10,
                  }}
                >
                  <div className="field" style={{ marginBottom: 8 }}>
                    <label>Perk {n} text</label>
                    <input
                      type="text"
                      value={draft[textKey]}
                      onChange={(e) => update(textKey, e.target.value)}
                      placeholder={n === 1 ? 'Fast delivery' : n === 2 ? '30-day easy returns' : 'Secure checkout'}
                    />
                  </div>
                  <div className="field" style={{ marginBottom: 0 }}>
                    <label>Icon</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {PERK_ICON_OPTIONS.map((ic) => {
                        const selected = draft[iconKey] === ic;
                        return (
                          <button
                            key={ic}
                            type="button"
                            onClick={() => update(iconKey, ic)}
                            title={ic}
                            style={{
                              width: 40,
                              height: 40,
                              borderRadius: 10,
                              border: selected ? '2px solid var(--ink)' : '1px solid var(--line)',
                              background: 'var(--surface)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'var(--ink)',
                              padding: 0,
                              cursor: 'pointer',
                            }}
                          >
                            {perkIconPreview(ic)}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </>
        )}
        <button
          type="button"
          className="btn-primary"
          disabled={saving === 'perks'}
          onClick={() =>
            save(
              [
                'perks_enabled',
                'perk_1_text', 'perk_1_icon',
                'perk_2_text', 'perk_2_icon',
                'perk_3_text', 'perk_3_icon',
              ],
              'perks',
              'Perks saved',
            )
          }
        >
          {saving === 'perks' ? 'Saving…' : 'Save perks'}
        </button>
      </div>

      <span className="section-title" style={{ display: 'block', marginTop: 26 }}>Home banner</span>
      <div className="panel">
        <div className="field" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <label style={{ marginBottom: 0 }}>Show banner</label>
          <label className="switch">
            <input
              type="checkbox"
              checked={draft.banner_enabled}
              onChange={(e) => update('banner_enabled', e.target.checked)}
            />
            <span className="track" />
            <span className="knob" />
          </label>
        </div>
        <div className="field"><label>Eyebrow</label><input type="text" value={draft.banner_eyebrow} onChange={(e) => update('banner_eyebrow', e.target.value)} /></div>
        <div className="field"><label>Title</label><input type="text" value={draft.banner_title} onChange={(e) => update('banner_title', e.target.value)} /></div>
        <div className="field"><label>Subtitle</label><input type="text" value={draft.banner_subtitle} onChange={(e) => update('banner_subtitle', e.target.value)} /></div>
        <div className="field"><label>CTA label</label><input type="text" value={draft.banner_cta} onChange={(e) => update('banner_cta', e.target.value)} /></div>
        <div className="field">
          <label>CTA action</label>
          <select
            value={draft.banner_cta_action}
            onChange={(e) => update('banner_cta_action', e.target.value as Draft['banner_cta_action'])}
          >
            <option value="all">Show all products</option>
            <option value="search">Focus search field</option>
            <option value="category">Show all products (category v2)</option>
          </select>
        </div>
        <div className="field">
          <label>Banner color</label>
          <div className="swatches">
            {(['mint', 'blue', 'pink', 'yellow', 'neutral'] as const).map((c) => {
              const bg =
                c === 'mint' ? '#D1FAE5'
                : c === 'blue' ? '#E0F2FE'
                : c === 'pink' ? '#FCE7F3'
                : c === 'yellow' ? '#FEF3C7'
                : '#EEEFF1';
              return (
                <label
                  key={c}
                  className={`swatch${draft.banner_color === c ? ' sel' : ''}`}
                  style={{ background: bg }}
                >
                  <input
                    type="radio"
                    name="banner-color"
                    checked={draft.banner_color === c}
                    onChange={() => update('banner_color', c)}
                  />
                </label>
              );
            })}
          </div>
        </div>
        <div className="field">
          <label>Live preview</label>
          <Banner
            settings={{
              banner_color: draft.banner_color,
              banner_eyebrow: draft.banner_eyebrow,
              banner_title: draft.banner_title,
              banner_subtitle: draft.banner_subtitle,
              banner_cta: draft.banner_cta,
            }}
            onCta={() => undefined}
          />
        </div>
        <button
          type="button"
          className="btn-primary"
          disabled={saving === 'banner'}
          onClick={() =>
            save(
              ['banner_enabled', 'banner_eyebrow', 'banner_title', 'banner_subtitle', 'banner_cta', 'banner_cta_action', 'banner_color'],
              'banner',
              'Banner saved',
            )
          }
        >
          {saving === 'banner' ? 'Saving…' : 'Save banner'}
        </button>
      </div>
    </>
  );
                                      }
