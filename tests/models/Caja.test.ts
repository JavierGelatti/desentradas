import { describe, expect, it } from "vitest";
import { Caja } from "../../src/models/Caja.ts";
import { Cobro } from "../../src/models/Cobro.ts";
import type { Credito } from "../../src/models/Credito.ts";
import { cobroEnEfectivo, desempate, dia, nuevoEncuentro } from "./factories.ts";

const nuevaCaja = () => new Caja(desempate);

const cobroConCredito = (credito: Credito, monto: number) =>
  new Cobro(credito.acreedor(), monto, dia(4), nuevoEncuentro({ numero: 4, asistentes: ["carla"] }), credito);

describe("Caja", () => {
  describe("distribución de cobros", () => {
    it("un cobro se distribuye en créditos iguales entre los asistentes al encuentro faltado", () => {
      const caja = nuevaCaja();
      const cobro = cobroEnEfectivo({ monto: 1000 });

      const creditos = caja.cobrar(cobro);

      expect(creditos.map((credito) => [credito.acreedor(), credito.monto()])).toEqual([
        ["beto", 500],
        ["carla", 500],
      ]);
      expect(caja.cobros()).toEqual([cobro]);
      expect([...caja.creditosPendientesDe("beto"), ...caja.creditosPendientesDe("carla")]).toEqual(creditos);
    });

    it("cuando el monto no se divide en partes iguales, el sobrante va de a un peso a los primeros según el desempate", () => {
      const caja = nuevaCaja();
      const cobro = cobroEnEfectivo({ monto: 1000, asistentes: ["carla", "beto", "ana"] });

      const creditos = caja.cobrar(cobro);

      expect(creditos.map((credito) => [credito.acreedor(), credito.monto()])).toEqual([
        ["ana", 334],
        ["beto", 333],
        ["carla", 333],
      ]);
    });

    it("un cobro menor a la cantidad de asistentes deja sin crédito a los últimos según el desempate", () => {
      const caja = nuevaCaja();
      const cobro = cobroEnEfectivo({ monto: 2, asistentes: ["carla", "beto", "ana"] });

      const creditos = caja.cobrar(cobro);

      expect(creditos.map((credito) => [credito.acreedor(), credito.monto()])).toEqual([
        ["ana", 1],
        ["beto", 1],
      ]);
    });
  });

  describe("créditos pendientes", () => {
    it("conoce el monto de los créditos pendientes, por nombre y en total", () => {
      const caja = nuevaCaja();
      caja.cobrar(cobroEnEfectivo({ monto: 1000 }));
      caja.cobrar(cobroEnEfectivo({ monto: 300, asistentes: ["beto"] }));

      expect(caja.montoPendienteDe("beto")).toBe(800);
      expect(caja.montoPendienteDe("carla")).toBe(500);
      expect(caja.montoPendienteDe("dario")).toBe(0);
      expect(caja.totalPendiente()).toBe(1300);
    });

    it("conoce los nombres con créditos pendientes, sin repetir y en el orden en que aparecieron", () => {
      const caja = nuevaCaja();
      caja.cobrar(cobroEnEfectivo({ monto: 1000, asistentes: ["dario", "carla"] }));
      caja.cobrar(cobroEnEfectivo({ monto: 300, asistentes: ["beto"] }));
      caja.cobrar(cobroEnEfectivo({ monto: 200, asistentes: ["dario"] }));
      caja.repartir("carla", dia(4));

      expect(caja.nombresConCreditosPendientes()).toEqual(["dario", "beto"]);
    });
  });

  describe("aplicación de créditos", () => {
    it("un crédito aplicado por su monto completo deja de estar pendiente", () => {
      const caja = nuevaCaja();
      const [credito] = caja.cobrar(cobroEnEfectivo({ monto: 1000, asistentes: ["beto"] }));

      caja.cobrar(cobroConCredito(credito, 1000));

      expect(caja.creditosPendientesDe("beto")).toEqual([]);
    });

    it("aplicar parte de un crédito deja pendiente el resto a nombre del mismo acreedor", () => {
      const caja = nuevaCaja();
      const [credito] = caja.cobrar(cobroEnEfectivo({ monto: 1000, asistentes: ["beto"] }));

      caja.cobrar(cobroConCredito(credito, 400));

      expect(caja.creditosPendientesDe("beto").map((pendiente) => pendiente.monto())).toEqual([600]);
    });

    it("no se puede aplicar un crédito que no está pendiente en la caja", () => {
      const caja = nuevaCaja();
      const [credito] = nuevaCaja().cobrar(cobroEnEfectivo({ asistentes: ["beto"] }));

      expect(() => {
        caja.cobrar(cobroConCredito(credito, 400));
      }).toThrow("El crédito no está pendiente en esta caja");
      expect(caja.cobros()).toEqual([]);
    });

    it("no se puede aplicar un crédito ya repartido", () => {
      const caja = nuevaCaja();
      const [credito] = caja.cobrar(cobroEnEfectivo({ monto: 1000, asistentes: ["beto"] }));
      caja.repartir("beto", dia(4));

      expect(() => {
        caja.cobrar(cobroConCredito(credito, 400));
      }).toThrow("El crédito no está pendiente en esta caja");
      expect(caja.montoPendienteDe("beto")).toBe(0);
    });
  });

  describe("repartos", () => {
    it("repartir entrega de una vez todos los créditos pendientes de una persona", () => {
      const caja = nuevaCaja();
      const [creditoDeBetoPorElPrimerCobro] = caja.cobrar(cobroEnEfectivo({ monto: 1000 }));
      const [creditoDeBetoPorElSegundoCobro] = caja.cobrar(cobroEnEfectivo({ monto: 300, asistentes: ["beto"] }));
      const creditosDeBeto = [creditoDeBetoPorElPrimerCobro, creditoDeBetoPorElSegundoCobro];

      const reparto = caja.repartir("beto", dia(5));

      expect(reparto.acreedor()).toBe("beto");
      expect(reparto.fecha()).toEqual(dia(5));
      expect(reparto.monto()).toBe(800);
      expect(reparto.creditos()).toEqual(creditosDeBeto);
      expect(caja.creditosPendientesDe("beto")).toEqual([]);
      expect(caja.montoPendienteDe("carla")).toBe(500);
      expect(caja.repartos()).toEqual([reparto]);
    });

    it("no se puede repartir a quien no tiene créditos pendientes", () => {
      const caja = nuevaCaja();

      expect(() => {
        caja.repartir("beto", dia(5));
      }).toThrow("beto no tiene créditos pendientes");
      expect(caja.repartos()).toEqual([]);
    });
  });

  describe("movimientos", () => {
    it("los movimientos son los cobros y los repartos, en orden cronológico", () => {
      const caja = nuevaCaja();
      caja.cobrar(cobroEnEfectivo({ deudor: "ana", monto: 1000, numero: 3 }));
      caja.repartir("beto", dia(5));
      caja.cobrar(cobroEnEfectivo({ deudor: "dario", monto: 300, numero: 6 }));

      const movimientos = caja.movimientos();

      expect(
        movimientos.map((movimiento) => [
          movimiento.fecha(),
          movimiento.tipo(),
          movimiento.persona(),
          movimiento.monto(),
        ]),
      ).toEqual([
        [dia(3), "cobro", "ana", 1000],
        [dia(5), "reparto", "beto", 500],
        [dia(6), "cobro", "dario", 300],
      ]);
    });

    it("los cobros hechos con créditos no son movimientos", () => {
      const caja = nuevaCaja();
      const [credito] = caja.cobrar(cobroEnEfectivo({ deudor: "ana", monto: 1000, numero: 3, asistentes: ["beto"] }));
      caja.cobrar(cobroConCredito(credito, 400));

      const movimientos = caja.movimientos();

      expect(movimientos.map((movimiento) => [movimiento.tipo(), movimiento.persona()])).toEqual([["cobro", "ana"]]);
    });
  });
});
