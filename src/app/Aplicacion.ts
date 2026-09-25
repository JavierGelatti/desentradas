import type { Almacenamiento } from "./Almacenamiento.ts";
import { Bitacora } from "./Bitacora.ts";
import type { Comando } from "./Comando.ts";
import { CrearGrupo } from "./comandos/CrearGrupo.ts";
import { Ingresar } from "./comandos/Ingresar.ts";
import { Reingresar } from "./comandos/Reingresar.ts";
import { CerrarEvento } from "./comandos/CerrarEvento.ts";
import { Cobrar } from "./comandos/Cobrar.ts";
import { Repartir } from "./comandos/Repartir.ts";
import { CambiarReglas } from "./comandos/CambiarReglas.ts";
import type { Desempate } from "../models/Desempate.ts";
import type { Grupo } from "../models/Grupo.ts";
import type { Reglas } from "../models/Reglas.ts";

// Fachada para la interfaz: las reglas viven en el modelo y el orden de los comandos en la bitácora.
export class Aplicacion {
  private _almacenamiento: Almacenamiento;
  private _desempate: Desempate;
  private _bitacora: Bitacora;
  private _avisoDeInicio: string | undefined;

  constructor(almacenamiento: Almacenamiento, desempate: Desempate) {
    this._almacenamiento = almacenamiento;
    this._desempate = desempate;
    this._bitacora = new Bitacora(desempate);
    this._avisoDeInicio = undefined;
    this._cargarLaBitacoraGuardada();
  }

  tieneGrupo(): boolean {
    return this._bitacora.tieneGrupo();
  }

  nombreDelGrupo(): string {
    return this._bitacora.nombreDelGrupo();
  }

  grupo(): Grupo {
    return this._bitacora.grupo();
  }

  avisoDeInicio(): string | undefined {
    return this._avisoDeInicio;
  }

  crearGrupo(nombreDelGrupo: string, reglasIniciales: Reglas): void {
    this._ejecutar(new CrearGrupo(nombreDelGrupo, reglasIniciales));
  }

  ingresar(nombre: string, fecha: Date): void {
    this._ejecutar(new Ingresar(nombre, fecha));
  }

  reingresar(nombre: string, fecha: Date): void {
    this._ejecutar(new Reingresar(nombre, fecha));
  }

  cerrarEvento(fecha: Date, asistentes: Iterable<string>): void {
    this._ejecutar(new CerrarEvento(fecha, asistentes));
  }

  cobrar(nombre: string, monto: number, fecha: Date): void {
    this._ejecutar(new Cobrar(nombre, monto, fecha));
  }

  repartir(nombre: string, fecha: Date): void {
    this._ejecutar(new Repartir(nombre, fecha));
  }

  cambiarReglas(reglas: Reglas): void {
    this._ejecutar(new CambiarReglas(reglas));
  }

  deshacer(): Comando {
    const deshecho = this._bitacora.deshacer();
    this._guardar();
    return deshecho;
  }

  puedeDeshacer(): boolean {
    return this._bitacora.puedeDeshacer();
  }

  ultimoComando(): Comando | undefined {
    return this._bitacora.ultimoComando();
  }

  exportar(): string {
    return JSON.stringify(this._bitacora.aJson(), null, 2);
  }

  // Se lee y ejecuta completa antes de reemplazar la bitácora actual: si falla, no cambia nada.
  importar(texto: string): void {
    this._bitacora = this._bitacoraDesde(texto);
    this._guardar();
  }

  private _ejecutar(comando: Comando): void {
    this._bitacora.ejecutar(comando);
    this._guardar();
  }

  private _guardar(): void {
    this._almacenamiento.guardar(this.exportar());
  }

  private _cargarLaBitacoraGuardada(): void {
    const texto = this._almacenamiento.leer();
    if (texto === undefined) return;

    try {
      this._bitacora = this._bitacoraDesde(texto);
    } catch {
      this._avisoDeInicio = "Los datos guardados no se pudieron leer y se ignoraron";
    }
  }

  private _bitacoraDesde(texto: string): Bitacora {
    return Bitacora.desdeJson(JSON.parse(texto), this._desempate);
  }
}
