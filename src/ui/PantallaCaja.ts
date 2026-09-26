import type { Movimiento } from "../models/Movimiento.ts";
import type { Saldo } from "../models/Saldo.ts";
import { Dialogo } from "./Dialogo.ts";
import { DialogoDeCobro } from "./DialogoDeCobro.ts";
import { boton, crear, desplegable, fila, tabla } from "./dom.ts";
import type { Entorno } from "./Entorno.ts";
import { fechaYHora, monto } from "./Formato.ts";
import { porNombre } from "./Orden.ts";

const porDeudaYNombre = (uno: Saldo, otro: Saldo): number => {
  if (uno.debe() !== otro.debe()) return uno.debe() ? -1 : 1;

  return porNombre(uno, otro);
};

// Lo que cada uno debe o tiene por recibir, y la plata que ya entró y salió.
export class PantallaCaja {
  private _entorno: Entorno;

  constructor(entorno: Entorno) {
    this._entorno = entorno;
  }

  elemento(): HTMLElement {
    const saldos = this._entorno.grupo().saldosAl(this._entorno.ahora()).toSorted(porDeudaYNombre);
    return crear(
      "section",
      {},
      crear("h2", {}, "Caja"),
      saldos.length > 0 && this._totales(saldos),
      this._tablaDeSaldos(saldos) ?? crear("p", {}, "Todavía no hay nada que cobrar ni repartir"),
      desplegable("Movimientos", this._tablaDeMovimientos()),
    );
  }

  private _totales(saldos: readonly Saldo[]): HTMLParagraphElement {
    const porCobrar = saldos.filter((saldo) => saldo.debe()).reduce((total, saldo) => total - saldo.monto(), 0);
    const porRepartir = this._entorno.grupo().caja().totalPendiente();
    return crear("p", {}, `Por cobrar ${monto(porCobrar)} · Por repartir ${monto(porRepartir)}`);
  }

  private _tablaDeSaldos(saldos: readonly Saldo[]): HTMLTableElement | undefined {
    return tabla(
      "Saldos",
      ["Nombre", "Saldo", ""],
      saldos.map((saldo) => this._filaDeSaldo(saldo)),
    );
  }

  private _filaDeSaldo(saldo: Saldo): HTMLTableRowElement {
    return fila(
      saldo.nombre(),
      monto(saldo.monto()),
      saldo.debe()
        ? boton("Cobrar", () => this._abrirCobro(saldo))
        : boton("Repartir", () => this._abrirReparto(saldo)),
    );
  }

  private _tablaDeMovimientos(): HTMLTableElement | undefined {
    const movimientos = this._entorno.grupo().caja().movimientos().toReversed();
    return tabla(
      undefined,
      ["Fecha", "Tipo", "Nombre", "Monto"],
      movimientos.map((movimiento) => this._filaDeMovimiento(movimiento)),
    );
  }

  private _filaDeMovimiento(movimiento: Movimiento): HTMLTableRowElement {
    return fila(fechaYHora(movimiento.fecha()), movimiento.tipo(), movimiento.persona(), monto(movimiento.monto()));
  }

  private _abrirCobro(saldo: Saldo): void {
    const nombre = saldo.nombre();
    new DialogoDeCobro(this._entorno, nombre, -saldo.monto(), (monto) =>
      this._entorno.aplicacion().cobrar(nombre, monto, this._entorno.ahora()),
    ).abrir();
  }

  private _abrirReparto(saldo: Saldo): void {
    const nombre = saldo.nombre();
    new Dialogo(
      this._entorno,
      `Repartir a ${nombre}`,
      [crear("p", {}, `Se le van a entregar ${monto(saldo.monto())}.`)],
      "Repartir",
      () => this._entorno.aplicacion().repartir(nombre, this._entorno.ahora()),
    ).abrir();
  }
}
