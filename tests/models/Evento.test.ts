import { describe, expect, it } from "vitest";
import { Evento } from "../../src/models/Evento.ts";
import { dia } from "./factories.ts";

describe("Evento", () => {
  it("no puede haber un evento sin asistentes", () => {
    expect(() => {
      new Evento(dia(1), []);
    }).toThrow("Un evento debe tener al menos un asistente");
  });

  it("registra cuándo ocurrió y quiénes asistieron", () => {
    const evento = new Evento(dia(1), ["ana", "beto"]);

    expect(evento.fecha()).toEqual(dia(1));
    expect(evento.asistio("ana")).toBe(true);
    expect(evento.asistio("carla")).toBe(false);
    expect([...evento.asistentes()]).toEqual(["ana", "beto"]);
  });
});
