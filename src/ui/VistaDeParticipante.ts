import diagramaSvg from "./estado_participante.svg?raw";
import { Evento } from "../models/Evento.ts";
import type { Participante } from "../models/Participante.ts";
import type { Accion } from "../models/Transicion.ts";

// Cada estado del participante se corresponde con una celda del diagrama (data-cell-id).
const celdaDelEstado = {
  participando: "daeG-zkA-Ir4rAnkjDKd-4",
  "en deuda": "daeG-zkA-Ir4rAnkjDKd-5",
  "libre de deuda": "daeG-zkA-Ir4rAnkjDKd-6",
  moroso: "daeG-zkA-Ir4rAnkjDKd-7",
  "finalizado por faltas": "daeG-zkA-Ir4rAnkjDKd-8",
  "finalizado por pago de morosidad": "daeG-zkA-Ir4rAnkjDKd-9",
};

const unDia = 24 * 60 * 60 * 1000;

export class VistaDeParticipante {
  private _crearParticipante: () => Participante;
  private _fechaInicial: Date;
  private _participante: Participante;
  private _fechaActual: Date;
  private _elemento: HTMLElement;
  private _diagrama: SVGSVGElement;
  private _botones: Map<Accion, HTMLButtonElement>;
  private _botonReiniciar: HTMLButtonElement;

  constructor(crearParticipante: () => Participante, fechaInicial: Date) {
    this._crearParticipante = crearParticipante;
    this._fechaInicial = fechaInicial;
    this._participante = crearParticipante();
    this._fechaActual = fechaInicial;

    this._elemento = document.createElement("div");
    this._elemento.classList.add("diagramaDeEstados");
    this._elemento.innerHTML = diagramaSvg;
    this._diagrama = this._elemento.querySelector("svg")!;

    this._botones = new Map([
      ["voy", this._boton("voy", () => this._participante.voy(this._proximoEvento([this._participante.nombre()])))],
      ["falto", this._boton("falto", () => this._participante.falto(this._proximoEvento(["otra persona"])))],
      ["pago", this._boton("pago", () => this._participante.pago(this._proximaFecha()))],
    ]);

    const botones = document.createElement("div");
    botones.classList.add("botonesAcciones");
    botones.append(...this._botones.values());
    this._botonReiniciar = this._boton("🔁", () => this._reiniciar());
    this._botonReiniciar.classList.add("botonReiniciar");
    this._botonReiniciar.title = "Reiniciar";
    botones.append(this._botonReiniciar);

    this._elemento.append(botones);
    this._actualizar();
  }

  elemento(): HTMLElement {
    return this._elemento;
  }

  private _boton(texto: string, accion: () => void): HTMLButtonElement {
    const boton = document.createElement("button");
    boton.textContent = texto;
    boton.addEventListener("click", () => {
      accion();
      this._actualizar();
    });
    return boton;
  }

  private _reiniciar(): void {
    this._participante = this._crearParticipante();
    this._fechaActual = this._fechaInicial;
  }

  private _actualizar(): void {
    this._resaltarEstadoActual();
    this._habilitarAccionesPosibles();
  }

  private _habilitarAccionesPosibles(): void {
    for (const [accion, boton] of this._botones) {
      boton.disabled = !this._participante.puede(accion);
    }

    this._botonReiniciar.disabled = this._participante.estaActivo();
  }

  private _resaltarEstadoActual(): void {
    for (const celda of Object.values(celdaDelEstado)) {
      this._formaDeLaCelda(celda).style.fill = "";
    }

    this._formaDeLaCelda(celdaDelEstado[this._estadoActual()]).style.fill = "light-dark(lightyellow, darkgoldenrod)";
  }

  private _estadoActual(): keyof typeof celdaDelEstado {
    const estado = this._participante.estado();
    if (estado === "finalizado") return `finalizado ${this._participante.motivoDeFinalizacion()!}`;

    return estado;
  }

  // La forma es el rectángulo del estado o, en los estados finales, el anillo exterior.
  private _formaDeLaCelda(celda: string): SVGElement {
    const formas = this._diagrama.querySelectorAll<SVGElement>(`[data-cell-id="${celda}"] :is(rect, ellipse)`);
    return formas[0];
  }

  private _proximoEvento(asistentes: string[]): Evento {
    return new Evento(this._proximaFecha(), asistentes);
  }

  private _proximaFecha(): Date {
    this._fechaActual = new Date(this._fechaActual.getTime() + unDia);
    return this._fechaActual;
  }
}
