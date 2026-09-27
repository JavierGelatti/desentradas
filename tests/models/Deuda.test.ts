import { describe, expect, it } from "vitest";
import { Deuda } from "../../src/models/Deuda.ts";
import { dia, nuevoEncuentro } from "./factories.ts";
import { InteresFijoPorDia } from "../../src/models/PoliticaDeInteres.ts";

const montoPorFalta = 1000;
const interesDiario = 10;

const nuevaDeuda = (encuentro = nuevoEncuentro()) =>
  new Deuda(montoPorFalta, encuentro, new InteresFijoPorDia(interesDiario));

describe("Deuda", () => {
  it("se origina por faltar a un encuentro, por un monto", () => {
    const encuentro = nuevoEncuentro();
    const deuda = nuevaDeuda(encuentro);

    expect(deuda.monto()).toBe(montoPorFalta);
    expect(deuda.encuentroFaltado()).toBe(encuentro);
  });

  it("con interés, acumula desde la fecha indicada", () => {
    const deuda = nuevaDeuda();

    const montoAlComenzar = deuda.montoConInteres(dia(8), dia(8));
    const montoTresDiasDespues = deuda.montoConInteres(dia(8), dia(11));

    expect(montoAlComenzar).toBe(montoPorFalta);
    expect(montoTresDiasDespues).toBe(montoPorFalta + 3 * interesDiario);
  });

  it("con interés, antes de la fecha indicada vale el monto original", () => {
    const deuda = nuevaDeuda();

    const monto = deuda.montoConInteres(dia(8), dia(5));

    expect(monto).toBe(montoPorFalta);
  });

  describe("pagos", () => {
    it("un pago parcial reduce la deuda por el monto pagado", () => {
      const deuda = nuevaDeuda();

      deuda.pagar(dia(3), 400);

      expect(deuda.estaSaldada()).toBe(false);
      expect(deuda.monto()).toBe(600);
    });

    it("pagar el total la salda", () => {
      const deuda = nuevaDeuda();

      deuda.pagar(dia(3), montoPorFalta);

      expect(deuda.estaSaldada()).toBe(true);
      expect(deuda.monto()).toBe(0);
    });

    it("no se puede pagar más de lo que vale la deuda", () => {
      const deuda = nuevaDeuda();

      expect(() => {
        deuda.pagar(dia(3), montoPorFalta + 1);
      }).toThrow("El pago no puede superar la deuda");
      expect(deuda.monto()).toBe(montoPorFalta);
    });

    it("el monto de un pago debe ser positivo", () => {
      const deuda = nuevaDeuda();

      expect(() => {
        deuda.pagar(dia(3), 0);
      }).toThrow("El monto del pago debe ser positivo");
      expect(() => {
        deuda.pagar(dia(3), -100);
      }).toThrow("El monto del pago debe ser positivo");
      expect(deuda.monto()).toBe(montoPorFalta);
    });

    it("un pago con interés capitaliza el interés devengado hasta esa fecha", () => {
      const deuda = nuevaDeuda();

      deuda.pagarConInteres(dia(8), dia(11), 530);

      expect(deuda.monto()).toBe(500);
    });

    it("no se puede pagar con interés más de lo que vale la deuda con interés a esa fecha", () => {
      const deuda = nuevaDeuda();

      expect(() => {
        deuda.pagarConInteres(dia(8), dia(11), montoPorFalta + 3 * interesDiario + 1);
      }).toThrow("El pago no puede superar la deuda");
      expect(deuda.monto()).toBe(montoPorFalta);
    });

    it("se puede saldar pagando con interés el valor con interés a esa fecha", () => {
      const deuda = nuevaDeuda();

      deuda.pagarConInteres(dia(8), dia(11), montoPorFalta + 3 * interesDiario);

      expect(deuda.estaSaldada()).toBe(true);
    });

    it("no se puede pagar en una fecha anterior al encuentro faltado", () => {
      const deuda = nuevaDeuda(nuevoEncuentro({ numero: 9 }));

      expect(() => {
        deuda.pagar(dia(8), 100);
      }).toThrow("El cobro no puede ser anterior al encuentro faltado");
    });
  });
});
