export const alfabetico = (uno: string, otro: string): number => uno.localeCompare(otro);

export const porNombre = (uno: { nombre(): string }, otro: { nombre(): string }): number =>
  alfabetico(uno.nombre(), otro.nombre());
