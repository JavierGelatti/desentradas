import type { Evento } from "./Evento.ts";
import type { Reglas } from "./Reglas.ts";
import { Participante } from "./Participante.ts";

export class Grupo {
  private _historialDeReglas: Reglas[];
  private _eventos: Evento[];
  private _participantes: Participante[];
  private _participantesHistoricos: Participante[];

  constructor(reglasIniciales: Reglas) {
    this._historialDeReglas = [reglasIniciales];
    this._eventos = [];
    this._participantes = [];
    this._participantesHistoricos = [];
  }

  cambiarReglas(reglas: Reglas): void {
    if (!this._esPosteriorAlUltimoEvento(reglas.rigeDesde())) {
      throw new Error("Las nuevas reglas deben regir desde después del último evento registrado");
    }

    if (!this._huboEventosDesde(this.reglas().rigeDesde())) this._historialDeReglas.pop();
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
    if (this.participanteActivo(nombre) !== undefined) {
      throw new Error(`${nombre} ya tiene una participación activa`);
    }

    const participante = new Participante(nombre, fecha);
    this._participantes.push(participante);
    return participante;
  }

  registrarPago(nombre: string, fecha: Date): void {
    const participante = this.participanteActivo(nombre);
    if (participante === undefined) throw new Error(`${nombre} no tiene una participación activa`);

    participante.pago(fecha, this.reglasVigentesAl(fecha));
    this._archivarFinalizados();
  }

  registrarEvento(evento: Evento): void {
    if (!this._esPosteriorAlUltimoEvento(evento.fecha())) {
      throw new Error("El evento debe ser posterior al último registrado");
    }
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

  participantes(): readonly Participante[] {
    return this._participantes;
  }

  participantesHistoricos(): readonly Participante[] {
    return this._participantesHistoricos;
  }

  participanteActivo(nombre: string): Participante | undefined {
    return this._participantes.find((participante) => participante.nombre() === nombre);
  }

  private _archivarFinalizados(): void {
    const finalizados = this._participantes.filter((participante) => !participante.estaActivo());
    this._participantes = this._participantes.filter((participante) => participante.estaActivo());
    this._participantesHistoricos.push(...finalizados);
  }

  private _asertarQuePuedenAsistir(nombres: Iterable<string>): void {
    for (const nombre of nombres) {
      const participante = this.participanteActivo(nombre);
      if (participante === undefined) throw new Error(`${nombre} no es un participante activo`);
      if (!participante.puedeAsistir()) throw new Error(`${nombre} no puede asistir`);
    }
  }

  private _esPosteriorAlUltimoEvento(fecha: Date): boolean {
    const ultimo = this._eventos.at(-1);
    return ultimo === undefined || fecha > ultimo.fecha();
  }

  private _huboEventosDesde(fecha: Date): boolean {
    return this._eventos.some((evento) => evento.fecha() >= fecha);
  }
}
