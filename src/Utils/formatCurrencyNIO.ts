export   const formatCurrencyNIO = (value?: number | null) => {
    const n = Number(value ?? 0)
    return `C$ ${n.toLocaleString("es-NI", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }