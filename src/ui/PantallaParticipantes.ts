import type { Participante } from "../models/Participante.ts";
import { campoDeTexto } from "./Campos.ts";
import { Dialogo } from "./Dialogo.ts";
import { DialogoDeCobro } from "./DialogoDeCobro.ts";
import { alerta, anexar, boton, crear, desplegable, fila, tabla, valorDe } from "./dom.ts";
import type { Entorno } from "./Entorno.ts";
import { monto } from "./Formato.ts";
import { porNombre } from "./Orden.ts";

const ultimoCambioDe = (participante: Participante) => participante.fechaDelUltimoCambio().getTime();

// Primero quienes requieren atención (los que no están al día), del cambio más reciente al más antiguo;
// después los que están al día, por nombre.
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
  private _seccion: HTMLElement;
  private _erroresDeReingreso: HTMLOutputElement;

  constructor(entorno: Entorno) {
    this._entorno = entorno;
    this._seccion = crear("section");
    this._erroresDeReingreso = alerta();
  }

  elemento(): HTMLElement {
    anexar(
      this._seccion,
      crear("h2", {}, "Participantes"),
      this._tablaDeActivos() ?? crear("p", {}, "Todavía no hay nadie"),
      crear(
        "p",
        {},
        boton("Registrar participante", () => this._abrirIngreso()),
      ),
      desplegable("Participaciones finalizadas", this._tablaDeFinalizados(), this._erroresDeReingreso),
    );
    return this._seccion;
  }

  private _tablaDeActivos(): HTMLTableElement | undefined {
    const activos = this._entorno.grupo().participantes().toSorted(porAtencionYNombre);
    return tabla(
      "Participaciones activas",
      ["Nombre", "Estado", "Faltas", "Deuda", "Crédito pendiente", ""],
      activos.map((participante) => this._filaDeActivo(participante)),
    );
  }

  private _filaDeActivo(participante: Participante): HTMLTableRowElement {
    const nombre = participante.nombre();
    const deuda = participante.deudaAl(this._entorno.ahora());
    return fila(
      nombre,
      participante.estado(),
      String(participante.faltas()),
      monto(deuda),
      monto(this._entorno.grupo().caja().montoPendienteDe(nombre)),
      deuda > 0 && boton("Cobrar", () => this._abrirCobro(nombre)),
    );
  }

  private _tablaDeFinalizados(): HTMLTableElement | undefined {
    const finalizados = this._entorno.grupo().participantesFinalizados().toSorted(porNombre);
    return tabla(
      "Quienes ya no participan",
      ["Nombre", "Motivo", "Crédito pendiente", ""],
      finalizados.map((participante) => this._filaDeFinalizado(participante)),
    );
  }

  private _filaDeFinalizado(participante: Participante): HTMLTableRowElement {
    const nombre = participante.nombre();
    return fila(
      nombre,
      participante.motivoDeFinalizacion() ?? "",
      monto(this._entorno.grupo().caja().montoPendienteDe(nombre)),
      boton("Reingresar", () => this._reingresar(nombre)),
    );
  }

  private _abrirCobro(nombre: string): void {
    new DialogoDeCobro(this._entorno, nombre, this._entorno.ahora(), (monto, fecha) =>
      this._entorno.aplicacion().cobrar(nombre, monto, fecha),
    ).abrirEn(this._seccion);
  }

  // Registrar queda fechado en el momento en que se hace.
  private _abrirIngreso(): void {
    new Dialogo(
      this._entorno,
      "Registrar participante",
      [campoDeTexto("Nombre", "nombre")],
      "Registrar",
      (formulario) => {
        this._entorno.aplicacion().ingresar(valorDe(formulario, "nombre"), this._entorno.ahora());
      },
    ).abrirEn(this._seccion);
  }

  // El reingreso no se confirma: se hace en el momento, y si el modelo lo rechaza se avisa junto a la tabla.
  private _reingresar(nombre: string): void {
    this._entorno.intentarYRefrescar(() => {
      this._entorno.aplicacion().reingresar(nombre, this._entorno.ahora());
    }, this._erroresDeReingreso);
  }
}
