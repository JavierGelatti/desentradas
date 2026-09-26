import type { ComandoJson } from "../json/ComandoJson.ts";
import type { Grupo } from "../../models/Grupo.ts";
import { fecha, type Objeto, texto } from "../json/Campos.ts";
import { ComandoSobreUnaPersona } from "./ComandoSobreUnaPersona.ts";

export class Reingresar extends ComandoSobreUnaPersona {
  static desdeJson(campos: Objeto): Reingresar {
    return new Reingresar(texto(campos, "nombre"), fecha(campos, "fecha"));
  }

  protected ejecutarEn(grupo: Grupo): void {
    grupo.reingresar(this._nombre, this._fecha);
  }

  describir(): string {
    return `Reingresó ${this._nombre}`;
  }

  aJson(): ComandoJson {
    return { tipo: "reingresar", nombre: this._nombre, fecha: this._fecha.toISOString() };
  }
}
