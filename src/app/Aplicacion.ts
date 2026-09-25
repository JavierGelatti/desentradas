import type { Almacenamiento } from "./Almacenamiento.ts";
import { Bitacora } from "./Bitacora.ts";
import type { BorradorDeEvento } from "./BorradorDeEvento.ts";
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

// Fachada para la interfaz: las reglas viven en el modelo, el orden de los comandos en la bitácora
// y el evento que se está armando en el borrador.
export class Aplicacion {
  private _almacenamiento: Almacenamiento;
  private _desempate: Desempate;
  private _borrador: BorradorDeEvento;
  private _bitacora: Bitacora;
  private _avisoDeInicio: string | undefined;

  constructor(almacenamiento: Almacenamiento, desempate: Desempate, borrador: BorradorDeEvento) {
    this._almacenamiento = almacenamiento;
    this._desempate = desempate;
    this._borrador = borrador;
    this._bitacora = new Bitacora(desempate);
    this._avisoDeInicio = undefined;
    this._cargarLaBitacoraGuardada();
  }

  tieneGrupo(): boolean {
    return this._bitacora.tieneGrupo();
  }

  grupo(): Grupo {
    return this._bitacora.grupo();
  }

  avisoDeInicio(): string | undefined {
    return this._avisoDeInicio;
  }

  borrador(): BorradorDeEvento {
    return this._borrador;
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

  ingresarAsistente(nombre: string): void {
    const nombreLimpio = nombre.trim();
    const fecha = this._borrador.fecha();
    if (this.grupo().yaParticipo(nombreLimpio)) {
      this.reingresar(nombreLimpio, fecha);
    } else {
      this.ingresar(nombreLimpio, fecha);
    }
    this._borrador.marcar(nombreLimpio);
  }

  // Solo para avisar: el modelo igual registra la falta a todos los activos, morosos incluidos.
  ausentesDelBorrador(): string[] {
    return this.grupo()
      .posiblesAsistentes()
      .map((participante) => participante.nombre())
      .filter((nombre) => !this._borrador.asiste(nombre));
  }

  cerrarElBorrador(): void {
    this.cerrarEvento(this._borrador.fecha(), this._borrador.asistentes());
    this._borrador.descartar();
  }

  cobrar(nombre: string, monto: number, fecha: Date): void {
    this._ejecutar(new Cobrar(nombre, monto, fecha));
  }

  cobrarEnLaPuerta(nombre: string, monto: number, fecha: Date): void {
    this._asertarQueEstaEnDeuda(nombre);

    this.cobrar(nombre, monto, fecha);
    if (this.grupo().participanteActivo(nombre)?.puedeAsistir()) this._borrador.marcar(nombre);
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
    if (deshecho instanceof CerrarEvento) this._borrador.restaurar(deshecho.fecha(), deshecho.asistentes());
    return deshecho;
  }

  puedeDeshacer(): boolean {
    return this._bitacora.puedeDeshacer();
  }

  comandos(): readonly Comando[] {
    return this._bitacora.comandos();
  }

  ultimoComando(): Comando | undefined {
    return this._bitacora.ultimoComando();
  }

  exportar(): string {
    return JSON.stringify(this._bitacora.aJson(), null, 2);
  }

  // Se lee y ejecuta completa antes de reemplazar la bitácora actual: si falla, no cambia nada.
  // El borrador era de otro grupo, así que se descarta.
  importar(texto: string): void {
    this._bitacora = this._bitacoraDesde(texto);
    this._guardar();
    this._borrador.descartar();
  }

  private _ejecutar(comando: Comando): void {
    this._bitacora.ejecutar(comando);
    this._guardar();
  }

  private _asertarQueEstaEnDeuda(nombre: string): void {
    const participante = this.grupo().participanteActivo(nombre);
    if (participante !== undefined && participante.estado() !== "en deuda") {
      throw new Error(`${nombre} no está en deuda`);
    }
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
