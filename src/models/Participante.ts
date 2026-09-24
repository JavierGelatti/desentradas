import type { Evento } from "./Evento.ts";
import type { Reglas } from "./Reglas.ts";
import type { Estado, MotivoDeFinalizacion, NombreDeEstado } from "./estados/Estado.ts";
import { Participando } from "./estados/Participando.ts";
import { Transicion, type Accion, type Disparador } from "./Transicion.ts";

export class Participante {
  private _nombre: string;
  private _estado: Estado;
  private _historial: Transicion[];

  constructor(nombre: string, fechaDeIngreso: Date) {
    this._nombre = nombre;
    this._estado = new Participando();
    this._historial = [Transicion.ingreso(fechaDeIngreso, this._estado.nombre())];
  }

  voy(evento: Evento, reglas: Reglas): void {
    this._transicionar("voy", evento.fecha(), this._estado.voy(evento, reglas));
  }

  falto(evento: Evento, reglas: Reglas): void {
    this._transicionar("falto", evento.fecha(), this._estado.falto(evento, reglas));
  }

  pago(fecha: Date, reglas: Reglas): void {
    this._transicionar("pago", fecha, this._estado.pago(fecha, reglas));
  }

  nombre(): string {
    return this._nombre;
  }

  estado(): NombreDeEstado {
    return this._estado.nombre();
  }

  historial(): readonly Transicion[] {
    return this._historial;
  }

  puede(accion: Accion): boolean {
    return this._estado.puede(accion);
  }

  accionesPosibles(): readonly Accion[] {
    return this._estado.accionesPosibles();
  }

  puedeAsistir(): boolean {
    return this._estado.puedeAsistir();
  }

  estaActivo(): boolean {
    return this._estado.estaActivo();
  }

  faltas(): number {
    return this._estado.faltas();
  }

  deudaAl(fecha: Date): number {
    return this._estado.deudaAl(fecha);
  }

  motivoDeFinalizacion(): MotivoDeFinalizacion | undefined {
    return this._estado.motivoDeFinalizacion();
  }

  private _transicionar(disparador: Disparador, fecha: Date, nuevoEstado: Estado): void {
    this._historial.push(new Transicion(fecha, disparador, this._estado.nombre(), nuevoEstado.nombre()));
    this._estado = nuevoEstado;
  }
}
