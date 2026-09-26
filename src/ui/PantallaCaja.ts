import { fechaYHora, monto } from "../app/Formato.ts";
import type { Movimiento } from "../models/Movimiento.ts";
import type { Saldo } from "../models/Saldo.ts";
import { Dialogo } from "./Dialogo.ts";
import { DialogoDeCobro } from "./DialogoDeCobro.ts";
import { boton, crear, desplegable, fila, type Hijo, tabla, tablaOAviso } from "./dom.ts";
import type { Entorno } from "./Entorno.ts";
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
      ...this._tablaDeSaldos(saldos),
      desplegable("Movimientos", this._tablaDeMovimientos()),
    );
  }

  private _totales(saldos: readonly Saldo[]): HTMLParagraphElement {
    const porCobrar = saldos.filter((saldo) => saldo.debe()).reduce((total, saldo) => total - saldo.monto(), 0);
    const porRepartir = this._entorno.grupo().caja().totalPendiente();
    return crear(
      "p",
      {},
      crear("span", { class: "debe" }, `Por cobrar ${monto(porCobrar)}`),
      crear("span", { class: "a-favor" }, `Por repartir ${monto(porRepartir)}`),
    );
  }

  private _tablaDeSaldos(saldos: readonly Saldo[]): Hijo[] {
    return tablaOAviso(
      "Saldos",
      ["Nombre", "Estado", "Saldo", ""],
      saldos.map((saldo) => this._filaDeSaldo(saldo)),
      "No hay nada para cobrar ni repartir",
    );
  }

  private _filaDeSaldo(saldo: Saldo): HTMLTableRowElement {
    return fila(
      saldo.nombre(),
      this._estadoDe(saldo.nombre()),
      crear("span", { class: saldo.debe() ? "debe" : "a-favor" }, monto(saldo.monto())),
      saldo.debe()
        ? boton("Cobrar", () => this._abrirCobro(saldo))
        : boton("Repartir", () => this._abrirReparto(saldo)),
    );
  }

  // Quien tiene por recibir puede haber dejado de participar.
  private _estadoDe(nombre: string): string {
    const grupo = this._entorno.grupo();
    const participantes = [...grupo.participantes(), ...grupo.participantesFinalizados()];
    return participantes.find((participante) => participante.nombre() === nombre)?.estado() ?? "";
  }

  private _tablaDeMovimientos(): HTMLElement | undefined {
    const movimientos = this._entorno.grupo().caja().movimientos().toReversed();
    return tabla(
      undefined,
      ["Fecha", "Nombre", "Tipo", "Monto"],
      movimientos.map((movimiento) => this._filaDeMovimiento(movimiento)),
    );
  }

  private _filaDeMovimiento(movimiento: Movimiento): HTMLTableRowElement {
    return fila(fechaYHora(movimiento.fecha()), movimiento.persona(), movimiento.tipo(), monto(movimiento.monto()));
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
