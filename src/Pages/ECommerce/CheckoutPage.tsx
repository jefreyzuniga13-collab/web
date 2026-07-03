/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useDispatch, useSelector, type TypedUseSelectorHook } from "react-redux";
import useInvoiceOrder from "@/Hooks/Ecommerce/payment/useInvoiceOrder";
import { useClientLocation } from "@/Hooks/Ecommerce/payment/useClientLocation";
import useLogCart from "@/Hooks/Crm/useLogCard";
import { useIniciarPago } from "@/Hooks/Ecommerce/payment/useIniciarPago";
import { usePayWithToken } from "@/Hooks/Ecommerce/payment/usePayWithToken";
import { procesarCheckoutExitoso } from "@/Utils/ECommerce/procesarCheckoutExitoso";
import { normalizeNumber, round2, safeStr } from "@/Utils/ECommerce/formatters";
import {CHECKOUT_INVOICE_KEY, CHECKOUT_PAYLOAD_KEY, ECOMMERCEUSERID_KEY} from "@/Utils/ECommerce/keys";
import type {ClientLocationDto, Coords, LocationMode, TotalesPantallaReqDTO} from "@/Interfaces/Ecommerce/ClientLocationInterface";
import type {Currencyto, CheckoutStep, PaymentMethod, BillingFormState} from "@/Interfaces/Ecommerce/InvoiceOrderInterface";
import type { NearestBranchRequestDto } from "@/Interfaces/Ecommerce/BranchInterfaces";
import type {FacturaTempo, PagoGenerico, ObtenerDivisaPagosTipoReq, ObtenerDivisaPagosTipoRes} from "@/Interfaces/Ecommerce/FacturaTempo";
import type { FaloteRequestDto } from "@/Interfaces/Crm/CartPCGInterface";
import { selectCarPCG, getProductFromCarAsync } from "@/Context/Slices/Ecommerce/cartSlice";
import type { AppDispatch, RootState } from "@/Context";
import { CartService } from "@/Services/Ecommerce/CarPCGService";
import { validateBillingForm, validateLocation } from "@/Utils/validation";
import { loadFacturaTempo } from "@/Utils/facturaTempoStorage";
import { PaymentMethodComponent } from "@/Components/ECommerce/Payment/PaymentMethodComponent";
import { CurrencySection } from "@/Components/ECommerce/Tabs/CurrencySection";
import { LocationSection } from "@/Components/ECommerce/Payment/LocationSection";
import type { LogCartResponseDto, Payload } from "@/Interfaces/Crm/LogCartInterface";
import type {PowertranzPayWithTokenRequestDto} from "@/Interfaces/Ecommerce/powertranzInterface";
import type { TarjetaModelInterface } from "@/Interfaces/Ecommerce/TarjetaInterface";
import { useCompleteFpi } from "@/Hooks/Ecommerce/payment/useCompleteFpi";
import { FechaManagua } from "@/Utils/FechaManagua";
import { calculateDistance, obtenerBrowserInfo } from "@/Utils/ECommerce/utils";
import "@/Styles/Ecommerce/Payment/CheckoutPage.css";

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

type CheckoutPaymentMethod = PaymentMethod | "manualCard";

type ManualCardFormState = {
  tarjeta: string;
  ultDigito: string;
  tarjetahabiente: string;
  autorizacion: string;
  termId: string;
  afiliado: string;
  fechaVence: string;
};

type BranchLike = {
  codSucursal: string | number;
  sucursal?: string | null;
  latitud: number | string;
  longitud: number | string;
};

const CheckoutPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const payload = location.state?.payload as Payload;

  const [ecommerceUserId, setEcommerceUserId] = useState<number>(0);
  const [orderId, setOrderId] = useState<number>(0);
  const [userFullName, setUserFullName] = useState<string>("");
  const [selectedSavedCard, setSelectedSavedCard] = useState<TarjetaModelInterface | null>(null);

  const [step, setStep] = useState<CheckoutStep | string>("");
  const [method, setMethod] = useState<CheckoutPaymentMethod>("card");

  const [billingForm, setBillingForm] = useState<BillingFormState>({
    firstName: "",
    lastName: "",
    email: "",
    country: "NI",
    city: "",
    address: "",
    addressName: ""
  });

  const [selectedCoords, setSelectedCoords] = useState<Coords | null>(null);
  const [selectedCurrency, setSelectedCurrency] = useState<Currencyto | null>(null);

  const [cashAmount, setCashAmount] = useState<number>(1);
  const [tip, setTip] = useState<number>(0);

  const [transferAmount, setTransferAmount] = useState<number>(0);
  const [transferRef, setTransferRef] = useState<string>("");

  const [manualCardData, setManualCardData] = useState<ManualCardFormState>({
    tarjeta: "",
    ultDigito: "",
    tarjetahabiente: "",
    autorizacion: "",
    termId: "",
    afiliado: "",
    fechaVence: ""
  });

  const [locationMode, setLocationMode] = useState<LocationMode>("new");
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);

  const [transpCost, setTranspCost] = useState<number>(0);
  const [nearestBranch, setNearestBranch] = useState<any | null>(null);
  const [distanceKm, setDistanceKm] = useState<number>(0);

  const [payNowLock, setPayNowLock] = useState<boolean>(false);
  const [payNowCooldown, setPayNowCooldown] = useState<number>(0);

  const [lockedBranchCode, setLockedBranchCode] = useState<string>("");
  const [lastPreviewKey, setLastPreviewKey] = useState<string>("");

  const [lockedAddressId, setLockedAddressId] = useState<number | null>(null);
  const [lockedTranspCost, setLockedTranspCost] = useState<number | null>(null);
  const [locationLockedByLog, setLocationLockedByLog] = useState<boolean>(false);

  const [divisaOpts, setDivisaOpts] = useState<ObtenerDivisaPagosTipoRes[]>([]);
  const [divisaSelected, setDivisaSelected] = useState<ObtenerDivisaPagosTipoRes | null>(null);
  const [divisaLoading, setDivisaLoading] = useState<boolean>(false);
  const [existingLog, setExistingLog] = useState<LogCartResponseDto | null>(null);

  const dispatch = useAppDispatch();
  const carPCG = useAppSelector(selectCarPCG);

  const cartTotal = useMemo(() => normalizeNumber(carPCG?.[0]?.total), [carPCG]);

const getTransporteFactura = () => {
  const stateTransp = normalizeNumber(transpCost);
  const logTransp = normalizeNumber(existingLog?.transCost);

  // Si el cliente seleccionó en mapa, este es el correcto.
  if (stateTransp > 0) return stateTransp;

  // Solo usar el del log si ya venía guardado.
  if (logTransp > 0) return logTransp;

  return 0;
};

const totalPagar = useMemo(() => {
  const totalBase = normalizeNumber(cartTotal ?? 0);
  const transporte = getTransporteFactura();
  const propina = normalizeNumber(tip);

  return round2(totalBase + transporte + propina);
}, [cartTotal, transpCost, existingLog?.transCost, tip]);

  const { mutateAsync: completeFpiAsync } = useCompleteFpi();

  const {
    currency,
    GetCurrencyAsync,
    GetTransportationCostAsync,
    GetNearestBranchAsync,
    loading: invoiceLoading,
    InsertaFacturaAsync
  } = useInvoiceOrder();

  const { fetchByContactId, UpdatedStatus } = useLogCart();
  const { CreateAsync: createLocationAsync, GetAsync, clientLocations } = useClientLocation();

  const iniciarPagoMutation = useIniciarPago({
    onSuccess: (response) => {
      navigate("/payment-hosted", {
        state: {
          payment: {
            redirectData: response.data.redirectData,
            spiToken: response.data.spiToken,
            orderId: "CRM" + response.data.orderId,
            mode: "hosted"
          }
        }
      });
    }
  });


  const goToStep = (nextStep: CheckoutStep | string) => {
  if (locationLockedByLog && nextStep === "location") {
    setStep("currency");
    return;
  }

  setStep(nextStep);
};

  const payWithTokenMutation = usePayWithToken({
    onSuccess: async (response) => {
      const data = response.data;
      const redirectData =
        data.riskManagement?.threeDSecure?.redirectData ??
        data.redirectData ??
        "";

      const authStatus = data.riskManagement?.threeDSecure?.authenticationStatus ?? "";
      const isoCode = data.isoResponseCode ?? "";
      const threeDsCompleted = authStatus === "Y" || isoCode === "3D0";

      // Nanega al 
      if (redirectData) {
        navigate("/payment-hosted", {
          state: {
            payment: {
              redirectData,
              spiToken: data.spiToken,
              orderId:  "CRM" + data.orderIdentifier,
              mode: "token-3ds"
            }
          }
        });
        return;
      }

      if (threeDsCompleted) {
        const completeRes = await completeFpiAsync({
          spiToken: data.spiToken ?? "",
          orderId:  "CRM" + data.orderIdentifier
        });

        const payment = completeRes.data.payment;

        const params = new URLSearchParams({
          approved: String(completeRes.data.approved ?? false),
          orderId: payment?.orderIdentifier ?? "",
          transactionIdentifier: payment?.transactionIdentifier ?? "",
          panToken: payment?.panToken ?? "",
          cardBrand: payment?.cardBrand ?? "",
          cardSuffix: payment?.cardSuffix ?? "",
          code: completeRes.data.isoResponseCode ?? "",
          message: completeRes.data.responseMessage ?? ""
        });

        navigate(`/payment-result?${params.toString()}`, { replace: true });
        return;
      }

      navigate("/unauthorized", { replace: true });
    }
  });

  useEffect(() => {
    if (!payload) {
      navigate("/unauthorized");
      return;
    }

    if (new Date(payload.expiresAtUtc).getTime() < Date.now()) {
      navigate("/unauthorized");
      return;
    }

    setEcommerceUserId(payload.ecommerceUserId);
    setOrderId(payload.orderId);
    setUserFullName(payload.fullName);
  }, [payload, navigate]);

  useEffect(() => {
    if (!payload?.contactId) return;

    let cancelled = false;

    const loadBranchLock = async () => {
      try {
        const log = await fetchByContactId(payload.contactId);

        if (cancelled) return;

        setExistingLog(log ?? null);

        const logBranch = String(log?.branch ?? "").trim();
        const logAddressId = Number(log?.addressId ?? 0);
        const logTrans = log?.transCost != null ? Number(log.transCost) : null;

        setLockedBranchCode(logBranch);
        setLockedAddressId(logAddressId > 0 ? logAddressId : null);
        setLockedTranspCost(logTrans != null && !Number.isNaN(logTrans) ? logTrans : null);

        const lockByPickup = log?.retiraSucursal === "S";
        const lockByAddress = logAddressId > 0 && !!logBranch;
        const mustLock = lockByPickup || lockByAddress;

        setLocationLockedByLog(mustLock);
      } catch {
        if (cancelled) return;
        setExistingLog(null);
        setLockedBranchCode("");
        setLockedAddressId(null);
        setLockedTranspCost(null);
        setLocationLockedByLog(false);
      }
    };

    void loadBranchLock();

    return () => {
      cancelled = true;
    };
  }, [payload?.contactId, fetchByContactId]);

  useEffect(() => {
    if (!payload?.contactId || !payload?.orderId || !ecommerceUserId) return;

    let cancelled = false;

    const boot = async () => {
      try {
        await dispatch(
          getProductFromCarAsync({ codCliente: payload.contactId, noPedido: payload.orderId })
        ).unwrap();

        if (cancelled) return;

        const log = await fetchByContactId(payload.contactId);

        if (cancelled) return;

        const isPickup = log?.retiraSucursal === "S";
        const logBranch = String(log?.branch ?? "").trim();
        const logAddressId = Number(log?.addressId ?? 0);
        const hasLockedAddress = logAddressId > 0 && !!logBranch;

        setExistingLog(log ?? null);
        setLockedBranchCode(logBranch);
        setLockedAddressId(hasLockedAddress ? logAddressId : null);

        const logTrans = log?.transCost != null ? Number(log.transCost) : null;

        setLockedTranspCost(
          isPickup ? 0 : logTrans != null && !Number.isNaN(logTrans) ? logTrans : null
        );

        setLocationLockedByLog(isPickup || hasLockedAddress);

        if (isPickup || hasLockedAddress) {
          setStep("currency");
        } else {
          setStep("location");
        }

        await GetCurrencyAsync();

        if (cancelled) return;

        await GetAsync(ecommerceUserId);
      } catch {
        if (cancelled) return;
        setExistingLog(null);
        setLocationLockedByLog(false);
        setStep("location");
      }
    };

    void boot();

    return () => {
      cancelled = true;
    };
  }, [
    payload?.contactId,
    payload?.orderId,
    ecommerceUserId,
    dispatch,
    fetchByContactId,
    GetCurrencyAsync,
    GetAsync
  ]);

  useEffect(() => {
  if (!locationLockedByLog) return;

  if (step === "location" || !step) {
    setStep("currency");
  }
}, [locationLockedByLog, step]);

  useEffect(() => {
    if (!userFullName) return;

    const parts = userFullName.split(" ");

    setBillingForm((prev) => ({
      ...prev,
      firstName: parts[0] ?? "",
      lastName: parts.slice(1).join(" ") ?? ""
    }));
  }, [userFullName]);

  const addressList = useMemo(
    () => (Array.isArray(clientLocations) ? clientLocations : clientLocations ? [clientLocations] : []),
    [clientLocations]
  );

  const selectedAddress = useMemo(() => {
    const id = selectedAddressId ?? lockedAddressId ?? null;
    return id ? addressList.find((a) => a.idDireccion === id) ?? null : null;
  }, [addressList, selectedAddressId, lockedAddressId]);

  useEffect(() => {
    if (!locationLockedByLog) return;
    if (!lockedAddressId) return;
    if (addressList.length === 0) return;

    const addr = addressList.find((a) => a.idDireccion === lockedAddressId) ?? null;
    if (!addr) return;

    setLocationMode("existing");
    setSelectedAddressId(Number(addr.idDireccion));
    setSelectedCoords({ latitud: Number(addr.latitud), longitud: Number(addr.longitud) });

    setBillingForm((prev) => ({
      ...prev,
      address: addr.descripcion ?? prev.address,
      addressName: addr.nombre ?? prev.addressName
    }));
  }, [locationLockedByLog, lockedAddressId, addressList]);

  useEffect(() => {
    if (addressList.length > 0 && !selectedAddressId && locationMode === "existing" && !locationLockedByLog) {
      const first = addressList[0];

      setSelectedAddressId(Number(first.idDireccion));
      setSelectedCoords({ latitud: Number(first.latitud), longitud: Number(first.longitud) });

      setBillingForm((prev) => ({
        ...prev,
        address: first.descripcion ?? prev.address
      }));
    } else if (addressList.length === 0 && locationMode === "existing" && !locationLockedByLog) {
      setLocationMode("new");
      setSelectedAddressId(null);
    }
  }, [addressList, selectedAddressId, locationMode, locationLockedByLog]);

  useEffect(() => {
    if (!selectedCoords || locationMode !== "new") return;
    if (locationLockedByLog) return;

    let cancelled = false;

    const fetchAddress = async () => {
      try {
        const { latitud, longitud } = selectedCoords;

        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${latitud}&lon=${longitud}&format=json&addressdetails=1`
        );

        const data = await res.json();

        if (cancelled) return;

        setBillingForm((prev) => ({
          ...prev,
          country: data.address?.country ?? prev.country,
          city: data.address?.city ?? data.address?.town ?? data.address?.village ?? prev.city,
          address: data.display_name ?? prev.address
        }));
      } catch {
        if (cancelled) return;
      }
    };

    void fetchAddress();

    return () => {
      cancelled = true;
    };
  }, [selectedCoords, locationMode, locationLockedByLog]);

  useEffect(() => {
    setNearestBranch(null);
    setDistanceKm(0);
    setTranspCost(0);
    setLastPreviewKey("");

    if (locationMode === "new") {
      if (!locationLockedByLog) setSelectedAddressId(null);
    } else {
      if (!locationLockedByLog) setSelectedCoords(null);
    }
  }, [locationMode, locationLockedByLog]);

  useEffect(() => {
    if (payNowCooldown <= 0) return;

    const t = window.setInterval(() => {
      setPayNowCooldown((s) => (s <= 1 ? 0 : s - 1));
    }, 1000);

    return () => window.clearInterval(t);
  }, [payNowCooldown]);

  const toastError = (msg: string) => {
    toast.error(msg);
    return false;
  };

  const handleBillingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setBillingForm((prev) => ({ ...prev, [id]: value }));
  };

  const handleCoordsChange = (coords: Coords) => setSelectedCoords(coords);

  const normalize = (v: string) => v.toLowerCase().trim();

  const resolveMethod = (item: Currencyto): CheckoutPaymentMethod => {
    const codPago = safeStr(item?.codPago).toUpperCase();
    const desc = normalize(safeStr(item?.descripcion_Pago));
    const moneda = normalize(safeStr(item?.moneda_Fija));

    if (codPago === "1" || desc.includes("efectivo") || moneda.includes("efectivo")) return "cash";
    if (codPago === "STR" || desc.includes("transfer") || desc.includes("transferencia") || moneda.includes("transfer")) return "transfer";
    if (codPago === "STA" || desc === "tarjeta") return "manualCard";
    if (codPago === "PAS") return "card";

    return "cash";
  };

  const isGatewayCard = method === "card";
  const isManualCard = method === "manualCard";
  const isAnyCard = isGatewayCard || isManualCard;

  const getDivisaConfig = (item: Currencyto): ObtenerDivisaPagosTipoReq => {
    return {
      codigo: "0",
      formulario: "1-",
      opcion: safeStr(item?.codPago)
    };
  };

  const loadDivisaIfNeeded = async (item: Currencyto) => {
    setDivisaLoading(true);

    try {
      const req = getDivisaConfig(item);
      const resp = await CartService.GetDivisaPagosTipoAsync(req);

      const list = Array.isArray(resp?.data) ? (resp.data as any[]) : resp?.data ? [resp.data] : [];

      const fixed: ObtenerDivisaPagosTipoRes[] = list
        .filter(Boolean)
        .map((x: ObtenerDivisaPagosTipoRes) => ({
          nombre: safeStr(x?.nombre),
          codigo: safeStr(x?.codigo),
          codigoExterno: safeStr(x?.codigoExterno),
          tipo: safeStr(x?.tipo),
          banco: safeStr(x?.banco),
          aCambio: safeStr(x?.aCambio)
        }))
        .filter((x) => x.codigo || x.codigoExterno || x.nombre);

      setDivisaOpts(fixed);
      setDivisaSelected(fixed.length > 0 ? fixed[0] : null);
    } catch {
      setDivisaOpts([]);
      setDivisaSelected(null);
    } finally {
      setDivisaLoading(false);
    }
  };

  const handleSelectCurrency = (item: Currencyto) => {
    setSelectedCurrency(item);

    const next = resolveMethod(item);

    setMethod(next);
    setSelectedSavedCard(null);
    setDivisaOpts([]);
    setDivisaSelected(null);

    if (next === "card" || next === "manualCard" || next === "transfer") {
      void loadDivisaIfNeeded(item);
    }
  };

  const getCoordsForFlow = (): Coords | null => {
    const addr = selectedAddress ?? addressList[0] ?? null;

    if (locationLockedByLog) {
      if (!addr) return null;
      return { latitud: Number(addr.latitud), longitud: Number(addr.longitud) };
    }

    if (locationMode === "existing") {
      if (!addr) return null;
      return { latitud: Number(addr.latitud), longitud: Number(addr.longitud) };
    }

    if (!selectedCoords) return null;

    return {
      latitud: Number(selectedCoords.latitud),
      longitud: Number(selectedCoords.longitud)
    };
  };

  const coordsKey = (c: Coords) => `${Number(c.latitud).toFixed(6)}|${Number(c.longitud).toFixed(6)}`;

  const getLockedBranch = async (): Promise<BranchLike | null> => {
    const code = String(lockedBranchCode ?? "").trim();

    if (!code) return null;

    const res = await CartService.getBranchByCod(code);
    const item = Array.isArray(res) ? (res[0] as any) : (res as any);

    const codSucursal = item?.codSucursal ?? item?.codsucursal ?? code;
    const latitud = item?.latitud;
    const longitud = item?.longitud;

    if (latitud == null || longitud == null) return null;

    return {
      codSucursal,
      sucursal: item?.sucursal ?? item?.nombreSucursal ?? item?.nombre ?? null,
      latitud,
      longitud
    };
  };

  const computeTransportPreview = async (coords: Coords) => {
    if (locationLockedByLog) {
      const locked = await getLockedBranch();

      if (!locked) return null;

      const lat1 = Number(coords.latitud);
      const lon1 = Number(coords.longitud);
      const lat2 = Number(locked.latitud);
      const lon2 = Number(locked.longitud);

      const km = [lat1, lon1, lat2, lon2].some((v) => Number.isNaN(v))
        ? 0
        : calculateDistance(lat1, lon1, lat2, lon2);

      const cost = Number(lockedTranspCost ?? 0);

      setNearestBranch(locked);
      setDistanceKm(km);
      setTranspCost(cost);
      setLastPreviewKey(`${coordsKey(coords)}|${String(locked.codSucursal)}`);

      return { nearest: locked, cost, km };
    }

    const branchCode = String(lockedBranchCode ?? "").trim();
    const key = `${coordsKey(coords)}|${branchCode || "AUTO"}`;

    if (key === lastPreviewKey && nearestBranch && transpCost >= 0) {
      return { nearest: nearestBranch, cost: transpCost, km: distanceKm };
    }

    let nearest: any | null = null;

    const locked = await getLockedBranch();

    if (locked) {
      nearest = locked;
    } else {
      const branchReq: NearestBranchRequestDto = {
        latitud: coords.latitud,
        longitud: coords.longitud
      };

      const branchResp = await GetNearestBranchAsync(branchReq);
      nearest = Array.isArray(branchResp) && branchResp.length > 0 ? branchResp[0] : branchResp;
    }

    if (!nearest) return null;

    const lat1 = Number(coords.latitud);
    const lon1 = Number(coords.longitud);
    const lat2 = Number(nearest.latitud);
    const lon2 = Number(nearest.longitud);

    if ([lat1, lon1, lat2, lon2].some((v) => Number.isNaN(v))) return null;

    const km = calculateDistance(lat1, lon1, lat2, lon2);
    const cost = await GetTransportationCostAsync(km);

    setNearestBranch(nearest);
    setDistanceKm(km);
    setTranspCost(Number(cost ?? 0));
    setLastPreviewKey(key);

    return { nearest, cost: Number(cost ?? 0), km };
  };

  const handleGoToCurrency = async () => {
    if (locationLockedByLog) {
      goToStep("currency");
      return;
    }

    if (!validateLocation(locationMode, selectedAddressId, selectedCoords)) return;
    if (!validateBillingForm(billingForm, locationMode)) return;

    const coords = getCoordsForFlow();

    if (!coords) return void toastError("Debes seleccionar la ubicación.");

    try {
      const preview = await computeTransportPreview(coords);

      if (!preview) return void toastError("No fue posible calcular el costo de transporte.");

      setStep("currency");
    } catch {
      toastError("No fue posible calcular el costo de transporte.");
    }
  };

  const handleGoToPayment = () => {
    if (locationLockedByLog) {
      goToStep("paymentMethod");
      return;
    }

    if (!validateLocation(locationMode, selectedAddressId, selectedCoords)) return;
    if (!validateBillingForm(billingForm, locationMode)) return;

    setStep("paymentMethod");
  };

const getTotalFactura = () => {
  const totalBase = normalizeNumber(carPCG?.[0]?.total ?? 0);
  const transporte = getTransporteFactura();
  const propina = normalizeNumber(tip);

  return round2(totalBase + transporte + propina);
};

  const validateManualCard = () => {

    if (!safeStr(manualCardData.tarjetahabiente)) {
      return toastError("El tarjetahabiente es requerido.");
    }

    if (!safeStr(manualCardData.fechaVence)) {
      return toastError("La fecha de vencimiento es requerida.");
    }

    return true;
  };


  //Detalle de pago
 const buildPagoGenerico = (
    invoiceReq: FacturaTempo,
    codSucursalFactura: string
  ): PagoGenerico => {
    const moneda = safeStr(invoiceReq.moneda) || "1";
    const tasaCambio = Number(invoiceReq.tasaCambio ?? 1);

    const isCash = method === "cash";
    const isTransfer = method === "transfer";
    const isGateway = method === "card";
    const isManual = method === "manualCard";

    const selected = divisaSelected;
    const total = getTotalFactura();

    const codPago = isCash ? safeStr(selectedCurrency?.codPago) : safeStr(selected?.codigo);
    const descripcionPago = isCash ? safeStr(selectedCurrency?.descripcion_Pago) : safeStr(selected?.nombre);
    const tipo = isCash ? "" : safeStr(selected?.tipo);
    const banco = isCash ? safeStr(selectedCurrency?.codigo_Banco) : safeStr(selected?.banco);
    const codPagoExterno = isCash ? safeStr(selectedCurrency?.codExterno) : safeStr(selected?.codigoExterno);

    let monto = total;
    let referencia = "";
    let numeroTransaccion = "";
    let fechaOVence = "";

    if (isCash) {
      monto = total;
    }

    if (isTransfer) {
      monto = total;
      referencia = safeStr(transferRef);
      numeroTransaccion = safeStr(transferRef);
      fechaOVence = new Date().toISOString().slice(0, 10);
    }

    if (isGateway) {
      monto = total;
    }

    if (isManual) {
      monto = total;
      referencia = safeStr(manualCardData.autorizacion);
      numeroTransaccion = safeStr(manualCardData.autorizacion);
      fechaOVence = safeStr(manualCardData.fechaVence);
    }

    const concepto = isCash
      ? "Efectivo"
      : isTransfer
        ? descripcionPago || "Transferencia"
        : isManual
          ? descripcionPago || "Tarjeta manual"
          : descripcionPago || "Tarjeta";

    return {
      numPago: "1",
      concepto,
      codPago,
      tipoPago: isCash ? "" : tipo,
      aplicaCambio: "True",
      codPagoExterno: codPagoExterno || (isCash ? "1" : ""),
      banco: banco || (isCash ? "00" : ""),
      monto: isCash ? Number(cashAmount) : monto,
      moneda,
      montoA: isCash ? Number(cashAmount) : monto,
      cambio: isCash ? Number(cashAmount - monto) : 0,
      tasaCambio: Number(tasaCambio),
      Fecha_o_Vence: fechaOVence,
      Dll: "",
      Numero: "",
      referencia,
      numeroTransaccion,
      cuentaContable: "",
      ultDigito: isManual ? safeStr(manualCardData.ultDigito) : "",
      tarjeta: isManual ? safeStr(manualCardData.tarjeta) : "",
      tarjetahabiente: isManual ? safeStr(manualCardData.tarjetahabiente) : "",
      autorizacion: isManual ? safeStr(manualCardData.autorizacion) : "",
      termId: isManual ? safeStr(manualCardData.termId) : "",
      afiliado: isManual ? safeStr(manualCardData.afiliado) : "",
      CodStrCadsaccion: "",
      Codtransaccion: "",
      CuentaHabiente: "",
      montoP: round2(total),
      montoS: round2(total / 36.6243),
      indice: "0",
      codClienteCrd: "00000",
      facturaPinpad: "",
      codEmpresa: safeStr(invoiceReq.codEmpresa),
      codSucursal: codSucursalFactura,
      montoFirma: "0",
      sobrante: "0"
    };
  };

  const handlePayNow = async () => {
    const isProcessingPayment = iniciarPagoMutation.isPending || payWithTokenMutation.isPending;

    if (payNowLock || payNowCooldown > 0 || isProcessingPayment) return;

    setPayNowLock(true);
    setPayNowCooldown(5);

    try {
      if (!carPCG || carPCG.length === 0) return void toastError("El carrito está vacío.");
      if (!selectedCurrency) return void toastError("Debe seleccionar un método de pago.");

      if (!locationLockedByLog) {
        if (!validateBillingForm(billingForm, locationMode)) return;
        if (!validateLocation(locationMode, selectedAddressId, selectedCoords)) return;
      }

      const totalFactura = getTotalFactura();

      if (method === "cash") {
        if (cashAmount <= 0) return void toastError("El monto en efectivo debe ser mayor a 0.");
        if (tip > cashAmount) return void toastError("La propina no puede ser mayor al monto ingresado.");

        const disponible = cashAmount - tip;

        if (disponible < totalFactura) {
          return void toastError(
            `Monto insuficiente. Te quedan C$${disponible} disponibles y el total es C$${totalFactura}.`
          );
        }
      }

      if (method === "transfer") {
        if (transferAmount <= 0) return void toastError("El monto debe ser mayor a 0.");
        if (!safeStr(transferRef)) return void toastError("La referencia es requerida.");

        const disponible = transferAmount - tip;

        if (disponible < totalFactura) {
          return void toastError(
            `Monto insuficiente. Te quedan C$${disponible} disponibles y el total es C$${totalFactura}.`
          );
        }
      }

      if ((method === "card" || method === "manualCard" || method === "transfer") && !divisaSelected) {
        return void toastError("Debe seleccionar el banco / forma de pago.");
      }

      if (method === "manualCard" && !validateManualCard()) return;

      const isPickup = existingLog?.retiraSucursal === "S";
      let nearest: any | null = null;
      let transporte = 0;

      const coords = !isPickup ? getCoordsForFlow() : null;

    if (isPickup) {
      nearest = await getLockedBranch();

      if (!nearest) return void toastError("No fue posible determinar la sucursal para retiro.");

      transporte = Number(existingLog?.transCost ?? 0);
    } 
      else {
        if (!coords) return void toastError("Debes seleccionar la ubicación.");

        const preview = await computeTransportPreview(coords);

        if (!preview?.nearest) return void toastError("No hay sucursal disponible.");

        nearest = preview.nearest;
        transporte = Number(preview.cost ?? getTransporteFactura());
      }

      let finalLocation: ClientLocationDto | null = null;

      if (isPickup) {
        finalLocation = {
          idDireccion: 0,
          nombre: "RETIRO EN SUCURSAL",
          referencia: "",
          descripcion: "RETIRO EN SUCURSAL",
          latitud: 0,
          longitud: 0,
          idUsuario: ecommerceUserId
        };
      } else if (locationLockedByLog) {
        const addr =
          selectedAddress ?? addressList.find((a) => a.idDireccion === lockedAddressId) ?? addressList[0];

        if (!addr) return void toastError("No hay dirección bloqueada disponible.");

        finalLocation = {
          idDireccion: addr.idDireccion,
          nombre: addr.nombre,
          referencia: addr.referencia,
          descripcion: addr.descripcion,
          latitud: addr.latitud,
          longitud: addr.longitud,
          idUsuario: ecommerceUserId
        };
      } else if (locationMode === "existing") {
        const addr = selectedAddress ?? addressList[0];

        if (!addr) return void toastError("No hay dirección seleccionada.");

        finalLocation = {
          idDireccion: addr.idDireccion,
          nombre: addr.nombre,
          referencia: addr.referencia,
          descripcion: addr.descripcion,
          latitud: addr.latitud,
          longitud: addr.longitud,
          idUsuario: ecommerceUserId
        };
      } else {
        if (!coords) return void toastError("Debes seleccionar la ubicación.");

        const locationPayload: ClientLocationDto = {
          idDireccion: 0,
          nombre: billingForm.addressName || billingForm.address,
          referencia: `${billingForm.city}, ${billingForm.country}`,
          descripcion: billingForm.address,
          latitud: coords.latitud,
          longitud: coords.longitud,
          idUsuario: ecommerceUserId
        };

        const newLocation = await createLocationAsync(locationPayload);

        if (!newLocation) return void toastError("No fue posible guardar la nueva dirección.");

        finalLocation = newLocation;
      }

      if (!finalLocation) return void toastError("No se pudo determinar la dirección final.");

      const facturaBase = await loadFacturaTempo();

      const codSucursalFactura = existingLog?.branch;

      if (!codSucursalFactura) return void toastError("No fue posible determinar la sucursal de factura.");

      const falote: FaloteRequestDto = {
        codSucursal: codSucursalFactura,
        documento: "OrdenFactura"
      };

      const dataconse = await CartService.GetConsecDocAsync(falote);

      const TotalesPantallaReq: TotalesPantallaReqDTO = {
        descuentoPantalla: existingLog?.DescuentoPantalla ?? 0,
        exonerado: "N",
        ivaPantalla: existingLog?.ivaPantalla ?? 0,
        maquina: `CRM-${payload?.contactId}`,
        sucursal: existingLog?.branch ?? codSucursalFactura,
        tabla: "det_factura_tempo",
        totalEnPantalla: existingLog?.subTotal ?? 0,
        usuario: payload!.contactId.toString()
      };

      const res = await CartService.sp_valida_SobTotalFactura(TotalesPantallaReq);
      const { pasasub, pasadesc, pasaiva } = res.data[0];

      const errores: Record<string, string> = {
        pasasub: "Subtotal no válido, diferencia con el valor real.",
        pasadesc: "Descuento no válido, diferencia con el valor real.",
        pasaiva: "IVA no válido, diferencia con el valor real."
      };

      const flags = [
        { key: "pasasub", value: pasasub },
        { key: "pasadesc", value: pasadesc },
        { key: "pasaiva", value: pasaiva }
      ];

      const fallo = flags.find((f) => f.value === "N" || f.value === null);

      if (fallo) {
        toast.error(`(${errores[fallo.key]})`);
        return;
      }

      const invoiceReqBase: FacturaTempo = {
        ...facturaBase,
        nombreCliente:
          existingLog?.contactName?.trim() || `${billingForm.firstName} ${billingForm.lastName}`.trim(),
        clientePadre:
          existingLog?.contactName?.trim() || `${billingForm.firstName} ${billingForm.lastName}`.trim(),
        direccionCte: String(finalLocation.descripcion ?? "").trim(),
        usuario: String(payload?.contactId),
        maquina: `CRM-${payload?.contactId}`,
        fechaFactura: FechaManagua.obtenerFormatoLimpio(),
        tasaCambio: 36.6243,
        sucursal: codSucursalFactura,
        numero: Number(dataconse?.data?.consecutivo ?? 0),
        idPromocion: String(orderId),
        noOrden: String(orderId),
        referencia: String(finalLocation.referencia ?? ""),
        valorTransporte: Number(transporte ?? 0),
        aplicaPropina: "N",
        observacion: existingLog?.observacion ?? "",
        hayFormaPago: "S",
        retiraSucursal: existingLog?.retiraSucursal != null ? String(existingLog.retiraSucursal) : "N",
        serie: existingLog?.serie != null ? existingLog.serie : "F"
      };

      const pagoGenerico: PagoGenerico = buildPagoGenerico(invoiceReqBase, codSucursalFactura);

      const invoiceReqFinal: FacturaTempo = {
        ...invoiceReqBase,
        detallePago: [pagoGenerico]
      } as FacturaTempo;

      if (method === "card") {
        const totalMonto = getTotalFactura();

        sessionStorage.setItem(CHECKOUT_INVOICE_KEY, JSON.stringify(invoiceReqFinal));
        sessionStorage.setItem(CHECKOUT_PAYLOAD_KEY, JSON.stringify(payload));
        sessionStorage.setItem(ECOMMERCEUSERID_KEY, JSON.stringify(ecommerceUserId));

        if (selectedSavedCard?.panToken) {
          const requestToken: PowertranzPayWithTokenRequestDto = {
            transactionIdentifier: null,
            orderId: String(dataconse?.data?.consecutivo ?? ""),
            amount: totalMonto,
            currencyCode: "558",
            capturaAutomatica: false,
            externalIdentifier: null,
            addressMatch: false,
            panToken: selectedSavedCard.panToken,
            tokenType: null,
            cardCvv: null,
            billingAddress: null,
            shippingAddress: null,
            browserInfo: obtenerBrowserInfo()
          };

          await payWithTokenMutation.mutateAsync(requestToken);
          return;
        }

        await iniciarPagoMutation.mutateAsync({
          orderId: String(dataconse?.data?.consecutivo ?? ""),
          amount: totalMonto,
          currencyCode: "558"
        });

        return;
      }

      await procesarCheckoutExitoso({
        invoiceReqFinal,
        payload: payload!,
        orderId,
        transactionIdentifier: method === "manualCard" ? safeStr(manualCardData.autorizacion) : "",
        usarPdfPagoElectronico: false,
        codSucursalFactura,
        consecutivo: Number(dataconse?.data?.consecutivo ?? 0),
        fetchByContactId,
        updatedStatus: UpdatedStatus,
        insertaFacturaAsync: InsertaFacturaAsync,
        dispatch,
        navigate
      });
    } catch (err: any) {
      toast.error(err?.message ?? "Error procesando pago");
      navigate("/unauthorized", { replace: true });
    } finally {
      window.setTimeout(() => setPayNowLock(false), 500);
    }
  };

  const isProcessingPayment = iniciarPagoMutation.isPending || payWithTokenMutation.isPending;
  const payNowDisabled = payNowLock || payNowCooldown > 0 || isProcessingPayment;

  return (
    <section className="checkout-page">
      <div className="checkout-shell">
        <div className="checkout-page__title">
          <h1 className="checkout-page__title__value">Checkout</h1>
        </div>

        <div className="checkout-main">
          <div className="checkout-left">
            {step === "location" && (
              <LocationSection
                addressList={addressList}
                locationMode={locationMode}
                isPickup={existingLog?.retiraSucursal === "S"}
                setLocationMode={setLocationMode}
                selectedAddressId={selectedAddressId}
                setSelectedAddressId={setSelectedAddressId}
                setSelectedCoords={setSelectedCoords}
                billingForm={billingForm}
                setBillingForm={setBillingForm}
                selectedAddress={selectedAddress}
                selectedCoords={selectedCoords}
                handleBillingChange={handleBillingChange}
                handleGoToCurrency={handleGoToCurrency}
                handleCoordsChange={handleCoordsChange}
                isLocked={locationLockedByLog}
              />
            )}

            {step === "currency" && (
              <CurrencySection
                step={step}
                currency={currency}
                selectedCurrency={selectedCurrency}
                handleSelectCurrency={handleSelectCurrency}
                invoiceLoading={invoiceLoading}
                setStep={goToStep}
                handleGoToPayment={handleGoToPayment}
              />
            )}

            {step === "paymentMethod" &&
              (payNowDisabled ? (
                <div>Cargando...</div>
              ) : (
                <PaymentMethodComponent
                  step={step as CheckoutStep}
                  setStep={goToStep}
                  method={method}
                  distanceKm={distanceKm}
                  transpCost={transpCost}
                  tip={tip}
                  setTip={setTip}
                  cashAmount={cashAmount}
                  setCashAmount={setCashAmount}
                  transferAmount={transferAmount}
                  setTransferAmount={setTransferAmount}
                  transfer={transferRef}
                  setTransfer={setTransferRef}
                  payNowDisabled={payNowDisabled}
                  payNowLock={payNowLock}
                  handlePayNow={handlePayNow}
                  divisaLoading={divisaLoading}
                  divisaOpts={divisaOpts}
                  divisaSelected={divisaSelected}
                  setDivisaSelected={setDivisaSelected}
                  carPCG={carPCG}

                  // AQUI
                  totalPagar={totalPagar}
                  
                  existingLog={existingLog}
                  ecommerceUserId={payload.ecommerceUserId}
                  onSelectCard={setSelectedSavedCard}
                  manualCardData={manualCardData}
                  setManualCardData={setManualCardData}
                  isGatewayCard={isGatewayCard}
                  isManualCard={isManualCard}
                  isAnyCard={isAnyCard}
                />
              ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default CheckoutPage;