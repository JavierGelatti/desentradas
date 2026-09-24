import type { Cobro } from "./Cobro.ts";

// Decide en qué orden se reparte el sobrante de un cobro entre los asistentes: los primeros reciben un peso más.
export interface Desempate {
  ordenar(nombres: readonly string[], cobro: Cobro): string[];
}

export class DesempateAlfabetico implements Desempate {
  ordenar(nombres: readonly string[], _cobro: Cobro): string[] {
    return [...nombres].sort();
  }
}

// Mezcla los nombres al azar, pero de forma reproducible: la semilla sale de los datos del cobro.
export class DesempateAleatorioReproducible implements Desempate {
  ordenar(nombres: readonly string[], cobro: Cobro): string[] {
    const siguienteAzar = mulberry32(cyrb53(this._datosDe(cobro)));
    const orden = [...nombres];
    for (let i = orden.length - 1; i > 0; i--) {
      const j = Math.floor(siguienteAzar() * (i + 1));
      [orden[i], orden[j]] = [orden[j], orden[i]];
    }
    return orden;
  }

  private _datosDe(cobro: Cobro): string {
    return [cobro.deudor(), cobro.fecha().getTime(), cobro.monto(), cobro.eventoFaltado().fecha().getTime()].join("|");
  }
}

// Hash de 53 bits de un string (cyrb53).
const cyrb53 = (texto: string, semilla = 0): number => {
  let h1 = 0xdeadbeef ^ semilla;
  let h2 = 0x41c6ce57 ^ semilla;
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

// Generador pseudoaleatorio de 32 bits (mulberry32): devuelve números en [0, 1).
const mulberry32 = (semilla: number): (() => number) => {
  let estado = semilla >>> 0;
  return () => {
    estado = (estado + 0x6d2b79f5) | 0;
    let t = Math.imul(estado ^ (estado >>> 15), 1 | estado);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};
