import type { Asistencia, Comando } from "../app/Comando.ts";
import { Dialogo, mostrarEnDialogo } from "./Dialogo.ts";
import { alerta, boton, crear, descargar, fila, intentar, tabla } from "./dom.ts";
import type { Entorno } from "./Entorno.ts";
import { fechaYHora } from "./Formato.ts";
import { alfabetico } from "./Orden.ts";

// La bitácora, del último comando al primero. Sólo el último se puede deshacer.
// Exportar descarga la bitácora como JSON e importar reemplaza todo lo de este dispositivo por un JSON.
export class PantallaHistorial {
  private _entorno: Entorno;
  private _errores: HTMLOutputElement;

  constructor(entorno: Entorno) {
    this._entorno = entorno;
    this._errores = alerta();
  }

  elemento(): HTMLElement {
    return crear("section", {}, crear("h2", {}, "Historial"), this._errores, this._tabla(), this._copiaDeSeguridad());
  }

  private _copiaDeSeguridad(): HTMLElement {
    const archivo = crear("input", {
      type: "file",
      name: "archivo",
      accept: ".json,application/json",
      onchange: () => this._leerParaImportar(archivo),
    });
    return crear(
      "form",
      { onsubmit: (evento: Event) => evento.preventDefault() },
      crear("h3", {}, "Copia de seguridad"),
      boton("Exportar", () => this._exportar()),
      crear("label", {}, "Importar ", archivo),
    );
  }

  private _exportar(): void {
    descargar(`${this._entorno.grupo().nombre()}.json`, this._entorno.aplicacion().exportar(), "application/json");
  }

  private _leerParaImportar(entrada: HTMLInputElement): void {
    const archivo = entrada.files?.[0];
    if (archivo === undefined) return;

    archivo.text().then(
      (texto) => this._confirmarImportacion(archivo.name, texto),
      () => (this._errores.textContent = "No se pudo leer el archivo"),
    );
    entrada.value = "";
  }

  private _confirmarImportacion(nombreDelArchivo: string, texto: string): void {
    const aviso = crear(
      "p",
      {},
      `Se va a reemplazar todo lo guardado en este dispositivo por el contenido de "${nombreDelArchivo}".`,
    );
    new Dialogo(this._entorno, "Importar", [aviso], "Reemplazar", () => {
      this._entorno.aplicacion().importar(texto);
    }).abrir();
  }

  private _tabla(): HTMLElement | undefined {
    const comandos = this._entorno.aplicacion().comandos().toReversed();
    return tabla(
      undefined,
      ["Fecha", "Qué pasó", ""],
      comandos.map((comando, posicion) => this._filaDe(comando, posicion === 0)),
    );
  }

  private _filaDe(comando: Comando, esElUltimo: boolean): HTMLTableRowElement {
    return fila(fechaYHora(comando.fecha()), comando.describir(), this._accionesSobre(comando, esElUltimo));
  }

  private _accionesSobre(comando: Comando, esElUltimo: boolean): HTMLElement {
    const asistencia = comando.asistencia();
    return crear(
      "span",
      {},
      asistencia !== undefined && boton("Ver", () => this._verAsistencia(comando.fecha(), asistencia)),
      " ",
      esElUltimo && boton("Deshacer", () => this._deshacer()),
    );
  }

  private _verAsistencia(fecha: Date, asistencia: Asistencia): void {
    const presentes = new Set(asistencia.presentes);
    const filas = [...asistencia.presentes, ...asistencia.ausentes]
      .toSorted(alfabetico)
      .map((nombre) => fila(nombre, presentes.has(nombre) ? "Presente" : "Ausente"));
    mostrarEnDialogo(
      this._entorno,
      `Encuentro del ${fechaYHora(fecha)}`,
      tabla(undefined, ["Nombre", "Asistencia"], filas),
    );
  }

  private _deshacer(): void {
    intentar(() => this._entorno.deshacer(), this._errores);
  }
}
