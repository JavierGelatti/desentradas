import { alerta, boton, botonDeEnvio, crear, formulario, type Hijo } from "./dom.ts";
import type { Entorno } from "./Entorno.ts";

export class Dialogo {
  private _entorno: Entorno;
  private _titulo: string;
  private _campos: HTMLElement[];
  private _textoDeConfirmacion: string;
  private _textoDeCancelacion: string;
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
    this._textoDeCancelacion = "Cancelar";
    this._alConfirmar = alConfirmar;
    this._errores = alerta();
    this._elemento = undefined;
  }

  conTextoDeCancelacion(texto: string): this {
    this._textoDeCancelacion = texto;
    return this;
  }

  abrir(): void {
    this._elemento = this._entorno.mostrarDialogo(
      formulario(
        (completado) => this._confirmar(completado),
        crear("h3", {}, this._titulo),
        ...this._campos,
        this._errores,
        crear(
          "p",
          {},
          boton(this._textoDeCancelacion, () => this._cerrar()),
          " ",
          botonDeEnvio(this._textoDeConfirmacion),
        ),
      ),
    );
  }

  private _cerrar(): void {
    this._elemento?.close();
  }

  private _confirmar(formulario: HTMLFormElement): void {
    this._entorno.intentarYRefrescar(() => {
      this._alConfirmar(formulario);
      this._cerrar();
    }, this._errores);
  }
}

export const mostrarEnDialogo = (entorno: Entorno, titulo: string, ...contenido: Hijo[]): void => {
  const dialogo = entorno.mostrarDialogo(
    crear("h3", {}, titulo),
    ...contenido,
    crear(
      "p",
      {},
      boton("Cerrar", () => dialogo.close()),
    ),
  );
};
