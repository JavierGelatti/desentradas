import type { Almacenamiento } from "./Almacenamiento.ts";
import { Bitacora } from "./Bitacora.ts";
import type { PlanillaDeAsistencia } from "./PlanillaDeAsistencia.ts";
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

export class Aplicacion {
  private _almacenamiento: Almacenamiento;
  private _desempate: Desempate;
  private _planillaDeAsistencia: PlanillaDeAsistencia;
  private _bitacora: Bitacora;
  private _avisoDeInicio: string | undefined;
  private _creacionDeshecha: CrearGrupo | undefined;

  constructor(almacenamiento: Almacenamiento, desempate: Desempate, planillaDeAsistencia: PlanillaDeAsistencia) {
    this._almacenamiento = almacenamiento;
    this._desempate = desempate;
    this._planillaDeAsistencia = planillaDeAsistencia;
    this._bitacora = new Bitacora(desempate);
    this._avisoDeInicio = undefined;
    this._creacionDeshecha = undefined;
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

  planillaDeAsistencia(): PlanillaDeAsistencia {
    return this._planillaDeAsistencia;
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

  cerrarEvento(fecha: Date, asistentes: Iterable<string>, ausentes: Iterable<string>): void {
    this._ejecutar(new CerrarEvento(fecha, asistentes, ausentes));
  }

  ingresarAsistente(nombre: string, fecha: Date): void {
    const nombreLimpio = nombre.trim();
    if (this.grupo().yaParticipo(nombreLimpio)) {
      this.reingresar(nombreLimpio, fecha);
    } else {
      this.ingresar(nombreLimpio, fecha);
    }
    this._planillaDeAsistencia.marcarComoPresente(nombreLimpio);
  }

  // Nota: el modelo igual registra la falta a todos los participantes activos, morosos incluidos.
  ausentesEnPlanillaDeAsistencia(): string[] {
    return this.grupo()
      .posiblesAsistentes()
      .map((participante) => participante.nombre())
      .filter((nombre) => !this._planillaDeAsistencia.asiste(nombre));
  }

  cerrarEventoSegunPlanillaDeAsistencia(fecha: Date): void {
    this.cerrarEvento(fecha, this._planillaDeAsistencia.asistentes(), this.ausentesEnPlanillaDeAsistencia());
    this._planillaDeAsistencia.descartar();
  }

  cobrar(nombre: string, monto: number, fecha: Date): void {
    this._ejecutar(new Cobrar(nombre, monto, fecha));
  }

  cobrarEnLaPuerta(nombre: string, monto: number, fecha: Date): void {
    this._asertarQueSoloLeFaltaPagar(nombre);

    this.cobrar(nombre, monto, fecha);
    if (this._puedeAsistir(nombre)) this._planillaDeAsistencia.marcarComoPresente(nombre);
  }

  repartir(nombre: string, fecha: Date): void {
    this._ejecutar(new Repartir(nombre, fecha));
  }

  cambiarReglas(reglas: Reglas): void {
    this._ejecutar(new CambiarReglas(reglas));
  }

  deshacer(): void {
    const deshecho = this._bitacora.deshacer();
    this._guardar();
    deshecho.alDeshacerse(this);
    this._desmarcarAQuienesNoPuedenAsistir();
  }

  recordarCreacionDeshecha(creacion: CrearGrupo): void {
    this._creacionDeshecha = creacion;
  }

  creacionDeshecha(): CrearGrupo | undefined {
    return this._creacionDeshecha;
  }

  puedeDeshacer(): boolean {
    return this._bitacora.puedeDeshacer();
  }

  comandos(): readonly Comando[] {
    return this._bitacora.comandos();
  }

  exportar(): string {
    return JSON.stringify(this._bitacora.aJson(), null, 2);
  }

  // Se lee y ejecuta completa antes de reemplazar la bitácora actual: si falla, no cambia nada.
  // La planilla de asistencia era de otro grupo, así que se descarta.
  importar(texto: string): void {
    this._bitacora = this._bitacoraDesde(texto);
    this._guardar();
    this._planillaDeAsistencia.descartar();
  }

  private _ejecutar(comando: Comando): void {
    this._bitacora.ejecutar(comando);
    this._creacionDeshecha = undefined;
    this._guardar();
  }

  // La planilla no está en la bitácora: al deshacer puede quedar marcado quien ya no puede asistir.
  private _desmarcarAQuienesNoPuedenAsistir(): void {
    if (!this._planillaDeAsistencia.existe()) return;

    this._planillaDeAsistencia.conservarSoloA((nombre) => this._puedeAsistir(nombre));
  }

  private _puedeAsistir(nombre: string): boolean {
    return this.grupo().participanteActivo(nombre)?.puedeAsistir() ?? false;
  }

  private _asertarQueSoloLeFaltaPagar(nombre: string): void {
    const participante = this.grupo().participanteActivo(nombre);
    if (participante !== undefined && !participante.soloLeFaltaPagarParaAsistir()) {
      throw new Error(`Pagar en la puerta no habilita a ${nombre}`);
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
