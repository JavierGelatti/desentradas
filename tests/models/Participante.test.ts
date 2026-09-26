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
  ana.pago(dia(3), ana.deudaAl(dia(3)), lasReglas, "efectivo");
  return ana;
};

const finalizadoPorFaltas = () => {
  const ana = libreDeDeuda();
  ana.falto(nuevoEvento({ numero: 9 }), lasReglas);
  ana.falto(nuevoEvento({ numero: 16 }), lasReglas);
  return ana;
};

const moroso = () => {
  const ana = enDeuda();
  ana.falto(nuevoEvento(), lasReglas);
  return ana;
};

const finalizado = () => {
  const ana = moroso();
  ana.pago(dia(16), ana.deudaAl(dia(16)), lasReglas, "efectivo");
  return ana;
};

describe("Participante", () => {
  describe("participando", () => {
    it("al ingresar está participando, sin faltas ni deuda", () => {
      const ana = nuevoParticipante();

      expect(ana.nombre()).toBe("ana");
      expect(ana.estado()).toBe("participando");
      expect(ana.estaActivo()).toBe(true);
      expect(ana.faltas()).toBe(0);
      expect(ana.deudaAl(dia(2))).toBe(0);
    });

    it("está habilitado para asistir", () => {
      const ana = nuevoParticipante();

      expect(ana.puedeAsistir()).toBe(true);
    });

    it("es un posible asistente, porque ya está habilitado", () => {
      const ana = nuevoParticipante();

      expect(ana.esPosibleAsistente()).toBe(true);
    });

    it("está al día", () => {
      const ana = nuevoParticipante();

      expect(ana.estaAlDia()).toBe(true);
    });

    it("no tiene nada que pagar para asistir", () => {
      const ana = nuevoParticipante();

      expect(ana.soloLeFaltaPagarParaAsistir()).toBe(false);
    });

    it("ir a un evento lo mantiene participando", () => {
      const ana = nuevoParticipante();

      ana.voy(nuevoEvento(), lasReglas);

      expect(ana.estado()).toBe("participando");
    });

    it("faltar lo deja en deuda por el monto por falta", () => {
      const ana = nuevoParticipante();

      ana.falto(nuevoEvento(), lasReglas);

      expect(ana.estado()).toBe("en deuda");
      expect(ana.deudaAl(dia(3))).toBe(1000);
    });

    it("faltar cuenta la falta", () => {
      const ana = nuevoParticipante();

      ana.falto(nuevoEvento(), lasReglas);

      expect(ana.faltas()).toBe(1);
    });

    it("sus acciones posibles son ir y faltar", () => {
      const ana = nuevoParticipante();

      expect(ana.accionesPosibles()).toEqual(["voy", "falto"]);
      expect(ana.puede("voy")).toBe(true);
      expect(ana.puede("pago")).toBe(false);
    });

    it("no puede pagar porque no debe nada", () => {
      const ana = nuevoParticipante();

      expect(() => {
        ana.pago(dia(2), 1000, lasReglas, "efectivo");
      }).toThrow(TransicionInvalida);
    });

    it("no puede reingresar", () => {
      const ana = nuevoParticipante();

      expect(() => {
        ana.reingresar(dia(20));
      }).toThrow(TransicionInvalida);
    });
  });

  describe("en deuda", () => {
    it("sus acciones posibles son faltar y pagar", () => {
      const ana = enDeuda();

      expect(ana.accionesPosibles()).toEqual(["falto", "pago"]);
    });

    it("es un posible asistente, porque puede asistir si paga", () => {
      const ana = enDeuda();

      expect(ana.esPosibleAsistente()).toBe(true);
    });

    it("no está habilitado para asistir", () => {
      const ana = enDeuda();

      expect(ana.puedeAsistir()).toBe(false);
    });

    it("sólo le falta pagar para asistir", () => {
      const ana = enDeuda();

      expect(ana.soloLeFaltaPagarParaAsistir()).toBe(true);
    });

    it("no está al día", () => {
      const ana = enDeuda();

      expect(ana.estaAlDia()).toBe(false);
    });

    it("no puede ir a un evento", () => {
      const ana = enDeuda();

      expect(() => {
        ana.voy(nuevoEvento(), lasReglas);
      }).toThrow(TransicionInvalida);
    });

    it("pagar el total lo deja libre de deuda", () => {
      const ana = enDeuda();

      ana.pago(dia(3), 1000, lasReglas, "efectivo");

      expect(ana.estado()).toBe("libre de deuda");
      expect(ana.deudaAl(dia(4))).toBe(0);
    });

    it("pagar produce un cobro a su nombre por el evento adeudado", () => {
      const ana = nuevoParticipante();
      const evento = nuevoEvento();
      ana.falto(evento, lasReglas);

      const cobro = ana.pago(dia(3), 400, lasReglas, "efectivo");

      expect(cobro.deudor()).toBe("ana");
      expect(cobro.monto()).toBe(400);
      expect(cobro.fecha()).toEqual(dia(3));
      expect(cobro.eventoFaltado()).toBe(evento);
      expect(cobro.origen()).toBe("efectivo");
    });

    it("pagar conserva la falta que originó la deuda", () => {
      const ana = enDeuda();

      ana.pago(dia(3), 1000, lasReglas, "efectivo");

      expect(ana.faltas()).toBe(1);
    });

    it("un pago parcial lo deja en deuda por el resto", () => {
      const ana = enDeuda();

      ana.pago(dia(3), 400, lasReglas, "efectivo");

      expect(ana.estado()).toBe("en deuda");
      expect(ana.deudaAl(dia(4))).toBe(600);
    });

    it("no se puede pagar más de lo que debe", () => {
      const ana = enDeuda();

      expect(() => {
        ana.pago(dia(3), 1001, lasReglas, "efectivo");
      }).toThrow("El pago no puede superar la deuda");
      expect(ana.estado()).toBe("en deuda");
      expect(ana.historial()).toHaveLength(2);
    });

    it("su deuda no acumula interés", () => {
      const ana = nuevoParticipante();

      ana.falto(nuevoEvento({ numero: 2 }), reglasConInteresDiario);

      expect(ana.deudaAl(dia(8))).toBe(1000);
    });

    it("faltar lo vuelve moroso", () => {
      const ana = enDeuda();

      ana.falto(nuevoEvento({ numero: 9 }), lasReglas);

      expect(ana.estado()).toBe("moroso");
    });

    it("al volverse moroso conserva las faltas y la deuda que tenía", () => {
      const ana = enDeuda();

      ana.falto(nuevoEvento({ numero: 9 }), lasReglas);

      expect(ana.faltas()).toBe(1);
      expect(ana.deudaAl(dia(10))).toBe(1000);
    });

    it("no puede reingresar", () => {
      const ana = enDeuda();

      expect(() => {
        ana.reingresar(dia(20));
      }).toThrow(TransicionInvalida);
    });

    it("puede pagar en la puerta y asistir al mismo evento", () => {
      const ana = enDeuda();
      const siguienteEvento = nuevoEvento({ asistentes: ["ana"] });

      ana.pago(siguienteEvento.fecha(), 1000, lasReglas, "efectivo");
      ana.voy(siguienteEvento, lasReglas);

      expect(ana.estado()).toBe("participando");
      expect(ana.faltas()).toBe(0);
      expect(ana.deudaAl(dia(10))).toBe(0);
    });
  });

  describe("libre de deuda", () => {
    it("está habilitado para asistir", () => {
      const ana = libreDeDeuda();

      expect(ana.puedeAsistir()).toBe(true);
    });

    it("no tiene nada que pagar para asistir", () => {
      const ana = libreDeDeuda();

      expect(ana.soloLeFaltaPagarParaAsistir()).toBe(false);
    });

    it("no está al día, porque se le cuentan las faltas", () => {
      const ana = libreDeDeuda();

      expect(ana.estaAlDia()).toBe(false);
    });

    it("sus acciones posibles son ir y faltar", () => {
      const ana = libreDeDeuda();

      expect(ana.accionesPosibles()).toEqual(["voy", "falto"]);
    });

    it("no puede pagar porque no debe nada", () => {
      const ana = libreDeDeuda();

      expect(() => {
        ana.pago(dia(4), 1000, lasReglas, "efectivo");
      }).toThrow(TransicionInvalida);
    });

    it("no puede reingresar", () => {
      const ana = libreDeDeuda();

      expect(() => {
        ana.reingresar(dia(20));
      }).toThrow(TransicionInvalida);
    });

    it("cada falta se cuenta sin generar deuda", () => {
      const ana = libreDeDeuda();

      ana.falto(nuevoEvento(), lasReglas);

      expect(ana.faltas()).toBe(2);
      expect(ana.deudaAl(dia(10))).toBe(0);
    });

    it("sigue libre de deuda mientras las faltas no superen la tolerancia", () => {
      const ana = libreDeDeuda();

      ana.falto(nuevoEvento(), lasReglas);

      expect(ana.estado()).toBe("libre de deuda");
      expect(ana.estaActivo()).toBe(true);
    });

    it("volver a ir borra las faltas y lo devuelve a participando", () => {
      const ana = libreDeDeuda();
      ana.falto(nuevoEvento(), lasReglas);

      ana.voy(nuevoEvento(), lasReglas);

      expect(ana.estado()).toBe("participando");
      expect(ana.faltas()).toBe(0);
    });

    it("la falta que supera la tolerancia desde la última vez que fue lo finaliza por faltas, sin deber nada", () => {
      const ana = nuevoParticipante();
      ana.voy(nuevoEvento({ numero: 2 }), lasReglas);
      ana.falto(nuevoEvento({ numero: 9 }), lasReglas);
      ana.pago(dia(10), 1000, lasReglas, "efectivo");
      ana.falto(nuevoEvento({ numero: 16 }), lasReglas);
      expect(ana.faltas()).toBe(2);

      ana.falto(nuevoEvento({ numero: 23 }), lasReglas);

      expect(ana.estado()).toBe("finalizado");
      expect(ana.motivoDeFinalizacion()).toBe("por faltas");
      expect(ana.deudaAl(dia(17))).toBe(0);
    });
  });

  describe("moroso", () => {
    it("pagar produce un cobro por el evento que originó la deuda", () => {
      const ana = nuevoParticipante();
      const evento = nuevoEvento({ numero: 2 });
      ana.falto(evento, lasReglas);
      ana.falto(nuevoEvento({ numero: 9 }), lasReglas);

      const cobro = ana.pago(dia(20), 400, lasReglas, "efectivo");

      expect(cobro.eventoFaltado()).toBe(evento);
    });

    it("sus acciones posibles son faltar y pagar", () => {
      const ana = moroso();

      expect(ana.accionesPosibles()).toEqual(["falto", "pago"]);
    });

    it("sigue activo", () => {
      const ana = moroso();

      expect(ana.estaActivo()).toBe(true);
    });

    it("no está habilitado para asistir", () => {
      const ana = moroso();

      expect(ana.puedeAsistir()).toBe(false);
    });

    it("no es un posible asistente, porque no puede asistir ni pagando", () => {
      const ana = moroso();

      expect(ana.esPosibleAsistente()).toBe(false);
    });

    it("pagar no le alcanza para asistir", () => {
      const ana = moroso();

      expect(ana.soloLeFaltaPagarParaAsistir()).toBe(false);
    });

    it("no está al día", () => {
      const ana = moroso();

      expect(ana.estaAlDia()).toBe(false);
    });

    it("no puede ir a un evento", () => {
      const ana = moroso();

      expect(() => {
        ana.voy(nuevoEvento(), lasReglas);
      }).toThrow(TransicionInvalida);
    });

    it("no puede reingresar", () => {
      const ana = moroso();

      expect(() => {
        ana.reingresar(dia(20));
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

    it("un pago parcial lo mantiene moroso por el resto", () => {
      const ana = moroso();

      ana.pago(dia(16), 400, lasReglas, "efectivo");

      expect(ana.estado()).toBe("moroso");
      expect(ana.deudaAl(dia(17))).toBe(600);
    });

    it("saldar la deuda finaliza la participación por pago de morosidad", () => {
      const ana = moroso();

      ana.pago(dia(16), 1000, lasReglas, "efectivo");

      expect(ana.estado()).toBe("finalizado");
      expect(ana.motivoDeFinalizacion()).toBe("por pago de morosidad");
      expect(ana.deudaAl(dia(17))).toBe(0);
    });
  });

  describe("finalizado", () => {
    it("su única acción posible es reingresar", () => {
      const ana = finalizado();

      expect(ana.accionesPosibles()).toEqual(["reingresar"]);
      expect(ana.puede("reingresar")).toBe(true);
    });

    it("ya no está activo", () => {
      const ana = finalizado();

      expect(ana.estaActivo()).toBe(false);
    });

    it("no está habilitado para asistir", () => {
      const ana = finalizado();

      expect(ana.puedeAsistir()).toBe(false);
    });

    it("reingresar lo devuelve a participando", () => {
      const ana = finalizado();

      ana.reingresar(dia(20));

      expect(ana.estado()).toBe("participando");
      expect(ana.faltas()).toBe(0);
      expect(ana.deudaAl(dia(21))).toBe(0);
      expect(ana.motivoDeFinalizacion()).toBeUndefined();
    });

    it("no se puede reingresar en una fecha anterior a la finalización", () => {
      const ana = finalizado(); // finaliza el día 16

      expect(() => {
        ana.reingresar(dia(15));
      }).toThrow("El reingreso no puede ser anterior a la finalización");
      expect(ana.estado()).toBe("finalizado");
    });

    it("se puede reingresar el mismo día de la finalización", () => {
      const ana = finalizado(); // finaliza el día 16

      ana.reingresar(dia(16));

      expect(ana.estado()).toBe("participando");
    });

    it("reingresar después de finalizar por faltas también lo devuelve a participando", () => {
      const ana = finalizadoPorFaltas();

      ana.reingresar(dia(20));

      expect(ana.estado()).toBe("participando");
      expect(ana.faltas()).toBe(0);
      expect(ana.motivoDeFinalizacion()).toBeUndefined();
    });

    it("pagar no le alcanza para asistir", () => {
      const ana = finalizado();

      expect(ana.soloLeFaltaPagarParaAsistir()).toBe(false);
    });

    it("no está al día", () => {
      const ana = finalizado();

      expect(ana.estaAlDia()).toBe(false);
    });

    it("no es un posible asistente", () => {
      const ana = finalizado();

      expect(ana.esPosibleAsistente()).toBe(false);
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
        ana.pago(dia(23), 1000, lasReglas, "efectivo");
      }).toThrow(TransicionInvalida);
    });
  });

  describe("historial", () => {
    it("registra el ingreso y cada cambio de estado, con su fecha, qué lo provocó y de qué estado a cuál pasó", () => {
      const ana = nuevoParticipante();
      ana.voy(nuevoEvento({ numero: 2 }), lasReglas);
      ana.falto(nuevoEvento({ numero: 9 }), lasReglas);
      ana.pago(dia(10), 1000, lasReglas, "efectivo");

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

    it("la fecha del último cambio es la de la última transición del historial", () => {
      const ana = nuevoParticipante();
      ana.voy(nuevoEvento({ numero: 2 }), lasReglas);
      ana.falto(nuevoEvento({ numero: 9 }), lasReglas);

      ana.pago(dia(10), 1000, lasReglas, "efectivo");

      expect(ana.fechaDelUltimoCambio()).toEqual(dia(10));
    });

    it("la fecha de ingreso es la del ingreso, aunque después haya otros cambios", () => {
      const ana = nuevoParticipante();

      ana.voy(nuevoEvento({ numero: 2 }), lasReglas);

      expect(ana.fechaDeIngreso()).toEqual(dia(1));
    });

    it("después de un reingreso, la fecha de ingreso es la del reingreso", () => {
      const ana = finalizado();

      ana.reingresar(dia(20));

      expect(ana.fechaDeIngreso()).toEqual(dia(20));
    });

    it("el reingreso continúa el historial de la misma participación", () => {
      const ana = finalizado();
      const transicionesAlFinalizar = ana.historial().length;

      ana.reingresar(dia(20));

      const ultima = ana.historial().at(-1)!;
      expect(ana.historial()).toHaveLength(transicionesAlFinalizar + 1);
      expect(ultima.describir()).toBe("reingresar: finalizado -> participando");
      expect(ultima.fecha()).toEqual(dia(20));
    });

    it("un pago parcial queda en el historial aunque el estado no cambie", () => {
      const ana = enDeuda();

      ana.pago(dia(3), 400, lasReglas, "efectivo");

      expect(ana.historial().at(-1)!.describir()).toBe("pago: en deuda -> en deuda");
    });

    it("una acción rechazada no deja rastro en el historial", () => {
      const ana = nuevoParticipante();

      expect(() => {
        ana.pago(dia(2), 1000, lasReglas, "efectivo");
      }).toThrow(TransicionInvalida);

      expect(ana.historial()).toHaveLength(1);
    });
  });
});
