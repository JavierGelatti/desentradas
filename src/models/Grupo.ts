import type { Evento } from "./Evento.ts";
import type { Reglas } from "./Reglas.ts";
import { Participante } from "./Participante.ts";

export class Grupo {
  private _reglas: Reglas;
  private _eventos: Evento[];
  private _participantes: Participante[];
  private _participantesHistoricos: Participante[];

  constructor(reglas: Reglas) {
    this._reglas = reglas;
    this._eventos = [];
    this._participantes = [];
    this._participantesHistoricos = [];
  }

  ingresar(nombre: string, fecha: Date): Participante {
    if (this.participanteActivo(nombre) !== undefined) {
      throw new Error(`${nombre} ya tiene una participación activa`);
    }

    const participante = new Participante(nombre, this._reglas, fecha);
    this._participantes.push(participante);
    return participante;
  }

  registrarPago(nombre: string, fecha: Date): void {
    const participante = this.participanteActivo(nombre);
    if (participante === undefined) throw new Error(`${nombre} no tiene una participación activa`);

    participante.pago(fecha);
    this._archivarFinalizados();
  }

  registrarEvento(evento: Evento): void {
    if (!this._esPosteriorAlUltimoEvento(evento)) {
      throw new Error("El evento debe ser posterior al último registrado");
    }
    this._asertarQuePuedenAsistir(evento.asistentes());

    this._participantes.forEach((participante) => {
      if (evento.asistio(participante.nombre())) {
        participante.voy(evento);
      } else {
        participante.falto(evento);
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

  private _esPosteriorAlUltimoEvento(evento: Evento): boolean {
    const ultimo = this._eventos.at(-1);
    return ultimo === undefined || evento.fecha() > ultimo.fecha();
  }
}
