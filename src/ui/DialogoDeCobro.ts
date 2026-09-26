import { campoNumerico } from "./Campos.ts";
import { Dialogo } from "./Dialogo.ts";
import { numeroDe } from "./dom.ts";
import type { Entorno } from "./Entorno.ts";

// Cobro a una persona: sólo pide el monto, que arranca en toda su deuda.
// Quien lo abre dice cómo y cuándo se cobra, porque en la puerta del evento el cobro además habilita a asistir.
export class DialogoDeCobro {
  private _entorno: Entorno;
  private _nombre: string;
  private _deuda: number;
  private _cobrar: (monto: number) => void;

  constructor(entorno: Entorno, nombre: string, deuda: number, cobrar: (monto: number) => void) {
    this._entorno = entorno;
    this._nombre = nombre;
    this._deuda = deuda;
    this._cobrar = cobrar;
  }

  abrirEn(contenedor: HTMLElement): void {
    const monto = campoNumerico("Monto", "monto", this._deuda, 1);
    new Dialogo(this._entorno, `Cobrar a ${this._nombre}`, [monto], "Cobrar", (formulario) => {
      this._cobrar(numeroDe(formulario, "monto"));
    }).abrirEn(contenedor);
  }
}
