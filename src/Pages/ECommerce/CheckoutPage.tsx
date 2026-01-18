/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import * as turf from "@turf/turf";
import dayjs from "dayjs";
import { toast } from "react-toastify";
import { useDispatch, useSelector, type TypedUseSelectorHook } from "react-redux";

import useInvoiceOrder from "@/Hooks/Ecommerce/useInvoiceOrder";
import { useClientLocation } from "@/Hooks/Ecommerce/useClientLocation";
import useLogCart from "@/Hooks/Crm/useLogCard";

import type {
  CalculationReqDto,
  ClientLocationDto,
  Coords,
  LocationMode,
  TotalesPantallaReqDTO,
} from "@/Interfaces/Ecommerce/ClientLocationInterface";
import type {
  NearestBranchRequestDto,
  Currencyto,
  CheckoutStep,
  PaymentMethod,
  BillingFormState,
  CardFormState,
} from "@/Interfaces/Ecommerce/InvoiceOrderInterface";
import type {
  FacturaTempo,
  PagoGenerico,
  ObtenerDivisaPagosTipoReq,
  ObtenerDivisaPagosTipoRes,
} from "@/Interfaces/Ecommerce/FacturaTempo";
import type { FaloteRequestDto } from "@/Interfaces/Crm/CartPCGInterface";

import { selectCarPCG, getProductFromCarAsync } from "@/Context/Slices/Ecommerce/cartSlice";
import type { AppDispatch, RootState } from "@/Context";
import { setContactCartBadge } from "@/Context/Slices/Ecommerce/cartBadgeSlice";

import { UserSessionService } from "@/Services/auth/UserSessionService";
import { CartService } from "@/Services/Ecommerce/CarPCGService";

import {
  formatCardNumber,
  formatCvc,
  formatExpiry,
  validateBillingForm,
  validateCardForm,
  validateLocation,
} from "@/Utils/validation";
import { loadFacturaTempo } from "@/Utils/facturaTempoStorage";

import "@/Styles/Ecommerce/CheckoutPage.css";

import { PaymentMethodComponent } from "@/Components/ECommerce/PaymentMethod";
import { Currency } from "@/Components/ECommerce/Currency";
import { Location } from "@/Components/ECommerce/Location";

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const from = turf.point([lon1, lat1]);
  const to = turf.point([lon2, lat2]);
  return turf.distance(from, to, { units: "kilometers" });
}

type BranchLike = {
  codSucursal: string | number;
  sucursal?: string | null;
  latitud: number | string;
  longitud: number | string;
};

function round2(n: number): number {
  return Math.round((Number(n ?? 0) + Number.EPSILON) * 100) / 100;
}

function safeStr(v: unknown): string {
  return String(v ?? "").trim();
}

// function yn(v: unknown): "S" | "N" {
//   const s = safeStr(v).toUpperCase();
//   return s === "S" ? "S" : "N";
// }

type Payload = {
  fullName: string;
  email: string;
  ecommerceUserId: number;
  expiresAtUtc: string;
  orderId: number;
  conversationId: number;
  contactId: number;
  userId: number;
};

const CheckoutPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const payload = location.state?.payload as Payload | undefined;

  const [ecommerceUserId, setEcommerceUserId] = useState<number>(0);
  const [orderId, setOrderId] = useState<number>(0);
  const [userFullName, setUserFullName] = useState<string>("");

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

  const [step, setStep] = useState<CheckoutStep>("location");
  const [method, setMethod] = useState<PaymentMethod>("card");

  const [billingForm, setBillingForm] = useState<BillingFormState>({
    firstName: "",
    lastName: "",
    email: "",
    country: "NI",
    city: "",
    address: "",
    addressName: "",
  });

  const [cardForm, setCardForm] = useState<CardFormState>({
    cardNumber: "",
    expiry: "",
    cvc: "",
    nameOnCard: "",
  });

  const [selectedCoords, setSelectedCoords] = useState<Coords | null>(null);
  const [selectedCurrency, setSelectedCurrency] = useState<Currencyto | null>(null);

  const [cashAmount, setCashAmount] = useState<number>(0);
  const [tip, setTip] = useState<number>(0);

  const [transferAmount, setTransferAmount] = useState<number>(0);
  const [transferRef, setTransferRef] = useState<string>("");

  const [locationMode, setLocationMode] = useState<LocationMode>("new");
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);

  const [transpCost, setTranspCost] = useState<number>(0);
  const [nearestBranch, setNearestBranch] = useState<any | null>(null);
  const [distanceKm, setDistanceKm] = useState<number>(0);

  const [payNowLock, setPayNowLock] = useState<boolean>(false);
  const [payNowCooldown, setPayNowCooldown] = useState<number>(0);

  const [lockedBranchCode, setLockedBranchCode] = useState<string>("");
  const [lastPreviewKey, setLastPreviewKey] = useState<string>("");

  const [divisaOpts, setDivisaOpts] = useState<ObtenerDivisaPagosTipoRes[]>([]);
  const [divisaSelected, setDivisaSelected] = useState<ObtenerDivisaPagosTipoRes | null>(null);
  const [divisaLoading, setDivisaLoading] = useState<boolean>(false);

  const dispatch = useAppDispatch();
  const carPCG = useAppSelector(selectCarPCG);

  const {
    currency,
    GetCurrencyAsync,
    GetTransportationCostAsync,
    GetNearestBranchAsync,
    loading: invoiceLoading,
    InsertaFacturaAsync,
  } = useInvoiceOrder();

  const { fetchByContactId, UpdatedStatus } = useLogCart();
  const { CreateAsync: createLocationAsync, GetAsync, clientLocation } = useClientLocation();

  useEffect(() => {
    if (!payload?.contactId) return;

    let cancelled = false;

    const loadBranchLock = async () => {
      try {
        const existingLog = await fetchByContactId(payload.contactId);
        if (cancelled) return;
        setLockedBranchCode(String(existingLog?.branch?.toString()?.trim?.() ?? "").trim());
      } catch {
        if (cancelled) return;
        setLockedBranchCode("");
      }
    };

    void loadBranchLock();

    return () => {
      cancelled = true;
    };
  }, [payload?.contactId, fetchByContactId]);

  useEffect(() => {
    if (!orderId || !ecommerceUserId || !payload?.orderId || !payload?.contactId) return;

    let cancelled = false;

    const loadCart = async () => {
      try {
        await dispatch(getProductFromCarAsync({ codCliente: 0, noPedido: payload.orderId })).unwrap();
        if (cancelled) return;

        const existingLog = await fetchByContactId(payload.contactId);
        if (cancelled) return;

        if (Number(existingLog?.addressId ?? 0) > 0) {
          setStep("currency");
        }

        await GetCurrencyAsync();
        if (cancelled) return;

        await GetAsync(ecommerceUserId);
      } catch {
        //
      }
    };

    void loadCart();

    return () => {
      cancelled = true;
    };
  }, [orderId, ecommerceUserId, payload?.orderId, payload?.contactId, dispatch, GetCurrencyAsync, GetAsync, fetchByContactId]);

  useEffect(() => {
    if (!userFullName) return;
    const parts = userFullName.split(" ");
    setBillingForm((prev) => ({
      ...prev,
      firstName: parts[0] ?? "",
      lastName: parts.slice(1).join(" ") ?? "",
    }));
  }, [userFullName]);

  const addressList = useMemo(
    () => (Array.isArray(clientLocation) ? clientLocation : clientLocation ? [clientLocation] : []),
    [clientLocation]
  );

  const selectedAddress = useMemo(
    () => (selectedAddressId ? addressList.find((a) => a.idDireccion === selectedAddressId) ?? null : null),
    [addressList, selectedAddressId]
  );

  useEffect(() => {
    if (addressList.length > 0 && !selectedAddressId && locationMode === "existing") {
      const first = addressList[0];
      setSelectedAddressId(first.idDireccion);
      setSelectedCoords({ latitud: first.latitud, longitud: first.longitud });
      setBillingForm((prev) => ({
        ...prev,
        address: first.descripcion ?? prev.address,
      }));
    } else if (addressList.length === 0 && locationMode === "existing") {
      setLocationMode("new");
      setSelectedAddressId(null);
    }
  }, [addressList, selectedAddressId, locationMode]);

  useEffect(() => {
    if (!selectedCoords || locationMode !== "new") return;

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
          address: data.display_name ?? prev.address,
        }));
      } catch {
        //
      }
    };

    void fetchAddress();

    return () => {
      cancelled = true;
    };
  }, [selectedCoords, locationMode]);

  useEffect(() => {
    setNearestBranch(null);
    setDistanceKm(0);
    setTranspCost(0);
    setLastPreviewKey("");

    if (locationMode === "new") {
      setSelectedAddressId(null);
    } else {
      setSelectedCoords(null);
    }
  }, [locationMode]);

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

  const onCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCardForm((p) => ({ ...p, cardNumber: formatCardNumber(e.target.value) }));
  };

  const onExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCardForm((p) => ({ ...p, expiry: formatExpiry(e.target.value) }));
  };

  const onCvcChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCardForm((p) => ({ ...p, cvc: formatCvc(e.target.value) }));
  };

  const onNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCardForm((p) => ({ ...p, nameOnCard: e.target.value }));
  };

  const handleCoordsChange = (coords: Coords) => setSelectedCoords(coords);

  const normalize = (v: string) => v.toLowerCase().trim();

  const resolveMethod = (item: Currencyto): "cash" | "transfer" | "card" => {
    const desc = normalize(safeStr((item as any)?.descripcion_Pago));
    const moneda = normalize(safeStr((item as any)?.moneda_Fija));
    if (desc.includes("efectivo") || moneda.includes("efectivo")) return "cash";
    if (desc.includes("transfer") || desc.includes("transferencia") || moneda.includes("transfer")) return "transfer";
    return "card";
  };

  const getDivisaConfig = (m: "card" | "transfer"): ObtenerDivisaPagosTipoReq => {
    return {
      codigo: safeStr((selectedCurrency as any)?.codPago),
      formulario: m === "card" ? "TC" : "TR",
      opcion: "1",
    };
  };

  const loadDivisaIfNeeded = async (m: "card" | "transfer") => {
    setDivisaLoading(true);
    try {
      const req = getDivisaConfig(m);
      const resp = await CartService.GetDivisaPagosTipoAsync(req);

      const list = Array.isArray(resp?.data) ? (resp.data as any[]) : resp?.data ? [resp.data] : [];
      const fixed: ObtenerDivisaPagosTipoRes[] = list
        .filter(Boolean)
        .map((x: any) => ({
          nombre: safeStr(x?.nombre),
          codigo: safeStr(x?.codigo),
          codigoExterno: safeStr(x?.codigoExterno),
          tipo: safeStr(x?.tipo),
          banco: safeStr(x?.banco),
          aCambio: safeStr(x?.aCambio),
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

    setDivisaOpts([]);
    setDivisaSelected(null);

    if (next === "card" || next === "transfer") {
      void loadDivisaIfNeeded(next);
    }
  };

  const getCoordsForFlow = (): Coords | null => {
    if (locationMode === "existing") {
      const addr = selectedAddress ?? addressList[0];
      if (!addr) return null;
      return { latitud: Number(addr.latitud), longitud: Number(addr.longitud) };
    }
    if (!selectedCoords) return null;
    return { latitud: Number(selectedCoords.latitud), longitud: Number(selectedCoords.longitud) };
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
      longitud,
    };
  };

  const computeTransportPreview = async (coords: Coords) => {
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
      const branchReq: NearestBranchRequestDto = { latitud: coords.latitud, longitud: coords.longitud };
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
    if (!validateLocation(locationMode, selectedAddressId, selectedCoords)) return;
    if (!validateBillingForm(billingForm, locationMode)) return;

    const coords = getCoordsForFlow();
    if (!coords) return toastError("Debes seleccionar la ubicación.");

    try {
      const preview = await computeTransportPreview(coords);
      if (!preview) return toastError("No fue posible calcular el costo de transporte.");
      setStep("currency");
    } catch {
      toastError("No fue posible calcular el costo de transporte.");
    }
  };

  const handleGoToPayment = () => {
    if (!validateLocation(locationMode, selectedAddressId, selectedCoords)) return;
    if (!validateBillingForm(billingForm, locationMode)) return;
    setStep("paymentMethod");
  };

  const buildPagoGenerico = (invoiceReq: FacturaTempo, 
    codSucursalFactura: string, TotalesPantallaReq: TotalesPantallaReqDTO): PagoGenerico => {
    const moneda = safeStr(invoiceReq.moneda) || "1";
    const tasaCambio = Number(invoiceReq.tasaCambio ?? 1);

    const cart = carPCG?.[0];
    const baseTotal = Number(cart?.total ?? 0);
    const totalPagar = round2(baseTotal + Number(transpCost ?? 0) + Number(tip ?? 0));

    const isCash = method === "cash";
    const isCard = method === "card";
    const isTransfer = method === "transfer";

    const selected = divisaSelected;

    const codPago = isCash ? safeStr(selectedCurrency?.codPago) : safeStr(selected?.codigo);
    const descripcionPago = isCash ? safeStr(selectedCurrency?.descripcion_Pago) : safeStr(selected?.nombre);
    const tipo = isCash ? "" : safeStr(selected?.tipo);
    const banco = isCash ? safeStr((selectedCurrency as any)?.codigo_Banco) : safeStr(selected?.banco);
    const codPagoExterno = isCash ? safeStr((selectedCurrency as any)?.codExterno) : safeStr(selected?.codigoExterno);
    // const aplicaCambio = isCash ? "True" : yn(selected?.aCambio) === "S";

    let monto = totalPagar;
    let referencia = "";
    let numeroTransaccion = "";
    let fechaOVence = "";
    let ultDigito = "";

    if (isCash) {
      monto = Number(cashAmount ?? 0);
    }

    if (isTransfer) {
      monto = Number(transferAmount ?? 0);
      referencia = safeStr(transferRef);
      numeroTransaccion = safeStr(transferRef);
      fechaOVence = dayjs().format("YYYY-MM-DD");
    }

    if (isCard) {
      monto = totalPagar;
      const cleanCard = safeStr(cardForm.cardNumber).replace(/\s+/g, "");
      ultDigito = cleanCard.slice(-4);
      fechaOVence = safeStr(cardForm.expiry);
    }

    const montoA = moneda === "1" ? Number(monto ?? 0) : round2(Number(monto ?? 0) / (Number(tasaCambio || 1) || 1));
    // const montoP = totalPagar;
    // const montoS = round2(totalPagar / (Number(tasaCambio || 1) || 1));

    const tipoPago = isCash ? "" : safeStr(tipo) || (isCard ? "TC" : isTransfer ? "TR" : "");

    return {
      numPago: "1",
      concepto: isCash
        ? "Efectivo"
        : isTransfer
        ? descripcionPago || "Transferencia"
        : `${descripcionPago || "Tarjeta"}${ultDigito ? ` (${ultDigito})` : ""}`,

      codPago: codPago || "1",
      tipoPago: tipoPago || "1",
      aplicaCambio: "True",
      codPagoExterno: codPagoExterno || (isCash ? "1" : ""),
      banco: banco || (isCash ? "00" : ""),

      monto: Number(monto ?? 0),
      moneda,
      montoA: Number(montoA ?? 0),
      cambio: Number(TotalesPantallaReq.totalEnPantalla - monto),
      tasaCambio: Number(tasaCambio ?? 1),
      Fecha_o_Vence: fechaOVence,
      Dll: "",
      Numero: "",
      referencia,
      numeroTransaccion,
      cuentaContable: "",

      ultDigito,
      tarjeta: "",
      tarjetahabiente: isCard ? safeStr(cardForm.nameOnCard) : "",
      autorizacion: "",
      termId: "",
      afiliado: "",

      montoP: TotalesPantallaReq.totalEnPantalla,
      montoS: TotalesPantallaReq.totalEnPantalla / 36.6243,

      indice: "0",
      codClienteCrd: "00000",
      facturaPinpad: "",
      codEmpresa: safeStr((invoiceReq as any)?.codEmpresa) || "01",
      codSucursal: codSucursalFactura,
      montoFirma: "0",
      sobrante: "0",
    };
  };

  const handlePayNow = async () => {
    if (payNowLock || payNowCooldown > 0) return;

    setPayNowLock(true);
    setPayNowCooldown(5);

    try {
      if (!carPCG || carPCG.length === 0) return void toastError("El carrito está vacío.");
      if (!selectedCurrency) return void toastError("Debe seleccionar un método de pago.");
      if (!validateBillingForm(billingForm, locationMode)) return;
      if (!validateLocation(locationMode, selectedAddressId, selectedCoords)) return;
      if (method === "card" && !validateCardForm(cardForm)) return;

      const cart = carPCG[0];
      const total = Number(cart.total ?? 0);

      if (method === "cash") {
        if (cashAmount <= 0) return void toastError("El monto en efectivo debe ser mayor a 0.");
        if (tip > cashAmount) return void toastError("La propina no puede ser mayor al monto ingresado.");
        const disponible = cashAmount - tip;
        if (disponible < total) {
          return void toastError(`Monto insuficiente. Te quedan C$${disponible} disponibles y el total es C$${total}.`);
        }
      }

      if (method === "transfer") {
        if (transferAmount <= 0) return void toastError("El monto debe ser mayor a 0.");
        if (!safeStr(transferRef)) return void toastError("La referencia es requerida.");
        const disponible = transferAmount - tip;
        if (disponible < total) {
          return void toastError(`Monto insuficiente. Te quedan C$${disponible} disponibles y el total es C$${total}.`);
        }
      }

      if ((method === "card" || method === "transfer") && !divisaSelected) {
        return void toastError("Debe seleccionar el banco / forma de pago.");
      }

      const coords = getCoordsForFlow();
      if (!coords) return void toastError("Debes seleccionar la ubicación.");

      const preview = await computeTransportPreview(coords);
      if (!preview?.nearest) return void toastError("No hay sucursal disponible.");

      const nearest = preview.nearest;
      const transporte = Number(preview.cost ?? 0);

      let finalLocation: ClientLocationDto | null = null;

      if (locationMode === "existing") {
        const addr = selectedAddress ?? addressList[0];
        if (!addr) return void toastError("No hay dirección seleccionada.");

        finalLocation = {
          idDireccion: addr.idDireccion,
          nombre: addr.nombre,
          referencia: addr.referencia,
          descripcion: addr.descripcion,
          latitud: addr.latitud,
          longitud: addr.longitud,
          idUsuario: ecommerceUserId,
        };
      } else {
        const locationPayload: ClientLocationDto = {
          idDireccion: 0,
          nombre: billingForm.addressName || billingForm.address,
          referencia: `${billingForm.city}, ${billingForm.country}`,
          descripcion: billingForm.address,
          latitud: coords.latitud,
          longitud: coords.longitud,
          idUsuario: ecommerceUserId,
        };

        const newLocation = await createLocationAsync(locationPayload);
        if (!newLocation) return void toastError("No fue posible guardar la nueva dirección.");
        finalLocation = newLocation;
      }

      if (!finalLocation) return void toastError("No se pudo determinar la dirección final.");

      const facturaBase = await loadFacturaTempo();

      const codSucursalFactura = String(nearest.codSucursal ?? nearest.codsucursal ?? "").trim();
      if (!codSucursalFactura) return void toastError("No fue posible determinar la sucursal de factura.");

      const falote: FaloteRequestDto = { codSucursal: codSucursalFactura, documento: "OrdenFactura" };
      const dataconse = await CartService.GetConsecDocAsync(falote);


      const calculationReqDto: CalculationReqDto ={
        maquina: `CRM-${payload?.contactId}`,
        usuario: `${payload?.contactId}`,
        aplicaPropina: 'N',
        exonerada: 'N',
        imi: 'N',
        ir: 'N',
        tabla: 'det_factura_tempo',
        tasa: 36.6243,
        tipoServicio: "8",
        valorTransporte: transferAmount,
      }

      const VspConsolidadoFacturaRes = await CartService.VspConsolidadoFactura(calculationReqDto);


      const TotalesPantallaReq: TotalesPantallaReqDTO ={
        descuentoPantalla: 0,
        exonerado: 'N',
        ivaPantalla: VspConsolidadoFacturaRes.data[0].iva,
        maquina: `CRM-${payload?.contactId}`,
        sucursal: '',
        tabla: 'det_factura_tempo',
        totalEnPantalla: VspConsolidadoFacturaRes.data[0].total,
        usuario: payload!.contactId.toString()
      }
      
      const invoiceReqBase: FacturaTempo = {
        ...facturaBase,
        
        codCli: "00000",
        nombreCliente: `${billingForm.firstName} ${billingForm.lastName}`,
        clientePadre: `${billingForm.firstName} ${billingForm.lastName}`,
        direccionCte: String(finalLocation.descripcion).trim(),
        usuario: String(payload?.contactId),
        maquina: `CRM-${payload?.contactId}`,
        fechaFactura: dayjs().format("YYYYMMDD"),
        tasaCambio:  36.6243,
        sucursal: codSucursalFactura,
        numero: Number(dataconse?.data?.consecutivo ?? 0),
        idPromocion: String(orderId),
        noOrden: String(orderId),
        referencia: String(finalLocation.referencia ?? ""),
        valorTransporte: Number(transporte ?? 0),
        retiraSucursal: 'S',
        hayFormaPago: "S"
      };

      const pagoGenerico: PagoGenerico = buildPagoGenerico(invoiceReqBase, codSucursalFactura,TotalesPantallaReq);
      const detallePago: PagoGenerico[] = [pagoGenerico];

      const invoiceReqFinal: FacturaTempo = {
        ...invoiceReqBase,
        detallePago
        // detallePago: JSON.stringify(pagos),
      } as FacturaTempo;

      await InsertaFacturaAsync(invoiceReqFinal);

      const existingLog = await fetchByContactId(payload!.contactId);
      if (existingLog?.id) {
        await UpdatedStatus(existingLog.id, 3);
      }

      await UserSessionService.revokeCartTempLink(orderId);
      dispatch(setContactCartBadge({ contactId: payload!.contactId, hasCart: false, count: 0 }));

      navigate("/successOrder", { replace: true });
    } catch (err: any) {
      toast.error(err?.message ?? "Error procesando pago");
      await UserSessionService.revokeCartTempLink(orderId);
      navigate("/unauthorized", { replace: true });
    } finally {
      window.setTimeout(() => setPayNowLock(false), 500);
    }
  };

  const payNowDisabled = payNowLock || payNowCooldown > 0;

  return (
    <section className="checkout-page">
      <div className="checkout-shell">
        <h1 className="checkout-page__title">Checkout</h1>

        <div className="checkout-main">
          <div className="checkout-left">
            {step === "location" && (
              <Location
                addressList={addressList}
                locationMode={locationMode}
                setLocationMode={setLocationMode}
                selectedAddressId={selectedAddressId}
                setSelectedAddressId={setSelectedAddressId}
                setSelectedCoords={setSelectedCoords}
                billingForm={billingForm}
                setBillingForm={setBillingForm}
                selectedAddress={selectedAddress as any}
                selectedCoords={selectedCoords}
                handleBillingChange={handleBillingChange}
                handleGoToCurrency={handleGoToCurrency}
                handleCoordsChange={handleCoordsChange}
              />
            )}

            {step === "currency" && (
              <Currency
                step={step}
                currency={currency}
                selectedCurrency={selectedCurrency}
                handleSelectCurrency={handleSelectCurrency}
                invoiceLoading={invoiceLoading}
                setStep={setStep}
                handleGoToPayment={handleGoToPayment}
              />
            )}

            {step === "paymentMethod" && (
              <PaymentMethodComponent
                step={step}
                setStep={setStep}
                method={method}
                distanceKm={distanceKm}
                transpCost={transpCost}
                cardForm={cardForm}
                tip={tip}
                setTip={setTip}
                onExpiryChange={onExpiryChange}
                onCardNumberChange={onCardNumberChange}
                onCvcChange={onCvcChange}
                onNameChange={onNameChange}
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
              />
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default CheckoutPage;