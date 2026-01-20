import Input from "@/Components/Common/Input";
import React, { useEffect, useMemo, useState } from "react";
import { useCategoryPCG } from "@/Hooks/Crm/useCategoryPCG";
import { useProductPCG } from "@/Hooks/Ecommerce/useProductPCG";
import { CategoryTab } from "@/Components/ECommerce/CategoryTab";
import { ProductPCGTab } from "@/Components/ECommerce/ProductPCGTab";
import DetailPCGProduct from "@/Components/ECommerce/DetailPCGProduct";
import type { ProductoPCGInterface } from "@/Interfaces/Chat/ProductPCGInterface";
import type { DetalleFacturaTempoRequest, FaloteRequestDto } from "@/Interfaces/Crm/CartPCGInterface";
import type { LogCartRequestDto } from "@/Interfaces/Crm/LogCartInterface";
import useLogCart from "@/Hooks/Crm/useLogCard";
import { useDispatch, useSelector } from "react-redux";
import type { RootState, AppDispatch } from "@/Context";
import { addProductTempoAsync, getProductFromCarAsync, selectCartLoading } from "@/Context/Slices/Ecommerce/cartSlice";
import { setContactCartBadge } from "@/Context/Slices/Ecommerce/cartBadgeSlice";
import "@/Styles/Ecommerce/ProductTab.css";
import { TiArrowBack } from "react-icons/ti";
import { CartService } from "@/Services/Ecommerce/CarPCGService";
import { SucursalPickerModal, type SucursalPickerValue } from "@/Components/ECommerce/SucursalPickerModal";
import type { ExistenciaSucursalItem } from "@/Interfaces/Ecommerce/FacturaTempo";
import dayjs from "dayjs";

interface Props {
  conversationId: number;
  contactId: number;
}

export interface SelectedInterface {
  codGrupo?: string | null;
  grupo?: string | null;
}

export const ProductTab = ({ conversationId, contactId }: Props) => {
  const [search, setSearch] = useState<string>("");
  const [selectedCategory, setselectedCategory] = useState<SelectedInterface | null>(null);
  const [detailProduct, setDetailProduct] = useState<ProductoPCGInterface | null>(null);
  const [simpleQuantity, setSimpleQuantity] = useState<number>(1);

  const [lockedBranch, setLockedBranch] = useState<string | null>(null);

  const [openSucursalModal, setOpenSucursalModal] = useState(false);
  const [sucursalItems, setSucursalItems] = useState<ExistenciaSucursalItem[]>([]);
  const [loadingSucursalItems, setLoadingSucursalItems] = useState(false);

  const [pendingProduct, setPendingProduct] = useState<ProductoPCGInterface | null>(null);
  const [pendingQuantity, setPendingQuantity] = useState<number>(1);

  const { GetAll, categoryPcg, error, loading } = useCategoryPCG();

  const { productPcg, GetByCategory, GetAll: GetProductByDescription, loadingProductPcg, error: errProducts } =
    useProductPCG();

  const { create: createLogCart, fetchByContactId } = useLogCart();

  const dispatch = useDispatch<AppDispatch>();
  const cartLoading = useSelector((state: RootState) => selectCartLoading(state));

  useEffect(() => {
    GetAll();
  }, [GetAll]);

  useEffect(() => {
    if (!selectedCategory) return;
    GetByCategory(selectedCategory.codGrupo!);
    setDetailProduct(null);
    setSimpleQuantity(1);
  }, [GetByCategory, selectedCategory]);

  const normalizedSearch = useMemo(() => search.trim().toLowerCase(), [search]);

  const filteredCategories = useMemo(() => {
    if (normalizedSearch === "") return categoryPcg;
    return categoryPcg.filter((c) => (c.grupo || "").toLowerCase().includes(normalizedSearch));
  }, [categoryPcg, normalizedSearch]);

  const filteredProducts = useMemo(() => {
    if (normalizedSearch === "") return productPcg;
    return productPcg.filter((p) => `${p.codProducto ?? ""} ${p.descripcion ?? ""}`.toLowerCase().includes(normalizedSearch));
  }, [productPcg, normalizedSearch]);

  const handleOpenDetail = (prod: ProductoPCGInterface) => {
    if (detailProduct?.id === prod.id) {
      setDetailProduct(null);
      setSimpleQuantity(1);
      return;
    }
    setDetailProduct(prod);
    setSimpleQuantity(1);
  };

  const handleBackToList = () => {
    setDetailProduct(null);
    setSimpleQuantity(1);
  };

  const handleChangeSimpleQuantity = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    if (Number.isNaN(value) || value <= 0) setSimpleQuantity(1);
    else setSimpleQuantity(value);
  };

  const resetToCategories = () => {
    setSearch("");
    setselectedCategory(null);
    setDetailProduct(null);
    setSimpleQuantity(1);
  };

  const handleSearchEnter = async (q: string) => {
    const term = (q || "").trim();
    if (!term) return;
    setselectedCategory(null);
    setDetailProduct(null);
    setSimpleQuantity(1);
    await GetProductByDescription(term);
  };

  const buildCartRequest = (productDetail: ProductoPCGInterface, branch: string): DetalleFacturaTempoRequest => {
    const baseItem: DetalleFacturaTempoRequest = {
      sucursal: branch,
      usuario: String(contactId),
      maquina: `CRM-${contactId}`,
      fecha: dayjs().format("YYYYMMDD"),
      codproducto: productDetail.codProducto.trim(),
      codprecio: "01",
      precio: productDetail.precio,
      bodega: "010",
      cantidadmovimiento: simpleQuantity,
      medidamovimiento: "",
      nofactura: "00000000",
      tipo: "1",
      tipodesc: "N",
      tipotrabajo: "INSERT",
      tasacambio: 36.0,
      financiamiento: 0,
      descuento: 0,
      codvendedor: "004",
      codcliente: "00000",
      autorizado: "N",
      producto: productDetail.descripcion.trim(),
      tabla: "det_factura_tempo",
      vincularse: "N",
      servicioventa: 1,
      facturaexonerada: "N",
      lote: "Sin Lote",
      vencimiento: "20260116",
      vienedelabusqueda: "N",
      observacion: "",
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

  const openBranchPickerForProduct = async (prod: ProductoPCGInterface, qty: number) => {
    setPendingProduct(prod);
    setPendingQuantity(qty);
    setOpenSucursalModal(true);
    setLoadingSucursalItems(true);

    try {
      const cod = (prod.codProducto ?? "").trim();
      if (!cod) {
        setSucursalItems([]);
        return;
      }

      const res = await CartService.getProductFromTempTotal(cod);
      const data = Array.isArray(res) ? (res as ExistenciaSucursalItem[]) : [];
      setSucursalItems(data);
    } catch {
      setSucursalItems([]);
    } finally {
      setLoadingSucursalItems(false);
    }
  };

  const addToCartCore = async (productDetail: ProductoPCGInterface, branch: string) => {
    if (simpleQuantity <= 0) return;

    const existingLog = await fetchByContactId(contactId);

    let consecutivo = 0;
    let branchToUse = branch;

    if (!existingLog) {
      const falote: FaloteRequestDto = { codSucursal: branch, documento: "GetConsecDoc" };
      const conse = await CartService.GetConsecDocAsync(falote);
      consecutivo = Number(conse.data.consecutivo);
      branchToUse = branch;
    } else {
      consecutivo = existingLog.orderId;
      branchToUse = existingLog.branch;
    }

    const carritoBase = buildCartRequest(productDetail, branchToUse);
    carritoBase.nofactura = String(consecutivo);
    carritoBase.sucursal = branchToUse;

    await dispatch(addProductTempoAsync(carritoBase)).unwrap();

    if (!existingLog) {
      if (Number(consecutivo) <= 0) {
        throw new Error("No se pudo obtener el noPedido para crear el LogCart.");
      }

      const logOrderRequest: LogCartRequestDto = {
        orderId: Number(String(consecutivo).trim()),
        contactId,
        conversationId,
        statusId: 1,
        branch: branchToUse,
      };

      await createLogCart(logOrderRequest);
    }

    await refreshBadge(Number(consecutivo));

    setSimpleQuantity(1);
    setselectedCategory(null);
    setDetailProduct(null);

    if (!lockedBranch) setLockedBranch(branchToUse);
  };

  const handleSimpleAdd = async (productDetail: ProductoPCGInterface) => {
    if (simpleQuantity <= 0) return;

    if (lockedBranch) {
      await addToCartCore(productDetail, lockedBranch);
      return;
    }

    const existingLog = await fetchByContactId(contactId);
    if (existingLog?.branch) {
      setLockedBranch(existingLog.branch);
      await addToCartCore(productDetail, existingLog.branch);
      return;
    }

    await openBranchPickerForProduct(productDetail, simpleQuantity);
  };

  const showCategories = !selectedCategory && normalizedSearch === "";
  const showProducts = !!selectedCategory || normalizedSearch !== "";

  if (loading) {
    return (
      <div className="detailPanel-loaderContainer">
        <div className="detailPanel-loader">Cargando...</div>
      </div>
    );
  }

  if (error) {
    return <div className="detailPanel-error">Error al cargar categorias</div>;
  }

  if (errProducts && selectedCategory) {
    return <div className="detailPanel-error">Error al cargar productos</div>;
  }

  if (detailProduct) {
    return (
      <section className="productTab-card">
        <header className="productTab-product__header">
          <h5 onClick={handleBackToList} className="productTab-content-header__titleDetail">
            <TiArrowBack fontSize={18} />
            {selectedCategory?.grupo ? `${selectedCategory.grupo}\\${detailProduct.descripcion}\\detalle` : `${detailProduct.descripcion}\\detalle`}
          </h5>
        </header>

        <DetailPCGProduct
          detail={detailProduct}
          contactId={contactId}
          conversationId={conversationId}
          setDetailProduct={setDetailProduct}
          setselectedCategory={setselectedCategory}
        />
      </section>
    );
  }

  return (
    <section className="productTab-card">
      <SucursalPickerModal
        open={openSucursalModal}
        loading={loadingSucursalItems}
        codProducto={pendingProduct?.codProducto ?? ""}
        items={sucursalItems}
        selectedCodSucursal={lockedBranch}
        onClose={() => {
          setOpenSucursalModal(false);
          setPendingProduct(null);
        }}
        onSelect={async (v: SucursalPickerValue) => {
          setOpenSucursalModal(false);

          if (!pendingProduct) return;

          const prevQty = pendingQuantity;
          const prod = pendingProduct;

          setPendingProduct(null);

          const old = simpleQuantity;
          setSimpleQuantity(prevQty);

          try {
            await addToCartCore(prod, v.codsucursal);
          } finally {
            setSimpleQuantity(old);
          }
        }}
      />

      <header className="productTab-product__header">
        <h5 className="productTab-content-header__title">
          {showCategories ? (
            "Categorias"
          ) : selectedCategory ? (
            <span className="productTab-content-header__titleCategory" onClick={resetToCategories}>
              <TiArrowBack fontSize={18} />
              {selectedCategory.grupo ?? ""}\productos
            </span>
          ) : (
            <span className="productTab-content-header__titleCategory" onClick={resetToCategories}>
              <TiArrowBack fontSize={18} />
              Productos
            </span>
          )}
        </h5>
      </header>

      <section className="productTab-clientHeaderActions">
        <Input
          id="searchProduct"
          name="searchProduct"
          value={search}
          max={500}
          placeholder="Buscar categoria o producto"
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={async (e) => {
            if (e.key === "Enter") await handleSearchEnter(search);
          }}
        />
      </section>

      {showCategories && (
        <div className="productTab-category__container">
          {filteredCategories.map((e) => (
            <CategoryTab cat={e} key={e.id} setselectedCategory={setselectedCategory} />
          ))}
        </div>
      )}

      {showProducts && (
        <div className="productTab-productPCG__container">
          {loadingProductPcg ? (
            <span>Cargando...</span>
          ) : (
            filteredProducts.map((e) => (
              <div key={e.codProducto} className="productTab-productRowWrapper">
                <ProductPCGTab
                  prod={e}
                  conversationId={conversationId}
                  onClick={handleOpenDetail}
                  simpleQuantity={simpleQuantity}
                  handleChangeSimpleQuantity={handleChangeSimpleQuantity}
                  handleSimpleAdd={handleSimpleAdd}
                  cartLoading={cartLoading}
                />
              </div>
            ))
          )}
        </div>
      )}
    </section>
  );
};