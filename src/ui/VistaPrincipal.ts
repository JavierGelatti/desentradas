import type { Almacenamiento } from "../app/Almacenamiento.ts";
import type { Aplicacion } from "../app/Aplicacion.ts";
import { CerrarEvento } from "../app/comandos/CerrarEvento.ts";
import { CrearGrupo } from "../app/comandos/CrearGrupo.ts";
import type { Grupo } from "../models/Grupo.ts";
import { crear, intentar } from "./dom.ts";
import type { Entorno } from "./Entorno.ts";
import { PantallaDeInicio } from "./PantallaDeInicio.ts";
import { PantallaEvento } from "./PantallaEvento.ts";
import { PantallaHistorial } from "./PantallaHistorial.ts";
import { PantallaParticipantes } from "./PantallaParticipantes.ts";
import { PantallaReglas } from "./PantallaReglas.ts";
import { PantallaRepartos } from "./PantallaRepartos.ts";

type NombreDePantalla = "participantes" | "repartos" | "evento" | "historial" | "reglas";

const pantallas: readonly [NombreDePantalla, string][] = [
  ["participantes", "Participantes"],
  ["repartos", "Repartos"],
  ["evento", "Evento"],
  ["historial", "Historial"],
  ["reglas", "Reglas"],
];

const esNombreDePantalla = (texto: string): texto is NombreDePantalla => pantallas.some(([nombre]) => nombre === texto);

// Encabezado, pestañas y la pantalla actual. Se vuelve a dibujar entera después de cada comando.
export class VistaPrincipal implements Entorno {
  private _aplicacion: Aplicacion;
  private _ultimaPantalla: Almacenamiento;
  private _ahora: () => Date;
  private _pantallaActual: NombreDePantalla;
  private _raiz: HTMLElement | undefined;
  private _creacionDeshecha: CrearGrupo | undefined;

  constructor(aplicacion: Aplicacion, ultimaPantalla: Almacenamiento, ahora: () => Date) {
    this._aplicacion = aplicacion;
    this._ultimaPantalla = ultimaPantalla;
    this._ahora = ahora;
    this._pantallaActual = this._pantallaInicial();
    this._raiz = undefined;
    this._creacionDeshecha = undefined;
  }

  montarEn(raiz: HTMLElement): void {
    this._raiz = raiz;
    window.addEventListener("hashchange", () => this._irSegunElHash());
    this._irA(this._pantallaActual);
  }

  aplicacion(): Aplicacion {
    return this._aplicacion;
  }

  grupo(): Grupo {
    return this._aplicacion.grupo();
  }

  ahora(): Date {
    return this._ahora();
  }

  refrescar(): void {
    if (this._raiz === undefined) throw new Error("La vista no está montada");

    if (this._aplicacion.tieneGrupo()) this._creacionDeshecha = undefined;
    this._raiz.replaceChildren(this._encabezado(), crear("main", {}, this._pantalla()));
  }

  // Si falla no se refresca, para que la alerta siga a la vista.
  intentarYRefrescar(accion: () => void, errores: HTMLOutputElement): void {
    if (intentar(accion, errores)) this.refrescar();
  }

  // El cierre deshecho quedó como borrador, así que se muestra la pantalla del evento;
  // la creación deshecha vuelve al formulario inicial con lo que se había cargado.
  deshacer(): void {
    const deshecho = this._aplicacion.deshacer();
    if (deshecho instanceof CerrarEvento) {
      this._irA("evento");
    } else if (deshecho instanceof CrearGrupo) {
      this._creacionDeshecha = deshecho;
      this.refrescar();
    } else {
      this.refrescar();
    }
  }

  private _pantallaInicial(): NombreDePantalla {
    if (this._aplicacion.borrador().existe()) return "evento";

    const delHash = location.hash.slice(1);
    if (esNombreDePantalla(delHash)) return delHash;

    const ultima = this._ultimaPantalla.leer() ?? "";
    return esNombreDePantalla(ultima) ? ultima : "evento";
  }

  private _irSegunElHash(): void {
    const pantalla = location.hash.slice(1);
    if (esNombreDePantalla(pantalla) && pantalla !== this._pantallaActual) this._irA(pantalla);
  }

  private _irA(pantalla: NombreDePantalla): void {
    this._pantallaActual = pantalla;
    this._ultimaPantalla.guardar(pantalla);
    if (location.hash !== `#${pantalla}`) location.hash = `#${pantalla}`;
    this.refrescar();
  }

  private _encabezado(): HTMLElement {
    if (!this._aplicacion.tieneGrupo()) return crear("header", {}, crear("h1", {}, "Eventos recurrentes"));

    return crear(
      "header",
      {},
      crear("h1", {}, this._aplicacion.grupo().nombre()),
      crear(
        "nav",
        {},
        ...pantallas.map(([nombre, titulo]) =>
          crear("a", { href: `#${nombre}`, "aria-current": nombre === this._pantallaActual && "page" }, titulo),
        ),
      ),
    );
  }

  private _pantalla(): HTMLElement {
    if (!this._aplicacion.tieneGrupo()) return new PantallaDeInicio(this, this._creacionDeshecha).elemento();

    switch (this._pantallaActual) {
      case "participantes":
        return new PantallaParticipantes(this).elemento();
      case "repartos":
        return new PantallaRepartos(this).elemento();
      case "evento":
        return new PantallaEvento(this).elemento();
      case "historial":
        return new PantallaHistorial(this).elemento();
      case "reglas":
        return new PantallaReglas(this).elemento();
    }
  }
}
