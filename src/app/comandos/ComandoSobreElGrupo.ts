import type { Aplicacion } from "../Aplicacion.ts";
import type { Comando } from "../Comando.ts";
import type { ComandoJson } from "../json/ComandoJson.ts";
import type { Desempate } from "../../models/Desempate.ts";
import type { Grupo } from "../../models/Grupo.ts";

export abstract class ComandoSobreElGrupo implements Comando {
  ejecutar(grupo: Grupo | undefined, _desempate: Desempate): Grupo {
    if (grupo === undefined) throw new Error("El grupo no está creado");

    this.ejecutarEn(grupo);
    return grupo;
  }

  protected abstract ejecutarEn(grupo: Grupo): void;

  // La mayoría no deja nada que retomar: deshacerlos alcanza con reconstruir el grupo.
  alDeshacerse(_aplicacion: Aplicacion): void {}

  abstract fecha(): Date;

  abstract describir(): string;

  abstract aJson(): ComandoJson;
}
