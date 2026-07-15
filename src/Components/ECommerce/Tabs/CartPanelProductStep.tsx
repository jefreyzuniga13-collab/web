import Input from "@/Components/Common/Input"
import vacio from "@/assets/vacio.png"

import { MdDelete, MdClear } from "react-icons/md"

import { formatearDecimales } from "@/Utils/calcularIVA"
import { safeNumber } from "@/Utils/ECommerce/utils"

import type {
  CartDetailView
} from "@/Interfaces/Crm/LogCartInterface"

interface Props {
  /**
   * Texto usado para buscar productos dentro del carrito.
   */
  search: string

  /**
   * Actualiza el texto de búsqueda.
   */
  setSearch: (value: string) => void

  /**
   * Lista ya filtrada de productos y opciones del carrito.
   */
  filteredDetails: CartDetailView[]

  /**
   * Indica si el sistema actual es PCG o propietario.
   * Se usa para saber si se manda codProducto al eliminar.
   */
  companySistema?: string | null

  /**
   * Función que elimina un producto principal del carrito.
   */
  handleRemoveItem: (
    idUsuario: number,
    noPedido: number,
    codProducto: string,
    unico: string
  ) => Promise<void>

  /**
   * Id del usuario dueño del carrito temporal.
   */
  cartUserId: number
}

export default function CartPanelProductStep({
  search,
  setSearch,
  filteredDetails,
  companySistema,
  handleRemoveItem,
  cartUserId
}: Props) {
  return (
    <div className="carPCPanel-stepContent">
      <div className="searchInputWithClear">
        <Input
          id="searchProduct"
          name="searchProduct"
          value={search}
          placeholder="Buscar categoría o producto"
          onChange={(event) => setSearch(event.target.value)}
        />

        {search.trim() && (
          <button
            type="button"
            className="searchInputWithClear__button"
            onClick={() => setSearch("")}
            aria-label="Limpiar búsqueda"
            title="Limpiar búsqueda"
          >
            <MdClear fontSize={20} />
          </button>
        )}
      </div>

      <div className="carPCPanel-products">
        {filteredDetails.map(({ detail }, index) => {
          /**
           * Producto principal.
           * Este sí se puede eliminar directamente desde el panel.
           */
          if (detail.tipoComponente === "P") {
            return (
              <div key={index} className="carPCPanel-content__list">
                <div className="carPCPanel-content__list-imgContainer">
                  <img
                    src={detail.imagen ?? vacio}
                    aria-label="product image"
                    className="carPCPanel-content__list-image"
                  />

                  <p className="carPCPanel-content__list-flootingQuantity">
                    {detail.cantidad}
                  </p>
                </div>

                <div className="carPCPanel-content__list-info">
                  <p className="carPCPanel-content__list-text">
                    {detail.descripcion}
                  </p>

                  <p className="carPCPanel-content__list-price">
                    {safeNumber(detail.precioV, 0) > 0
                      ? ` C$ ${formatearDecimales(detail.precioV)}`
                      : ""}
                  </p>
                </div>

                <MdDelete
                  fontSize={24}
                  onClick={() =>
                    handleRemoveItem(
                      cartUserId,
                      detail.noPedido,
                      String(companySistema) === "P"
                        ? String(detail.codProducto ?? "")
                        : "",
                      detail.unico!
                    )
                  }
                  className="carPCPanel-content__removeIcon"
                />
              </div>
            )
          }

          /**
           * Opción o modificador.
           * No se elimina aquí porque depende del producto padre.
           */
          if (detail.tipoComponente === "O") {
            return (
              <div
                key={index}
                className="carPCPanel-content__list__opcion"
              >
                <div className="carPCPanel-content__list-info-opcion">
                  <p className="carPCPanel-content__list-opcion">
                    {detail.descripcion}
                  </p>

                  <p className="carPCPanel-content__list-price">
                    {safeNumber(detail.precioV, 0) > 0
                      ? `C$ ${formatearDecimales(detail.precioV)}`
                      : ""}
                  </p>
                </div>

                <div className="carPCPanel-content__list-imgContainer">
                  <p className="carPCPanel-content__list-flootingQuantity-opcion">
                    {detail.cantidad}
                  </p>
                </div>
              </div>
            )
          }

          return null
        })}
      </div>
    </div>
  )
}