import { alerta, boton, crear, intentar, mostrarDialogo } from "./dom.ts";
import type { Entorno } from "./Entorno.ts";

// Un formulario secundario en un <dialog> nativo: al confirmar ejecuta la acción y, si el modelo la rechaza,
// muestra el mensaje adentro del diálogo para que se pueda corregir y reintentar. Si sale bien, se cierra
// y la vista se vuelve a dibujar.
export class Dialogo {
  private _entorno: Entorno;
  private _titulo: string;
  private _campos: HTMLElement[];
  private _textoDeConfirmacion: string;
  private _alConfirmar: (formulario: HTMLFormElement) => void;
  private _errores: HTMLOutputElement;
  private _elemento: HTMLDialogElement | undefined;

  constructor(
    entorno: Entorno,
    titulo: string,
    campos: HTMLElement[],
    textoDeConfirmacion: string,
    alConfirmar: (formulario: HTMLFormElement) => void,
  ) {
    this._entorno = entorno;
    this._titulo = titulo;
    this._campos = campos;
    this._textoDeConfirmacion = textoDeConfirmacion;
    this._alConfirmar = alConfirmar;
    this._errores = alerta();
    this._elemento = undefined;
  }

  abrirEn(contenedor: HTMLElement): void {
    const formulario = crear(
      "form",
      { method: "dialog", onsubmit: (evento: Event) => this._confirmar(evento, formulario) },
      crear("h3", {}, this._titulo),
      ...this._campos,
      this._errores,
      crear(
        "p",
        {},
        boton("Cancelar", () => this._cerrar()),
        " ",
        crear("button", { type: "submit" }, this._textoDeConfirmacion),
      ),
    );
    this._elemento = mostrarDialogo(contenedor, formulario);
  }

  private _cerrar(): void {
    this._elemento?.close();
  }

  private _confirmar(evento: Event, formulario: HTMLFormElement): void {
    evento.preventDefault();
    if (!intentar(() => this._alConfirmar(formulario), this._errores)) return;

    this._cerrar();
    this._entorno.refrescar();
  }
}
