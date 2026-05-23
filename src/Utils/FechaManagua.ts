export class FechaManagua {
  /**
   * Obtiene la fecha actual de Managua en formato AAAAMMDD
   * @returns {string} cadena de texto limpia (ej. "20260522")
   */
  static obtenerFormatoLimpio(): string {
    const fecha = new Date();
    
    const opciones = { 
      timeZone: 'America/Managua', 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit' 
    } as const;

    const formato = new Intl.DateTimeFormat('es-NI', opciones);
    const partes = formato.formatToParts(fecha);

    const año = partes.find(p => p.type === 'year')?.value || '';
    const mes = partes.find(p => p.type === 'month')?.value || '';
    const día = partes.find(p => p.type === 'day')?.value || '';

    // Retorna un string puro listo para usar
    return `${año}${mes}${día}`;
  }
}
