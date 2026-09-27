import type { Almacenamiento } from "../app/Almacenamiento.ts";
import type { Aplicacion } from "../app/Aplicacion.ts";
import type { Grupo } from "../models/Grupo.ts";
import { crear, type Hijo, intentar, mostrarDialogo } from "./dom.ts";
import type { Entorno } from "./Entorno.ts";
import { PantallaCaja } from "./PantallaCaja.ts";
import { PantallaDeInicio } from "./PantallaDeInicio.ts";
import { PantallaEncuentro } from "./PantallaEncuentro.ts";
import { PantallaHistorial } from "./PantallaHistorial.ts";
import { PantallaParticipantes } from "./PantallaParticipantes.ts";
import { PantallaReglas } from "./PantallaReglas.ts";

interface Pantalla {
  elemento(): HTMLElement;
}

const pantallas = {
  participantes: { titulo: "Participantes", Pantalla: PantallaParticipantes },
  caja: { titulo: "Caja", Pantalla: PantallaCaja },
  encuentro: { titulo: "Encuentro", Pantalla: PantallaEncuentro },
  historial: { titulo: "Historial", Pantalla: PantallaHistorial },
  reglas: { titulo: "Reglas", Pantalla: PantallaReglas },
} satisfies Record<string, { titulo: string; Pantalla: new (entorno: Entorno) => Pantalla }>;

type NombreDePantalla = keyof typeof pantallas;

const esNombreDePantalla = (texto: string): texto is NombreDePantalla => Object.hasOwn(pantallas, texto);

const pantallaDelHash = (): NombreDePantalla | undefined => {
  const nombre = location.hash.slice(1);
  return esNombreDePantalla(nombre) ? nombre : undefined;
};

export class VistaPrincipal implements Entorno {
  private _aplicacion: Aplicacion;
  private _ultimaPantalla: Almacenamiento;
  private _ahora: () => Date;
  private _pantallaActual: NombreDePantalla;
  private _raiz: HTMLElement | undefined;

  constructor(aplicacion: Aplicacion, ultimaPantalla: Almacenamiento, ahora: () => Date) {
    this._aplicacion = aplicacion;
    this._ultimaPantalla = ultimaPantalla;
    this._ahora = ahora;
    this._pantallaActual = this._pantallaInicial();
    this._raiz = undefined;
  }

  montarEn(raiz: HTMLElement): void {
    this._raiz = raiz;
    this._seguirElHashMientrasEsteEn(raiz);
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

  // Un diálogo puede haberse abierto durante la acción que refresca.
  refrescar(): void {
    const raiz = this._raizMontada();
    raiz.querySelectorAll(":scope > :not(dialog)").forEach((elemento) => elemento.remove());
    raiz.prepend(this._encabezado(), crear("main", {}, this._pantalla()));
  }

  // Si falla no se refresca, para que la alerta siga a la vista.
  intentarYRefrescar(accion: () => void, errores: HTMLOutputElement): void {
    if (intentar(accion, errores)) this.refrescar();
  }

  deshacer(): void {
    const deshecho = this._aplicacion.deshacer();
    if (deshecho.asistencia() !== undefined) {
      this._irA("encuentro");
    } else {
      this.refrescar();
    }
  }

  irAlHistorial(): void {
    this._irA("historial");
  }

  mostrarDialogo(...contenido: Hijo[]): HTMLDialogElement {
    return mostrarDialogo(this._raizMontada(), ...contenido);
  }

  private _raizMontada(): HTMLElement {
    if (this._raiz === undefined) throw new Error("La vista no está montada");

    return this._raiz;
  }

  private _pantallaInicial(): NombreDePantalla {
    if (this._aplicacion.tienePlanillaDeAsistencia()) return "encuentro";

    const ultima = this._ultimaPantalla.leer() ?? "";
    return pantallaDelHash() ?? (esNombreDePantalla(ultima) ? ultima : "encuentro");
  }

  private _seguirElHashMientrasEsteEn(raiz: HTMLElement): void {
    const seguirElHash = () => {
      if (raiz.isConnected) {
        this._irSegunElHash();
      } else {
        window.removeEventListener("hashchange", seguirElHash);
      }
    };
    window.addEventListener("hashchange", seguirElHash);
  }

  private _irSegunElHash(): void {
    const pantalla = pantallaDelHash();
    if (pantalla !== undefined && pantalla !== this._pantallaActual) this._irA(pantalla);
  }

  private _irA(pantalla: NombreDePantalla): void {
    this._pantallaActual = pantalla;
    this._ultimaPantalla.guardar(pantalla);
    if (location.hash !== `#${pantalla}`) location.hash = `#${pantalla}`;
    this.refrescar();
  }

  private _encabezado(): HTMLElement {
    const tieneGrupo = this._aplicacion.tieneGrupo();
    return crear(
      "header",
      {},
      crear("h1", {}, tieneGrupo ? this.grupo().nombre() : "Desentradas"),
      tieneGrupo &&
        crear(
          "nav",
          {},
          ...Object.entries(pantallas).map(([nombre, { titulo }]) =>
            crear("a", { href: `#${nombre}`, "aria-current": nombre === this._pantallaActual && "page" }, titulo),
          ),
        ),
    );
  }

  private _pantalla(): HTMLElement {
    if (!this._aplicacion.tieneGrupo()) return new PantallaDeInicio(this).elemento();

    return new pantallas[this._pantallaActual].Pantalla(this).elemento();
  }
}
