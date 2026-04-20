import { useEffect, useMemo, useState, type JSX } from "react";
import { FaTrash } from "react-icons/fa";
import { safeStr } from "@/Utils/ECommerce/formatters";
import { useTarjetaPCG } from "@/Hooks/Ecommerce/payment/useTarjeta";
import type { TarjetaModelInterface } from "@/Interfaces/Ecommerce/TarjetaInterface";
import '@/Styles/Ecommerce/Payment/SavedCards.css';
import cardvisa from '@/assets/img/cardvisa.png';
import cardmc from '@/assets/img/cardmc.png';
import cardamex from '@/assets/img/cardamex.png';

function cardBrandLabel(card: TarjetaModelInterface): JSX.Element {
  const brand = safeStr(card.marca).toLowerCase();
  const imgStyle = { width: "24px", marginRight: "8px", verticalAlign: "middle" as const };

  if (brand.includes("visa")) {
    return (
      <span>
        <img src={cardvisa} alt="Visa" style={imgStyle} />
      </span>
    );
  }

  if (brand.includes("master")) {
    return (
      <span>
        <img src={cardmc} alt="Mastercard" style={imgStyle} />
      </span>
    );
  }

  if (brand.includes("amex")) {
    return (
      <span>
        <img src={cardamex} alt="American Express" style={imgStyle} />
      </span>
    );
  }

  return <span>{safeStr(card.marca) || "Tarjeta"}</span>;
}

interface Props {
  ecommerceUserId: number;
  onSelectCard?: (card: TarjetaModelInterface | null) => void;
}

export default function SavedCards({ ecommerceUserId, onSelectCard }: Props) {
  const {
    tarjetas,
    loadingTarjetas,
    deletingCard,
    selectedCardId,
    setSelectedCard,
    clearSelectedCard,
    DeleteCard,
  } = useTarjetaPCG({
    idUsuario: ecommerceUserId,
    enabled: ecommerceUserId > 0,
  });

  const [localSelectedId, setLocalSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (selectedCardId) {
      const id = String(selectedCardId);
      setLocalSelectedId(id);
      const selected = tarjetas.find((x) => String(x.idTarjeta) === id) ?? null;
      onSelectCard?.(selected);
      return;
    }

    setLocalSelectedId(null);
    onSelectCard?.(null);
  }, [tarjetas, selectedCardId, onSelectCard]);

  const hasCards = useMemo(() => tarjetas.length > 0, [tarjetas]);

  const handleSelect = (card: TarjetaModelInterface) => {
    if (card.idTarjeta == null) return;

    const id = String(card.idTarjeta);

    if (localSelectedId === id) {
      setLocalSelectedId(null);
      clearSelectedCard();
      onSelectCard?.(null);
      return;
    }

    setLocalSelectedId(id);
    setSelectedCard(id);
    onSelectCard?.(card);
  };

  const handleDelete = async (card: TarjetaModelInterface) => {
    if (card.idTarjeta == null) return;

    await DeleteCard(ecommerceUserId, card.idTarjeta);

    if (localSelectedId === String(card.idTarjeta)) {
      setLocalSelectedId(null);
      clearSelectedCard();
      onSelectCard?.(null);
    }
  };

  if (loadingTarjetas) {
    return (
      <div className="checkout-saved-cards">
        <div className="checkout-saved-cards__empty">Cargando tarjetas...</div>
      </div>
    );
  }

  if (!hasCards) {
    return (
      <div className="checkout-saved-cards">
        <div className="checkout-saved-cards__empty">
          No tienes tarjetas guardadas aún.
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-saved-cards">
      <p className="checkout-saved-cards__title">Tarjetas guardadas</p>

      {tarjetas.map((card) => {
        const id = card.idTarjeta != null ? String(card.idTarjeta) : "";
        const active = !!id && localSelectedId === id;

        return (
          <div
            key={id || `${safeStr(card.panToken)}-${safeStr(card.ultimos4)}`}
            className={`checkout-saved-card ${active ? "checkout-saved-card--active" : ""}`}
            onClick={() => handleSelect(card)}
          >
            <div className="checkout-saved-card__info">
              <div className="checkout-saved-card__top">
                <span className="checkout-saved-card__brand">
                  {cardBrandLabel(card)}
                </span>
              </div>

              <span className="checkout-saved-card__number">
                **** {safeStr(card.ultimos4)}
              </span>

              <span className="checkout-saved-card__owner">
                {safeStr(card.titular) || "Titular no disponible"}
              </span>
            </div>

            <div className="checkout-saved-card__actions">
              <button
                type="button"
                className="checkout-saved-card__btn"
                onClick={(e) => {
                  e.stopPropagation();
                  void handleDelete(card);
                }}
                disabled={deletingCard}
              >
                <FaTrash fontSize={12} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}