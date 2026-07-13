/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useCallback, useEffect, useMemo, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { useDispatch, useSelector, type TypedUseSelectorHook } from "react-redux"
import { toast } from "react-toastify"
import type { AppDispatch, RootState } from "@/Context"
import { getProductFromCarAsync, selectCarPCG } from "@/Context/Slices/Ecommerce/cartSlice"
import { CartService } from "@/Services/Ecommerce/CarPCGService"
import { CurrencySection } from "@/Components/ECommerce/Tabs/CurrencySection"
import LocationSection from "@/Components/ECommerce/Payment/LocationSection"
import OnlyTextAddressSection from "@/Components/ECommerce/Payment/OnlyTextAddressSection"
import PaymentMethodComponent from "@/Components/ECommerce/Payment/PaymentMethodComponent"
import useInvoiceOrder from "@/Hooks/Ecommerce/payment/useInvoiceOrder"
import useLogCart from "@/Hooks/Crm/useLogCard"
import { useClientLocation } from "@/Hooks/Ecommerce/payment/useClientLocation"
import { useIniciarPago } from "@/Hooks/Ecommerce/payment/useIniciarPago"
import { usePayWithToken } from "@/Hooks/Ecommerce/payment/usePayWithToken"
import { useCompleteFpi } from "@/Hooks/Ecommerce/payment/useCompleteFpi"
import { useCheckoutPaymentState } from "@/Hooks/Ecommerce/payment/useCheckoutPaymentState"
import { validateBillingForm, validateLocation } from "@/Utils/validation"
import { loadFacturaTempo } from "@/Utils/facturaTempoStorage"
import { calculateDistance, obtenerBrowserInfo, safeNumber, safePositiveNumber } from "@/Utils/ECommerce/utils"
import { safeStr } from "@/Utils/ECommerce/formatters"
import { buildPagoGenerico } from "@/Utils/ECommerce/buildPagoGenerico"
import { buildFacturaTempo } from "@/Utils/ECommerce/buildFacturaTempo"
import { procesarVentaCheckout } from "@/Utils/ECommerce/procesarVentaCheckout"
import { construirDetallePago, obtenerTipoPagoDesdeMoneda, validarPagosSeleccionados } from "@/Utils/ECommerce/pagoFacturaUtils"
import { getAddressFromCoords } from "@/Utils/ECommerce/reverseGeocoding"
import { CHECKOUT_INVOICE_KEY, CHECKOUT_PAYLOAD_KEY, ECOMMERCEUSERID_KEY } from "@/Utils/ECommerce/keys"
import type { BillingFormState, CheckoutStep, Currencyto } from "@/Interfaces/Ecommerce/InvoiceOrderInterface"
import type { ClientLocationDto, Coords, LocationMode } from "@/Interfaces/Ecommerce/ClientLocationInterface"
import type { FacturaTempo, ObtenerDivisaPagosTipoReq, ObtenerDivisaPagosTipoRes, PagoGenerico } from "@/Interfaces/Ecommerce/FacturaTempo"
import type { FaloteRequestDto } from "@/Interfaces/Crm/CartPCGInterface"
import type { LogCartResponseDto, Payload } from "@/Interfaces/Crm/LogCartInterface"
import type { PowertranzPayWithTokenRequestDto } from "@/Interfaces/Ecommerce/powertranzInterface"
import type { CheckoutPaymentMethod } from "@/Interfaces/Ecommerce/PaymentCheckoutInterface"
import type { PagoSeleccionado } from "@/Interfaces/Ecommerce/MultiPagoTypes"
import type { TempLinkResolveResponseDto } from "@/Interfaces/Common/GlobalPCGInterface"
import "@/Styles/Ecommerce/Payment/CheckoutPage.css"
import { tasaCambio } from "@/Constants/tasaCambio"

const CHECKOUT_PDF_CONTEXT_KEY = "checkout_pdf_context"

export const useAppDispatch: () => AppDispatch = useDispatch
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector

type BranchLike = {
  codSucursal: string | number
  sucursal?: string | null
  latitud: number | string
  longitud: number | string
}

type FinalLocation = {
  idDireccion?: number | null
  nombre?: string | null
  descripcion?: string | null
  referencia?: string | null
  latitud?: number | string | null
  longitud?: number | string | null
}

type CheckoutPayload = Payload & TempLinkResolveResponseDto

const getDivisaConfig = (item: Currencyto): ObtenerDivisaPagosTipoReq => {
  return {
    codigo: "0",
    formulario: "1-",
    opcion: safeStr(item?.codPago)
  }
}

const getLogText = (
  log: LogCartResponseDto | null,
  keys: string[]
): string => {
  const source = log as Record<string, unknown> | null

  if (!source) return ""

  for (const key of keys) {
    const value = safeStr(source[key])

    if (value) return value
  }

  return ""
}

const getPayloadText = (
  payload: CheckoutPayload | undefined,
  keys: string[]
): string => {
  const source =
    payload as unknown as Record<string, unknown> | undefined

  if (!source) return ""

  for (const key of keys) {
    const value = safeStr(source[key])

    if (value) return value
  }

  return ""
}

const CheckoutPage: React.FC = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()

  const payload =
    location.state?.payload as CheckoutPayload | undefined

  const carPCG = useAppSelector(selectCarPCG)

  /**
   * El cliente público no inicia sesión ni consulta /Auth/me.
   * Estos permisos vienen desde /Auth/TempLink/Resolve.
   */
  const permiteMultiPago = payload?.permiteMultiPago === true
  const permitePasarela = payload?.permitePasarela === true

  const [ecommerceUserId, setEcommerceUserId] = useState(0)
  const [orderId, setOrderId] = useState(0)
  const [step, setStep] = useState<CheckoutStep>("location")
  const [initializingCheckout, setInitializingCheckout] = useState(true)

  const [billingForm, setBillingForm] = useState<BillingFormState>({
    firstName: "",
    lastName: "",
    email: "",
    country: "NI",
    city: "",
    address: "",
    addressName: ""
  })

  const [selectedCoords, setSelectedCoords] = useState<Coords | null>(null)
  const [selectedCurrency, setSelectedCurrency] = useState<Currencyto | null>(null)
  const [multiPagoActivo, setMultiPagoActivoState] = useState(false)
  const [pagosMultiples, setPagosMultiples] = useState<PagoSeleccionado[]>([])
  const [locationMode, setLocationMode] = useState<LocationMode>("existing")
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null)
  const [tip, setTip] = useState(0)
  const [transpCost, setTranspCost] = useState(0)
  const [distanceKm, setDistanceKm] = useState(0)
  const [divisaOpts, setDivisaOpts] = useState<ObtenerDivisaPagosTipoRes[]>([])
  const [divisaLoading, setDivisaLoading] = useState(false)
  const [existingLog, setExistingLog] = useState<LogCartResponseDto | null>(null)
  const [, setNearestBranch] = useState<BranchLike | null>(null)
  const [payNowLock, setPayNowLock] = useState(false)
  const [payNowCooldown, setPayNowCooldown] = useState(0)

  const {
    currency,
    GetCurrencyAsync,
    GetTransportationCostAsync,
    GetNearestBranchAsync,
    loading: invoiceLoading,
    InsertaFacturaAsync
  } = useInvoiceOrder()

  const { fetchByContactId, UpdatedStatus } = useLogCart()
  const { CreateAsync: createLocationAsync, GetAsync, clientLocations } = useClientLocation()
  const { mutateAsync: completeFpiAsync } = useCompleteFpi()

  const isPickup = existingLog?.retiraSucursal === "S"
  const isOnlyTextAddress = existingLog?.onlyTextAddress === true

  /**
   * Indica que el agente dejó una dirección guardada seleccionada.
   *
   * El costo de transporte por sí solo no significa que exista una
   * dirección seleccionada. En modo solo texto, el cliente todavía debe
   * escribir su dirección aunque transCost ya venga definido en LogCart.
   */
  const hasAgentDelivery = useMemo(() => {
    if (!existingLog || isPickup || isOnlyTextAddress) return false

    return safeNumber(existingLog.addressId, 0) > 0
  }, [existingLog, isPickup, isOnlyTextAddress])

  const addressList = useMemo<ClientLocationDto[]>(() => {
    return clientLocations ?? []
  }, [clientLocations])

  const selectedAddress = useMemo<ClientLocationDto | null>(() => {
    if (selectedAddressId == null) return null

    return (
      addressList.find(
        (item) => Number(item.idDireccion) === Number(selectedAddressId)
      ) ?? null
    )
  }, [addressList, selectedAddressId])

  const cartTotal = useMemo(() => {
    const cart = carPCG?.[0] as any

    return safePositiveNumber(
      cart?.total ??
        cart?.totalFactura ??
        existingLog?.totalEnPantalla ??
        0
    )
  }, [carPCG, existingLog?.totalEnPantalla])

  const getTransporteFactura = useCallback(() => {
    if (isPickup) return 0

    const logTransp = safePositiveNumber(existingLog?.transCost)
    const stateTransp = safePositiveNumber(transpCost)

    if (logTransp > 0) return logTransp
    if (stateTransp > 0) return stateTransp

    return 0
  }, [isPickup, existingLog?.transCost, transpCost])

  const totalPagar = useMemo(() => {
    const totalBase = safePositiveNumber(cartTotal)
    const transporte = getTransporteFactura()
    const propina = safePositiveNumber(tip)

    return totalBase + transporte + propina
  }, [cartTotal, getTransporteFactura, tip])

  const payment = useCheckoutPaymentState({
    source: "customerLink",
    totalPagar,
    initialMethod: "gatewayCard"
  })

  const {
    method,
    setMethod,
    divisaSelected,
    setDivisaSelected,
    cashAmount,
    setCashAmount,
    transfer,
    setTransfer,
    manualCardData,
    setManualCardData,
    selectedSavedCard,
    setSelectedSavedCard,
    canPay
  } = payment

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
      })
    }
  })

  const payWithTokenMutation = usePayWithToken({
    onSuccess: async (response) => {
      const data = response.data

      const redirectData =
        data.riskManagement?.threeDSecure?.redirectData ??
        data.redirectData ??
        ""

      const authStatus =
        data.riskManagement?.threeDSecure?.authenticationStatus ?? ""

      const isoCode = data.isoResponseCode ?? ""
      const threeDsCompleted = authStatus === "Y" || isoCode === "3D0"

      if (redirectData) {
        navigate("/payment-hosted", {
          state: {
            payment: {
              redirectData,
              spiToken: data.spiToken,
              orderId: "CRM" + data.orderIdentifier,
              mode: "token-3ds"
            }
          }
        })

        return
      }

      if (threeDsCompleted) {
        const completeRes = await completeFpiAsync({
          spiToken: data.spiToken ?? "",
          orderId: "CRM" + data.orderIdentifier
        })

        const paymentResult = completeRes.data.payment

        const params = new URLSearchParams({
          approved: String(completeRes.data.approved ?? false),
          orderId: paymentResult?.orderIdentifier ?? "",
          transactionIdentifier: paymentResult?.transactionIdentifier ?? "",
          panToken: paymentResult?.panToken ?? "",
          cardBrand: paymentResult?.cardBrand ?? "",
          cardSuffix: paymentResult?.cardSuffix ?? "",
          code: completeRes.data.isoResponseCode ?? "",
          message: completeRes.data.responseMessage ?? ""
        })

        navigate(`/payment-result?${params.toString()}`, { replace: true })
        return
      }

      navigate("/unauthorized", { replace: true })
    }
  })

  const isGatewayCard = !multiPagoActivo && method === "gatewayCard"

  const isProcessingPayment =
    iniciarPagoMutation.isPending ||
    payWithTokenMutation.isPending

  const payNowDisabled =
    payNowLock ||
    payNowCooldown > 0 ||
    isProcessingPayment ||
    invoiceLoading ||
    (!multiPagoActivo && !canPay)

  const goToStep = (nextStep: CheckoutStep | string) => {
    if (
      (isPickup || hasAgentDelivery) &&
      nextStep === "location"
    ) {
      setStep("currency")
      return
    }

    setStep(nextStep as CheckoutStep)
  }

  const setMultiPagoActivo = (value: boolean) => {
    setMultiPagoActivoState(value)
    setSelectedCurrency(null)
    setDivisaOpts([])
    setDivisaSelected(null)
    setSelectedSavedCard(null)

    if (value) {
      setMethod(null)
      return
    }

    setPagosMultiples([])
  }

  const loadDivisaIfNeeded = async (
    item: Currencyto
  ): Promise<ObtenerDivisaPagosTipoRes[]> => {
    setDivisaLoading(true)

    try {
      const req = getDivisaConfig(item)
      const resp = await CartService.GetDivisaPagosTipoAsync(req)

      const list = Array.isArray(resp?.data)
        ? (resp.data as ObtenerDivisaPagosTipoRes[])
        : resp?.data
          ? [resp.data as ObtenerDivisaPagosTipoRes]
          : []

      const fixed = list
        .filter(Boolean)
        .map((x) => ({
          nombre: safeStr(x?.nombre),
          codigo: safeStr(x?.codigo),
          codigoExterno: safeStr(x?.codigoExterno),
          tipo: safeStr(x?.tipo),
          banco: safeStr(x?.banco),
          aCambio: safeStr(x?.aCambio)
        }))
        .filter((x) => x.codigo || x.codigoExterno || x.nombre)

      setDivisaOpts(fixed)
      setDivisaSelected(fixed.length > 0 ? fixed[0] : null)

      return fixed
    } catch {
      setDivisaOpts([])
      setDivisaSelected(null)
      toast.error("No se pudieron cargar las opciones de pago.")
      return []
    } finally {
      setDivisaLoading(false)
    }
  }

  const handleSelectCurrency = async (item: Currencyto) => {
    const nextMethod = obtenerTipoPagoDesdeMoneda(item)

    if (nextMethod === "gatewayCard" && !permitePasarela) {
      toast.error("La pasarela de pago no está habilitada para esta empresa.")
      return
    }

    setSelectedCurrency(item)
    setMethod(nextMethod)

    await loadDivisaIfNeeded(item)
  }

  const handleGoToPayment = () => {
    if (multiPagoActivo) {
      goToStep("paymentMethod")
      return
    }

    if (!selectedCurrency) {
      toast.error("Selecciona una forma de pago.")
      return
    }

    goToStep("paymentMethod")
  }

  const calcularEntrega = async (finalLocation: FinalLocation) => {
    if (isPickup || hasAgentDelivery || isOnlyTextAddress) {
      setTranspCost(isPickup ? 0 : safeNumber(existingLog?.transCost, 0))
      setDistanceKm(0)
      return
    }

    if (!finalLocation?.latitud || !finalLocation?.longitud) return

    const branch = await GetNearestBranchAsync({
      latitud: Number(finalLocation.latitud),
      longitud: Number(finalLocation.longitud)
    } as any)

    setNearestBranch(branch as BranchLike)

    if (!branch?.latitud || !branch?.longitud) return

    const distance = calculateDistance(
      Number(finalLocation.latitud),
      Number(finalLocation.longitud),
      Number(branch.latitud),
      Number(branch.longitud)
    )

    setDistanceKm(distance)

    const transportation = await GetTransportationCostAsync(distance)

    setTranspCost(Number(transportation ?? 0))
  }

  const handleCoordsChangeFromMap = async (coords: Coords) => {
    setSelectedCoords(coords)

    try {
      const address = await getAddressFromCoords(
        Number(coords.latitud),
        Number(coords.longitud)
      )

      setBillingForm((prev) => ({
        ...prev,
        city: address.city || prev.city,
        country: address.country || prev.country || "NI",
        address: address.fullAddress || prev.address,
        addressName: prev.addressName || ""
      }))
    } catch {
      toast.info("Ubicación seleccionada. Completa la dirección manualmente.")
    }
  }

  const handleGoToCurrencyFromLocation = async () => {
    if (isPickup) {
      setTranspCost(0)
      setDistanceKm(0)
      setSelectedAddressId(null)
      setSelectedCoords(null)
      goToStep("currency")
      return
    }

    if (isOnlyTextAddress) {
      const validBilling = validateBillingForm(
        billingForm,
        "text",
        true
      )

      if (!validBilling) return

      setLocationMode("text")
      setSelectedAddressId(null)
      setSelectedCoords(null)
      setDistanceKm(0)
      setTranspCost(safeNumber(existingLog?.transCost, 0))
      goToStep("currency")
      return
    }

    if (hasAgentDelivery) {
      setTranspCost(safeNumber(existingLog?.transCost, 0))
      setDistanceKm(0)
      goToStep("currency")
      return
    }

    if (!validateLocation(locationMode, selectedAddressId, selectedCoords)) {
      return
    }

    if (locationMode === "new") {
      const validBilling = validateBillingForm(billingForm, locationMode)

      if (!validBilling) return

      if (selectedCoords) {
        await calcularEntrega({
          descripcion: billingForm.address,
          referencia: billingForm.city,
          latitud: selectedCoords.latitud,
          longitud: selectedCoords.longitud
        })
      }
    }

    if (locationMode === "existing" && selectedAddress) {
      await calcularEntrega(selectedAddress as FinalLocation)
    }

    goToStep("currency")
  }

  const resolveFinalLocation = async (): Promise<FinalLocation | null> => {
    if (isPickup) {
      return {
        nombre: "Retira en sucursal",
        descripcion: existingLog?.branchName ?? "",
        referencia: existingLog?.branch ?? ""
      }
    }

    if (isOnlyTextAddress) {
      const validBilling = validateBillingForm(
        billingForm,
        "text",
        true
      )

      if (!validBilling) return null

      return {
        idDireccion: null,
        nombre: safeStr(billingForm.addressName) || "Dirección de entrega",
        descripcion: safeStr(billingForm.address),
        referencia: null,
        latitud: null,
        longitud: null
      }
    }

    if (hasAgentDelivery) {
      const saved = selectedAddressId == null
        ? null
        : addressList.find(
            (item) => Number(item.idDireccion) === Number(selectedAddressId)
          )

      if (saved) return saved as FinalLocation

      return {
        idDireccion: selectedAddressId,
        nombre:
          getLogText(existingLog, ["addressName", "nombreDireccion"]) ||
          "Dirección de entrega",
        descripcion:
          getLogText(existingLog, [
            "address",
            "direccion",
            "direccionCte",
            "descripcionDireccion",
            "descripcion"
          ]) || "Dirección indicada por el agente",
        referencia:
          getLogText(existingLog, ["referencia", "reference", "city", "ciudad"]) ||
          safeStr(existingLog?.branch)
      }
    }

    if (safeNumber(selectedAddressId, 0) > 0) {
      const saved = addressList.find(
        (item) => Number(item.idDireccion) === Number(selectedAddressId)
      )

      return saved ? (saved as FinalLocation) : null
    }

    if (locationMode === "new") {
      const validBilling = validateBillingForm(billingForm, locationMode)

      if (!validBilling) return null

      if (!selectedCoords) {
        toast.error("Selecciona una ubicación en el mapa.")
        return null
      }

      const newLocation = await createLocationAsync({
        nombre: billingForm.addressName || billingForm.address,
        descripcion: billingForm.address,
        referencia: billingForm.city,
        latitud: selectedCoords.latitud,
        longitud: selectedCoords.longitud,
        idUsuario: ecommerceUserId
      })

      return newLocation as FinalLocation
    }

    return null
  }

  const validateTotalsBeforeInvoice = async ({
    codSucursalFactura
  }: {
    codSucursalFactura: string
  }) => {
    const totalesPantallaReq = {
      descuentoPantalla: existingLog?.DescuentoPantalla ?? 0,
      exonerado: "N",
      ivaPantalla: existingLog?.ivaPantalla ?? 0,
      maquina: `CRM-${payload?.contactId}`,
      sucursal: existingLog?.branch ?? codSucursalFactura,
      tabla: "det_factura_tempo",
      totalEnPantalla: existingLog?.subTotal ?? 0,
      usuario: String(payload?.contactId ?? "")
    }

    const validacionTotales =
      await CartService.sp_valida_SobTotalFactura(totalesPantallaReq)

    const { pasasub, pasadesc, pasaiva } =
      validacionTotales.data?.[0] ?? {}

    const errores: Record<string, string> = {
      pasasub: "Subtotal no válido, diferencia con el valor real.",
      pasadesc: "Descuento no válido, diferencia con el valor real.",
      pasaiva: "IVA no válido, diferencia con el valor real."
    }

    const fallo = [
      { key: "pasasub", value: pasasub },
      { key: "pasadesc", value: pasadesc },
      { key: "pasaiva", value: pasaiva }
    ].find((item) => item.value === "N")

    if (fallo) {
      throw new Error(`(${errores[fallo.key]})`)
    }
  }

  const construirDetallePagoFinal = ({
    facturaBase,
    codSucursalFactura,
    tasaCambio
  }: {
    facturaBase: FacturaTempo
    codSucursalFactura: string
    tasaCambio: number
  }): PagoGenerico[] => {
    if (multiPagoActivo) {
      const error = validarPagosSeleccionados(
        pagosMultiples,
        totalPagar
      )

      if (error) {
        throw new Error(error)
      }

      const facturaParaPago = {
        ...facturaBase,
        tasaCambio,
        moneda: safeStr(facturaBase.moneda) || "1",
        codEmpresa: safeStr(facturaBase.codEmpresa)
      } as FacturaTempo

      return construirDetallePago(
        pagosMultiples,
        facturaParaPago,
        codSucursalFactura,
        totalPagar
      )
    }

    if (!method) {
      throw new Error("Selecciona un método de pago.")
    }

    return [
      buildPagoGenerico({
        method,
        total: totalPagar,
        selectedCurrency,
        divisaSelected,
        codSucursal: codSucursalFactura,
        tasaCambio,
        transfer,
        manualCardData,
        moneda: safeStr(facturaBase.moneda) || "1",
        codEmpresa: safeStr(facturaBase.codEmpresa)
      })
    ]
  }

  const handlePayNow = async () => {
    if (!payload) {
      toast.error("No se encontró la información del pedido.")
      return
    }

    if (!multiPagoActivo && !method) {
      toast.error("Selecciona un método de pago.")
      return
    }

    if (payNowLock) return

    setPayNowLock(true)
    setPayNowCooldown(3)

    try {
      const finalLocation = await resolveFinalLocation()

      if (!finalLocation) {
        toast.error("No se pudo determinar la dirección final.")
        return
      }

      if (!isPickup && !hasAgentDelivery) {
        const validLocation = validateLocation(
          locationMode,
          selectedAddressId,
          selectedCoords,
          isOnlyTextAddress,
          billingForm.address
        )

        if (!validLocation) return
      }

      const facturaBase = await loadFacturaTempo()
      const codSucursalFactura = safeStr(existingLog?.branch)

      if (!codSucursalFactura) {
        toast.error("No fue posible determinar la sucursal de factura.")
        return
      }

      await validateTotalsBeforeInvoice({ codSucursalFactura })

      const falote: FaloteRequestDto = {
        codSucursal: codSucursalFactura,
        documento: "OrdenFactura"
      }

      const dataconse = await CartService.GetConsecDocAsync(falote)
      const consecutivo = Number(dataconse?.data?.consecutivo ?? 0)

      if (!consecutivo) {
        toast.error("No fue posible obtener el consecutivo de factura.")
        return
      }

      const nombreCliente =
      getLogText(existingLog, [
        "invoiceName",
        "InvoiceName",
        "nombreFactura",
        "nombreCliente"
      ]) ||
      getLogText(existingLog, [
        "contactName",
        "clientName",
        "customerName",
        "cliente"
      ]) ||
      getPayloadText(payload, ["fullName"]) ||
      "Cliente"

      const telefonoContacto =
        getLogText(existingLog, [
          "contactPhone",
          "phone",
          "telefono",
          "telefonoCte",
          "waId"
        ]) ||
        getPayloadText(payload, [
          "phone",
          "telefono",
          "contactPhone"
        ])

      const sellerName =
        getLogText(existingLog, [
          "createdByFullName",
          "createdByNickname",
          "createdByName",
          "userName",
          "sellerName",
        ]) ||
        getPayloadText(payload, [
          "sellerName",
          "userName"
        ]) ||
        "Venta en línea"

      const companyName =
        getLogText(existingLog, [
          "companyName",
        ]) ||
        getPayloadText(payload, [
          "companyName"
        ]) ||
        "Empresa"

      const pdfContext = {
        sellerName,
        contactName: nombreCliente,
        contactPhone: telefonoContacto,
        companyName
      }

      const detallePago = construirDetallePagoFinal({
        facturaBase,
        codSucursalFactura,
        tasaCambio
      })

      const invoiceReqFinal = buildFacturaTempo({
        facturaBase,
        codSucursalFactura,
        consecutivo,
        orderId,
        contactId: payload.contactId,
        nombreCliente,
        direccionCte: safeStr(finalLocation.descripcion),
        referencia: safeStr(finalLocation.referencia),
        valorTransporte: getTransporteFactura(),
        retiraSucursal:
          existingLog?.retiraSucursal != null
            ? String(existingLog.retiraSucursal)
            : "N",
        observacion: existingLog?.observacion ?? "",
        serie: existingLog?.serie ?? facturaBase.serie,
        detallePago,
        tasa: tasaCambio,
        correo: billingForm.email,
        telefonoCte: telefonoContacto
      })

      if (isGatewayCard) {
        const totalMonto = totalPagar

        sessionStorage.setItem(
          CHECKOUT_INVOICE_KEY,
          JSON.stringify(invoiceReqFinal)
        )

        sessionStorage.setItem(
          CHECKOUT_PAYLOAD_KEY,
          JSON.stringify(payload)
        )

        sessionStorage.setItem(
          ECOMMERCEUSERID_KEY,
          JSON.stringify(ecommerceUserId)
        )

        sessionStorage.setItem(
          CHECKOUT_PDF_CONTEXT_KEY,
          JSON.stringify(pdfContext)
        )

        if (selectedSavedCard?.panToken) {
          const requestToken: PowertranzPayWithTokenRequestDto = {
            transactionIdentifier: null,
            orderId: String(consecutivo),
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
          }

          await payWithTokenMutation.mutateAsync(requestToken)
          return
        }

        await iniciarPagoMutation.mutateAsync({
          orderId: String(consecutivo),
          amount: totalMonto,
          currencyCode: "558"
        })

        return
      }

      await procesarVentaCheckout({
        source: "customerLink",
        paymentMethod: multiPagoActivo
          ? "cash"
          : method as CheckoutPaymentMethod,
        paymentState: payment.paymentState,
        invoiceReqFinal,
        payload,
        orderId,
        transactionIdentifier: "",
        usarPdfPagoElectronico: false,
        codSucursalFactura,
        consecutivo,
        pdfContext,
        fetchByContactId,
        updatedStatus: UpdatedStatus,
        insertaFacturaAsync: InsertaFacturaAsync,
        dispatch,
        navigate
      })
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Error procesando pago."

      toast.error(message)
      navigate("/unauthorized", { replace: true })
    } finally {
      window.setTimeout(() => setPayNowLock(false), 500)
    }
  }

  useEffect(() => {
    if (!payload) return

    const hasMultiPagoPermission =
      typeof payload.permiteMultiPago === "boolean"

    const hasGatewayPermission =
      typeof payload.permitePasarela === "boolean"

    if (!hasMultiPagoPermission || !hasGatewayPermission) {
      console.error(
        "TempLink/Resolve no devolvió los permisos de pago requeridos.",
        payload
      )

      toast.error(
        "No se pudo obtener la configuración de pagos de la empresa."
      )

      navigate("/unauthorized", { replace: true })
    }
  }, [payload, navigate])

  useEffect(() => {
    if (!payload) {
      navigate("/unauthorized", { replace: true })
      return
    }

    setEcommerceUserId(Number(payload.ecommerceUserId ?? 0))
    setOrderId(Number(payload.orderId ?? 0))

    dispatch(
      getProductFromCarAsync({
        codCliente: payload.contactId,
        noPedido: Number(payload.orderId ?? 0)
      })
    )
  }, [payload, dispatch, navigate])

  useEffect(() => {
    if (!payload?.contactId) return

    const loadInitialData = async () => {
      setInitializingCheckout(true)

      try {
        const log = await fetchByContactId(payload.contactId)
        const logIsPickup = log?.retiraSucursal === "S"
        const logOnlyTextAddress = log?.onlyTextAddress === true
        // SQL puede devolver 0 cuando no existe dirección; solo valores mayores que cero son válidos.
        const logAddressId = safeNumber(log?.addressId, 0)
        const logHasAgentDelivery =
          !logIsPickup &&
          !logOnlyTextAddress &&
          logAddressId > 0

        setExistingLog(log)

        if (logIsPickup) {
          setTranspCost(0)
          setDistanceKm(0)
          setSelectedAddressId(null)
          setSelectedCoords(null)
          setLocationMode("existing")

          await GetCurrencyAsync()

          setStep("currency")
          return
        }

        if (logOnlyTextAddress) {
          setLocationMode("text")
          setSelectedAddressId(null)
          setSelectedCoords(null)
          setDistanceKm(0)
          setTranspCost(safeNumber(log?.transCost, 0))

          setBillingForm((previous) => ({
            ...previous,
            address: "",
            addressName: "",
            city: ""
          }))

          await GetCurrencyAsync()

          setStep("location")
          return
        }

        if (logHasAgentDelivery) {
          setSelectedAddressId(logAddressId)
          setLocationMode("existing")

          setSelectedCoords(null)
          setDistanceKm(0)
          setTranspCost(safeNumber(log?.transCost, 0))

          await GetCurrencyAsync()
          await GetAsync(Number(payload.ecommerceUserId ?? 0))

          setStep("currency")
          return
        }

        setSelectedAddressId(null)
        setLocationMode("existing")

        if (log?.transCost != null) {
          setTranspCost(safeNumber(log.transCost, 0))
        }

        await GetCurrencyAsync()
        await GetAsync(Number(payload.ecommerceUserId ?? 0))

        setStep("location")
      } catch {
        toast.error("No se pudo cargar la información del checkout.")
      } finally {
        setInitializingCheckout(false)
      }
    }

    void loadInitialData()
  }, [
    payload?.contactId,
    payload?.ecommerceUserId,
    fetchByContactId,
    GetCurrencyAsync,
    GetAsync
  ])

  useEffect(() => {
    if (!permiteMultiPago && multiPagoActivo) {
      setMultiPagoActivo(false)
    }
  }, [permiteMultiPago, multiPagoActivo])

  useEffect(() => {
    if (payNowCooldown <= 0) return

    const timer = window.setInterval(() => {
      setPayNowCooldown((current) => (current <= 1 ? 0 : current - 1))
    }, 1000)

    return () => window.clearInterval(timer)
  }, [payNowCooldown])

  useEffect(() => {
    if (!selectedCoords) return
    if (isPickup || hasAgentDelivery || isOnlyTextAddress) return

    void calcularEntrega({
      descripcion: billingForm.address,
      referencia: billingForm.city,
      latitud: selectedCoords.latitud,
      longitud: selectedCoords.longitud
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCoords])

  return (
    <section className="checkout-page">
      <div className="checkout-shell">
        <div className="checkout-page__title">
          <h1 className="checkout-page__title__value">Checkout</h1>
        </div>

        <div className="checkout-main">
          <div className="checkout-left">
            {initializingCheckout && (
              <div className="checkout-section">
                <p className="checkout-hint">Cargando checkout...</p>
              </div>
            )}

            {!initializingCheckout &&
              step === "location" &&
              isOnlyTextAddress && (
                <OnlyTextAddressSection
                  billingForm={billingForm}
                  transpCost={getTransporteFactura()}
                  disabled={invoiceLoading}
                  onChange={(field, value) => {
                    setBillingForm((previous) => ({
                      ...previous,
                      [field]: value
                    }))
                  }}
                  onContinue={handleGoToCurrencyFromLocation}
                />
              )}

            {!initializingCheckout &&
              step === "location" &&
              !isOnlyTextAddress && (
                <LocationSection
                  addressList={addressList}
                  locationMode={locationMode}
                  setLocationMode={setLocationMode}
                  selectedAddressId={selectedAddressId}
                  setSelectedAddressId={setSelectedAddressId}
                  selectedCoords={selectedCoords}
                  setSelectedCoords={setSelectedCoords}
                  billingForm={billingForm}
                  setBillingForm={setBillingForm}
                  selectedAddress={selectedAddress}
                  handleBillingChange={(event) => {
                    const { id, value } = event.target

                    setBillingForm((previous) => ({
                      ...previous,
                      [id]: value
                    }))
                  }}
                  handleGoToCurrency={handleGoToCurrencyFromLocation}
                  handleCoordsChange={handleCoordsChangeFromMap}
                  isLocked={false}
                  isPickup={isPickup}
                />
              )}

            {!initializingCheckout && step === "currency" && (
              <CurrencySection
                step={step}
                currency={currency}
                selectedCurrency={selectedCurrency}
                handleSelectCurrency={handleSelectCurrency}
                invoiceLoading={invoiceLoading}
                setStep={goToStep}
                handleGoToPayment={handleGoToPayment}
                permiteMultiPago={permiteMultiPago}
                permitePasarela={permitePasarela}
                multiPagoActivo={multiPagoActivo}
                setMultiPagoActivo={setMultiPagoActivo}
              />
            )}

            {!initializingCheckout && step === "paymentMethod" && (
              <PaymentMethodComponent
                step={step}
                setStep={goToStep}
                method={method}
                setMethod={setMethod}
                allowedMethods={[
                  "cash",
                  "transfer",
                  "manualCard",
                  "gatewayCard"
                ]}
                distanceKm={distanceKm}
                transpCost={getTransporteFactura()}
                tip={tip}
                setTip={setTip}
                cashAmount={cashAmount}
                setCashAmount={setCashAmount}
                transfer={transfer}
                setTransfer={setTransfer}
                payNowDisabled={payNowDisabled}
                payNowLock={payNowLock}
                handlePayNow={handlePayNow}
                divisaLoading={divisaLoading}
                divisaOpts={divisaOpts}
                divisaSelected={divisaSelected}
                setDivisaSelected={setDivisaSelected}
                carPCG={carPCG}
                totalPagar={totalPagar}
                existingLog={existingLog}
                ecommerceUserId={ecommerceUserId}
                onSelectCard={setSelectedSavedCard}
                manualCardData={manualCardData}
                setManualCardData={setManualCardData}
                backStep="currency"
                payButtonText="Pagar ahora"
                showMethodSelector={false}
                multiPagoActivo={multiPagoActivo}
                pagosMultiples={pagosMultiples}
                setPagosMultiples={setPagosMultiples}
                currency={currency}
                cargarDivisas={loadDivisaIfNeeded}
              />
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

export default CheckoutPage