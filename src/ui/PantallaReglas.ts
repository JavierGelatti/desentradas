import type { Reglas } from "../models/Reglas.ts";
import { alerta, crear, fila, intentar, tabla } from "./dom.ts";
import type { Entorno } from "./Entorno.ts";
import { camposDeReglas, describirInteres, reglasDesde } from "./FormularioDeReglas.ts";
import { fechaYHora, monto } from "./Formato.ts";

// Las reglas vigentes, el formulario para cambiarlas (rigen desde el momento del cambio) y las versiones anteriores.
export class PantallaReglas {
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
      crear("h2", {}, "Reglas"),
      this._reglasVigentes(),
      this._formularioDeCambio(),
      crear("details", {}, crear("summary", {}, "Versiones anteriores"), this._tablaDeVersiones()),
    );
  }

  private _reglasVigentes(): HTMLElement {
    const reglas = this._entorno.grupo().reglas();
    return crear(
      "dl",
      {},
      crear("dt", {}, "Rigen desde"),
      crear("dd", {}, fechaYHora(reglas.rigeDesde())),
      crear("dt", {}, "Tolerancia de faltas"),
      crear("dd", {}, String(reglas.toleranciaDeFaltas())),
      crear("dt", {}, "Monto por falta"),
      crear("dd", {}, monto(reglas.montoPorFalta())),
      crear("dt", {}, "Interés"),
      crear("dd", {}, describirInteres(reglas.politicaDeInteres())),
    );
  }

  private _formularioDeCambio(): HTMLFormElement {
    const formulario = crear(
      "form",
      { onsubmit: (evento: Event) => this._cambiar(evento, formulario) },
      crear("h3", {}, "Cambiar las reglas"),
      ...camposDeReglas(this._entorno.grupo().reglas()),
      this._errores,
      crear("p", {}, crear("button", { type: "submit" }, "Cambiar reglas")),
    );
    return formulario;
  }

  private _cambiar(evento: Event, formulario: HTMLFormElement): void {
    evento.preventDefault();
    const cambiadas = intentar(() => {
      this._entorno.aplicacion().cambiarReglas(reglasDesde(formulario, this._entorno.ahora()));
    }, this._errores);
    if (cambiadas) this._entorno.refrescar();
  }

  private _tablaDeVersiones(): HTMLTableElement {
    const anteriores = this._entorno.grupo().historialDeReglas().slice(0, -1).reverse();
    return tabla(
      "De la más reciente a la más antigua",
      ["Rigieron desde", "Tolerancia", "Monto por falta", "Interés"],
      anteriores.map((reglas) => this._filaDeVersion(reglas)),
    );
  }

  private _filaDeVersion(reglas: Reglas): HTMLTableRowElement {
    return fila(
      fechaYHora(reglas.rigeDesde()),
      String(reglas.toleranciaDeFaltas()),
      monto(reglas.montoPorFalta()),
      describirInteres(reglas.politicaDeInteres()),
    );
  }
}
