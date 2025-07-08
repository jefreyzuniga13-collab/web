export const formatoNicaragua = (fecha: Date) => {
    const dia = fecha.getDate();
    const mes = fecha.getMonth() + 1;
    const año = fecha.getFullYear();

    const diaFormateado = dia < 10 ? `0${dia}` : dia;
    const mesFormateado = mes < 10 ? `0${mes}` : mes;

    return `${año}/${mesFormateado}/${diaFormateado}`;
};