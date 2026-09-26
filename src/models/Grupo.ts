import { Caja } from "./Caja.ts";
import type { OrigenDeCobro } from "./Cobro.ts";
import type { Desempate } from "./Desempate.ts";
import type { Evento } from "./Evento.ts";
import type { Reglas } from "./Reglas.ts";
import type { Reparto } from "./Reparto.ts";
import { Participante } from "./Participante.ts";

export class Grupo {
  private _nombre: string;
  private _historialDeReglas: Reglas[];
  private _eventos: Evento[];
  private _participantes: Participante[];
  private _participantesFinalizados: Participante[];
  private _caja: Caja;

  constructor(nombre: string, reglasIniciales: Reglas, desempate: Desempate) {
    const nombreLimpio = nombre.trim();
    if (nombreLimpio === "") throw new Error("El nombre del grupo no puede estar vacío");

    this._nombre = nombreLimpio;
    this._historialDeReglas = [reglasIniciales];
    this._eventos = [];
    this._participantes = [];
    this._participantesFinalizados = [];
    this._caja = new Caja(desempate);
  }

  nombre(): string {
    return this._nombre;
  }

  cambiarReglas(reglas: Reglas): void {
    this._asertarQueRigenDespuesDelUltimoEvento(reglas);

    if (this._esPosteriorAlUltimoEvento(this.reglas().rigeDesde())) this._historialDeReglas.pop();
    this._historialDeReglas.push(reglas);
  }

  reglas(): Reglas {
    return this._historialDeReglas.at(-1)!;
  }

  historialDeReglas(): readonly Reglas[] {
    return this._historialDeReglas;
  }

  reglasAnteriores(): readonly Reglas[] {
    return this._historialDeReglas.slice(0, -1);
  }

  reglasVigentesAl(fecha: Date): Reglas {
    const vigentes = this._historialDeReglas.findLast((reglas) => reglas.rigeDesde() <= fecha);
    if (vigentes === undefined) throw new Error("No hay reglas vigentes en esa fecha");

    return vigentes;
  }

  ingresar(nombre: string, fecha: Date): Participante {
    const nombreLimpio = nombre.trim();
    if (nombreLimpio === "") throw new Error("El nombre no puede estar vacío");
    this._asertarQueNoTieneParticipacionActiva(nombreLimpio);
    this._asertarQueNuncaParticipo(nombreLimpio);

    const participante = new Participante(nombreLimpio, fecha);
    this._participantes.push(participante);
    return participante;
  }

  reingresar(nombre: string, fecha: Date): Participante {
    const nombreLimpio = nombre.trim();
    this._asertarQueNoTieneParticipacionActiva(nombreLimpio);
    const participante = this._participanteFinalizadoLlamado(nombreLimpio);

    participante.reingresar(fecha);
    this._participantesFinalizados.splice(this._participantesFinalizados.indexOf(participante), 1);
    this._participantes.push(participante);
    return participante;
  }

  cobrar(nombre: string, monto: number, fecha: Date): void {
    const participante = this._participanteActivoLlamado(nombre);
    if (this._caja.huboCobrosDespuesDe(fecha)) throw new Error("El cobro no puede ser anterior al último cobro");

    this._cobrarYDistribuir(participante, monto, fecha, "efectivo");
    this._archivarFinalizados();
  }

  repartir(nombre: string, fecha: Date): Reparto {
    return this._caja.repartir(nombre, fecha);
  }

  cerrarEvento(evento: Evento): void {
    this._asertarQueEsPosteriorAlUltimoEvento(evento);
    this._asertarQuePuedenAsistir(evento);
    const reglas = this.reglasVigentesAl(evento.fecha());

    this._participantesDelEvento(evento).forEach((participante) => {
      if (evento.asistio(participante.nombre())) {
        participante.voy(evento, reglas);
      } else {
        participante.falto(evento, reglas);
        this._aplicarCreditosPendientesDe(participante, evento.fecha());
      }
    });
    this._eventos.push(evento);
    this._archivarFinalizados();
  }

  eventos(): readonly Evento[] {
    return this._eventos;
  }

  caja(): Caja {
    return this._caja;
  }

  participantes(): readonly Participante[] {
    return this._participantes;
  }

  // Quienes se esperan en el próximo evento: los morosos no pueden asistir ni pagando.
  posiblesAsistentes(): readonly Participante[] {
    return this._participantes.filter((participante) => participante.esPosibleAsistente());
  }

  participantesFinalizados(): readonly Participante[] {
    return this._participantesFinalizados;
  }

  participanteActivo(nombre: string): Participante | undefined {
    return this._participantes.find((participante) => participante.nombre() === nombre);
  }

  yaParticipo(nombre: string): boolean {
    return this._participanteFinalizado(nombre.trim()) !== undefined;
  }

  private _participantesDelEvento(evento: Evento): readonly Participante[] {
    return this._participantes.filter((participante) => !participante.ingresoDespuesDe(evento));
  }

  private _participanteActivoLlamado(nombre: string): Participante {
    const participante = this.participanteActivo(nombre);
    if (participante === undefined) throw new Error(`${nombre} no tiene una participación activa`);

    return participante;
  }

  private _participanteFinalizado(nombre: string): Participante | undefined {
    return this._participantesFinalizados.find((participante) => participante.nombre() === nombre);
  }

  private _participanteFinalizadoLlamado(nombre: string): Participante {
    const participante = this._participanteFinalizado(nombre);
    if (participante === undefined) throw new Error(`${nombre} nunca ingresó al grupo`);

    return participante;
  }

  private _asertarQueNoTieneParticipacionActiva(nombre: string): void {
    if (this.participanteActivo(nombre) !== undefined) throw new Error(`${nombre} ya tiene una participación activa`);
  }

  private _asertarQueNuncaParticipo(nombre: string): void {
    if (this._participanteFinalizado(nombre) !== undefined) {
      throw new Error(`${nombre} ya participó del grupo, debe reingresar`);
    }
  }

  private _asertarQuePuedenAsistir(evento: Evento): void {
    for (const nombre of evento.asistentes()) {
      const participante = this.participanteActivo(nombre);
      if (participante === undefined) throw new Error(`${nombre} no es un participante activo`);
      if (participante.ingresoDespuesDe(evento)) throw new Error(`${nombre} ingresó después del evento`);
      if (!participante.puedeAsistir()) throw new Error(`${nombre} no puede asistir`);
    }
  }

  private _asertarQueEsPosteriorAlUltimoEvento(evento: Evento): void {
    if (!this._esPosteriorAlUltimoEvento(evento.fecha())) {
      throw new Error("El evento debe ser posterior al último registrado");
    }
  }

  private _asertarQueRigenDespuesDelUltimoEvento(reglas: Reglas): void {
    if (!this._esPosteriorAlUltimoEvento(reglas.rigeDesde())) {
      throw new Error("Las nuevas reglas deben regir desde después del último evento registrado");
    }
  }

  private _esPosteriorAlUltimoEvento(fecha: Date): boolean {
    const ultimo = this._eventos.at(-1);
    return ultimo === undefined || fecha > ultimo.fecha();
  }

  private _cobrarYDistribuir(participante: Participante, monto: number, fecha: Date, origen: OrigenDeCobro): void {
    const cobro = participante.pago(fecha, monto, this.reglasVigentesAl(fecha), origen);
    const acreedores = new Set(this._caja.cobrar(cobro).map((credito) => credito.acreedor()));
    acreedores.forEach((nombre) => {
      const acreedor = this.participanteActivo(nombre);
      if (acreedor !== undefined) this._aplicarCreditosPendientesDe(acreedor, fecha);
    });
  }

  private _aplicarCreditosPendientesDe(participante: Participante, fecha: Date): void {
    for (const credito of this._caja.creditosPendientesDe(participante.nombre())) {
      const deuda = participante.deudaAl(fecha);
      if (deuda === 0) return;

      const monto = Math.min(credito.monto(), deuda);
      this._cobrarYDistribuir(participante, monto, fecha, this._caja.aplicar(credito, monto));
    }
  }

  private _archivarFinalizados(): void {
    const finalizados = this._participantes.filter((participante) => !participante.estaActivo());
    this._participantes = this._participantes.filter((participante) => participante.estaActivo());
    this._participantesFinalizados.push(...finalizados);
  }
}
