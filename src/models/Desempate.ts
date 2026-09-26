import type { Cobro } from "./Cobro.ts";

// Ordena a los asistentes de un cobro: los primeros reciben un peso más del sobrante.
export interface Desempate {
  ordenar(nombres: Iterable<string>, cobro: Cobro): string[];
}

export class DesempateAlfabetico implements Desempate {
  ordenar(nombres: Iterable<string>, _cobro: Cobro): string[] {
    return [...nombres].sort();
  }
}

export class DesempateAleatorioReproducible implements Desempate {
  ordenar(nombres: Iterable<string>, cobro: Cobro): string[] {
    const datos = this._datosDe(cobro);
    const puntajeDe = (nombre: string) => cyrb53(`${datos}|${nombre}`);
    return [...nombres].sort((uno, otro) => puntajeDe(uno) - puntajeDe(otro));
  }

  private _datosDe(cobro: Cobro): string {
    return [cobro.deudor(), cobro.fecha().getTime(), cobro.monto(), cobro.eventoFaltado().fecha().getTime()].join("|");
  }
}

// Hash de 53 bits de un string (cyrb53).
const cyrb53 = (texto: string): number => {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < texto.length; i++) {
    const caracter = texto.charCodeAt(i);
    h1 = Math.imul(h1 ^ caracter, 2654435761);
    h2 = Math.imul(h2 ^ caracter, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
  h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return 4294967296 * (2097151 & h2) + (h1 >>> 0);
};
