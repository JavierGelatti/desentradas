import type { PlanillaDeAsistencia } from "../app/PlanillaDeAsistencia.ts";
import type { Participante } from "../models/Participante.ts";
import { campoDeTexto } from "./Campos.ts";
import { Dialogo } from "./Dialogo.ts";
import { DialogoDeCobro } from "./DialogoDeCobro.ts";
import { alerta, boton, crear, fila, tabla, valorDe } from "./dom.ts";
import type { Entorno } from "./Entorno.ts";
import { fechaYHora, monto } from "./Formato.ts";
import { alfabetico, porNombre } from "./Orden.ts";

// La pantalla de la noche: se empieza el evento, se marca quién vino y se cierra o se cancela.
export class PantallaEvento {
  private _entorno: Entorno;
  private _seccion: HTMLElement;
  private _errores: HTMLOutputElement;

  constructor(entorno: Entorno) {
    this._entorno = entorno;
    this._seccion = crear("section");
    this._errores = alerta();
  }

  elemento(): HTMLElement {
    this._seccion.append(
      crear("h2", {}, "Evento"),
      this._planillaDeAsistencia().existe()
        ? this._formulario()
        : crear(
            "p",
            {},
            boton("Empezar evento", () => this._empezar()),
          ),
    );
    return this._seccion;
  }

  private _formulario(): HTMLFormElement {
    return crear(
      "form",
      { onsubmit: (evento: Event) => this._pedirConfirmacion(evento) },
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
        crear("button", { type: "submit" }, "Cerrar evento"),
      ),
    );
  }

  private _empezar(): void {
    this._planillaDeAsistencia().empezar();
    this._entorno.refrescar();
  }

  private _cancelar(): void {
    if (this._planillaDeAsistencia().asistentes().length === 0) {
      this._planillaDeAsistencia().descartar();
      this._entorno.refrescar();
    } else {
      new Dialogo(
        this._entorno,
        "Cancelar evento",
        [crear("p", {}, "Se van a perder las marcas de asistencia.")],
        "Descartar",
        () => this._planillaDeAsistencia().descartar(),
      ).abrirEn(this._seccion);
    }
  }

  private _tablaDeAsistencia(): HTMLTableElement | undefined {
    return tabla(
      "Asistencia",
      ["Asiste", "Nombre", "Estado", ""],
      this._listados().map((participante) => this._filaDe(participante)),
    );
  }

  private _listados(): Participante[] {
    return this._entorno.grupo().posiblesAsistentes().toSorted(porNombre);
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
    if (participante.soloLeFaltaPagarParaAsistir()) return boton("Cobrar y habilitar", () => this._abrirCobro(nombre));

    const pendiente = this._entorno.grupo().caja().montoPendienteDe(nombre);
    if (this._planillaDeAsistencia().asiste(nombre) && pendiente > 0) {
      return boton(`Repartir ${monto(pendiente)}`, () => this._repartir(nombre));
    }

    return false;
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

  private _abrirCobro(nombre: string): void {
    new DialogoDeCobro(this._entorno, nombre, this._entorno.ahora(), (monto, fecha) =>
      this._entorno.aplicacion().cobrarEnLaPuerta(nombre, monto, fecha),
    ).abrirEn(this._seccion);
  }

  private _repartir(nombre: string): void {
    this._entorno.intentarYRefrescar(
      () => this._entorno.aplicacion().repartir(nombre, this._entorno.ahora()),
      this._errores,
    );
  }

  private _abrirIngreso(): void {
    new Dialogo(this._entorno, "Vino alguien nuevo", [campoDeTexto("Nombre", "nombre")], "Registrar", (formulario) => {
      this._entorno.aplicacion().ingresarAsistente(valorDe(formulario, "nombre"), this._entorno.ahora());
    }).abrirEn(this._seccion);
  }

  private _pedirConfirmacion(evento: Event): void {
    evento.preventDefault();
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
    ).abrirEn(this._seccion);
  }
}
