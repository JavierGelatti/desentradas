import type { Almacenamiento } from "./Almacenamiento.ts";

export class AlmacenamientoEnMemoria implements Almacenamiento {
  private _texto: string | undefined;

  constructor() {
    this._texto = undefined;
  }

  guardar(texto: string): void {
    this._texto = texto;
  }

  leer(): string | undefined {
    return this._texto;
  }

  borrar(): void {
    this._texto = undefined;
  }
}
