/**
 * El cliente del link paynow no inicia sesión.
 * PCG lee la empresa desde el header `empresa`.
 */
export function applyPublicEmpresaId(empresaId?: string | null): string {
  const value = String(empresaId ?? "").trim();

  if (value) {
    sessionStorage.setItem("EmpresaId", value);
    return value;
  }

  sessionStorage.removeItem("EmpresaId");
  return "";
}

export function readPublicEmpresaId(): string {
  return (
    sessionStorage.getItem("EmpresaId") ||
    localStorage.getItem("EmpresaId") ||
    ""
  );
}
