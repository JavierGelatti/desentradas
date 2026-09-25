import type { BorradorDeEvento } from "../app/BorradorDeEvento.ts";
import type { Participante } from "../models/Participante.ts";
import { campoDeFecha, campoDeTexto, controlDe } from "./Campos.ts";
import { Dialogo } from "./Dialogo.ts";
import { DialogoDeCobro } from "./DialogoDeCobro.ts";
import { alerta, boton, crear, fila, intentar, tabla, valorDe } from "./dom.ts";
import type { Entorno } from "./Entorno.ts";
import { desdeEntradaDeFecha, monto } from "./Formato.ts";
import { porNombre } from "./Orden.ts";

// La pantalla de la noche: se marca quién vino y se cierra el evento. Lo marcado vive en el borrador de la aplicación.
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
    const formulario = crear(
      "form",
      { onsubmit: (evento: Event) => this._pedirConfirmacion(evento) },
      this._campoDeFecha(),
      this._tablaDeAsistencia(),
      crear(
        "p",
        {},
        boton("Vino alguien nuevo", () => this._abrirIngreso()),
      ),
      this._errores,
      crear("p", {}, crear("button", { type: "submit" }, "Cerrar evento")),
    );
    this._seccion.append(crear("h2", {}, "Evento"), formulario);
    return this._seccion;
  }

  private _campoDeFecha(): HTMLLabelElement {
    const campo = campoDeFecha("Fecha y hora", "fecha", this._borrador().fecha());
    controlDe(campo).addEventListener("change", () => {
      intentar(() => this._borrador().cambiarFecha(desdeEntradaDeFecha(controlDe(campo).value)), this._errores);
    });
    return campo;
  }

  private _tablaDeAsistencia(): HTMLTableElement | undefined {
    return tabla(
      "Asistencia",
      ["Asiste", "Nombre", "Estado", ""],
      this._listados().map((participante) => this._filaDe(participante)),
    );
  }

  // Los morosos no pueden asistir ni pagando, así que no se listan ni cuentan como ausentes.
  private _listados(): Participante[] {
    return this._entorno
      .grupo()
      .participantes()
      .filter((participante) => participante.estado() !== "moroso")
      .sort(porNombre);
  }

  private _filaDe(participante: Participante): HTMLTableRowElement {
    const nombre = participante.nombre();
    const casilla = crear("input", {
      type: "checkbox",
      name: "asistentes",
      value: nombre,
      "aria-label": `Asiste ${nombre}`,
      checked: this._borrador().asiste(nombre),
      disabled: !participante.puedeAsistir(),
      onchange: () => this._marcar(nombre, casilla.checked),
    });
    return fila(casilla, nombre, participante.estado(), this._accionDe(participante));
  }

  private _accionDe(participante: Participante): HTMLElement | false {
    const nombre = participante.nombre();
    if (participante.estado() === "en deuda") return boton("Cobrar y habilitar", () => this._abrirCobro(nombre));

    const pendiente = this._entorno.grupo().caja().montoPendienteDe(nombre);
    if (this._borrador().asiste(nombre) && pendiente > 0) {
      return boton(`Repartir ${monto(pendiente)}`, () => this._repartir(nombre));
    }

    return false;
  }

  private _borrador(): BorradorDeEvento {
    return this._entorno.aplicacion().borrador();
  }

  private _marcar(nombre: string, asiste: boolean): void {
    if (asiste) {
      this._borrador().marcar(nombre);
    } else {
      this._borrador().desmarcar(nombre);
    }
    this._entorno.refrescar();
  }

  private _abrirCobro(nombre: string): void {
    new DialogoDeCobro(this._entorno, nombre, this._borrador().fecha(), (monto, fecha) =>
      this._entorno.aplicacion().cobrarEnLaPuerta(nombre, monto, fecha),
    ).abrirEn(this._seccion);
  }

  private _repartir(nombre: string): void {
    const repartido = intentar(
      () => this._entorno.aplicacion().repartir(nombre, this._borrador().fecha()),
      this._errores,
    );
    if (repartido) this._entorno.refrescar();
  }

  private _abrirIngreso(): void {
    new Dialogo(this._entorno, "Vino alguien nuevo", [campoDeTexto("Nombre", "nombre")], "Registrar", (formulario) => {
      this._entorno.aplicacion().ingresarAsistente(valorDe(formulario, "nombre").trim());
    }).abrirEn(this._seccion);
  }

  // Al confirmar se nombra a todos los activos sin marcar salvo los morosos, que ya no pueden volver a asistir.
  // El modelo igual les registra la falta a todos.
  private _pedirConfirmacion(evento: Event): void {
    evento.preventDefault();
    const ausentes = this._listados()
      .filter((participante) => !this._borrador().asiste(participante.nombre()))
      .map((participante) => participante.nombre());
    const aviso = ausentes.length === 0 ? "Nadie queda ausente." : `Quedan ausentes: ${ausentes.join(", ")}.`;
    new Dialogo(this._entorno, "Cerrar evento", [crear("p", {}, aviso)], "Confirmar", () =>
      this._entorno.aplicacion().cerrarElBorrador(),
    ).abrirEn(this._seccion);
  }
}
