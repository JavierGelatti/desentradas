import { Caja } from "./Caja.ts";
import { Cobro, type OrigenDeCobro } from "./Cobro.ts";
import type { Credito } from "./Credito.ts";
import type { Desempate } from "./Desempate.ts";
import type { Evento } from "./Evento.ts";
import type { Reglas } from "./Reglas.ts";
import type { Reparto } from "./Reparto.ts";
import { Participante } from "./Participante.ts";
import { TransicionInvalida } from "./estados/TransicionInvalida.ts";

export class Grupo {
  private _historialDeReglas: Reglas[];
  private _eventos: Evento[];
  private _participantes: Participante[];
  private _participantesHistoricos: Participante[];
  private _caja: Caja;

  constructor(reglasIniciales: Reglas, desempate: Desempate) {
    this._historialDeReglas = [reglasIniciales];
    this._eventos = [];
    this._participantes = [];
    this._participantesHistoricos = [];
    this._caja = new Caja(desempate);
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
    const participante = this._participanteHistoricoLlamado(nombreLimpio);

    participante.reingresar(fecha);
    this._participantesHistoricos.splice(this._participantesHistoricos.indexOf(participante), 1);
    this._participantes.push(participante);
    return participante;
  }

  registrarPago(nombre: string, monto: number, fecha: Date): void {
    const participante = this._participanteActivoLlamado(nombre);
    if (this._caja.huboCobrosDespuesDe(fecha)) throw new Error("El pago no puede ser anterior al último cobro");

    this._cobrarYRepartir(participante, monto, fecha, "efectivo");
    this._archivarFinalizados();
  }

  repartir(nombre: string, fecha: Date): Reparto {
    return this._caja.repartir(nombre, fecha);
  }

  registrarEvento(evento: Evento): void {
    this._asertarQueEsPosteriorAlUltimoEvento(evento);
    this._asertarQuePuedenAsistir(evento.asistentes());
    const reglas = this.reglasVigentesAl(evento.fecha());

    this._participantes.forEach((participante) => {
      if (evento.asistio(participante.nombre())) {
        participante.voy(evento, reglas);
      } else {
        participante.falto(evento, reglas);
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

  participantesHistoricos(): readonly Participante[] {
    return this._participantesHistoricos;
  }

  participanteActivo(nombre: string): Participante | undefined {
    return this._participantes.find((participante) => participante.nombre() === nombre);
  }

  yaParticipo(nombre: string): boolean {
    return this._participanteHistorico(nombre.trim()) !== undefined;
  }

  private _participanteActivoLlamado(nombre: string): Participante {
    const participante = this.participanteActivo(nombre);
    if (participante === undefined) throw new Error(`${nombre} no tiene una participación activa`);

    return participante;
  }

  private _participanteHistorico(nombre: string): Participante | undefined {
    return this._participantesHistoricos.find((participante) => participante.nombre() === nombre);
  }

  private _participanteHistoricoLlamado(nombre: string): Participante {
    const participante = this._participanteHistorico(nombre);
    if (participante === undefined) throw new Error(`${nombre} nunca ingresó al grupo`);

    return participante;
  }

  private _asertarQueNoTieneParticipacionActiva(nombre: string): void {
    if (this.participanteActivo(nombre) !== undefined) throw new Error(`${nombre} ya tiene una participación activa`);
  }

  private _asertarQueNuncaParticipo(nombre: string): void {
    if (this._participanteHistorico(nombre) !== undefined) {
      throw new Error(`${nombre} ya participó del grupo, debe reingresar`);
    }
  }

  private _asertarQuePuedenAsistir(nombres: Iterable<string>): void {
    for (const nombre of nombres) {
      const participante = this.participanteActivo(nombre);
      if (participante === undefined) throw new Error(`${nombre} no es un participante activo`);
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

  private _cobrarYRepartir(participante: Participante, monto: number, fecha: Date, origen: OrigenDeCobro): void {
    const eventoAdeudado = participante.eventoAdeudado();
    if (eventoAdeudado === undefined) throw new TransicionInvalida("pago", participante.estado());

    participante.pago(fecha, monto, this.reglasVigentesAl(fecha));
    const cobro = new Cobro(participante.nombre(), monto, fecha, eventoAdeudado, origen);
    this._caja.cobrar(cobro).forEach((credito) => this._aplicarSiElTitularDebe(credito, fecha));
  }

  private _aplicarSiElTitularDebe(credito: Credito, fecha: Date): void {
    const deudor = this.participanteActivo(credito.nombre());
    if (deudor === undefined) return;
    const deuda = deudor.deudaAl(fecha);
    if (deuda === 0) return;

    const monto = Math.min(credito.monto(), deuda);
    this._cobrarYRepartir(deudor, monto, fecha, this._caja.aplicar(credito, monto));
  }

  private _archivarFinalizados(): void {
    const finalizados = this._participantes.filter((participante) => !participante.estaActivo());
    this._participantes = this._participantes.filter((participante) => participante.estaActivo());
    this._participantesHistoricos.push(...finalizados);
  }
}
