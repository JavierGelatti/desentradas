import type { Almacenamiento } from "./Almacenamiento.ts";

// Lo mínimo que se usa de un Storage del navegador (localStorage), para poder reemplazarlo en las pruebas.
export type StorageDeClaves = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export class AlmacenamientoEnStorage implements Almacenamiento {
  private _storage: StorageDeClaves;
  private _clave: string;

  constructor(storage: StorageDeClaves, clave: string) {
    this._storage = storage;
    this._clave = clave;
  }

  guardar(texto: string): void {
    this._storage.setItem(this._clave, texto);
  }

  leer(): string | undefined {
    return this._storage.getItem(this._clave) ?? undefined;
  }

  borrar(): void {
    this._storage.removeItem(this._clave);
  }
}
