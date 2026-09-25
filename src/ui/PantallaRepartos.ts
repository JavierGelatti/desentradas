import type { Reparto } from "../models/Reparto.ts";
import { campoDeFecha } from "./Campos.ts";
import { Dialogo } from "./Dialogo.ts";
import { boton, crear, fila, tabla, valorDe } from "./dom.ts";
import type { Entorno } from "./Entorno.ts";
import { desdeEntradaDeFecha, fechaYHora, monto } from "./Formato.ts";

// Quiénes tienen plata por recibir, y lo que ya se les entregó.
export class PantallaRepartos {
  private _entorno: Entorno;
  private _seccion: HTMLElement;

  constructor(entorno: Entorno) {
    this._entorno = entorno;
    this._seccion = crear("section");
  }

  elemento(): HTMLElement {
    this._seccion.append(
      crear("h2", {}, "Repartos"),
      this._tablaDePendientes(),
      crear("details", {}, crear("summary", {}, "Repartos hechos"), this._tablaDeRepartos()),
    );
    return this._seccion;
  }

  private _nombresConCreditosPendientes(): string[] {
    const nombres = this._entorno
      .grupo()
      .caja()
      .creditos()
      .filter((credito) => credito.estaPendiente())
      .map((credito) => credito.nombre());
    return [...new Set(nombres)].sort((uno, otro) => uno.localeCompare(otro));
  }

  private _tablaDePendientes(): HTMLTableElement {
    const caja = this._entorno.grupo().caja();
    return tabla(
      "Créditos pendientes",
      ["Nombre", "Monto", ""],
      this._nombresConCreditosPendientes().map((nombre) =>
        fila(
          nombre,
          monto(caja.montoPendienteDe(nombre)),
          boton("Repartir", () => this._abrirReparto(nombre)),
        ),
      ),
    );
  }

  private _tablaDeRepartos(): HTMLTableElement {
    const repartos = this._entorno.grupo().caja().repartos().toReversed();
    return tabla(
      "Del más reciente al más antiguo",
      ["Fecha", "Nombre", "Monto"],
      repartos.map((reparto) => this._filaDeReparto(reparto)),
    );
  }

  private _filaDeReparto(reparto: Reparto): HTMLTableRowElement {
    return fila(fechaYHora(reparto.fecha()), reparto.nombre(), monto(reparto.monto()));
  }

  private _abrirReparto(nombre: string): void {
    const campos = [campoDeFecha("Fecha", "fecha", this._entorno.ahora())];
    new Dialogo(this._entorno, `Repartir a ${nombre}`, campos, "Repartir", (formulario) => {
      this._entorno.aplicacion().repartir(nombre, desdeEntradaDeFecha(valorDe(formulario, "fecha")));
    }).abrirEn(this._seccion);
  }
}
