import { useMemo, useState } from "react";
import { toast } from "react-toastify";
import Input from "@/Components/Common/Input";
import Select from "@/Components/Common/Select";
import { Label } from "@/Components/Common/Label";
import ManualCardPaymentSection from "@/Components/ECommerce/Payment/ManualCardPaymentSection";
import type { Currencyto } from "@/Interfaces/Ecommerce/InvoiceOrderInterface";
import type { ObtenerDivisaPagosTipoRes } from "@/Interfaces/Ecommerce/FacturaTempo";
import type { PagoSeleccionado } from "@/Interfaces/Ecommerce/MultiPagoTypes";
import type { CheckoutPaymentMethod,  ManualCardFormState} from "@/Interfaces/Ecommerce/PaymentCheckoutInterface";
import { initialManualCardFormState } from "@/Interfaces/Ecommerce/PaymentCheckoutInterface";
import { filtrarFormasPagoMultipago, obtenerTipoPagoDesdeMoneda, totalPagado, totalPendiente} from "@/Utils/ECommerce/pagoFacturaUtils";
import { formatearDecimales } from "@/Utils/calcularIVA";
import { round2, safeStr } from "@/Utils/ECommerce/formatters";
import "@/Styles/Ecommerce/Payment/MultiPagoSection.css";

type Props = {
  /**
   * Formas de pago disponibles desde PCG.
   */
  currency: Currencyto[];

  /**
   * Total final que debe cubrir el multipago.
   */
  totalPagar: number;

  /**
   * Pagos agregados actualmente.
   */
  pagos: PagoSeleccionado[];

  /**
   * Actualiza la lista de pagos.
   */
  setPagos: React.Dispatch<React.SetStateAction<PagoSeleccionado[]>>;

  /**
   * Carga bancos o tipos de pago según la forma seleccionada.
   */
  cargarDivisas: (item: Currencyto) => Promise<ObtenerDivisaPagosTipoRes[]>;

  /**
   * Bloquea los controles cuando hay proceso activo.
   */
  disabled?: boolean;
};

const crearIdPago = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

const getCurrencyKey = (item: Currencyto, index: number) => {
  return `${safeStr(item.codPago)}-${safeStr(item.descripcion_Pago)}-${index}`;
};

const getMetodoLabel = (metodo: CheckoutPaymentMethod) => {
  if (metodo === "cash") return "Efectivo";
  if (metodo === "transfer") return "Transferencia";
  if (metodo === "manualCard") return "Tarjeta manual";

  return "Tarjeta en línea";
};

const getPagoTitulo = (pago: PagoSeleccionado) => {
  if (pago.metodo === "cash") {
    return safeStr(pago.moneda?.descripcion_Pago) || "Efectivo";
  }

  if (pago.metodo === "transfer") {
    return safeStr(pago.divisa?.nombre) || "Transferencia";
  }

  if (pago.metodo === "manualCard") {
    return safeStr(pago.divisa?.nombre) || "Tarjeta manual";
  }

  return "Pago";
};

export default function MultiPagoSection({
  currency,
  totalPagar,
  pagos,
  setPagos,
  cargarDivisas,
  disabled = false,
}: Props) {
  const [selectedCurrency, setSelectedCurrency] = useState<Currencyto | null>(
    null,
  );
  const [method, setMethod] = useState<CheckoutPaymentMethod | null>(null);
  const [monto, setMonto] = useState<number>(0);
  const [referencia, setReferencia] = useState("");
  const [divisaOpts, setDivisaOpts] = useState<ObtenerDivisaPagosTipoRes[]>([]);

  const [divisaSelected, setDivisaSelected] =
    useState<ObtenerDivisaPagosTipoRes | null>(null);

  const [divisaLoading, setDivisaLoading] = useState(false);

  const [manualCardData, setManualCardData] = useState<ManualCardFormState>(
    initialManualCardFormState,
  );

  const formasPagoMultipago = useMemo(() => {
    return filtrarFormasPagoMultipago(currency);
  }, [currency]);

  const efectivoAgregado = useMemo(() => {
    return pagos.some((pago) => pago.metodo === "cash");
  }, [pagos]);

  /**
   * Después de agregar efectivo se ocultan todas las opciones de efectivo.
   */
  const formasPagoDisponibles = useMemo(() => {
    return formasPagoMultipago.filter((item) => {
      return !(
        efectivoAgregado &&
        obtenerTipoPagoDesdeMoneda(item) === "cash"
      );
    });
  }, [efectivoAgregado, formasPagoMultipago]);

  const pagado = useMemo(() => {
    return totalPagado(pagos);
  }, [pagos]);

  const pendiente = useMemo(() => {
    return totalPendiente(pagos, totalPagar);
  }, [pagos, totalPagar]);

  const vuelto = useMemo(() => {
    return Math.max(0, pagado - Number(totalPagar ?? 0));
  }, [pagado, totalPagar]);

  const requiereDivisa = method === "transfer" || method === "manualCard";

  const resetFormulario = () => {
    setSelectedCurrency(null);
    setMethod(null);
    setMonto(0);
    setReferencia("");
    setDivisaOpts([]);
    setDivisaSelected(null);
    setManualCardData(initialManualCardFormState);
  };

  const handleSelectCurrency = async (value: string) => {
    const selected = formasPagoDisponibles.find(
      (item, index) => getCurrencyKey(item, index) === value,
    );

    if (!selected) {
      resetFormulario();
      return;
    }

    const nextMethod = obtenerTipoPagoDesdeMoneda(selected);

    setSelectedCurrency(selected);
    setMethod(nextMethod);
    setReferencia("");
    setDivisaOpts([]);
    setDivisaSelected(null);
    setManualCardData(initialManualCardFormState);

    const pendienteActual = totalPendiente(pagos, totalPagar);

    setMonto(pendienteActual > 0 ? round2(pendienteActual) : 0);

    if (nextMethod === "transfer" || nextMethod === "manualCard") {
      setDivisaLoading(true);

      try {
        const opts = await cargarDivisas(selected);

        setDivisaOpts(opts);
        setDivisaSelected(opts.length > 0 ? opts[0] : null);
      } catch {
        setDivisaOpts([]);
        setDivisaSelected(null);
        toast.error("No se pudieron cargar las opciones de pago.");
      } finally {
        setDivisaLoading(false);
      }
    }
  };

  const validarPagoActual = () => {
    if (!selectedCurrency || !method) {
      return "Selecciona una forma de pago.";
    }

    if (pendiente <= 0) {
      return "El total de la factura ya está cubierto.";
    }

    if (method === "gatewayCard") {
      return "La tarjeta en línea no está disponible dentro de multipago.";
    }

    if (method === "cash" && efectivoAgregado) {
      return "Solamente puede agregar un pago en efectivo.";
    }

    const montoActual = Number(monto);

    if (!Number.isFinite(montoActual) || montoActual <= 0) {
      return "El monto debe ser mayor a 0.";
    }

    /**
     * Efectivo puede superar el pendiente para generar vuelto.
     * Los demás métodos no pueden excederlo.
     */
    if (method !== "cash" && montoActual > pendiente) {
      return "El monto no puede superar el pendiente.";
    }

    if (requiereDivisa && !divisaSelected) {
      return "Selecciona banco o tipo de pago.";
    }

    if (method === "transfer" && !safeStr(referencia)) {
      return "La referencia de transferencia es requerida.";
    }

    if (method === "manualCard") {
      if (!safeStr(manualCardData.tarjetahabiente)) {
        return "El tarjetahabiente es requerido.";
      }

      if (safeStr(manualCardData.ultDigito).length !== 4) {
        return "Los últimos 4 dígitos son requeridos.";
      }

      if (!safeStr(manualCardData.fechaVence)) {
        return "La fecha de vencimiento es requerida.";
      }
    }

    return null;
  };

  const handleAgregarPago = () => {
    const error = validarPagoActual();

    if (error) {
      toast.error(error);
      return;
    }

    const nuevoPago: PagoSeleccionado = {
      id: crearIdPago(),
      metodo: method!,
      moneda: selectedCurrency,
      divisa: requiereDivisa ? divisaSelected : null,
      monto: Number(monto),
      referencia: method === "transfer" ? referencia.trim() : "",
      tarjetaManual: method === "manualCard" ? manualCardData : undefined,
    };

    setPagos((prev) => [...prev, nuevoPago]);
    resetFormulario();
  };

  const handleQuitarPago = (id: string) => {
    setPagos((prev) => prev.filter((pago) => pago.id !== id));
  };

  const montoActual = Number(monto);

  const puedeAgregar =
    !disabled &&
    pendiente > 0 &&
    !!selectedCurrency &&
    !!method &&
    Number.isFinite(montoActual) &&
    montoActual > 0 &&
    (method === "cash" || montoActual <= pendiente) &&
    (method !== "cash" || !efectivoAgregado) &&
    (!requiereDivisa || !!divisaSelected);

  return (
    <div className="multipago-section">
      <div className="checkout-summary multipago-summary">
        <div className="checkout-summary__subtitle">
          <p className="checkout-summary__p">Total factura:</p>
          <strong className="checkout-summary__strong">
            C$ {formatearDecimales(totalPagar)}
          </strong>
        </div>

        <div className="checkout-summary__subtitle">
          <p className="checkout-summary__p">Total recibido:</p>
          <strong className="checkout-summary__strong">
            C$ {formatearDecimales(pagado)}
          </strong>
        </div>

        <div className="checkout-summary__subtitle">
          <p className="checkout-summary__p">Pendiente:</p>
          <strong className="checkout-summary__strong__pendiente">
            C$ {formatearDecimales(pendiente)}
          </strong>
        </div>

        {vuelto > 0 && (
          <div className="checkout-summary__subtitle">
            <p className="checkout-summary__p">Vuelto:</p>
            <strong className="checkout-summary__strong">
              C$ {formatearDecimales(vuelto)}
            </strong>
          </div>
        )}
      </div>

      <div className="multipago-form">
        <div className="checkout-field checkout-field--full">
          <Label htmlFor="multipagoCurrency">Forma de pago</Label>

          <Select
            id="multipagoCurrency"
            value={
              selectedCurrency
                ? (formasPagoDisponibles
                    .map((item, index) => ({
                      item,
                      key: getCurrencyKey(item, index),
                    }))
                    .find(({ item }) => item === selectedCurrency)?.key ?? "")
                : ""
            }
            disabled={disabled || pendiente <= 0}
            placeholder="Seleccionar"
            onChange={(event) => {
              void handleSelectCurrency(event.target.value);
            }}
            options={formasPagoDisponibles.map((item, index) => ({
              value: getCurrencyKey(item, index),
              label: safeStr(item.descripcion_Pago)
            }))}
          />
        </div>

        {method && (
          <div className="multipago-selected-method">
            <span>Método seleccionado</span>
            <strong>{getMetodoLabel(method)}</strong>
          </div>
        )}

        {requiereDivisa && (
          <div className="checkout-field checkout-field--full">
            <Label htmlFor="multipagoDivisa">Banco o tipo de pago</Label>

            <Select
              id="multipagoDivisa"
              value={safeStr(divisaSelected?.codigo)}
              disabled={disabled || divisaLoading}
              placeholder={divisaLoading ? "Cargando..." : "Seleccionar"}
              onChange={(event) => {
                const code = safeStr(event.target.value);

                const found =
                  divisaOpts.find((item) => safeStr(item.codigo) === code) ??
                  null;

                setDivisaSelected(found);
              }}
              options={divisaOpts.map((item) => ({
                value: safeStr(item.codigo),
                label: safeStr(item.nombre)
              }))}
            />
          </div>
        )}

        {method && (
          <div className="checkout-field checkout-field--full">
            <Label htmlFor="multipagoMonto">Monto</Label>

            <Input
              id="multipagoMonto"
              type="number"
              min={0}
              max={method === "cash" ? undefined : pendiente}
              value={monto}
              disabled={disabled || pendiente <= 0}
              onChange={(event) => {
                const value =
                  event.target.value === "" ? 0 : Number(event.target.value);

                setMonto(value);
              }}
            />

            {method === "cash" && (
              <small className="multipago-cash-help">
                Puede superar el pendiente; el excedente será el vuelto.
              </small>
            )}
          </div>
        )}

        {method === "transfer" && (
          <div className="checkout-field checkout-field--full">
            <Label htmlFor="multipagoReferencia">Referencia</Label>

            <Input
              id="multipagoReferencia"
              type="text"
              value={referencia}
              disabled={disabled}
              onChange={(event) => setReferencia(event.target.value)}
              placeholder="Referencia de transferencia"
            />
          </div>
        )}

        {method === "manualCard" && (
          <ManualCardPaymentSection
            value={manualCardData}
            onChange={setManualCardData}
          />
        )}

        <button
          type="button"
          className="multipago-add-btn"
          disabled={!puedeAgregar}
          onClick={handleAgregarPago}
        >
          Agregar pago
        </button>
      </div>

      {pagos.length > 0 && (
        <div className="multipago-list">
          <p className="multipago-list__title">Pagos agregados</p>

          {pagos.map((pago) => (
            <div key={pago.id} className="multipago-card">
              <div className="multipago-card__content">
                <div>
                  <strong className="multipago-card__title">
                    {getPagoTitulo(pago)}
                  </strong>

                  <span className="multipago-card__text">
                    {getMetodoLabel(pago.metodo)} - C${" "}
                    {formatearDecimales(pago.monto)}
                  </span>

                  {pago.metodo === "transfer" && (
                    <span className="multipago-card__text">
                      Referencia: {safeStr(pago.referencia)}
                    </span>
                  )}

                  {pago.metodo === "manualCard" && (
                    <span className="multipago-card__text">
                      Tarjeta: **** {safeStr(pago.tarjetaManual?.ultDigito)}
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  className="multipago-remove-btn"
                  disabled={disabled}
                  onClick={() => handleQuitarPago(pago.id)}
                >
                  Quitar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
