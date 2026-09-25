import { describe, expect, it } from "vitest";
import { AlmacenamientoEnMemoria } from "../../src/app/AlmacenamientoEnMemoria.ts";
import { AlmacenamientoEnStorage } from "../../src/app/AlmacenamientoEnStorage.ts";

describe("AlmacenamientoEnMemoria", () => {
  it("al empezar no tiene nada guardado", () => {
    const almacenamiento = new AlmacenamientoEnMemoria();

    expect(almacenamiento.leer()).toBeUndefined();
  });

  it("lee lo último que se guardó", () => {
    const almacenamiento = new AlmacenamientoEnMemoria();

    almacenamiento.guardar("primero");
    almacenamiento.guardar("segundo");

    expect(almacenamiento.leer()).toBe("segundo");
  });

  it("después de borrar no tiene nada guardado", () => {
    const almacenamiento = new AlmacenamientoEnMemoria();
    almacenamiento.guardar("texto");

    almacenamiento.borrar();

    expect(almacenamiento.leer()).toBeUndefined();
  });
});

const storageFalso = () => {
  const guardado = new Map<string, string>();
  return {
    getItem: (clave: string) => guardado.get(clave) ?? null,
    setItem: (clave: string, valor: string) => guardado.set(clave, valor),
    removeItem: (clave: string) => guardado.delete(clave),
    guardado,
  };
};

describe("AlmacenamientoEnStorage", () => {
  it("guarda el texto en el storage bajo su clave", () => {
    const storage = storageFalso();
    const almacenamiento = new AlmacenamientoEnStorage(storage, "bitácora");

    almacenamiento.guardar("texto");

    expect(storage.guardado.get("bitácora")).toBe("texto");
  });

  it("lee lo que el storage tiene bajo su clave", () => {
    const storage = storageFalso();
    storage.setItem("bitácora", "texto");
    const almacenamiento = new AlmacenamientoEnStorage(storage, "bitácora");

    expect(almacenamiento.leer()).toBe("texto");
  });

  it("borrar quita lo que el storage tiene bajo su clave", () => {
    const storage = storageFalso();
    storage.setItem("bitácora", "texto");
    const almacenamiento = new AlmacenamientoEnStorage(storage, "bitácora");

    almacenamiento.borrar();

    expect(storage.guardado.has("bitácora")).toBe(false);
  });

  it("no tiene nada guardado si el storage no tiene nada bajo su clave", () => {
    const almacenamiento = new AlmacenamientoEnStorage(storageFalso(), "bitácora");

    expect(almacenamiento.leer()).toBeUndefined();
  });
});
