import type { ComandoJson } from "../json/ComandoJson.ts";
import type { Grupo } from "../../models/Grupo.ts";
import { fecha, numero, type Objeto, texto } from "../json/Campos.ts";
import { ComandoSobreUnaPersona } from "./ComandoSobreUnaPersona.ts";

export class Cobrar extends ComandoSobreUnaPersona {
  private _monto: number;

  static desdeJson(campos: Objeto): Cobrar {
    return new Cobrar(texto(campos, "nombre"), numero(campos, "monto"), fecha(campos, "fecha"));
  }

  constructor(nombre: string, monto: number, fecha: Date) {
    super(nombre, fecha);
    this._monto = monto;
  }

  protected ejecutarEn(grupo: Grupo): void {
    grupo.cobrar(this._nombre, this._monto, this._fecha);
  }

  describir(): string {
    return `Cobro de $${this._monto} a ${this._nombre}`;
  }

  aJson(): ComandoJson {
    return { tipo: "cobrar", nombre: this._nombre, monto: this._monto, fecha: this._fecha.toISOString() };
  }
}
