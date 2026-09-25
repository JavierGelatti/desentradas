import { describe, expect, it } from "vitest";
import { AlmacenamientoEnMemoria } from "../../src/app/AlmacenamientoEnMemoria.ts";
import { dia } from "../models/factories.ts";
import { nuevoBorrador } from "./factories.ts";

describe("BorradorDeEvento", () => {
  it("mientras no empezó, su fecha es la de ahora y no tiene asistentes", () => {
    const borrador = nuevoBorrador();

    expect(borrador.existe()).toBe(false);
    expect(borrador.fecha()).toEqual(dia(5));
    expect(borrador.asistentes()).toEqual([]);
  });

  it("marcar a alguien empieza el borrador con la fecha que mostraba", () => {
    const almacenamiento = new AlmacenamientoEnMemoria();
    let momento = dia(5);
    const borrador = nuevoBorrador(almacenamiento, () => momento);

    borrador.marcar("ana");
    momento = dia(6);

    expect(borrador.existe()).toBe(true);
    expect(borrador.fecha()).toEqual(dia(5));
    expect(borrador.asistentes()).toEqual(["ana"]);
    expect(borrador.asiste("ana")).toBe(true);
  });

  it("el borrador empezado queda guardado", () => {
    const almacenamiento = new AlmacenamientoEnMemoria();
    let momento = dia(5);
    const borrador = nuevoBorrador(almacenamiento, () => momento);

    borrador.marcar("ana");
    momento = dia(6);

    expect(JSON.parse(almacenamiento.leer()!)).toEqual({ fecha: dia(5).toISOString(), asistentes: ["ana"] });
  });

  it("un borrador nuevo sobre el mismo almacenamiento recupera la fecha y los asistentes guardados", () => {
    const almacenamiento = new AlmacenamientoEnMemoria();
    const anterior = nuevoBorrador(almacenamiento);
    anterior.marcar("ana");
    anterior.cambiarFecha(dia(6));

    const borrador = nuevoBorrador(almacenamiento);

    expect(borrador.existe()).toBe(true);
    expect(borrador.fecha()).toEqual(dia(6));
    expect(borrador.asistentes()).toEqual(["ana"]);
  });

  it("un borrador guardado que no se puede leer se ignora y se borra", () => {
    const almacenamiento = new AlmacenamientoEnMemoria();
    almacenamiento.guardar("esto no es JSON");

    const borrador = nuevoBorrador(almacenamiento);

    expect(borrador.existe()).toBe(false);
    expect(almacenamiento.leer()).toBeUndefined();
  });

  it("descartar el borrador lo vuelve a dejar sin empezar", () => {
    const almacenamiento = new AlmacenamientoEnMemoria();
    const borrador = nuevoBorrador(almacenamiento);
    borrador.marcar("ana");
    borrador.cambiarFecha(dia(6));

    borrador.descartar();

    expect(borrador.existe()).toBe(false);
    expect(borrador.fecha()).toEqual(dia(5));
    expect(borrador.asistentes()).toEqual([]);
  });

  it("descartar el borrador borra lo guardado", () => {
    const almacenamiento = new AlmacenamientoEnMemoria();
    const borrador = nuevoBorrador(almacenamiento);
    borrador.marcar("ana");
    borrador.cambiarFecha(dia(6));

    borrador.descartar();

    expect(almacenamiento.leer()).toBeUndefined();
  });
});
