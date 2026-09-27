import { Caja } from "./Caja.ts";
import type { OrigenDeCobro } from "./Cobro.ts";
import type { Credito } from "./Credito.ts";
import type { Desempate } from "./Desempate.ts";
import type { Encuentro } from "./Encuentro.ts";
import type { Reglas } from "./Reglas.ts";
import type { Reparto } from "./Reparto.ts";
import { Participante } from "./Participante.ts";
import { Saldo } from "./Saldo.ts";

export class Grupo {
  private _nombre: string;
  private _historialDeReglas: Reglas[];
  private _encuentros: Encuentro[];
  private _participantes: Participante[];
  private _caja: Caja;

  constructor(nombre: string, reglasIniciales: Reglas, desempate: Desempate) {
    const nombreLimpio = nombre.trim();
    if (nombreLimpio === "") throw new Error("El nombre del grupo no puede estar vacío");

    this._nombre = nombreLimpio;
    this._historialDeReglas = [reglasIniciales];
    this._encuentros = [];
    this._participantes = [];
    this._caja = new Caja(desempate);
  }

  nombre(): string {
    return this._nombre;
  }

  cambiarReglas(reglas: Reglas): void {
    this._asertarQueRigenDespuesDelUltimoEncuentro(reglas);

    if (this._esPosteriorAlUltimoEncuentro(this.reglas().rigeDesde())) this._historialDeReglas.pop();
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
    return participante;
  }

  cobrar(nombre: string, monto: number, fecha: Date): void {
    const participante = this._participanteActivoLlamado(nombre);
    this._asertarQueNoEsAnteriorAlUltimoMovimiento("El cobro", fecha);

    this._cobrarYDistribuir(participante, monto, fecha, "efectivo");
  }

  repartir(nombre: string, fecha: Date): Reparto {
    this._asertarQueNoEsAnteriorAlUltimoMovimiento("El reparto", fecha);

    return this._caja.repartir(nombre, fecha);
  }

  registrarEncuentro(encuentro: Encuentro): void {
    this._asertarQueEsPosteriorAlUltimoEncuentro(encuentro);
    this._asertarQueNoEsAnteriorAlUltimoMovimiento("El encuentro", encuentro.fecha());
    this._asertarQuePuedenAsistir(encuentro);
    this._asertarQuePuedenFaltar(encuentro);
    const reglas = this.reglasVigentesAl(encuentro.fecha());

    this._participantesLlamados(encuentro.asistentes()).forEach((participante) => participante.voy(encuentro));
    this._participantesLlamados(encuentro.ausentes()).forEach((participante) => {
      participante.falto(encuentro, reglas);
      this._aplicarCreditosPendientesDe(participante, encuentro.fecha());
    });
    this._encuentros.push(encuentro);
  }

  encuentros(): readonly Encuentro[] {
    return this._encuentros;
  }

  caja(): Caja {
    return this._caja;
  }

  participantes(): readonly Participante[] {
    return this._participantes.filter((participante) => participante.estaActivo());
  }

  posiblesAsistentes(): readonly Participante[] {
    return this._participantes.filter((participante) => participante.esPosibleAsistente());
  }

  participantesFinalizados(): readonly Participante[] {
    return this._participantes.filter((participante) => !participante.estaActivo());
  }

  // Ningún nombre se repite: quien debe no tiene créditos pendientes.
  saldosAl(fecha: Date): readonly Saldo[] {
    const deudas = this._participantes
      .map((participante) => new Saldo(participante.nombre(), -participante.deudaAl(fecha)))
      .filter((saldo) => saldo.debe());
    const creditos = this._caja
      .nombresConCreditosPendientes()
      .map((nombre) => new Saldo(nombre, this._caja.montoPendienteDe(nombre)));
    return [...deudas, ...creditos];
  }

  participante(nombre: string): Participante | undefined {
    return this._participantes.find((participante) => participante.nombre() === nombre);
  }

  participanteActivo(nombre: string): Participante | undefined {
    return this.participantes().find((participante) => participante.nombre() === nombre);
  }

  yaParticipo(nombre: string): boolean {
    return this._participanteFinalizado(nombre.trim()) !== undefined;
  }

  private _participantesLlamados(nombres: Iterable<string>): readonly Participante[] {
    return [...nombres].map((nombre) => this._participanteActivoLlamado(nombre));
  }

  private _participanteActivoLlamado(nombre: string): Participante {
    const participante = this.participanteActivo(nombre);
    if (participante === undefined) throw new Error(`${nombre} no tiene una participación activa`);

    return participante;
  }

  private _participanteFinalizado(nombre: string): Participante | undefined {
    return this.participantesFinalizados().find((participante) => participante.nombre() === nombre);
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

  private _asertarQuePuedenAsistir(encuentro: Encuentro): void {
    for (const nombre of encuentro.asistentes()) {
      const participante = this._participanteDelEncuentroLlamado(nombre, encuentro);
      if (!participante.puedeAsistir()) throw new Error(`${nombre} no puede asistir`);
    }
  }

  private _asertarQuePuedenFaltar(encuentro: Encuentro): void {
    for (const nombre of encuentro.ausentes()) {
      const participante = this._participanteDelEncuentroLlamado(nombre, encuentro);
      if (!participante.esPosibleAsistente()) throw new Error(`${nombre} no puede faltar`);
    }
  }

  private _participanteDelEncuentroLlamado(nombre: string, encuentro: Encuentro): Participante {
    const participante = this.participanteActivo(nombre);
    if (participante === undefined) throw new Error(`${nombre} no es un participante activo`);
    if (participante.ingresoDespuesDe(encuentro)) throw new Error(`${nombre} ingresó después del encuentro`);

    return participante;
  }

  private _asertarQueEsPosteriorAlUltimoEncuentro(encuentro: Encuentro): void {
    if (!this._esPosteriorAlUltimoEncuentro(encuentro.fecha())) {
      throw new Error("El encuentro debe ser posterior al último registrado");
    }
  }

  private _asertarQueNoEsAnteriorAlUltimoMovimiento(movimiento: string, fecha: Date): void {
    if (this._huboEncuentrosDespuesDe(fecha)) {
      throw new Error(`${movimiento} no puede ser anterior al último encuentro`);
    }
    const posterior = this._caja.movimientoPosteriorA(fecha);
    if (posterior !== undefined) {
      throw new Error(`${movimiento} no puede ser anterior al último ${posterior.tipo()}`);
    }
  }

  private _asertarQueRigenDespuesDelUltimoEncuentro(reglas: Reglas): void {
    if (!this._esPosteriorAlUltimoEncuentro(reglas.rigeDesde())) {
      throw new Error("Las nuevas reglas deben regir desde después del último encuentro registrado");
    }
  }

  private _esPosteriorAlUltimoEncuentro(fecha: Date): boolean {
    return this._encuentros.every((encuentro) => encuentro.fecha() < fecha);
  }

  private _huboEncuentrosDespuesDe(fecha: Date): boolean {
    return this._encuentros.some((encuentro) => encuentro.fecha() > fecha);
  }

  private _cobrarYDistribuir(participante: Participante, monto: number, fecha: Date, origen: OrigenDeCobro): void {
    const cobro = participante.pago(fecha, monto, origen);
    this._aplicarCreditosPendientesDeLosAcreedores(this._caja.cobrar(cobro), fecha);
  }

  private _aplicarCreditosPendientesDeLosAcreedores(creditos: readonly Credito[], fecha: Date): void {
    const acreedores = new Set(creditos.map((credito) => credito.acreedor()));
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
      this._cobrarYDistribuir(participante, monto, fecha, credito);
    }
  }
}
