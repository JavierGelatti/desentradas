import { describe, expect, it } from "vitest";
import { Participante } from "../../src/models/Participante.ts";
import { TransicionInvalida } from "../../src/models/estados/TransicionInvalida.ts";
import { dia, nuevoEvento, reglas } from "./factories.ts";
import { InteresFijoPorDia } from "../../src/models/PoliticaDeInteres.ts";

const lasReglas = reglas({ toleranciaDeFaltas: 2 });
const reglasConInteresDiario = reglas({ politicaDeInteres: new InteresFijoPorDia(10) });

const nuevoParticipante = () => new Participante("ana", dia(1));

const enDeuda = () => {
  const ana = nuevoParticipante();
  ana.falto(nuevoEvento(), lasReglas);
  return ana;
};

const libreDeDeuda = () => {
  const ana = enDeuda();
  ana.pago(dia(3), lasReglas);
  return ana;
};

const moroso = () => {
  const ana = enDeuda();
  ana.falto(nuevoEvento(), lasReglas);
  return ana;
};

const finalizado = () => {
  const ana = moroso();
  ana.pago(dia(16), lasReglas);
  return ana;
};

describe("Participante", () => {
  describe("participando", () => {
    it("al ingresar está participando, sin faltas ni deuda, y puede asistir", () => {
      const ana = nuevoParticipante();

      expect(ana.nombre()).toBe("ana");
      expect(ana.estado()).toBe("participando");
      expect(ana.puedeAsistir()).toBe(true);
      expect(ana.estaActivo()).toBe(true);
      expect(ana.faltas()).toBe(0);
      expect(ana.deudaAl(dia(2))).toBe(0);
    });

    it("ir a un evento lo mantiene participando", () => {
      const ana = nuevoParticipante();

      ana.voy(nuevoEvento(), lasReglas);

      expect(ana.estado()).toBe("participando");
    });

    it("faltar estando participando lo deja en deuda por el monto por falta, cuenta esa falta, y ya no puede asistir", () => {
      const ana = nuevoParticipante();

      ana.falto(nuevoEvento(), lasReglas);

      expect(ana.estado()).toBe("en deuda");
      expect(ana.puedeAsistir()).toBe(false);
      expect(ana.faltas()).toBe(1);
      expect(ana.deudaAl(dia(3))).toBe(1000);
    });

    it("puede ir o faltar, pero no pagar", () => {
      const ana = nuevoParticipante();

      expect(ana.accionesPosibles()).toEqual(["voy", "falto"]);
      expect(ana.puede("voy")).toBe(true);
      expect(ana.puede("pago")).toBe(false);
    });

    it("un participante que no debe nada no puede pagar", () => {
      const ana = nuevoParticipante();

      expect(() => {
        ana.pago(dia(2), lasReglas);
      }).toThrow(TransicionInvalida);
    });
  });

  describe("en deuda", () => {
    it("puede faltar o pagar, pero no ir", () => {
      const ana = enDeuda();

      expect(ana.accionesPosibles()).toEqual(["falto", "pago"]);
    });

    it("no puede ir a un evento mientras deba", () => {
      const ana = enDeuda();

      expect(() => {
        ana.voy(nuevoEvento(), lasReglas);
      }).toThrow(TransicionInvalida);
    });

    it("pagar lo deja libre de deuda, pudiendo asistir, y conserva la falta que originó la deuda", () => {
      const ana = enDeuda();

      ana.pago(dia(3), lasReglas);

      expect(ana.estado()).toBe("libre de deuda");
      expect(ana.puedeAsistir()).toBe(true);
      expect(ana.faltas()).toBe(1);
      expect(ana.deudaAl(dia(4))).toBe(0);
    });

    it("su deuda no acumula interés", () => {
      const ana = nuevoParticipante();

      ana.falto(nuevoEvento({ numero: 2 }), reglasConInteresDiario);

      expect(ana.deudaAl(dia(8))).toBe(1000);
    });

    it("una falta estando en deuda lo vuelve moroso, conservando las faltas que tenía", () => {
      const ana = enDeuda();

      ana.falto(nuevoEvento({ numero: 9 }), lasReglas);

      expect(ana.estado()).toBe("moroso");
      expect(ana.puedeAsistir()).toBe(false);
      expect(ana.estaActivo()).toBe(true);
      expect(ana.faltas()).toBe(1);
      expect(ana.deudaAl(dia(10))).toBe(1000);
    });

    it("puede pagar en la puerta y asistir al mismo evento", () => {
      const ana = enDeuda();
      const siguienteEvento = nuevoEvento({ asistentes: ["ana"] });

      ana.pago(siguienteEvento.fecha(), lasReglas);
      ana.voy(siguienteEvento, lasReglas);

      expect(ana.estado()).toBe("participando");
      expect(ana.faltas()).toBe(0);
      expect(ana.deudaAl(dia(10))).toBe(0);
    });
  });

  describe("libre de deuda", () => {
    it("puede ir o faltar, pero no pagar", () => {
      const ana = libreDeDeuda();

      expect(ana.accionesPosibles()).toEqual(["voy", "falto"]);
    });

    it("no puede pagar porque no debe nada", () => {
      const ana = libreDeDeuda();

      expect(() => {
        ana.pago(dia(4), lasReglas);
      }).toThrow(TransicionInvalida);
    });

    it("cada falta se cuenta sin generar deuda, y sigue activo mientras no supere la tolerancia", () => {
      const ana = libreDeDeuda();

      ana.falto(nuevoEvento(), lasReglas);

      expect(ana.estado()).toBe("libre de deuda");
      expect(ana.estaActivo()).toBe(true);
      expect(ana.faltas()).toBe(2);
      expect(ana.deudaAl(dia(10))).toBe(0);
    });

    it("volver a ir borra las faltas y lo devuelve a participando", () => {
      const ana = libreDeDeuda();
      ana.falto(nuevoEvento(), lasReglas);

      ana.voy(nuevoEvento(), lasReglas);

      expect(ana.estado()).toBe("participando");
      expect(ana.faltas()).toBe(0);
    });

    it("con tolerancia N, la falta N + 1 desde la última vez que fue lo finaliza por faltas, sin deber nada", () => {
      const ana = nuevoParticipante();
      ana.voy(nuevoEvento({ numero: 2 }), lasReglas);
      ana.falto(nuevoEvento({ numero: 9 }), lasReglas);
      ana.pago(dia(10), lasReglas);
      ana.falto(nuevoEvento({ numero: 16 }), lasReglas);
      expect(ana.faltas()).toBe(2);

      ana.falto(nuevoEvento({ numero: 23 }), lasReglas);

      expect(ana.estado()).toBe("finalizado");
      expect(ana.motivoDeFinalizacion()).toBe("por faltas");
      expect(ana.estaActivo()).toBe(false);
      expect(ana.puedeAsistir()).toBe(false);
      expect(ana.deudaAl(dia(17))).toBe(0);
    });
  });

  describe("moroso", () => {
    it("puede faltar o pagar, pero no ir", () => {
      const ana = moroso();

      expect(ana.accionesPosibles()).toEqual(["falto", "pago"]);
    });

    it("no puede ir a un evento", () => {
      const ana = moroso();

      expect(() => {
        ana.voy(nuevoEvento(), lasReglas);
      }).toThrow(TransicionInvalida);
    });

    it("sus faltas no se cuentan ni generan deuda", () => {
      const ana = moroso();
      expect(ana.faltas()).toBe(1);

      ana.falto(nuevoEvento(), lasReglas);

      expect(ana.estado()).toBe("moroso");
      expect(ana.faltas()).toBe(1);
      expect(ana.deudaAl(dia(17))).toBe(1000);
    });

    it("su deuda acumula interés desde el evento en que se volvió moroso", () => {
      const ana = nuevoParticipante();
      ana.falto(nuevoEvento({ numero: 2 }), reglasConInteresDiario);

      ana.falto(nuevoEvento({ numero: 9 }), reglasConInteresDiario);

      expect(ana.deudaAl(dia(9))).toBe(1000);
      expect(ana.deudaAl(dia(12))).toBe(1030);
    });

    it("pagar salda la deuda y finaliza la participación por pago de morosidad, sin devolverlo a participar", () => {
      const ana = moroso();

      ana.pago(dia(16), lasReglas);

      expect(ana.estado()).toBe("finalizado");
      expect(ana.motivoDeFinalizacion()).toBe("por pago de morosidad");
      expect(ana.estaActivo()).toBe(false);
      expect(ana.puedeAsistir()).toBe(false);
      expect(ana.deudaAl(dia(17))).toBe(0);
    });
  });

  describe("finalizado", () => {
    it("no tiene acciones posibles", () => {
      const ana = finalizado();

      expect(ana.accionesPosibles()).toEqual([]);
    });

    it("no puede ir a un evento", () => {
      const ana = finalizado();

      expect(() => {
        ana.voy(nuevoEvento(), lasReglas);
      }).toThrow(TransicionInvalida);
    });

    it("no puede faltar a un evento", () => {
      const ana = finalizado();

      expect(() => {
        ana.falto(nuevoEvento(), lasReglas);
      }).toThrow(TransicionInvalida);
    });

    it("no puede pagar", () => {
      const ana = finalizado();

      expect(() => {
        ana.pago(dia(23), lasReglas);
      }).toThrow(TransicionInvalida);
    });
  });

  describe("historial", () => {
    it("registra el ingreso y cada transición con su fecha, disparador, origen y destino", () => {
      const ana = nuevoParticipante();
      ana.voy(nuevoEvento({ numero: 2 }), lasReglas);
      ana.falto(nuevoEvento({ numero: 9 }), lasReglas);
      ana.pago(dia(10), lasReglas);

      const historial = ana.historial();

      expect(historial.map((transicion) => transicion.describir())).toEqual([
        "ingreso -> participando",
        "voy: participando -> participando",
        "falto: participando -> en deuda",
        "pago: en deuda -> libre de deuda",
      ]);
      expect(historial.map((transicion) => transicion.fecha())).toEqual([dia(1), dia(2), dia(9), dia(10)]);
      expect(historial[3].disparador()).toBe("pago");
      expect(historial[3].desde()).toBe("en deuda");
      expect(historial[3].hacia()).toBe("libre de deuda");
      expect(historial[0].desde()).toBeUndefined();
    });

    it("una transición inválida no deja rastro", () => {
      const ana = nuevoParticipante();

      expect(() => {
        ana.pago(dia(2), lasReglas);
      }).toThrow(TransicionInvalida);

      expect(ana.historial()).toHaveLength(1);
    });
  });
});
