import type { Reglas } from "../models/Reglas.ts";
import { alerta, botonDeEnvio, crear, desplegable, fila, formulario, tabla } from "./dom.ts";
import type { Entorno } from "./Entorno.ts";
import { camposDeReglas, reglasDesde } from "./FormularioDeReglas.ts";
import { fechaYHora, monto } from "./Formato.ts";

// Desde cuándo rigen, tolerancia, monto por falta e interés, tal como se muestran.
const valoresDe = (reglas: Reglas): string[] => [
  fechaYHora(reglas.rigeDesde()),
  String(reglas.toleranciaDeFaltas()),
  monto(reglas.montoPorFalta()),
  reglas.politicaDeInteres().describir(monto),
];

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
      desplegable("Versiones anteriores", this._tablaDeVersiones()),
    );
  }

  private _reglasVigentes(): HTMLElement {
    const titulos = ["Rigen desde", "Tolerancia de faltas", "Monto por falta", "Interés"];
    const valores = valoresDe(this._entorno.grupo().reglas());
    return crear(
      "dl",
      {},
      ...titulos.flatMap((titulo, posicion) => [crear("dt", {}, titulo), crear("dd", {}, valores[posicion])]),
    );
  }

  private _formularioDeCambio(): HTMLFormElement {
    return formulario(
      (completado) => this._cambiar(completado),
      crear("h3", {}, "Cambiar las reglas"),
      ...camposDeReglas(this._entorno.grupo().reglas()),
      this._errores,
      crear("p", {}, botonDeEnvio("Cambiar reglas")),
    );
  }

  private _cambiar(formulario: HTMLFormElement): void {
    this._entorno.intentarYRefrescar(() => {
      this._entorno.aplicacion().cambiarReglas(reglasDesde(formulario, this._entorno.ahora()));
    }, this._errores);
  }

  private _tablaDeVersiones(): HTMLTableElement | undefined {
    const anteriores = this._entorno.grupo().reglasAnteriores().toReversed();
    return tabla(
      undefined,
      ["Rigieron desde", "Tolerancia", "Monto por falta", "Interés"],
      anteriores.map((reglas) => fila(...valoresDe(reglas))),
    );
  }
}
