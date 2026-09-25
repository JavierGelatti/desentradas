import type { ComandoJson } from "../json/ComandoJson.ts";
import type { Grupo } from "../../models/Grupo.ts";
import { fecha, numero, type Objeto, texto } from "../json/Campos.ts";
import { ComandoSobreElGrupo } from "./ComandoSobreElGrupo.ts";

export class Cobrar extends ComandoSobreElGrupo {
  private _nombre: string;
  private _monto: number;
  private _fecha: Date;

  static desdeJson(campos: Objeto): Cobrar {
    return new Cobrar(texto(campos, "nombre"), numero(campos, "monto"), fecha(campos, "fecha"));
  }

  constructor(nombre: string, monto: number, fecha: Date) {
    super();
    this._nombre = nombre;
    this._monto = monto;
    this._fecha = fecha;
  }

  protected ejecutarEn(grupo: Grupo): void {
    grupo.registrarPago(this._nombre, this._monto, this._fecha);
  }

  fecha(): Date {
    return this._fecha;
  }

  describir(): string {
    return `Cobro de $${this._monto} a ${this._nombre}`;
  }

  aJson(): ComandoJson {
    return { tipo: "cobrar", nombre: this._nombre, monto: this._monto, fecha: this._fecha.toISOString() };
  }
}
