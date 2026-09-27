import { Cobro, type OrigenDeCobro } from "./Cobro.ts";
import type { Encuentro } from "./Encuentro.ts";
import type { Reglas } from "./Reglas.ts";
import type { Estado, NombreDeEstado } from "./estados/Estado.ts";
import { Participando } from "./estados/Participando.ts";
import { Transicion, type Accion, type Disparador } from "./Transicion.ts";

export type MotivoDeFinalizacion = "por faltas" | "por pago de morosidad";

export class Participante {
  private _nombre: string;
  private _historial: Transicion[];

  constructor(nombre: string, fechaDeIngreso: Date, reglas: Reglas) {
    this._nombre = nombre;
    this._historial = [new Transicion(fechaDeIngreso, "ingreso", new Participando(reglas))];
  }

  voy(encuentro: Encuentro, reglas: Reglas): void {
    this._transicionar("voy", encuentro.fecha(), this._estado().voy(reglas));
  }

  falto(encuentro: Encuentro): void {
    this._transicionar("falto", encuentro.fecha(), this._estado().falto(encuentro));
  }

  pago(fecha: Date, monto: number, origen: OrigenDeCobro): Cobro {
    const cobro = new Cobro(this._nombre, monto, fecha, this._estado().encuentroAdeudado(), origen);
    this._transicionar("pago", fecha, this._estado().pago(fecha, monto));
    return cobro;
  }

  reingresar(fecha: Date, reglas: Reglas): void {
    const participando = this._estado().reingresar(reglas);
    this._asertarQueNoEsAnteriorALaFinalizacion(fecha);

    this._transicionar("reingresar", fecha, participando);
  }

  nombre(): string {
    return this._nombre;
  }

  estado(): NombreDeEstado {
    return this._estado().nombre();
  }

  reglas(): Reglas {
    return this._estado().reglas();
  }

  historial(): readonly Transicion[] {
    return this._historial;
  }

  fechaDeIngreso(): Date {
    return this._historial.findLast((transicion) => transicion.iniciaParticipacion())!.fecha();
  }

  ingresoDespuesDe(encuentro: Encuentro): boolean {
    return this.fechaDeIngreso() > encuentro.fecha();
  }

  fechaDelUltimoCambio(): Date {
    return this._ultimaTransicion().fecha();
  }

  puede(accion: Accion): boolean {
    return this._estado().puede(accion);
  }

  accionesPosibles(): readonly Accion[] {
    return this._estado().accionesPosibles();
  }

  puedeAsistir(): boolean {
    return this._estado().puedeAsistir();
  }

  esPosibleAsistente(): boolean {
    return this._estado().esPosibleAsistente();
  }

  soloLeFaltaPagarParaAsistir(): boolean {
    return this._estado().soloLeFaltaPagarParaAsistir();
  }

  soloLeFaltaPagarParaReingresar(): boolean {
    return this._estado().soloLeFaltaPagarParaReingresar();
  }

  estaAlDia(): boolean {
    return this._estado().estaAlDia();
  }

  estaActivo(): boolean {
    return this._estado().estaActivo();
  }

  faltas(): number {
    return this._estado().faltas();
  }

  deudaAl(fecha: Date): number {
    return this._estado().deudaAl(fecha);
  }

  motivoDeFinalizacion(): MotivoDeFinalizacion | undefined {
    if (this.estaActivo()) return undefined;

    return this._ultimaTransicion().disparador() === "falto" ? "por faltas" : "por pago de morosidad";
  }

  private _asertarQueNoEsAnteriorALaFinalizacion(fecha: Date): void {
    if (fecha < this.fechaDelUltimoCambio()) throw new Error("El reingreso no puede ser anterior a la finalización");
  }

  private _transicionar(disparador: Disparador, fecha: Date, nuevoEstado: Estado): void {
    this._historial.push(new Transicion(fecha, disparador, nuevoEstado));
  }

  private _estado(): Estado {
    return this._ultimaTransicion().hacia();
  }

  private _ultimaTransicion(): Transicion {
    return this._historial.at(-1)!;
  }
}
