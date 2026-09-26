import type { Movimiento } from "../models/Movimiento.ts";
import type { Saldo } from "../models/Saldo.ts";
import { campoDeFecha } from "./Campos.ts";
import { Dialogo } from "./Dialogo.ts";
import { DialogoDeCobro } from "./DialogoDeCobro.ts";
import { anexar, boton, crear, desplegable, fila, tabla, valorDe } from "./dom.ts";
import type { Entorno } from "./Entorno.ts";
import { desdeEntradaDeFecha, fechaYHora, monto } from "./Formato.ts";
import { alfabetico } from "./Orden.ts";

const debe = (saldo: Saldo) => saldo.monto() < 0;

const porDeudaYNombre = (uno: Saldo, otro: Saldo): number => {
  if (debe(uno) !== debe(otro)) return debe(uno) ? -1 : 1;

  return alfabetico(uno.nombre(), otro.nombre());
};

const sumar = (saldos: readonly Saldo[]) => saldos.reduce((total, saldo) => total + Math.abs(saldo.monto()), 0);

// Lo que cada uno debe o tiene por recibir, y la plata que ya entró y salió.
export class PantallaCaja {
  private _entorno: Entorno;
  private _seccion: HTMLElement;

  constructor(entorno: Entorno) {
    this._entorno = entorno;
    this._seccion = crear("section");
  }

  elemento(): HTMLElement {
    const saldos = this._entorno.grupo().saldosAl(this._entorno.ahora()).toSorted(porDeudaYNombre);
    anexar(
      this._seccion,
      crear("h2", {}, "Caja"),
      saldos.length > 0 && this._totales(saldos),
      this._tablaDeSaldos(saldos) ?? crear("p", {}, "Todavía no hay nada que cobrar ni repartir"),
      desplegable("Movimientos", this._tablaDeMovimientos()),
    );
    return this._seccion;
  }

  private _totales(saldos: readonly Saldo[]): HTMLParagraphElement {
    const porCobrar = sumar(saldos.filter(debe));
    const porRepartir = sumar(saldos.filter((saldo) => !debe(saldo)));
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
    const nombre = saldo.nombre();
    return fila(
      nombre,
      monto(saldo.monto()),
      debe(saldo)
        ? boton("Cobrar", () => this._abrirCobro(nombre))
        : boton("Repartir", () => this._abrirReparto(nombre)),
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

  private _abrirCobro(nombre: string): void {
    new DialogoDeCobro(this._entorno, nombre, this._entorno.ahora(), (monto, fecha) =>
      this._entorno.aplicacion().cobrar(nombre, monto, fecha),
    ).abrirEn(this._seccion);
  }

  private _abrirReparto(nombre: string): void {
    const campos = [campoDeFecha("Fecha", "fecha", this._entorno.ahora())];
    new Dialogo(this._entorno, `Repartir a ${nombre}`, campos, "Repartir", (formulario) => {
      this._entorno.aplicacion().repartir(nombre, desdeEntradaDeFecha(valorDe(formulario, "fecha")));
    }).abrirEn(this._seccion);
  }
}
