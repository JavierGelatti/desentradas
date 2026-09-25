import type { ComandoJson } from "../json/ComandoJson.ts";
import type { Grupo } from "../../models/Grupo.ts";
import { fecha, type Objeto, texto } from "../json/Campos.ts";
import { ComandoSobreElGrupo } from "./ComandoSobreElGrupo.ts";

export class Reingresar extends ComandoSobreElGrupo {
  private _nombre: string;
  private _fecha: Date;

  static desdeJson(campos: Objeto): Reingresar {
    return new Reingresar(texto(campos, "nombre"), fecha(campos, "fecha"));
  }

  constructor(nombre: string, fecha: Date) {
    super();
    this._nombre = nombre;
    this._fecha = fecha;
  }

  protected ejecutarEn(grupo: Grupo): void {
    grupo.reingresar(this._nombre, this._fecha);
  }

  aJson(): ComandoJson {
    return { tipo: "reingresar", nombre: this._nombre, fecha: this._fecha.toISOString() };
  }
}
