import { describe, expect, it } from "vitest";
import { AlmacenamientoEnMemoria } from "../../src/app/AlmacenamientoEnMemoria.ts";
import { PlanillaDeAsistencia } from "../../src/app/PlanillaDeAsistencia.ts";

describe("PlanillaDeAsistencia", () => {
  it("una planilla nueva queda guardada con sus asistentes", () => {
    const almacenamiento = new AlmacenamientoEnMemoria();

    const planilla = new PlanillaDeAsistencia(almacenamiento, ["ana"]);

    expect(planilla.asistentes()).toEqual(["ana"]);
    expect(JSON.parse(almacenamiento.leer()!)).toEqual({ asistentes: ["ana"] });
  });

  it("marcar a alguien como presente lo deja entre los asistentes", () => {
    const planilla = new PlanillaDeAsistencia(new AlmacenamientoEnMemoria(), []);

    planilla.marcarComoPresente("ana");

    expect(planilla.asistentes()).toEqual(["ana"]);
    expect(planilla.asiste("ana")).toBe(true);
  });

  it("desmarcar a alguien como presente lo saca de los asistentes", () => {
    const planilla = new PlanillaDeAsistencia(new AlmacenamientoEnMemoria(), ["ana", "beto"]);

    planilla.desmarcarComoPresente("ana");

    expect(planilla.asistentes()).toEqual(["beto"]);
    expect(planilla.asiste("ana")).toBe(false);
  });

  it("conservar solo a quienes cumplen un criterio desmarca al resto y deja guardada la planilla", () => {
    const almacenamiento = new AlmacenamientoEnMemoria();
    const planilla = new PlanillaDeAsistencia(almacenamiento, ["ana", "beto", "carla"]);

    planilla.conservarSoloA((nombre) => nombre !== "beto");

    expect(planilla.asistentes()).toEqual(["ana", "carla"]);
    expect(JSON.parse(almacenamiento.leer()!)).toEqual({ asistentes: ["ana", "carla"] });
  });

  it("sin nada guardado no hay planilla", () => {
    const almacenamiento = new AlmacenamientoEnMemoria();

    const planilla = PlanillaDeAsistencia.guardadaEn(almacenamiento);

    expect(planilla).toBeUndefined();
  });

  it("la planilla guardada se recupera con sus asistentes", () => {
    const almacenamiento = new AlmacenamientoEnMemoria();
    new PlanillaDeAsistencia(almacenamiento, []).marcarComoPresente("ana");

    const planilla = PlanillaDeAsistencia.guardadaEn(almacenamiento);

    expect(planilla?.asistentes()).toEqual(["ana"]);
  });

  it("una planilla guardada que no se puede leer se ignora y se borra", () => {
    const almacenamiento = new AlmacenamientoEnMemoria();
    almacenamiento.guardar("esto no es JSON");

    const planilla = PlanillaDeAsistencia.guardadaEn(almacenamiento);

    expect(planilla).toBeUndefined();
    expect(almacenamiento.leer()).toBeUndefined();
  });

  it("descartar la planilla borra lo guardado", () => {
    const almacenamiento = new AlmacenamientoEnMemoria();
    const planilla = new PlanillaDeAsistencia(almacenamiento, ["ana"]);

    planilla.descartar();

    expect(almacenamiento.leer()).toBeUndefined();
  });
});
