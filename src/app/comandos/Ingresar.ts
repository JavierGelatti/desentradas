import type { ComandoJson } from "../json/ComandoJson.ts";
import type { Grupo } from "../../models/Grupo.ts";
import { fecha, type Objeto, texto } from "../json/Campos.ts";
import { ComandoSobreUnaPersona } from "./ComandoSobreUnaPersona.ts";

export class Ingresar extends ComandoSobreUnaPersona {
  static desdeJson(campos: Objeto): Ingresar {
    return new Ingresar(texto(campos, "nombre"), fecha(campos, "fecha"));
  }

  protected ejecutarEn(grupo: Grupo): void {
    grupo.ingresar(this._nombre, this._fecha);
  }

  describir(): string {
    return `Ingresó ${this._nombre}`;
  }

  aJson(): ComandoJson {
    return { tipo: "ingresar", nombre: this._nombre, fecha: this._fecha.toISOString() };
  }
}
