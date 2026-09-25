import { describe, expect, it } from "vitest";
import { Caja } from "../../src/models/Caja.ts";
import { DesempateAlfabetico } from "../../src/models/Desempate.ts";
import { cobroEnEfectivo, dia } from "./factories.ts";

const nuevaCaja = () => new Caja(new DesempateAlfabetico());

describe("Caja", () => {
  describe("cobros", () => {
    it("un cobro se reparte en créditos iguales entre los asistentes al evento faltado", () => {
      const caja = nuevaCaja();
      const cobro = cobroEnEfectivo({ monto: 1000 });

      const creditos = caja.cobrar(cobro);

      expect(creditos.map((credito) => [credito.acreedor(), credito.monto()])).toEqual([
        ["beto", 500],
        ["carla", 500],
      ]);
      expect(creditos.every((credito) => credito.cobro() === cobro)).toBe(true);
      expect(creditos.every((credito) => credito.estaPendiente())).toBe(true);
      expect(caja.cobros()).toEqual([cobro]);
      expect(caja.creditos()).toEqual(creditos);
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

    it("conoce los créditos pendientes, y su monto, por nombre y en total", () => {
      const caja = nuevaCaja();
      caja.cobrar(cobroEnEfectivo({ monto: 1000 }));
      caja.cobrar(cobroEnEfectivo({ monto: 300, asistentes: ["beto"] }));

      expect(caja.creditosPendientesDe("beto").map((credito) => credito.monto())).toEqual([500, 300]);
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
    it("aplicar un crédito por su monto completo lo deja aplicado", () => {
      const caja = nuevaCaja();
      const [credito] = caja.cobrar(cobroEnEfectivo({ monto: 1000, asistentes: ["beto"] }));

      const aplicado = caja.aplicar(credito, 1000);

      expect(aplicado).toBe(credito);
      expect(credito.estado()).toBe("aplicado");
      expect(caja.montoPendienteDe("beto")).toBe(0);
      expect(caja.creditos()).toEqual([credito]);
    });

    it("aplicar parte de un crédito lo divide en uno aplicado y otro pendiente por el resto", () => {
      const caja = nuevaCaja();
      const cobro = cobroEnEfectivo({ monto: 1000, asistentes: ["beto"] });
      const [credito] = caja.cobrar(cobro);

      const aplicado = caja.aplicar(credito, 400);

      expect(aplicado.monto()).toBe(400);
      expect(aplicado.estado()).toBe("aplicado");
      expect(aplicado.cobro()).toBe(cobro);
      expect(caja.montoPendienteDe("beto")).toBe(600);
      expect(caja.creditos().map((credito) => [credito.monto(), credito.estado()])).toEqual([
        [400, "aplicado"],
        [600, "cobrado"],
      ]);
    });

    it("no se puede aplicar un crédito que no es de la caja", () => {
      const caja = nuevaCaja();
      const [credito] = nuevaCaja().cobrar(cobroEnEfectivo({ asistentes: ["beto"] }));

      expect(() => {
        caja.aplicar(credito, 1000);
      }).toThrow("El crédito no es de esta caja");
    });

    it("no se puede aplicar más que el monto del crédito", () => {
      const caja = nuevaCaja();
      const [credito] = caja.cobrar(cobroEnEfectivo({ monto: 1000, asistentes: ["beto"] }));

      expect(() => {
        caja.aplicar(credito, 1001);
      }).toThrow("El monto a aplicar no puede superar el del crédito");
      expect(credito.estaPendiente()).toBe(true);
    });
  });

  describe("repartos", () => {
    it("repartir entrega de una vez todos los créditos pendientes de una persona", () => {
      const caja = nuevaCaja();
      caja.cobrar(cobroEnEfectivo({ monto: 1000 }));
      caja.cobrar(cobroEnEfectivo({ monto: 300, asistentes: ["beto"] }));
      const creditosDeBeto = caja.creditosPendientesDe("beto");

      const reparto = caja.repartir("beto", dia(5));

      expect(reparto.acreedor()).toBe("beto");
      expect(reparto.fecha()).toEqual(dia(5));
      expect(reparto.monto()).toBe(800);
      expect(reparto.creditos()).toEqual(creditosDeBeto);
      expect(creditosDeBeto.every((credito) => credito.estado() === "repartido")).toBe(true);
      expect(caja.montoPendienteDe("beto")).toBe(0);
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
});
