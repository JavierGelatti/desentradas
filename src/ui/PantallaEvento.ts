import type { PlanillaDeAsistencia } from "../app/PlanillaDeAsistencia.ts";
import type { Participante } from "../models/Participante.ts";
import { Dialogo } from "./Dialogo.ts";
import { DialogoDeCobro } from "./DialogoDeCobro.ts";
import { DialogoDeRegistro } from "./DialogoDeRegistro.ts";
import { alerta, boton, botonDeEnvio, crear, fila, formulario, tabla } from "./dom.ts";
import type { Entorno } from "./Entorno.ts";
import { fechaYHora, monto } from "./Formato.ts";
import { alfabetico, porNombre } from "./Orden.ts";

// La pantalla de la noche: se empieza el evento, se marca quién vino y se cierra o se cancela.
export class PantallaEvento {
  private _entorno: Entorno;
  private _errores: HTMLOutputElement;

  constructor(entorno: Entorno) {
    this._entorno = entorno;
    this._errores = alerta();
  }

  elemento(): HTMLElement {
    return crear(
      "section",
      {},
      crear("h2", {}, "Evento"),
      this._entorno.aplicacion().tienePlanillaDeAsistencia()
        ? this._formulario()
        : crear(
            "p",
            {},
            boton("Empezar evento", () => this._empezar()),
          ),
    );
  }

  private _formulario(): HTMLFormElement {
    return formulario(
      () => this._pedirConfirmacion(),
      this._tablaDeAsistencia() ?? crear("p", {}, "Todavía no hay nadie"),
      crear(
        "p",
        {},
        boton("Vino alguien nuevo", () => this._abrirIngreso()),
      ),
      this._errores,
      crear(
        "p",
        {},
        boton("Cancelar", () => this._cancelar()),
        " ",
        botonDeEnvio("Cerrar evento"),
      ),
    );
  }

  private _empezar(): void {
    this._entorno.aplicacion().empezarPlanillaDeAsistencia();
    this._entorno.refrescar();
  }

  private _cancelar(): void {
    if (this._planillaDeAsistencia().asistentes().length === 0) {
      this._entorno.aplicacion().descartarPlanillaDeAsistencia();
      this._entorno.refrescar();
    } else {
      new Dialogo(
        this._entorno,
        "Cancelar evento",
        [crear("p", {}, "Se van a perder las marcas de asistencia.")],
        "Descartar",
        () => this._entorno.aplicacion().descartarPlanillaDeAsistencia(),
      ).abrir();
    }
  }

  private _tablaDeAsistencia(): HTMLTableElement | undefined {
    const posiblesAsistentes = this._entorno.grupo().posiblesAsistentes().toSorted(porNombre);
    return tabla(
      "Asistencia",
      ["Asiste", "Nombre", "Estado", ""],
      posiblesAsistentes.map((participante) => this._filaDe(participante)),
    );
  }

  private _filaDe(participante: Participante): HTMLTableRowElement {
    const nombre = participante.nombre();
    const casilla = crear("input", {
      type: "checkbox",
      name: "asistentes",
      value: nombre,
      "aria-label": `Asiste ${nombre}`,
      checked: this._planillaDeAsistencia().asiste(nombre),
      disabled: !participante.puedeAsistir(),
      onchange: () => this._marcar(nombre, casilla.checked),
    });
    return fila(casilla, nombre, participante.estado(), this._accionDe(participante));
  }

  private _accionDe(participante: Participante): HTMLElement | false {
    const nombre = participante.nombre();
    if (participante.soloLeFaltaPagarParaAsistir()) {
      return boton("Cobrar y habilitar", () => this._abrirCobro(participante));
    }
    if (!this._planillaDeAsistencia().asiste(nombre)) return false;

    const pendiente = this._entorno.grupo().caja().montoPendienteDe(nombre);
    return pendiente > 0 && boton(`Repartir ${monto(pendiente)}`, () => this._repartir(nombre));
  }

  private _planillaDeAsistencia(): PlanillaDeAsistencia {
    return this._entorno.aplicacion().planillaDeAsistencia();
  }

  private _marcar(nombre: string, asiste: boolean): void {
    if (asiste) {
      this._planillaDeAsistencia().marcarComoPresente(nombre);
    } else {
      this._planillaDeAsistencia().desmarcarComoPresente(nombre);
    }
    this._entorno.refrescar();
  }

  private _abrirCobro(participante: Participante): void {
    const nombre = participante.nombre();
    const deuda = participante.deudaAl(this._entorno.ahora());
    new DialogoDeCobro(this._entorno, nombre, deuda, (monto) =>
      this._entorno.aplicacion().cobrarEnLaPuerta(nombre, monto, this._entorno.ahora()),
    ).abrir();
  }

  private _repartir(nombre: string): void {
    this._entorno.intentarYRefrescar(
      () => this._entorno.aplicacion().repartir(nombre, this._entorno.ahora()),
      this._errores,
    );
  }

  private _abrirIngreso(): void {
    new DialogoDeRegistro(this._entorno, "Vino alguien nuevo", (nombre) =>
      this._entorno.aplicacion().ingresarAsistente(nombre, this._entorno.ahora()),
    ).abrir();
  }

  private _pedirConfirmacion(): void {
    const ausentes = this._entorno.aplicacion().ausentesEnPlanillaDeAsistencia().toSorted(alfabetico);
    const aviso = ausentes.length === 0 ? "Nadie queda ausente." : `Quedan ausentes: ${ausentes.join(", ")}.`;
    new Dialogo(
      this._entorno,
      "Cerrar evento",
      [
        crear("p", {}, `Se va a registrar el evento con fecha ${fechaYHora(this._entorno.ahora())}.`),
        crear("p", {}, aviso),
      ],
      "Confirmar",
      () => this._entorno.aplicacion().cerrarEventoSegunPlanillaDeAsistencia(this._entorno.ahora()),
    ).abrir();
  }
}
