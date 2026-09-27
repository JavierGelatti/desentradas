import type { Almacenamiento } from "./Almacenamiento.ts";
import { Bitacora } from "./Bitacora.ts";
import { PlanillaDeAsistencia } from "./PlanillaDeAsistencia.ts";
import type { Comando } from "./Comando.ts";
import { CrearGrupo } from "./comandos/CrearGrupo.ts";
import { Ingresar } from "./comandos/Ingresar.ts";
import { Reingresar } from "./comandos/Reingresar.ts";
import { RegistrarEncuentro } from "./comandos/RegistrarEncuentro.ts";
import { Cobrar } from "./comandos/Cobrar.ts";
import { Repartir } from "./comandos/Repartir.ts";
import { CambiarReglas } from "./comandos/CambiarReglas.ts";
import type { Desempate } from "../models/Desempate.ts";
import type { Grupo } from "../models/Grupo.ts";
import type { Reglas } from "../models/Reglas.ts";
import { formatoInvalido } from "./json/Campos.ts";

export class Aplicacion {
  private _almacenamiento: Almacenamiento;
  private _desempate: Desempate;
  private _almacenamientoDePlanilla: Almacenamiento;
  private _planillaDeAsistencia: PlanillaDeAsistencia | undefined;
  private _bitacora: Bitacora;
  private _avisoDeInicio: string | undefined;
  private _creacionDeshecha: CrearGrupo | undefined;

  constructor(almacenamiento: Almacenamiento, desempate: Desempate, almacenamientoDePlanilla: Almacenamiento) {
    this._almacenamiento = almacenamiento;
    this._desempate = desempate;
    this._almacenamientoDePlanilla = almacenamientoDePlanilla;
    this._planillaDeAsistencia = PlanillaDeAsistencia.guardadaEn(almacenamientoDePlanilla);
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

  tienePlanillaDeAsistencia(): boolean {
    return this._planillaDeAsistencia !== undefined;
  }

  planillaDeAsistencia(): PlanillaDeAsistencia {
    if (this._planillaDeAsistencia === undefined) throw new Error("No hay una planilla de asistencia empezada");

    return this._planillaDeAsistencia;
  }

  empezarPlanillaDeAsistencia(): PlanillaDeAsistencia {
    this._asertarQueNoHayPlanillaDeAsistencia();

    return this.restaurarPlanillaDeAsistencia([]);
  }

  restaurarPlanillaDeAsistencia(asistentes: Iterable<string>): PlanillaDeAsistencia {
    const planilla = PlanillaDeAsistencia.nueva(this._almacenamientoDePlanilla, asistentes);
    this._planillaDeAsistencia = planilla;
    return planilla;
  }

  descartarPlanillaDeAsistencia(): void {
    this._planillaDeAsistencia?.descartar();
    this._planillaDeAsistencia = undefined;
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

  registrarEncuentro(fecha: Date, asistentes: Iterable<string>, ausentes: Iterable<string>): void {
    this._ejecutar(new RegistrarEncuentro(fecha, asistentes, ausentes));
  }

  ingresarAsistente(nombre: string, fecha: Date): void {
    const planilla = this.planillaDeAsistencia();
    const nombreLimpio = nombre.trim();
    if (this.grupo().yaParticipo(nombreLimpio)) {
      this.reingresar(nombreLimpio, fecha);
    } else {
      this.ingresar(nombreLimpio, fecha);
    }
    planilla.marcarComoPresente(nombreLimpio);
  }

  ausentesEnPlanillaDeAsistencia(): string[] {
    const planilla = this.planillaDeAsistencia();
    return this.grupo()
      .posiblesAsistentes()
      .map((participante) => participante.nombre())
      .filter((nombre) => !planilla.asiste(nombre));
  }

  registrarEncuentroSegunPlanillaDeAsistencia(fecha: Date): void {
    const planilla = this.planillaDeAsistencia();
    this.registrarEncuentro(fecha, planilla.asistentes(), this.ausentesEnPlanillaDeAsistencia());
    this.descartarPlanillaDeAsistencia();
  }

  cobrar(nombre: string, monto: number, fecha: Date): void {
    this._ejecutar(new Cobrar(nombre, monto, fecha));
  }

  cobrarEnLaPuerta(nombre: string, monto: number, fecha: Date): void {
    this._asertarQueSoloLeFaltaPagar(nombre);
    const planilla = this.planillaDeAsistencia();

    this.cobrar(nombre, monto, fecha);
    if (this._puedeAsistir(nombre)) planilla.marcarComoPresente(nombre);
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

  importar(texto: string): void {
    this._bitacora = this._bitacoraDesde(texto);
    this._guardar();
    this.descartarPlanillaDeAsistencia();
  }

  private _ejecutar(comando: Comando): void {
    this._bitacora.ejecutar(comando);
    this._creacionDeshecha = undefined;
    this._guardar();
  }

  private _desmarcarAQuienesNoPuedenAsistir(): void {
    this._planillaDeAsistencia?.conservarSoloA((nombre) => this._puedeAsistir(nombre));
  }

  private _asertarQueNoHayPlanillaDeAsistencia(): void {
    if (this.tienePlanillaDeAsistencia()) throw new Error("Ya hay una planilla de asistencia empezada");
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
    return Bitacora.desdeJson(this._jsonDesde(texto), this._desempate);
  }

  private _jsonDesde(texto: string): unknown {
    try {
      return JSON.parse(texto);
    } catch {
      throw formatoInvalido("el texto no es JSON");
    }
  }
}
