/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState } from "react";
import { FaShoppingCart } from "react-icons/fa";
import { useProductPCG } from "@/Hooks/useProductPCG";
import { useCarPCG } from "@/Hooks/useCarPCG";
import type { listaOpciones, ProductoPCGInterface } from "@/Interfaces/Chat/ProductPCGInterface";
import type { CarDto, ListDetalleCarrito } from "@/Interfaces/Crm/CartPCGInterface";
import "@/Styles/Chat/DetailPanel/DetailProduct.css";
import noimageavailable from '@/assets/noimageavailable.webp'

interface Props {
  detail: ProductoPCGInterface;
  idUsuario: number;
  setDetailProduct: (detailP: ProductoPCGInterface | null)=> void;
  setselectedCategory: (category: string | null)=> void;
}

const DetailPCGProduct = ({ detail, idUsuario, setDetailProduct, setselectedCategory }: Props) => {
  const [cantidad, setCantidad] = useState<number>(1);
  const [total, setTotal] = useState<number>(0);
  const [observacion, setObservacion] = useState<string>("");
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string[]>>({});

  const { productModifiers, getProductModifiers } = useProductPCG();
  const { AddProductToCarAsync, loading } = useCarPCG();

  useEffect(() => {
    getProductModifiers(detail.codProducto);
  }, [detail.codProducto, getProductModifiers]);

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
      productModifiers.forEach((mod: any) => {
        mod.listOpciones.forEach((op: any) => {
          map.set(op.codOpcion, {
            codOpcion: op.codOpcion,
            descripcionOp: op.descripcionOp,
            codPrecio: op.codPrecio,
            precioVenta: Number(op.precioVenta),
            cantidad: op.cantidad ?? 0,
            totalMenu: op.totalMenu ?? 0,
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
    let optionsTotal = 0;
    Object.values(selectedOptions).forEach((optionIds) => {
      optionIds.forEach((id) => {
        const option = optionIndex.get(id);
        if (option) {
          optionsTotal += cantidad * Number(option.precioVenta);
        }
      });
    });
    const basePrice = cantidad * Number(detail.precio ?? 0);
    setTotal(basePrice + optionsTotal);
  }, [cantidad, selectedOptions, optionIndex, detail]);

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    if (Number.isNaN(value) || value <= 0) {
      setCantidad(1);
    } else {
      setCantidad(value);
    }
  };

  const handleToggleOption = (modifier: any, optionId: string) => {
    setSelectedOptions((prev) => {
      const key = String(modifier.codModificador);
      const current = prev[key] ?? [];
      let nextForModifier: string[] = [];

      if (modifier.esMultipleSeleccion) {
        if (current.includes(optionId)) {
          nextForModifier = current.filter((id) => id !== optionId);
        } else {
          const max = Number(modifier.maximoSel ?? 0);
          if (max > 0 && current.length >= max) {
            return prev;
          }
          nextForModifier = [...current, optionId];
        }
      } else {
        if (current.includes(optionId)) {
          nextForModifier = [];
        } else {
          nextForModifier = [optionId];
        }
      }

      return { ...prev, [key]: nextForModifier };
    });
  };

  const isOptionSelected = (modifier: any, optionId: string) => {
    const key = String(modifier.codModificador);
    const current = selectedOptions[key] ?? [];
    return current.includes(optionId);
  };

  const buildCartRequest = (): CarDto => {
    const items: ListDetalleCarrito[] = [];
    const basePrice = Number(detail.precio ?? 0);
    const baseTotal = basePrice * cantidad;

    const baseItem: ListDetalleCarrito = {
      tipoComponente: "P",
      indice: 1,
      codTipoModificador: "0000",
      codModificador: "00000",
      codGrupo: (detail as any).codGrupo ?? "000",
      codProducto: detail.codProducto,
      codOpcion: "00000",
      descripcion: detail.descripcion,
      cantidad,
      precioV: basePrice,
      totalMenu: baseTotal,
      codUm: (detail as any).codUm ?? "",
      observaciones: observacion,
      unico: "",
      noPedido: 0,
      imagen: detail.imagen,
    };

    items.push(baseItem);

    let index = 2;
    Object.entries(selectedOptions).forEach(([modifierId, optionIds]) => {
      optionIds.forEach((id) => {
        const option = optionIndex.get(id);
        if (!option) return;

        const precioV = Number(option.precioVenta);
        const totalMenu = precioV * cantidad;

        const optionItem: ListDetalleCarrito = {
          tipoComponente: "O",
          indice: index++,
          codTipoModificador: option.codTipoModificador ?? "0000",
          codModificador: option.codModificador ?? modifierId,
          codGrupo: (detail as any).codGrupo ?? "000",
          codProducto: detail.codProducto,
          codOpcion: option.codOpcion,
          descripcion: option.descripcionOp,
          cantidad,
          precioV,
          totalMenu,
          codUm: option.codUm,
          observaciones: observacion,
          unico: "",
          noPedido: 0,
          imagen: detail.imagen,
        };

        items.push(optionItem);
      });
    });

    const totalCarrito = items.reduce((sum, item) => sum + item.totalMenu, 0);

    const carDto: CarDto = {
      idUsuario,
      fecha: new Date().toISOString(),
      total: totalCarrito,
      listDetalle: items,
    };

    return carDto;
  };

  const handleAddToCart = async () => {
    if (cantidad <= 0) return;
    const req = buildCartRequest();
    await AddProductToCarAsync(req);
    setDetailProduct(null)
    setselectedCategory(null)
  };

  return (
    <div className="detail-product__container">
      <section className="detail-product__section">
        <div className="detail-product__image">
          <img
             src={detail.imagen != null ? detail.imagen : noimageavailable}
            // alt="product image"
            aria-label="product-image"
            className="detail-image"
          />
        </div>

        <div className="detail-product__content">
          <div className="detail-content__text">
            <p className="detail-product__descriptions">{detail.descripcion}</p>
            <p className="detail-product__price">C$ {detail.precio}</p>
          </div>
          <p className="detail-product__content">{detail.contenido}</p>
        </div>

        {productModifiers != null && productModifiers.length > 0 && (
          <div className="product-modifiers">
            <header className="product-modifiers__content">
              {productModifiers.map((mod: any, index: number) => (
                <div className="product-modifiers__product" key={index}>
                  <p className="product-modifiers__product__title">{mod.descripcionMod}</p>
                  <div className="product-modifiers__option__container">
                    {mod.listOpciones.map((op: listaOpciones, idx: number) => (
                      <div className="product-modifiers__options" key={idx}>
                        {Number(op.precioVenta) > 0 && (
                          <>
                            <input
                              type="checkbox"
                              className="product-modifiers__checkout"
                              id={String(op.codOpcion)}
                              checked={isOptionSelected(mod, op.codOpcion)}
                              onChange={() => handleToggleOption(mod, op.codOpcion)}
                            />
                            <label
                              htmlFor={String(op.codOpcion)}
                              className="product-modifiers__option"
                            >
                              {op.descripcionOp}
                              <span className="product-modifiers__option__price">
                                C$ {Number(op.precioVenta).toFixed(2)}
                              </span>
                            </label>
                          </>
                        )}
                      </div>
                    ))}
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
          rows={7}
          placeholder="Ingrese descripción de item"
          value={observacion}
          onChange={(e) => setObservacion(e.target.value)}
        />
      </div>

      <footer className="detail-product__actions">
        <input
          type="number"
          className="detail-product__inputNumber"
          min={1}
          value={cantidad}
          onChange={handleQuantityChange}
        />
        <button
          type="button"
          className="productTab-buyButton"
          onClick={handleAddToCart}
          disabled={loading || cantidad <= 0}
        >
          <span className="button-text">Agregar</span>
          <FaShoppingCart fontSize={16} />
        </button>

        {total > 0 && (
          <p className="productDetail-total">
            Total:
            <span className="productDetail-total__value">
              C$ {total.toFixed(2)}
            </span>
          </p>
        )}
      </footer>
    </div>
  );
};

export default DetailPCGProduct;