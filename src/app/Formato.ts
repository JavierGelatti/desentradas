// Montos en pesos enteros y fechas con hora, siempre en hora local y formato es-AR.
const formatoDeMonto = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });

const formatoDeFecha = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

export const monto = (valor: number): string => formatoDeMonto.format(valor);

export const fechaYHora = (fecha: Date): string => formatoDeFecha.format(fecha);
