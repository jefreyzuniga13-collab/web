import type { ProductoPCGInterface } from "@/Interfaces/Chat/ProductPCGInterface";
import "@/Styles/Chat/DetailPanel/ProductPCGTab.css";
import Tooltip from "@mui/material/Tooltip";
import noimageavailable from '@/assets/noimageavailable.webp'

interface Props {
  prod: ProductoPCGInterface;
  onClick?: (product: ProductoPCGInterface) => void;
}

export const ProductPCGTab = ({ prod, onClick }: Props) => {
  const handleClick = () => {
    if (onClick) onClick(prod);
  };

  return (
    <div className="productPCG-row" onClick={handleClick}>
      <div className="productPCG-row__image">
        <img
          src={prod.imagen != null? prod.imagen : noimageavailable}
          // alt="product image"
          aria-label="product image"
          className="product-image"
        />
      </div>

      <span className="product-row__description">
        <Tooltip title={prod.descripcion}>
          <span>{prod.descripcion ?? ""}</span>
        </Tooltip>
      </span>

      <span className="product-row__price">
        <Tooltip title={prod.contenido}>
          <span className="product-row__price__value">{prod.contenido ?? ""}</span>
        </Tooltip>
      </span>
    </div>
  );
};