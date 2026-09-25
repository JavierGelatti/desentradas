import { campoDeFecha, campoNumerico, controlDe } from "./Campos.ts";
import { Dialogo } from "./Dialogo.ts";
import { numeroDe, valorDe } from "./dom.ts";
import type { Entorno } from "./Entorno.ts";
import { desdeEntradaDeFecha } from "./Formato.ts";

// Cobro a una persona: el monto arranca en toda su deuda a la fecha elegida y se recalcula al cambiarla.
// Quien lo abre dice cómo se cobra, porque en la puerta del evento el cobro además habilita a asistir.
export class DialogoDeCobro {
  private _entorno: Entorno;
  private _nombre: string;
  private _fecha: Date;
  private _cobrar: (monto: number, fecha: Date) => void;

  constructor(entorno: Entorno, nombre: string, fecha: Date, cobrar: (monto: number, fecha: Date) => void) {
    this._entorno = entorno;
    this._nombre = nombre;
    this._fecha = fecha;
    this._cobrar = cobrar;
  }

  abrirEn(contenedor: HTMLElement): void {
    const fecha = campoDeFecha("Fecha", "fecha", this._fecha);
    const monto = campoNumerico("Monto", "monto", this._deudaAl(this._fecha), 1);
    controlDe(fecha).addEventListener("change", () => {
      controlDe(monto).value = String(this._deudaAl(desdeEntradaDeFecha(controlDe(fecha).value)));
    });
    new Dialogo(this._entorno, `Cobrar a ${this._nombre}`, [fecha, monto], "Cobrar", (formulario) => {
      this._cobrar(numeroDe(formulario, "monto"), desdeEntradaDeFecha(valorDe(formulario, "fecha")));
    }).abrirEn(contenedor);
  }

  private _deudaAl(fecha: Date): number {
    return this._entorno.grupo().participanteActivo(this._nombre)?.deudaAl(fecha) ?? 0;
  }
}
