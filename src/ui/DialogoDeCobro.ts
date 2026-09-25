import { campoDeFecha, campoNumerico, controlDe } from "./Campos.ts";
import { Dialogo } from "./Dialogo.ts";
import { numeroDe, valorDe } from "./dom.ts";
import type { Entorno } from "./Entorno.ts";
import { desdeEntradaDeFecha } from "./Formato.ts";

// Cobro a una persona: el monto arranca en toda su deuda a la fecha elegida y se recalcula al cambiarla.
export class DialogoDeCobro {
  private _entorno: Entorno;
  private _nombre: string;
  private _fecha: Date;
  private _alCobrar: (() => void) | undefined;

  constructor(entorno: Entorno, nombre: string, fecha: Date, alCobrar?: () => void) {
    this._entorno = entorno;
    this._nombre = nombre;
    this._fecha = fecha;
    this._alCobrar = alCobrar;
  }

  abrirEn(contenedor: HTMLElement): void {
    const fecha = campoDeFecha("Fecha", "fecha", this._fecha);
    const monto = campoNumerico("Monto", "monto", this._deudaAl(this._fecha), 1);
    controlDe(fecha).addEventListener("change", () => {
      controlDe(monto).value = String(this._deudaAl(desdeEntradaDeFecha(controlDe(fecha).value)));
    });
    new Dialogo(this._entorno, `Cobrar a ${this._nombre}`, [fecha, monto], "Cobrar", (formulario) => {
      this._entorno
        .aplicacion()
        .cobrar(this._nombre, numeroDe(formulario, "monto"), desdeEntradaDeFecha(valorDe(formulario, "fecha")));
      this._alCobrar?.();
    }).abrirEn(contenedor);
  }

  private _deudaAl(fecha: Date): number {
    return this._entorno.grupo().participanteActivo(this._nombre)?.deudaAl(fecha) ?? 0;
  }
}
