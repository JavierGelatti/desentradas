import type { CrearGrupo } from "../app/comandos/CrearGrupo.ts";
import { campoDeTexto } from "./Campos.ts";
import { alerta, crear, intentar, valorDe } from "./dom.ts";
import type { Entorno } from "./Entorno.ts";
import { camposDeReglas, reglasDesde } from "./FormularioDeReglas.ts";

// Lo único que se ve hasta que el grupo está creado. Las reglas iniciales rigen desde el momento de crearlo.
export class PantallaDeInicio {
  private _entorno: Entorno;
  private _creacionAnterior: CrearGrupo | undefined;

  constructor(entorno: Entorno, creacionAnterior?: CrearGrupo) {
    this._entorno = entorno;
    this._creacionAnterior = creacionAnterior;
  }

  elemento(): HTMLElement {
    const aviso = this._entorno.aplicacion().avisoDeInicio();
    const errores = alerta();
    const formulario = crear(
      "form",
      { onsubmit: (evento: Event) => this._crearGrupo(evento, formulario, errores) },
      campoDeTexto("Nombre del grupo", "nombreDelGrupo", this._creacionAnterior?.nombreDelGrupo() ?? ""),
      ...camposDeReglas(this._creacionAnterior?.reglas()),
      errores,
      crear("button", { type: "submit" }, "Crear"),
    );
    return crear(
      "section",
      {},
      crear("h2", {}, "Crear el grupo"),
      aviso !== undefined && crear("p", { role: "alert" }, aviso),
      formulario,
    );
  }

  private _crearGrupo(evento: Event, formulario: HTMLFormElement, errores: HTMLOutputElement): void {
    evento.preventDefault();
    const creado = intentar(() => {
      const reglas = reglasDesde(formulario, this._entorno.ahora());
      this._entorno.aplicacion().crearGrupo(valorDe(formulario, "nombreDelGrupo"), reglas);
    }, errores);
    if (creado) this._entorno.refrescar();
  }
}
