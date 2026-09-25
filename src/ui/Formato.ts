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

const dosDigitos = (numero: number) => String(numero).padStart(2, "0");

// El valor de un <input type="datetime-local">: YYYY-MM-DDTHH:mm en hora local, con precisión de minuto.
export const aEntradaDeFecha = (fecha: Date): string =>
  `${fecha.getFullYear()}-${dosDigitos(fecha.getMonth() + 1)}-${dosDigitos(fecha.getDate())}` +
  `T${dosDigitos(fecha.getHours())}:${dosDigitos(fecha.getMinutes())}`;

// Un texto sin zona horaria se interpreta como hora local, que es lo que muestra el input.
export const desdeEntradaDeFecha = (texto: string): Date => {
  const fecha = new Date(texto);
  if (texto === "" || Number.isNaN(fecha.getTime())) throw new Error("Falta la fecha");

  return fecha;
};
