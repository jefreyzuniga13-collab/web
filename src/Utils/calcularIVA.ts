export const calcularIVA = (monto: number): string => {
  const tasaIVA = 0.15;
  const ivaCalculado = monto * tasaIVA;
  const totalCalculado = monto + ivaCalculado;

  return totalCalculado.toFixed(2)
};


export const formatearDecimales = (monto: number): string => {
  return monto.toFixed(2)
};