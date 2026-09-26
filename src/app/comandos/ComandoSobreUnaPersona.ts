import { ComandoSobreElGrupo } from "./ComandoSobreElGrupo.ts";

export abstract class ComandoSobreUnaPersona extends ComandoSobreElGrupo {
  protected _nombre: string;
  protected _fecha: Date;

  constructor(nombre: string, fecha: Date) {
    super();
    this._nombre = nombre;
    this._fecha = fecha;
  }

  fecha(): Date {
    return this._fecha;
  }
}
