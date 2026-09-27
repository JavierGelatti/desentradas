import type { Reglas } from "../Reglas.ts";
import { Estado } from "./Estado.ts";

export abstract class ConReglas extends Estado {
  private _reglas: Reglas;

  constructor(reglas: Reglas) {
    super();
    this._reglas = reglas;
  }

  override reglas(): Reglas {
    return this._reglas;
  }
}
