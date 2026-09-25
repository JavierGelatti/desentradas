import type { Comando } from "./Comando.ts";
import { comandoDesdeJson, type ComandoJson } from "./json/ComandoJson.ts";
import { formatoInvalido, lista, numero, objeto } from "./json/Campos.ts";
import type { Desempate } from "../models/Desempate.ts";
import type { Grupo } from "../models/Grupo.ts";

const VERSION = 1;

export type BitacoraJson = { version: typeof VERSION; comandos: ComandoJson[] };

// La bitácora es la verdad: el grupo es siempre el resultado de ejecutar todos sus comandos en orden.
export class Bitacora {
  private _desempate: Desempate;
  private _comandos: Comando[];
  private _grupo: Grupo | undefined;

  // Ejecuta cada comando leído, así que una bitácora que el grupo rechaza no se puede leer.
  static desdeJson(json: unknown, desempate: Desempate): Bitacora {
    const campos = objeto(json, "La bitácora");
    const version = numero(campos, "version");
    if (version !== VERSION) throw formatoInvalido(`versión de bitácora desconocida "${version}"`);

    const bitacora = new Bitacora(desempate);
    lista(campos, "comandos").forEach((comando) => bitacora.ejecutar(comandoDesdeJson(comando)));
    return bitacora;
  }

  constructor(desempate: Desempate) {
    this._desempate = desempate;
    this._comandos = [];
    this._grupo = undefined;
  }

  ejecutar(comando: Comando): void {
    this._grupo = comando.ejecutar(this._grupo, this._desempate);
    this._comandos.push(comando);
  }

  // Al deshacer se reconstruye el grupo desde cero: las referencias a participantes anteriores dejan de valer.
  deshacer(): Comando {
    if (!this.puedeDeshacer()) throw new Error("No hay nada que deshacer");

    const deshecho = this._comandos.pop()!;
    this._reconstruirElGrupo();
    return deshecho;
  }

  puedeDeshacer(): boolean {
    return this._comandos.length > 0;
  }

  comandos(): readonly Comando[] {
    return this._comandos;
  }

  ultimoComando(): Comando | undefined {
    return this._comandos.at(-1);
  }

  tieneGrupo(): boolean {
    return this._grupo !== undefined;
  }

  grupo(): Grupo {
    if (this._grupo === undefined) throw new Error("El grupo no está creado");

    return this._grupo;
  }

  aJson(): BitacoraJson {
    return { version: VERSION, comandos: this._comandos.map((comando) => comando.aJson()) };
  }

  private _reconstruirElGrupo(): void {
    const comandos = this._comandos;
    this._comandos = [];
    this._grupo = undefined;
    comandos.forEach((comando) => this.ejecutar(comando));
  }
}
