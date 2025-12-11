/* eslint-disable @typescript-eslint/no-explicit-any */
import type {
  CarDto,
  ListDetalleCarrito
} from '@/Interfaces/Crm/CartPCGInterface'
import { useCallback, useMemo, useState } from "react";
import { CartService } from '@/Services/CarPCGService'
import { toast } from 'react-toastify';

export function useCarPCG() {
  const [carPCG, setCarPCG] = useState<CarDto[]>([])
  const [listDetail, setListDetail] = useState<ListDetalleCarrito[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<Error | null>(null)

  const cartItemsCount = useMemo(() => {
    if (!carPCG || carPCG.length === 0) return 0;

    return carPCG.reduce((acc, cart) => {
      const count = cart.listDetalle?.reduce((sum, d) => sum + d.cantidad, 0) ?? 0;
      return acc + count;
    }, 0);
  }, [carPCG]);

  const AddProductToCarAsync = useCallback(async (req: CarDto) => {
    setLoading(true);
    setError(null);

    try {
      const item = await CartService.AddProductToCar(req);
      if (item.success) {
        setCarPCG(item.data);
        // toast.success(item.message)
      } else {
        setCarPCG([]);
        toast.error(item.message);
      }
    } catch (err: any) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const AddProductsToCarAsync = useCallback(async (req: CarDto[]) => {
    setLoading(true);
    setError(null);

    try {
      const item = await CartService.AddProductsToCar(req);
      setCarPCG(item);
    } catch (err: any) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const getProductFromCarAsync = useCallback(async (codCliente: number) => {
    setLoading(true);
    setError(null);
    try {
      const item = await CartService.getProductFromCar(codCliente);
      setCarPCG(item);
    } catch (err: any) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateCarAsync = useCallback(async (idUsuario: number, noPedido: number, codProducto: string, unico: string) => {
    setLoading(true);
    setError(null);
    try {
      const item = await CartService.removeProductFromCar(idUsuario, noPedido, codProducto, unico);
      setCarPCG(item.data);

      if (item.success) {
        toast.success(item.message);
      } 
      // else {
      //   toast.error(item.message);
      // }
    } catch (err: any) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    carPCG,
    listDetail,
    setListDetail,
    loading,
    error,
    cartItemsCount,
    AddProductsToCarAsync,
    getProductFromCarAsync,
    updateCarAsync,
    AddProductToCarAsync
  }
}