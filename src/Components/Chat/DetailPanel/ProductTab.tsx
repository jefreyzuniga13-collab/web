import "@/Styles/Chat/DetailPanel/ProductTab.css"
import Input from "@/Components/Common/Input"
import { useEffect, useState } from "react"
import { useCategoryPCG } from "@/Hooks/useCategoryPCG"
import { useProductPCG } from "@/Hooks/useProductPCG"
import { CategoryTab } from "@/Components/Chat/DetailPanel/CategoryTab"
import { ProductPCGTab } from "@/Components/Chat/DetailPanel/ProductPCGTab"
import DetailPCGProduct from "@/Components/Chat/DetailPanel/DetailPCGProduct"
import { IoArrowBackCircleSharp } from "react-icons/io5"
import type { ProductoPCGInterface } from "@/Interfaces/Chat/ProductPCGInterface"
import { FaShoppingCart } from "react-icons/fa"
import type { CarDto, ListDetalleCarrito } from "@/Interfaces/Crm/CartPCGInterface"
import type { LogCartRequestDto } from "@/Interfaces/Crm/LogCartInterface"
import useLogCart from "@/Hooks/Crm/useLogCard"
import { useDispatch, useSelector } from "react-redux"
import type { RootState, AppDispatch } from "@/Context"
import { addProductToCarAsync, selectCartLoading } from "@/Context/Slices/Cart/cartSlice"
interface Props {
  conversationId: number
  contactId: number
}

export const ProductTab = ({ conversationId, contactId}: Props) => {
  const [search, setSearch] = useState<string>("")
  const [selectedCategory, setselectedCategory] = useState<string | null>(null)
  const [detailProduct, setDetailProduct] = useState<ProductoPCGInterface | null>(null)
  const [simpleQuantity, setSimpleQuantity] = useState<number>(1)

  const { GetAll, categoryPcg, error, loading } = useCategoryPCG()
  const { productPcg, GetByCategory, loadingProductPcg, error: errProducts } = useProductPCG()
  const { create: createLogCart, fetchByContactId } = useLogCart()

  const dispatch = useDispatch<AppDispatch>()
  const cartLoading = useSelector((state: RootState) => selectCartLoading(state))

  useEffect(() => {
    GetAll()
  }, [GetAll])

  useEffect(() => {
    if (!selectedCategory) return
    GetByCategory(selectedCategory)
    setDetailProduct(null)
    setSimpleQuantity(1)
  }, [GetByCategory, selectedCategory])

  const handleOpenDetail = (prod: ProductoPCGInterface) => {
    if (detailProduct?.id === prod.id) {
      setDetailProduct(null)
      setSimpleQuantity(1)
      return
    }
    setDetailProduct(prod)
    setSimpleQuantity(1)
  }

  const handleBackToList = () => {
    setDetailProduct(null)
    setSimpleQuantity(1)
  }

  const handleChangeSimpleQuantity = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value)
    if (Number.isNaN(value) || value <= 0) {
      setSimpleQuantity(1)
    } else {
      setSimpleQuantity(value)
    }
  }

  const handleSimpleAdd = async (productDetail: ProductoPCGInterface) => {
    if (simpleQuantity <= 0) return

    const precioV = productDetail.precio
    const totalMenu = precioV * simpleQuantity

    const detalle: ListDetalleCarrito = {
      tipoComponente: "P",
      indice: 1,
      codTipoModificador: "0000",
      codModificador: "00000",
      codGrupo: productDetail.codCategoria,
      codProducto: productDetail.codProducto,
      codOpcion: "00000",
      descripcion: productDetail.descripcion,
      cantidad: simpleQuantity,
      precioV,
      totalMenu,
      codUm: productDetail.codUm,
      observaciones: "",
      unico: "",
      noPedido: 0,
      imagen: productDetail.imagen,
      listOpciones: []
    }

    const existingLog = await fetchByContactId(contactId)

    let carrito: CarDto

    if (existingLog) {
      carrito = {
        // idUsuario:  existingLog.orderId,
        fecha: new Date().toISOString(),
        total: totalMenu,
        noPedido: existingLog.orderId,
        tipoServicio: 8,
        listDetalle: [detalle]
      }

      await dispatch(addProductToCarAsync(carrito)).unwrap()
    } else {
      carrito = {
        // idUsuario: contactId,
        noPedido: 0,
        tipoServicio: 8,
        fecha: new Date().toISOString(),
        total: totalMenu,
        listDetalle: [detalle]
      }

      const cartCreated = await dispatch(addProductToCarAsync(carrito)).unwrap()
      const first = Array.isArray(cartCreated) ? cartCreated[0] : cartCreated
      const orderId = first?.noPedido

      const logOrderRequest: LogCartRequestDto = {
        orderId,
        contactId,
        conversationId,
        statusId: 1
      }

      await createLogCart(logOrderRequest)
    }

    setSimpleQuantity(1)
    setselectedCategory(null)
    setDetailProduct(null)
  }

  const normalizedSearch = search.trim().toLowerCase()

  const filteredCategories =
    normalizedSearch === ""
      ? categoryPcg
      : categoryPcg.filter(c => c.grupo.toLowerCase().includes(normalizedSearch))

  const filteredProducts =
    normalizedSearch === ""
      ? productPcg
      : productPcg.filter(p =>
          `${p.codProducto} ${p.descripcion}`.toLowerCase().includes(normalizedSearch)
        )

  if (loading) {
    return (
      <div className="detailPanel-loaderContainer">
        <div className="detailPanel-loader">Cargando...</div>
      </div>
    )
  }

  if (error) {
    return <div className="detailPanel-error">Error al cargar categorias</div>
  }

  if (errProducts && selectedCategory) {
    return <div className="detailPanel-error">Error al cargar productos</div>
  }

  if (detailProduct && detailProduct.tieneOpcion) {
    return (
      <section className="productTab-card">
        <header className="productTab-product__header">
          <h5>Detalle de producto</h5>
          <div className="productTab-icon__container">
            <IoArrowBackCircleSharp
              fontSize={24}
              className="productTab-icon"
              onClick={handleBackToList}
            />
          </div>
        </header>
        <DetailPCGProduct
          detail={detailProduct}
          contactId={contactId}
          conversationId={conversationId}
          setDetailProduct={setDetailProduct}
          setselectedCategory={setselectedCategory}
        />
      </section>
    )
  }

  return (
    <section className="productTab-card">
      <header className="productTab-product__header">
        <h5 className="productTab-content-header__title">
          {selectedCategory === null ? "Categorias" : "Productos"}
        </h5>
        <div className="productTab-icon__container">
          <IoArrowBackCircleSharp
            fontSize={24}
            className="productTab-icon"
            onClick={() => {
              setselectedCategory(null)
              setDetailProduct(null)
              setSimpleQuantity(1)
            }}
          />
        </div>
      </header>

      <section className="productTab-clientHeaderActions">
        <Input
          id="searchProduct"
          name="searchProduct"
          value={search}
          max={500}
          placeholder="Buscar categoria o producto"
          onChange={e => setSearch(e.target.value)}
        />
      </section>

      {!selectedCategory && (
        <div className="productTab-category__container">
          {filteredCategories.map(e => (
            <CategoryTab
              cat={e}
              key={e.id}
              setselectedCategory={setselectedCategory}
            />
          ))}
        </div>
      )}

      {selectedCategory && (
        <div className="productTab-productPCG__container">
          {loadingProductPcg ? (
            <span>Cargando...</span>
          ) : (
            filteredProducts.map(e => (
              <div key={e.codProducto} className="productTab-productRowWrapper">
                {detailProduct &&
                  !detailProduct.tieneOpcion &&
                  detailProduct.codProducto === e.codProducto && (
                    <div className="productTab-simpleAddBar productTab-simpleAddBar--absolute">
                      <input
                        type="number"
                        min={1}
                        max={1000}
                        value={simpleQuantity}
                        onChange={handleChangeSimpleQuantity}
                        className="productTab-simpleAddBar__input"
                      />
                      <button
                        type="button"
                        className="productTab-buyButton__general"
                        onClick={() => handleSimpleAdd(e)}
                        disabled={simpleQuantity <= 0 || cartLoading}
                      >
                        <FaShoppingCart fontSize={12} />
                      </button>
                    </div>
                  )}

                <ProductPCGTab
                  prod={e}
                  conversationId={conversationId}
                  onClick={handleOpenDetail}
                />
              </div>
            ))
          )}
        </div>
      )}
    </section>
  )
}