import { describe, expect, it } from "vitest";
import { Deuda } from "../../src/models/Deuda.ts";
import { dia, nuevoEvento } from "./factories.ts";
import { InteresFijoPorDia } from "../../src/models/PoliticaDeInteres.ts";

const montoPorFalta = 1000;
const interesDiario = 10;

const nuevaDeuda = (evento = nuevoEvento()) => new Deuda(montoPorFalta, evento, new InteresFijoPorDia(interesDiario));

describe("Deuda", () => {
  it("se origina por faltar a un evento, por un monto, y no nace en mora", () => {
    const evento = nuevoEvento();
    const deuda = nuevaDeuda(evento);

    expect(deuda.monto()).toBe(montoPorFalta);
    expect(deuda.eventoFaltado()).toBe(evento);
    expect(deuda.estaEnMora()).toBe(false);
  });

  it("mientras no está en mora, vale el monto original en cualquier fecha", () => {
    const deuda = nuevaDeuda();

    expect(deuda.montoAl(dia(20))).toBe(montoPorFalta);
  });

  it("en mora, acumula interés desde la fecha en que entró en mora", () => {
    const deuda = nuevaDeuda();

    deuda.entrarEnMora(dia(8));

    expect(deuda.estaEnMora()).toBe(true);
    expect(deuda.montoAl(dia(8))).toBe(montoPorFalta);
    expect(deuda.montoAl(dia(11))).toBe(montoPorFalta + 3 * interesDiario);
  });

  it("no puede entrar en mora dos veces", () => {
    const deuda = nuevaDeuda();
    deuda.entrarEnMora(dia(8));

    expect(() => deuda.entrarEnMora(dia(9))).toThrow("La deuda ya está en mora");
    expect(deuda.montoAl(dia(11))).toBe(montoPorFalta + 3 * interesDiario);
  });

  describe("pagos", () => {
    it("un pago parcial reduce la deuda por el monto pagado", () => {
      const deuda = nuevaDeuda();

      deuda.pagar(dia(3), 400);

      expect(deuda.estaSaldada()).toBe(false);
      expect(deuda.montoAl(dia(5))).toBe(600);
    });

    it("pagar el total la salda", () => {
      const deuda = nuevaDeuda();

      deuda.pagar(dia(3), montoPorFalta);

      expect(deuda.estaSaldada()).toBe(true);
      expect(deuda.montoAl(dia(5))).toBe(0);
    });

    it("no se puede pagar más de lo que vale la deuda a esa fecha", () => {
      const deuda = nuevaDeuda();

      expect(() => {
        deuda.pagar(dia(3), montoPorFalta + 1);
      }).toThrow("El pago no puede superar la deuda");
      expect(deuda.montoAl(dia(3))).toBe(montoPorFalta);
    });

    it("el monto de un pago debe ser positivo", () => {
      const deuda = nuevaDeuda();

      expect(() => {
        deuda.pagar(dia(3), 0);
      }).toThrow("El monto del pago debe ser positivo");
      expect(() => {
        deuda.pagar(dia(3), -100);
      }).toThrow("El monto del pago debe ser positivo");
      expect(deuda.montoAl(dia(3))).toBe(montoPorFalta);
    });

    it("en mora, el pago se descuenta del valor con interés a esa fecha, y el interés vuelve a correr desde el pago", () => {
      const deuda = nuevaDeuda();
      deuda.entrarEnMora(dia(8));

      deuda.pagar(dia(11), 530);

      expect(deuda.montoAl(dia(11))).toBe(500);
      expect(deuda.montoAl(dia(14))).toBe(500 + 3 * interesDiario);
    });

    it("en mora, se puede saldar pagando el valor con interés a esa fecha", () => {
      const deuda = nuevaDeuda();
      deuda.entrarEnMora(dia(8));

      deuda.pagar(dia(11), montoPorFalta + 3 * interesDiario);

      expect(deuda.estaSaldada()).toBe(true);
      expect(deuda.montoAl(dia(20))).toBe(0);
    });

    it("no se puede pagar en una fecha anterior al último pago", () => {
      const deuda = nuevaDeuda();
      deuda.pagar(dia(5), 400);

      expect(() => {
        deuda.pagar(dia(4), 100);
      }).toThrow("El pago no puede ser anterior al último pago");
      expect(deuda.montoAl(dia(5))).toBe(600);
    });
  });
});
