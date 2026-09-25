import type { ComandoJson } from "../json/ComandoJson.ts";
import type { Grupo } from "../../models/Grupo.ts";
import { fecha, type Objeto, texto } from "../json/Campos.ts";
import { ComandoSobreElGrupo } from "./ComandoSobreElGrupo.ts";

export class Ingresar extends ComandoSobreElGrupo {
  private _nombre: string;
  private _fecha: Date;

  static desdeJson(campos: Objeto): Ingresar {
    return new Ingresar(texto(campos, "nombre"), fecha(campos, "fecha"));
  }

  constructor(nombre: string, fecha: Date) {
    super();
    this._nombre = nombre;
    this._fecha = fecha;
  }

  protected ejecutarEn(grupo: Grupo): void {
    grupo.ingresar(this._nombre, this._fecha);
  }

  fecha(): Date {
    return this._fecha;
  }

  describir(): string {
    return `Registro de ${this._nombre}`;
  }

  aJson(): ComandoJson {
    return { tipo: "ingresar", nombre: this._nombre, fecha: this._fecha.toISOString() };
  }
}
