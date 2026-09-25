import { describe, expect, it } from "vitest";
import { AlmacenamientoEnMemoria } from "../../src/app/AlmacenamientoEnMemoria.ts";
import { nuevaPlanillaDeAsistencia } from "./factories.ts";

describe("PlanillaDeAsistencia", () => {
  it("mientras no empezó, no tiene asistentes", () => {
    const planilla = nuevaPlanillaDeAsistencia();

    expect(planilla.existe()).toBe(false);
    expect(planilla.asistentes()).toEqual([]);
  });

  it("empezar la planilla la deja empezada, sin asistentes y guardada", () => {
    const almacenamiento = new AlmacenamientoEnMemoria();
    const planilla = nuevaPlanillaDeAsistencia(almacenamiento);

    planilla.empezar();

    expect(planilla.existe()).toBe(true);
    expect(planilla.asistentes()).toEqual([]);
    expect(JSON.parse(almacenamiento.leer()!)).toEqual({ asistentes: [] });
  });

  it("marcar a alguien como presente lo deja entre los asistentes", () => {
    const planilla = nuevaPlanillaDeAsistencia();
    planilla.empezar();

    planilla.marcarComoPresente("ana");

    expect(planilla.asistentes()).toEqual(["ana"]);
    expect(planilla.asiste("ana")).toBe(true);
  });

  it("conservar solo a quienes cumplen un criterio desmarca al resto y deja guardada la planilla", () => {
    const almacenamiento = new AlmacenamientoEnMemoria();
    const planilla = nuevaPlanillaDeAsistencia(almacenamiento);
    planilla.empezar();
    ["ana", "beto", "carla"].forEach((nombre) => planilla.marcarComoPresente(nombre));

    planilla.conservarSoloA((nombre) => nombre !== "beto");

    expect(planilla.asistentes()).toEqual(["ana", "carla"]);
    expect(JSON.parse(almacenamiento.leer()!)).toEqual({ asistentes: ["ana", "carla"] });
  });

  it("no se puede empezar una planilla ya empezada", () => {
    const planilla = nuevaPlanillaDeAsistencia();
    planilla.empezar();
    planilla.marcarComoPresente("ana");

    expect(() => {
      planilla.empezar();
    }).toThrow("Ya hay una planilla de asistencia empezada");
    expect(planilla.asistentes()).toEqual(["ana"]);
  });

  it("no se puede marcar a alguien como presente sin empezar la planilla", () => {
    const almacenamiento = new AlmacenamientoEnMemoria();
    const planilla = nuevaPlanillaDeAsistencia(almacenamiento);

    expect(() => {
      planilla.marcarComoPresente("ana");
    }).toThrow("No hay una planilla de asistencia empezada");
    expect(planilla.existe()).toBe(false);
    expect(almacenamiento.leer()).toBeUndefined();
  });

  it("no se puede desmarcar a alguien como presente sin empezar la planilla", () => {
    const almacenamiento = new AlmacenamientoEnMemoria();
    const planilla = nuevaPlanillaDeAsistencia(almacenamiento);

    expect(() => {
      planilla.desmarcarComoPresente("ana");
    }).toThrow("No hay una planilla de asistencia empezada");
    expect(planilla.existe()).toBe(false);
    expect(almacenamiento.leer()).toBeUndefined();
  });

  it("no se puede conservar solo a algunos asistentes sin empezar la planilla", () => {
    const almacenamiento = new AlmacenamientoEnMemoria();
    const planilla = nuevaPlanillaDeAsistencia(almacenamiento);

    expect(() => {
      planilla.conservarSoloA(() => true);
    }).toThrow("No hay una planilla de asistencia empezada");
    expect(planilla.existe()).toBe(false);
    expect(almacenamiento.leer()).toBeUndefined();
  });

  it("una planilla nueva sobre el mismo almacenamiento recupera la planilla empezada con sus asistentes", () => {
    const almacenamiento = new AlmacenamientoEnMemoria();
    const anterior = nuevaPlanillaDeAsistencia(almacenamiento);
    anterior.empezar();
    anterior.marcarComoPresente("ana");

    const planilla = nuevaPlanillaDeAsistencia(almacenamiento);

    expect(planilla.existe()).toBe(true);
    expect(planilla.asistentes()).toEqual(["ana"]);
  });

  it("una planilla guardada que no se puede leer se ignora y se borra", () => {
    const almacenamiento = new AlmacenamientoEnMemoria();
    almacenamiento.guardar("esto no es JSON");

    const planilla = nuevaPlanillaDeAsistencia(almacenamiento);

    expect(planilla.existe()).toBe(false);
    expect(almacenamiento.leer()).toBeUndefined();
  });

  it("descartar la planilla la vuelve a dejar sin empezar", () => {
    const almacenamiento = new AlmacenamientoEnMemoria();
    const planilla = nuevaPlanillaDeAsistencia(almacenamiento);
    planilla.empezar();
    planilla.marcarComoPresente("ana");

    planilla.descartar();

    expect(planilla.existe()).toBe(false);
    expect(planilla.asistentes()).toEqual([]);
  });

  it("descartar la planilla borra lo guardado", () => {
    const almacenamiento = new AlmacenamientoEnMemoria();
    const planilla = nuevaPlanillaDeAsistencia(almacenamiento);
    planilla.empezar();
    planilla.marcarComoPresente("ana");

    planilla.descartar();

    expect(almacenamiento.leer()).toBeUndefined();
  });
});
