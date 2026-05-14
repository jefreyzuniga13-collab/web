import React, { useMemo } from "react"
import { MdDelete } from "react-icons/md"
import noimageavailable from "@/assets/img/noimageavailable.webp"
import type { CarDto, ListDetalleCarrito } from "@/Interfaces/Crm/CartPCGInterface"
import { calcularIVA } from "@/Utils/calcularIVA"

type Row = { cart: CarDto; detail: ListDetalleCarrito }

type Props = {
  carPCG: CarDto[]
  search: string
  onRemove: (args: { idUsuario: number; noPedido: number; codProducto: string; unico: string }) => void
}

export function CartItemsList({ carPCG, search, onRemove }: Props) {
  const hasItems = useMemo(() => Array.isArray(carPCG) && carPCG.length > 0, [carPCG])

  const rows = useMemo<Row[]>(() => {
    if (!hasItems) return []
    const term = search.trim().toLowerCase()
    const result: Row[] = []

    carPCG.forEach((cart) => {
      cart.listDetalle.forEach((detail) => {
        if (!term || detail.descripcion.toLowerCase().includes(term)) result.push({ cart, detail })
      })
    })

    return result
  }, [carPCG, hasItems, search])

  return (
    <>
      {rows.map(({ cart, detail }, index) => (
        <div key={`${detail.unico ?? "u"}-${index}`} className="carPCPanel-content__list">
          <div className="carPCPanel-content__list-imgContainer">
            <img
              src={detail.imagen ?? noimageavailable}
              aria-label="product image"
              className="carPCPanel-content__list-image"
            />
            <p className="carPCPanel-content__list-flootingQuantity">{detail.cantidad}</p>
          </div>

          <div className="carPCPanel-content__list-info">
            <p className="carPCPanel-content__list-text">{detail.descripcion}</p>
            <p className="carPCPanel-content__list-price">
              {/* C$ {detail.precioV.toFixed(2)} */}
              {calcularIVA(detail.precioV).toString() }
              </p>
          </div>

          <div className="carPCPanel-listaOpciones">
            {detail.listOpciones?.map((e, idx) => (
              <p key={idx} className="carPCPanel-content__item">
                {e.descripcionOp}
              </p>
            ))}
          </div>

          <MdDelete
            fontSize={24}
            className="carPCPanel-content__removeIcon"
            onClick={() =>
              onRemove({
                idUsuario: cart.idUsuario ?? 0,
                noPedido: detail.noPedido,
                codProducto: detail.codProducto,
                unico: detail.unico!,
              })
            }
          />
        </div>
      ))}
    </>
  )
}
