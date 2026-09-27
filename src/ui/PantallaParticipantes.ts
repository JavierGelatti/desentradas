import { monto } from "../app/Formato.ts";
import type { Participante } from "../models/Participante.ts";
import { DialogoDeCobro } from "./DialogoDeCobro.ts";
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
      desplegable("Quienes ya no participan", this._tablaDeQuienesYaNoParticipan(), this._erroresDeReingreso),
    );
  }

  private _tablaDeActivos(): Hijo[] {
    const activos = this._entorno
      .grupo()
      .participantes()
      .filter((participante) => !participante.soloLeFaltaPagarParaReingresar())
      .toSorted(porAtencionYNombre);
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

  // Un moroso sigue activo en el grupo, pero para volver a participar tiene que pagar y reingresar.
  private _tablaDeQuienesYaNoParticipan(): HTMLElement | undefined {
    const grupo = this._entorno.grupo();
    const morosos = grupo.participantes().filter((participante) => participante.soloLeFaltaPagarParaReingresar());
    return tabla(
      undefined,
      ["Nombre", "Motivo", ""],
      [...morosos, ...grupo.participantesFinalizados()]
        .toSorted(porNombre)
        .map((participante) =>
          participante.soloLeFaltaPagarParaReingresar()
            ? this._filaDeMoroso(participante)
            : this._filaDeFinalizado(participante),
        ),
    );
  }

  private _filaDeMoroso(participante: Participante): HTMLTableRowElement {
    const deuda = participante.deudaAl(this._entorno.ahora());
    return fila(
      participante.nombre(),
      `moroso, debe ${monto(deuda)}`,
      boton("Cobrar y reingresar", () => this._abrirCobro(participante.nombre(), deuda)),
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

  private _abrirCobro(nombre: string, deuda: number): void {
    new DialogoDeCobro(this._entorno, nombre, deuda, (monto) =>
      this._entorno.aplicacion().cobrarYReingresar(nombre, monto, this._entorno.ahora()),
    ).abrir();
  }

  private _reingresar(nombre: string): void {
    this._entorno.intentarYRefrescar(() => {
      this._entorno.aplicacion().reingresar(nombre, this._entorno.ahora());
    }, this._erroresDeReingreso);
  }
}
