// Lectura de campos de un JSON de origen desconocido: cualquier desvío del formato esperado es un error.
export type Objeto = Record<string, unknown>;

export const formatoInvalido = (detalle: string): Error => new Error(`Formato inválido: ${detalle}`);

export const objeto = (json: unknown, descripcion: string): Objeto => {
  if (typeof json !== "object" || json === null || Array.isArray(json)) {
    throw formatoInvalido(`${descripcion} debe ser un objeto`);
  }

  return json as Objeto;
};

export const texto = (objeto: Objeto, campo: string): string => {
  const valor = objeto[campo];
  if (typeof valor !== "string") throw formatoInvalido(`"${campo}" debe ser un texto`);

  return valor;
};

export const numero = (objeto: Objeto, campo: string): number => {
  const valor = objeto[campo];
  if (typeof valor !== "number" || !Number.isFinite(valor)) throw formatoInvalido(`"${campo}" debe ser un número`);

  return valor;
};

export const fecha = (objeto: Objeto, campo: string): Date => {
  const valor = new Date(texto(objeto, campo));
  if (Number.isNaN(valor.getTime())) throw formatoInvalido(`"${campo}" debe ser una fecha en formato ISO`);

  return valor;
};

export const lista = (objeto: Objeto, campo: string): unknown[] => {
  const valor = objeto[campo];
  if (!Array.isArray(valor)) throw formatoInvalido(`"${campo}" debe ser una lista`);

  return valor;
};

export const textos = (objeto: Objeto, campo: string): string[] => {
  const valor = lista(objeto, campo);
  if (!valor.every((elemento) => typeof elemento === "string")) {
    throw formatoInvalido(`"${campo}" debe ser una lista de textos`);
  }

  return valor;
};

// Un campo que los JSON guardados antes de existir no traen.
export const textosOpcionales = (objeto: Objeto, campo: string): string[] | undefined =>
  objeto[campo] === undefined ? undefined : textos(objeto, campo);
