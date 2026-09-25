import { describe, expect, it } from "vitest";
import { AlmacenamientoEnMemoria } from "../../src/app/AlmacenamientoEnMemoria.ts";
import { dia } from "../models/factories.ts";
import { nuevaPlanillaDeAsistencia } from "./factories.ts";

describe("PlanillaDeAsistencia", () => {
  it("mientras no empezó, su fecha es la de ahora y no tiene asistentes", () => {
    const planilla = nuevaPlanillaDeAsistencia();

    expect(planilla.existe()).toBe(false);
    expect(planilla.fecha()).toEqual(dia(5));
    expect(planilla.asistentes()).toEqual([]);
  });

  it("marcar a alguien como presente empieza la planilla con la fecha que mostraba", () => {
    const almacenamiento = new AlmacenamientoEnMemoria();
    let momento = dia(5);
    const planilla = nuevaPlanillaDeAsistencia(almacenamiento, () => momento);

    planilla.marcarComoPresente("ana");
    momento = dia(6);

    expect(planilla.existe()).toBe(true);
    expect(planilla.fecha()).toEqual(dia(5));
    expect(planilla.asistentes()).toEqual(["ana"]);
    expect(planilla.asiste("ana")).toBe(true);
  });

  it("la planilla empezada queda guardada", () => {
    const almacenamiento = new AlmacenamientoEnMemoria();
    let momento = dia(5);
    const planilla = nuevaPlanillaDeAsistencia(almacenamiento, () => momento);

    planilla.marcarComoPresente("ana");
    momento = dia(6);

    expect(JSON.parse(almacenamiento.leer()!)).toEqual({ fecha: dia(5).toISOString(), asistentes: ["ana"] });
  });

  it("una planilla nueva sobre el mismo almacenamiento recupera la fecha y los asistentes guardados", () => {
    const almacenamiento = new AlmacenamientoEnMemoria();
    const anterior = nuevaPlanillaDeAsistencia(almacenamiento);
    anterior.marcarComoPresente("ana");
    anterior.cambiarFecha(dia(6));

    const planilla = nuevaPlanillaDeAsistencia(almacenamiento);

    expect(planilla.existe()).toBe(true);
    expect(planilla.fecha()).toEqual(dia(6));
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
    planilla.marcarComoPresente("ana");
    planilla.cambiarFecha(dia(6));

    planilla.descartar();

    expect(planilla.existe()).toBe(false);
    expect(planilla.fecha()).toEqual(dia(5));
    expect(planilla.asistentes()).toEqual([]);
  });

  it("descartar la planilla borra lo guardado", () => {
    const almacenamiento = new AlmacenamientoEnMemoria();
    const planilla = nuevaPlanillaDeAsistencia(almacenamiento);
    planilla.marcarComoPresente("ana");
    planilla.cambiarFecha(dia(6));

    planilla.descartar();

    expect(almacenamiento.leer()).toBeUndefined();
  });
});
