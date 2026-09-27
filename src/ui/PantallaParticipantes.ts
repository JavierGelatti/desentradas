import type { Participante } from "../models/Participante.ts";
import { DialogoDeRegistro } from "./DialogoDeRegistro.ts";
import { alerta, boton, crear, desplegable, fila, type Hijo, tabla, tablaOAviso } from "./dom.ts";
import type { Entorno } from "./Entorno.ts";
import { porNombre } from "./Orden.ts";

const ultimoCambioDe = (participante: Participante) => participante.fechaDelUltimoCambio().getTime();

// Primero quienes no están al día, del cambio más reciente al más antiguo; después los que están al día, por nombre.
const porAtencionYNombre = (uno: Participante, otro: Participante): number => {
  const unoAlDia = uno.estaAlDia();
  const otroAlDia = otro.estaAlDia();
  if (unoAlDia !== otroAlDia) return unoAlDia ? 1 : -1;
  if (!unoAlDia && ultimoCambioDe(uno) !== ultimoCambioDe(otro)) {
    return ultimoCambioDe(otro) - ultimoCambioDe(uno);
  }

  return porNombre(uno, otro);
};

export class PantallaParticipantes {
  private _entorno: Entorno;
  private _erroresDeReingreso: HTMLOutputElement;

  constructor(entorno: Entorno) {
    this._entorno = entorno;
    this._erroresDeReingreso = alerta();
  }

  elemento(): HTMLElement {
    return crear(
      "section",
      {},
      crear("h2", {}, "Participantes"),
      ...this._tablaDeActivos(),
      desplegable("Participaciones finalizadas", this._tablaDeFinalizados(), this._erroresDeReingreso),
    );
  }

  private _tablaDeActivos(): Hijo[] {
    const activos = this._entorno.grupo().participantes().toSorted(porAtencionYNombre);
    return tablaOAviso(
      "Participaciones activas",
      ["Nombre", "Estado"],
      activos.map((participante) => this._filaDeActivo(participante)),
      "Todavía no hay nadie",
      boton("Registrar participante", () => this._abrirIngreso()),
    );
  }

  private _filaDeActivo(participante: Participante): HTMLTableRowElement {
    return fila(participante.nombre(), this._estadoConFaltas(participante));
  }

  // Sólo en libre de deuda las faltas cuentan contra la tolerancia.
  private _estadoConFaltas(participante: Participante): string {
    const estado = participante.estado();
    if (estado !== "libre de deuda") return estado;

    const tolerancia = participante.reglas().toleranciaDeFaltas();
    return `${estado} (${participante.faltas()}/${tolerancia} faltas)`;
  }

  private _tablaDeFinalizados(): HTMLElement | undefined {
    const finalizados = this._entorno.grupo().participantesFinalizados().toSorted(porNombre);
    return tabla(
      "Quienes ya no participan",
      ["Nombre", "Motivo", ""],
      finalizados.map((participante) => this._filaDeFinalizado(participante)),
    );
  }

  private _filaDeFinalizado(participante: Participante): HTMLTableRowElement {
    const nombre = participante.nombre();
    return fila(
      nombre,
      participante.motivoDeFinalizacion() ?? "",
      boton("Reingresar", () => this._reingresar(nombre)),
    );
  }

  private _abrirIngreso(): void {
    new DialogoDeRegistro(this._entorno, "Registrar participante", (nombre) =>
      this._entorno.aplicacion().ingresar(nombre, this._entorno.ahora()),
    ).abrir();
  }

  private _reingresar(nombre: string): void {
    this._entorno.intentarYRefrescar(() => {
      this._entorno.aplicacion().reingresar(nombre, this._entorno.ahora());
    }, this._erroresDeReingreso);
  }
}
