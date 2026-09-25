import type { Comando } from "../app/Comando.ts";
import { Dialogo } from "./Dialogo.ts";
import { alerta, anexar, boton, crear, fila, intentar, tabla } from "./dom.ts";
import type { Entorno } from "./Entorno.ts";
import { fechaYHora } from "./Formato.ts";

// La bitácora, del último comando al primero. Sólo el último se puede deshacer.
// Exportar descarga la bitácora como JSON e importar reemplaza todo lo de este dispositivo por un JSON.
export class PantallaHistorial {
  private _entorno: Entorno;
  private _seccion: HTMLElement;
  private _errores: HTMLOutputElement;

  constructor(entorno: Entorno) {
    this._entorno = entorno;
    this._seccion = crear("section");
    this._errores = alerta();
  }

  elemento(): HTMLElement {
    anexar(this._seccion, crear("h2", {}, "Historial"), this._errores, this._tabla(), this._copiaDeSeguridad());
    return this._seccion;
  }

  private _copiaDeSeguridad(): HTMLElement {
    const archivo = crear("input", { type: "file", name: "archivo", accept: ".json,application/json" });
    archivo.addEventListener("change", () => this._leerParaImportar(archivo));
    return crear(
      "form",
      { onsubmit: (evento: Event) => evento.preventDefault() },
      crear("h3", {}, "Copia de seguridad"),
      crear(
        "p",
        {},
        boton("Exportar", () => this._exportar()),
      ),
      crear("label", {}, "Importar ", archivo),
    );
  }

  private _exportar(): void {
    const contenido = new Blob([this._entorno.aplicacion().exportar()], { type: "application/json" });
    const url = URL.createObjectURL(contenido);
    const enlace = crear("a", { href: url, download: `${this._entorno.grupo().nombre()}.json` });
    this._seccion.append(enlace);
    enlace.click();
    enlace.remove();
    URL.revokeObjectURL(url);
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
    }).abrirEn(this._seccion);
  }

  private _tabla(): HTMLTableElement | undefined {
    const comandos = this._entorno.aplicacion().comandos().toReversed();
    return tabla(
      undefined,
      ["Fecha", "Qué pasó", ""],
      comandos.map((comando, posicion) => this._filaDe(comando, posicion === 0)),
    );
  }

  private _filaDe(comando: Comando, esElUltimo: boolean): HTMLTableRowElement {
    return fila(
      fechaYHora(comando.fecha()),
      comando.describir(),
      esElUltimo && boton("Deshacer", () => this._deshacer()),
    );
  }

  private _deshacer(): void {
    intentar(() => this._entorno.deshacer(), this._errores);
  }
}
