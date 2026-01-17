import { useEffect, useMemo, useState } from "react";
import { FaShoppingCart } from "react-icons/fa";
import { useProductPCG } from "@/Hooks/Ecommerce/useProductPCG";
import type {
  listaOpciones,
  ProductoModificadorPCGInterface,
  ProductoPCGInterface,
} from "@/Interfaces/Chat/ProductPCGInterface";
import type { DetalleFacturaTempoRequest, FaloteRequestDto } from "@/Interfaces/Crm/CartPCGInterface";
import "@/Styles/Ecommerce/DetailProduct.css";
import { addProductTempoAsync, getProductFromCarAsync, selectCartLoading } from "@/Context/Slices/Ecommerce/cartSlice";
import { useDispatch, useSelector, type TypedUseSelectorHook } from "react-redux";
import type { RootState, AppDispatch } from "@/Context";
import useLogCart from "@/Hooks/Crm/useLogCard";
import type { LogCartRequestDto } from "@/Interfaces/Crm/LogCartInterface";
import { toast } from "react-toastify";
import { setContactCartBadge } from "@/Context/Slices/Ecommerce/cartBadgeSlice";
import { SendMediaECommerceFromUrlAsync } from "@/Services/chat/MessageService";
import { IoMdSend } from "react-icons/io";
import Button from "@/Components/Common/Button";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import type { SelectedInterface } from "./ProductTab";
import aguamarina from "@/assets/aguamarina.png";
import { MdInventory } from "react-icons/md";
import { CartService } from "@/Services/Ecommerce/CarPCGService";

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

interface Props {
  detail: ProductoPCGInterface;
  contactId: number;
  conversationId: number;
  setDetailProduct: (detailP: ProductoPCGInterface | null) => void;
  setselectedCategory: (category: SelectedInterface | null) => void;
}

type BranchPick = {
  codsucursal: string;
  sucursal: string;
  serie: string;
  existencia: number;
  medida: string;
};

const DetailPCGProduct = ({ detail, contactId, conversationId, setDetailProduct, setselectedCategory }: Props) => {
  const [cantidad, setCantidad] = useState<number>(1);
  const [total, setTotal] = useState<number>(0);
  const [observacion, setObservacion] = useState<string>("");
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string[]>>({});
  const [optionQuantities, setOptionQuantities] = useState<Record<string, number>>({});
  const { productModifiers, getProductModifiers } = useProductPCG();
  const [sending, setSending] = useState<boolean>(false);
  const dispatch = useAppDispatch();
  const loading = useAppSelector(selectCartLoading);
  const { create: createLogCart, fetchByContactId } = useLogCart();
  const [ismaximize, setismaximize] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  const [lockedBranch, setLockedBranch] = useState<string | null>(null);
  const [branchRows, setBranchRows] = useState<BranchPick[]>([]);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [branchUiSelected, setBranchUiSelected] = useState<string | null>(null);

  const authRaw = localStorage.getItem("auth") || "{}";
  const { userId } = JSON.parse(authRaw);

  useEffect(() => {
    const run = async () => {
      const existingLog = await fetchByContactId(contactId);
      if (existingLog?.branch) {
        setLockedBranch(existingLog.branch);
        setBranchUiSelected(existingLog.branch);
      }
    };
    run();
  }, [contactId, fetchByContactId]);

  useEffect(() => {
    const run = async () => {
      const cod = (detail?.codProducto ?? "").trim();
      if (!cod) {
        setBranchRows([]);
        return;
      }

      setLoadingBranches(true);
      try {
        const res = await CartService.getProductFromTempTotal(cod);
        const data = Array.isArray(res) ? (res as BranchPick[]) : [];
        setBranchRows(data);
        if (!lockedBranch && !branchUiSelected && data.length > 0) {
          setBranchUiSelected(data[0].codsucursal);
        }
      } catch {
        setBranchRows([]);
      } finally {
        setLoadingBranches(false);
      }
    };
    run();
  }, [detail?.codProducto, lockedBranch, branchUiSelected]);

  useEffect(() => {
    if (!detail?.codProducto) return;
    if (detail.tieneOpcion == false) return;
    getProductModifiers(detail.codProducto);
  }, [detail?.codProducto, getProductModifiers]);

  useEffect(() => {
    if (!productModifiers || productModifiers.length === 0) {
      setSelectedOptions({});
      setOptionQuantities({});
      return;
    }

    const initialSelected: Record<string, string[]> = {};
    const initialQuantities: Record<string, number> = {};

    productModifiers.forEach((mod: ProductoModificadorPCGInterface) => {
      const key = String(mod.codModificador);
      const defaults = mod.listOpciones
        .filter((op: listaOpciones) => op.esOpcionDefecto === "S")
        .map((op: listaOpciones) => op.codOpcion);

      if (defaults.length > 0) {
        const maxSel = Number(mod.maximoSel ?? 0);
        const limited = maxSel > 0 ? defaults.slice(0, maxSel) : defaults;
        initialSelected[key] = limited;

        limited.forEach((cod) => {
          const op = mod.listOpciones.find((o) => o.codOpcion === cod);
          const maxPerItem = op?.cantidad ?? 1;
          const base = 1;
          initialQuantities[cod] = base > maxPerItem ? maxPerItem : base;
        });
      }
    });

    setSelectedOptions(initialSelected);
    setOptionQuantities(initialQuantities);
  }, [productModifiers]);

  const optionIndex = useMemo(() => {
    const map = new Map<
      string,
      {
        codOpcion: string;
        descripcionOp: string;
        codPrecio: number | string;
        precioVenta: number;
        cantidad: number;
        totalMenu: number;
        codUm: string;
        codTipoModificador?: string;
        codModificador?: string;
      }
    >();

    if (productModifiers) {
      productModifiers.forEach((mod: ProductoModificadorPCGInterface) => {
        mod.listOpciones.forEach((op: listaOpciones) => {
          map.set(op.codOpcion, {
            codOpcion: op.codOpcion,
            descripcionOp: op.descripcionOp,
            codPrecio: op.codPrecio,
            precioVenta: Number(op.precioVenta),
            cantidad: op.cantidad,
            totalMenu: op.precioVenta * op.cantidad,
            codUm: op.codUm,
            codTipoModificador: mod.codTipoModificador,
            codModificador: mod.codModificador,
          });
        });
      });
    }
    return map;
  }, [productModifiers]);

  useEffect(() => {
    if (!productModifiers || productModifiers.length === 0) return;

    setOptionQuantities((prev) => {
      const updated = { ...prev };

      productModifiers.forEach((mod: ProductoModificadorPCGInterface) => {
        const key = String(mod.codModificador);
        const selectedForMod = selectedOptions[key] ?? [];

        mod.listOpciones.forEach((op: listaOpciones) => {
          const id = op.codOpcion;
          if (!selectedForMod.includes(id)) return;

          const maxPerItem = op.cantidad ?? 1;
          const minPerItem = 1;
          const current = updated[id];

          let next = current ?? minPerItem;
          if (next < minPerItem) next = minPerItem;
          if (next > maxPerItem) next = maxPerItem;
          updated[id] = next;
        });
      });

      return updated;
    });
  }, [productModifiers, selectedOptions]);

  useEffect(() => {
    let optionsTotal = 0;
    Object.values(selectedOptions).forEach((optionIds) => {
      optionIds.forEach((id) => {
        const option = optionIndex.get(id);
        if (option) {
          const qtyPerItem = optionQuantities[id] ?? 1;
          optionsTotal += qtyPerItem * cantidad * Number(option.precioVenta);
        }
      });
    });
    const basePrice = cantidad * Number(detail.precio ?? 0);
    setTotal(basePrice + optionsTotal);
  }, [cantidad, selectedOptions, optionQuantities, optionIndex, detail]);

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    if (Number.isNaN(value) || value <= 0) setCantidad(1);
    else setCantidad(value);
  };

  const handleToggleOption = (modifier: ProductoModificadorPCGInterface, codOpcion: string) => {
    setSelectedOptions((prev) => {
      const key = String(modifier.codModificador);
      const current = prev[key] ?? [];
      let nextForModifier: string[] = [];

      const maxSel = Number(modifier.maximoSel ?? 0);

      if (modifier.esMultipleSeleccion) {
        if (current.includes(codOpcion)) {
          nextForModifier = current.filter((id) => id !== codOpcion);

          setOptionQuantities((prevQty) => {
            const rest = { ...prevQty };
            delete rest[codOpcion];
            return rest;
          });
        } else {
          const op = modifier.listOpciones.find((o) => o.codOpcion === codOpcion);
          const maxPerItem = op?.cantidad ?? 1;
          const base = 1;
          const initialQty = Math.min(base, maxPerItem);

          const currentTotal = current.reduce((sum, id) => sum + (optionQuantities[id] ?? 1), 0);

          if (maxSel > 0 && currentTotal + initialQty > maxSel) {
            toast.warning(`No puede seleccionar más de ${maxSel} en "${modifier.descripcionMod}".`);
            return prev;
          }

          nextForModifier = [...current, codOpcion];

          setOptionQuantities((prevQty) => ({
            ...prevQty,
            [codOpcion]: prevQty[codOpcion] ?? initialQty,
          }));
        }
      } else {
        if (current.includes(codOpcion)) {
          nextForModifier = [];
          setOptionQuantities((prevQty) => {
            const rest = { ...prevQty };
            delete rest[codOpcion];
            return rest;
          });
        } else {
          const op = modifier.listOpciones.find((o) => o.codOpcion === codOpcion);
          const maxPerItem = op?.cantidad ?? 1;
          const base = 1;
          const initialQty = Math.min(base, maxPerItem);

          nextForModifier = [codOpcion];

          setOptionQuantities((prevQty) => ({
            ...prevQty,
            [codOpcion]: prevQty[codOpcion] ?? initialQty,
          }));
        }
      }

      return { ...prev, [key]: nextForModifier };
    });
  };

  const isOptionSelected = (modifier: ProductoModificadorPCGInterface, codOpcion: string) => {
    const key = String(modifier.codModificador);
    const current = selectedOptions[key] ?? [];
    return current.includes(codOpcion);
  };

  const handleOptionQuantityChange = (modifier: ProductoModificadorPCGInterface, codOpcion: string, value: number) => {
    if (Number.isNaN(value)) return;

    let safe = value < 1 ? 1 : value;

    const option = optionIndex.get(codOpcion);
    const maxPerItem = option?.cantidad ?? Number.MAX_SAFE_INTEGER;
    if (safe > maxPerItem) safe = maxPerItem;

    const key = String(modifier.codModificador);
    const selectedForMod = selectedOptions[key] ?? [];
    if (!selectedForMod.includes(codOpcion)) return;

    const maxSel = Number(modifier.maximoSel ?? 0);

    if (maxSel > 0) {
      const totalOther = selectedForMod
        .filter((id) => id !== codOpcion)
        .reduce((sum, id) => sum + (optionQuantities[id] ?? 1), 0);

      const remaining = maxSel - totalOther;

      if (remaining <= 0) {
        toast.warning(`Ya alcanzó el máximo de ${maxSel} para "${modifier.descripcionMod}".`);
        return;
      }

      if (safe > remaining) {
        safe = remaining;
        toast.warning(
          `Solo puede asignar hasta ${remaining} a esta opción para no superar ${maxSel} en "${modifier.descripcionMod}".`
        );
      }
    }

    setOptionQuantities((prev) => ({ ...prev, [codOpcion]: safe }));
  };

  const buildCartRequest = (branch: string): DetalleFacturaTempoRequest => {
    const baseItem: DetalleFacturaTempoRequest = {
      sucursal: branch,
      usuario: String(contactId),
      maquina: `CRM-${contactId}`,
      fecha: "20260116",
      codproducto: detail.codProducto.trim(),
      codprecio: "01",
      precio: detail.precio,
      bodega: "010",
      cantidadmovimiento: cantidad,
      medidamovimiento: "",
      nofactura: "00000000",
      tipo: "1",
      tipodesc: "N",
      tipotrabajo: "INSERT",
      tasacambio: 36.0,
      financiamiento: 0,
      descuento: 0,
      codvendedor: "000",
      codcliente: "00000",
      autorizado: "N",
      producto: detail.descripcion.trim(),
      tabla: "det_factura_tempo",
      vincularse: "N",
      servicioventa: 1,
      facturaexonerada: "N",
      lote: "Sin Lote",
      vencimiento: "20260116",
      vienedelabusqueda: "N",
      observacion,
      iddescuentolineal: 0,
      vienedebusquedaprioridadproducto: "S",
      pol_Sumacant: "S",
    };
    return baseItem;
  };

  const refreshBadge = async (noPedido: number) => {
    const updated = await dispatch(getProductFromCarAsync({ codCliente: contactId ?? 0, noPedido })).unwrap();
    const arr = Array.isArray(updated) ? updated : [];
    const count = arr[0]?.listDetalle?.reduce((sum, d) => sum + Number(d.cantidad ?? 0), 0) ?? 0;

    dispatch(
      setContactCartBadge({
        contactId,
        hasCart: count > 0,
        count,
      })
    );
  };

  const addToCartCore = async (branch: string) => {
    const existingLog = await fetchByContactId(contactId);

    let consecutivo = 0;
    let branchToUse = branch;

    if (existingLog?.orderId && existingLog.orderId > 0) {
      consecutivo = existingLog.orderId;
      branchToUse = existingLog.branch;
    } else {
      const falote: FaloteRequestDto = { codSucursal: branch, documento: "GetConsecDoc" };
      const data = await CartService.GetConsecDocAsync(falote);
      consecutivo = Number(data.data.consecutivo);
      branchToUse = branch;
    }

    const req = buildCartRequest(branchToUse);
    req.nofactura = String(consecutivo).trim();
    req.sucursal = branchToUse;

    await dispatch(addProductTempoAsync(req)).unwrap();

    const tempo = await dispatch(
      getProductFromCarAsync({ codCliente: contactId ?? 0, noPedido: Number(req.nofactura) })
    ).unwrap();

    const orderId = Number(tempo?.[0]?.noPedido ?? 0);
    if (orderId <= 0) {
      toast.error("No se pudo obtener el número de pedido.");
      return;
    }

    if (!existingLog) {
      const logOrderRequest: LogCartRequestDto = {
        orderId,
        contactId,
        conversationId,
        statusId: 1,
        branch: branchToUse,
      };
      await createLogCart(logOrderRequest);
    }

    await refreshBadge(orderId);

    if (!lockedBranch) setLockedBranch(branchToUse);

    setCantidad(1);
    setselectedCategory(null);
    setDetailProduct(null);
  };

  const handleAddToCart = async () => {
    if (cantidad <= 0) {
      toast.warning("La cantidad debe ser al menos 1.");
      return;
    }

    if (productModifiers && productModifiers.length > 0) {
      let firstError: string | null = null;

      for (const mod of productModifiers) {
        if (mod.esRequerido !== "S") continue;

        const key = String(mod.codModificador);
        const sel = selectedOptions[key] ?? [];

        if (!mod.esMultipleSeleccion) {
          if (sel.length !== 1) {
            firstError = `Seleccione una opción en "${mod.descripcionMod}".`;
            break;
          }
        } else {
          if (sel.length === 0) {
            firstError = `Seleccione al menos una opción en "${mod.descripcionMod}".`;
            break;
          }
        }
      }

      if (firstError) {
        toast.warning(firstError);
        return;
      }
    }

    if (lockedBranch) {
      await addToCartCore(lockedBranch);
      return;
    }

    const existingLog = await fetchByContactId(contactId);
    if (existingLog?.branch) {
      setLockedBranch(existingLog.branch);
      await addToCartCore(existingLog.branch);
      return;
    }

    const pick = branchUiSelected ?? branchRows[0]?.codsucursal ?? null;
    if (!pick) {
      toast.error("No hay sucursales disponibles.");
      return;
    }

    await addToCartCore(pick);
  };

  const handlePickBranch = async (codsucursal: string) => {
    if (lockedBranch) return;
    const existingLog = await fetchByContactId(contactId);
    if (existingLog?.branch) {
      setLockedBranch(existingLog.branch);
      setBranchUiSelected(existingLog.branch);
      return;
    }

    setBranchUiSelected(codsucursal);
  };

  const canPickBranch = !lockedBranch;

  const renderBranches = () => {
    if (loadingBranches) return <div className="detail-product__branchListLoading">Cargando sucursales...</div>;
    if (!branchRows.length) return null;

    const rows = [...branchRows].sort((a, b) => (b.existencia ?? 0) - (a.existencia ?? 0));

    return (
      <div className="detail-product__branchList">
        {rows.map((x) => {
          const active = (lockedBranch ?? branchUiSelected) === x.codsucursal;
          return (
            <button
              key={`${x.codsucursal}-${x.serie}-${x.sucursal}`}
              type="button"
              className={`detail-product__branchItem ${active ? "detail-product__branchItem--active" : ""}`}
              onClick={() => handlePickBranch(x.codsucursal)}
              disabled={!canPickBranch}
              title={!canPickBranch ? "Sucursal bloqueada" : "Seleccionar sucursal"}
            >
              <div className="detail-product__branchItemMain">
                <span className="detail-product__branchCode">{x.codsucursal}</span>
                <span className="detail-product__branchName">{x.sucursal}</span>
                <span className="detail-product__branchSerie">Serie {x.serie}</span>
              </div>
              <div className="detail-product__branchItemMeta">
                <span className="detail-product__branchStock">
                  {x.existencia} {x.medida}
                </span>
                <span className="detail-product__branchRadio" aria-hidden="true">
                  {active ? "●" : "○"}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    );
  };

  const buildModifiersMessage = (mods: ProductoModificadorPCGInterface[] | null) => {
    if (!mods || mods.length === 0) return "";
    const lines: string[] = [];

    mods.forEach((mod) => {
      mod.listOpciones.forEach((op) => {
        if (isOptionSelected(mod, op.codOpcion)) {
          const header = `\n${mod.descripcionMod}`;
          const precio = op.precioVenta > 0 ? ` - C$ ${op.precioVenta.toFixed(2)}` : " - Precio Incluido";
          const option = `• ${op.descripcionOp}${precio}`;
          const optionMessage = `${header}\n${option}`;
          if (optionMessage.length <= 1024) lines.push(optionMessage);
        }
      });
    });

    if (!lines.length) {
      toast.warn("El texto permitido para la imagen es de 1024 caractares");
      return "";
    }

    return `\n\n*Opciones:*\n${lines.join("\n")}`;
  };

  const handleSendProductMessage = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    e.preventDefault();
    if (sending) return;
    if (!conversationId || !userId) return;

    setSending(true);
    try {
      const parts: string[] = [];

      if (detail.descripcion) parts.push(`*Producto:* ${detail.descripcion}`);
      if (detail.contenido) parts.push(`*Contenido:* ${detail.contenido}`);
      if (detail.precio && detail.precio > 0) parts.push(`*Precio:* ${detail.precio.toFixed(2)}`);

      let modifiersMsg = "";
      if (detail.tieneOpcion) modifiersMsg = buildModifiersMessage(productModifiers);

      const caption = `${parts.join("\n")}${modifiersMsg}`.trim();
      if (!caption) return;

      const mediaUrl = detail.imagen && detail.imagen.trim() !== "" ? detail.imagen : "https://i.ibb.co/ccjvL5Nh/aguamarina.png";

      await SendMediaECommerceFromUrlAsync(conversationId, {
        mediaUrl,
        caption,
        externalId: null,
        repliedParentMessageId: null,
      });
    } finally {
      setSending(false);
    }
  };

  const openImagePreview = (url: string) => {
    setPreviewImageUrl(url);
    setismaximize(true);
  };

  const closeImagePreview = () => {
    setPreviewImageUrl(null);
    setismaximize(false);
  };

  // const quickSucursalRows = useMemo(() => {
  //   const list = [...(branchRows ?? [])];
  //   list.sort((a, b) => (b.existencia ?? 0) - (a.existencia ?? 0));
  //   return list.slice(0, 6);
  // }, [branchRows]);

  return (
    <>
      <div className="detail-product__container">
        <section className="detail-product__section">
          <div className="detail-product__image">
            <img
              src={detail.imagen || aguamarina}
              aria-label="product-image"
              className="detail-image"
              onClick={() => openImagePreview(detail.imagen ?? "")}
            />
          </div>

          <div className="detail-product__content">
            <div className="detail-content__text">
              <p className="detail-product__descriptions">{detail.codProducto + " " + detail.descripcion}</p>
              <p className="detail-product__price">C$ {detail.precio}</p>
            </div>

            <p className="detail-product__descriptions-marca">{detail.marca != null ? detail.marca : ""}</p>
            <p className="detail-product__existencia">
              {detail.existencia > 0 ? (
                <>
                  <MdInventory fontSize={12} />
                  {detail.existencia}
                </>
              ) : (
                ""
              )}
            </p>

            <p className="detail-product__content">{detail.contenido}</p>

            {/* {quickSucursalRows.length > 0 && (
              <div className="detail-product__branchQuick">
                {quickSucursalRows.map((x) => (
                  <span key={`${x.codsucursal}-${x.serie}-${x.sucursal}`} className="detail-product__branchQuickItem">
                    {x.codsucursal} {x.sucursal} · {x.existencia} {x.medida}
                  </span>
                ))}
              </div>
            )} */}

            {renderBranches()}
          </div>

          {productModifiers != null && productModifiers.length > 0 && (
            <div className="product-modifiers">
              <header className="product-modifiers__content">
                {productModifiers.map((mod: ProductoModificadorPCGInterface, index: number) => (
                  <div className="product-modifiers__product" key={index}>
                    <p className="product-modifiers__product__title">{mod.descripcionMod}</p>
                    <div className="product-modifiers__option__container">
                      {mod.listOpciones.map((op: listaOpciones, idx: number) => {
                        const selected = isOptionSelected(mod, op.codOpcion);
                        const currentQty = optionQuantities[op.codOpcion] ?? 1;

                        return (
                          <div className="product-modifiers__options" key={idx}>
                            <input
                              type="checkbox"
                              className="product-modifiers__checkout"
                              id={String(op.codOpcion)}
                              checked={selected}
                              name="selected_options"
                              onChange={() => handleToggleOption(mod, op.codOpcion)}
                            />
                            <label htmlFor={String(op.codOpcion)} className="product-modifiers__option">
                              {op.descripcionOp}
                              {Number(op.precioVenta) > 0 && (
                                <span className="product-modifiers__option__price">
                                  C$ {Number(op.precioVenta).toFixed(2)}
                                </span>
                              )}
                            </label>
                            {selected && (
                              <input
                                type="number"
                                className="product-modifiers__option__qty"
                                min={1}
                                value={currentQty}
                                onChange={(e) => handleOptionQuantityChange(mod, op.codOpcion, Number(e.target.value))}
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </header>
            </div>
          )}
        </section>

        <div className="detailPanel-description__container">
          <textarea
            className="detailPanel-description__textarea"
            name="descripcion"
            id="descripcion"
            rows={5}
            placeholder="Ingrese descripción de item"
            value={observacion}
            onChange={(e) => setObservacion(e.target.value)}
          />
        </div>

        <footer className="detail-product__actions">
          {total > 0 && (
            <p className="productDetail-total">
              Total:<span className="productDetail-total__value">C$ {total.toFixed(2)}</span>
            </p>
          )}

          <input type="number" className="detail-product__inputNumber" min={1} max={10} value={cantidad} onChange={handleQuantityChange} />

          <button type="button" className="productTab-buyButton" onClick={handleAddToCart} disabled={loading || cantidad <= 0}>
            {loading ? <AiOutlineLoading3Quarters fontSize={18} /> : <FaShoppingCart fontSize={18} />}
          </button>

          <Button className="button-sendProductDetailt" disabled={sending} onClick={handleSendProductMessage}>
            {sending ? <AiOutlineLoading3Quarters fontSize={18} className="product-row__iconBtn" /> : <IoMdSend fontSize={18} className="product-row__iconBtn" />}
          </Button>
        </footer>
      </div>

      {ismaximize && previewImageUrl && (
        <div className="chat-window__image-preview-overlay" onClick={closeImagePreview}>
          <img src={previewImageUrl} alt="Vista previa" className="chat-window__image-preview-full" />
        </div>
      )}
    </>
  );
};

export default DetailPCGProduct;