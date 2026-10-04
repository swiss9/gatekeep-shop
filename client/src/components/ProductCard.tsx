import { formatMoney, type ProductWithCategory } from '../lib/api';
import { PastelThumb } from './PastelThumb';

type Props = {
  product: ProductWithCategory;
  currency: string;
  onOpen: () => void;
};

export function ProductCard({ product, currency, onOpen }: Props) {
  return (
    <article className="card" onClick={onOpen}>
      <PastelThumb product={product} className="thumb" />
      <div className="card-info">
        <div className="p-cat">{product.category_name}</div>
        <div className="p-name">{product.name}</div>
        <div className="p-price">{formatMoney(product.price, currency)}</div>
      </div>
    </article>
  );
}
