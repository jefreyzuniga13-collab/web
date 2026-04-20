import { useEffect, useState } from "react";
import SavedCards from "./SavedCards";
import type { TarjetaModelInterface } from "@/Interfaces/Ecommerce/TarjetaInterface";
import { SAVE_CARD_AFTER_PAYMENT_KEY } from "@/Utils/ECommerce/keys";
import '@/Styles/Ecommerce/Payment/CardPaymentSection.css';

interface Props {
  onSelectCard?: (card: TarjetaModelInterface | null) => void;
  ecommerceUserId: number;
}

export default function CardPaymentSection({
  ecommerceUserId,
  onSelectCard,
}: Props) {
  const [selectedSavedCard, setSelectedSavedCard] = useState<TarjetaModelInterface | null>(null);
  const [saveCard, setSaveCard] = useState<boolean>(false);

  useEffect(() => {
    const current = sessionStorage.getItem(SAVE_CARD_AFTER_PAYMENT_KEY);
    setSaveCard(current === "S");
  }, []);

  useEffect(() => {
    sessionStorage.setItem(SAVE_CARD_AFTER_PAYMENT_KEY, saveCard ? "S" : "N");
  }, [saveCard]);

  const handleSelectCard = (card: TarjetaModelInterface | null) => {
    setSelectedSavedCard(card);
    onSelectCard?.(card);
  };

  const handleChangeSaveCard = (checked: boolean) => {
    if (selectedSavedCard) {
      setSaveCard(false);
      sessionStorage.setItem(SAVE_CARD_AFTER_PAYMENT_KEY, "N");
      return;
    }

    setSaveCard(checked);
    sessionStorage.setItem(SAVE_CARD_AFTER_PAYMENT_KEY, checked ? "S" : "N");
  };

  return (
    <div className="checkout-section--card">
      <SavedCards
        ecommerceUserId={ecommerceUserId}
        onSelectCard={handleSelectCard}
      />

      <div className="checkout-card-save-option">
        <label className="checkout-card-save-option__label">
          <input
            type="checkbox"
            checked={selectedSavedCard ? false : saveCard}
            onChange={(e) => handleChangeSaveCard(e.target.checked)}
            disabled={!!selectedSavedCard}
          />
          <span>Guardar tarjeta para futuras compras</span>
        </label>
      </div>
    </div>
  );
}