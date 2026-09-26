// Creación de elementos y lectura de formularios, para no depender de ningún framework.
type Atributos = Record<string, string | number | boolean | EventListener | undefined>;

// Un hijo en false o undefined no se agrega, para poder escribir `condicion && elemento`.
export type Hijo = Node | string | false | undefined;

export const crear = <Etiqueta extends keyof HTMLElementTagNameMap>(
  etiqueta: Etiqueta,
  atributos: Atributos = {},
  ...hijos: Hijo[]
): HTMLElementTagNameMap[Etiqueta] => {
  const elemento = document.createElement(etiqueta);
  for (const [nombre, valor] of Object.entries(atributos)) {
    if (valor === undefined || valor === false) continue;

    if (typeof valor === "function") {
      elemento.addEventListener(nombre.replace(/^on/, ""), valor);
    } else {
      elemento.setAttribute(nombre, valor === true ? "" : String(valor));
    }
  }
  anexar(elemento, ...hijos);
  return elemento;
};

const anexar = (elemento: HTMLElement, ...hijos: Hijo[]): void => {
  elemento.append(...hijos.filter((hijo) => hijo !== false && hijo !== undefined));
};

// Un botón que no envía el formulario en el que está.
export const boton = (texto: string, alHacerClic: () => void): HTMLButtonElement =>
  crear("button", { type: "button", onclick: alHacerClic }, texto);

export const botonDeEnvio = (texto: string): HTMLButtonElement => crear("button", { type: "submit" }, texto);

// Un formulario que no navega al enviarse: ejecuta la acción con el formulario ya completo.
export const formulario = (alEnviar: (formulario: HTMLFormElement) => void, ...hijos: Hijo[]): HTMLFormElement => {
  const elemento = crear(
    "form",
    {
      onsubmit: (evento: Event) => {
        evento.preventDefault();
        alEnviar(elemento);
      },
    },
    ...hijos,
  );
  return elemento;
};

// Una tabla sin filas no se muestra.
export const tabla = (
  titulo: string | undefined,
  encabezados: readonly string[],
  filas: HTMLTableRowElement[],
): HTMLTableElement | undefined =>
  filas.length === 0
    ? undefined
    : crear(
        "table",
        {},
        titulo !== undefined && crear("caption", {}, titulo),
        crear("thead", {}, crear("tr", {}, ...encabezados.map((texto) => crear("th", {}, texto)))),
        crear("tbody", {}, ...filas),
      );

// Un desplegable sin contenido no se muestra. La alerta acompaña al contenido, pero no decide si se muestra.
export const desplegable = (
  titulo: string,
  contenido: HTMLElement | undefined,
  alerta?: HTMLOutputElement,
): HTMLElement | undefined => contenido && crear("details", {}, crear("summary", {}, titulo), contenido, alerta);

export const fila = (...celdas: Hijo[]): HTMLTableRowElement =>
  crear("tr", {}, ...celdas.map((celda) => crear("td", {}, celda)));

// Al cerrarse sale del documento, para no acumular diálogos ocultos.
export const mostrarDialogo = (contenedor: HTMLElement, ...contenido: Hijo[]): HTMLDialogElement => {
  const dialogo = crear("dialog", { onclose: () => dialogo.remove() }, ...contenido);
  contenedor.append(dialogo);
  dialogo.showModal();
  return dialogo;
};

// El navegador guarda el contenido como un archivo con ese nombre.
export const descargar = (nombreDelArchivo: string, contenido: string, tipo: string): void => {
  const url = URL.createObjectURL(new Blob([contenido], { type: tipo }));
  const enlace = crear("a", { href: url, download: nombreDelArchivo });
  document.body.append(enlace);
  enlace.click();
  enlace.remove();
  URL.revokeObjectURL(url);
};

export const alerta = (): HTMLOutputElement => crear("output", { role: "alert" });

// Ejecuta la acción y muestra en la alerta el mensaje del error si falla. Devuelve si salió bien.
export const intentar = (accion: () => void, alerta: HTMLOutputElement): boolean => {
  try {
    alerta.textContent = "";
    accion();
    return true;
  } catch (error) {
    alerta.textContent = error instanceof Error ? error.message : String(error);
    return false;
  }
};

export const valorDe = (formulario: HTMLFormElement, nombre: string): string => {
  const control = formulario.elements.namedItem(nombre);
  if (!(control instanceof HTMLInputElement || control instanceof HTMLSelectElement)) {
    throw new Error(`El formulario no tiene el campo "${nombre}"`);
  }

  return control.value;
};

export const numeroDe = (formulario: HTMLFormElement, nombre: string): number => {
  const valor = valorDe(formulario, nombre);
  const numero = Number(valor);
  if (valor.trim() === "" || Number.isNaN(numero)) throw new Error("Falta un número");

  return numero;
};
