import { describe, expect, it } from "vitest";
import { AlmacenamientoEnMemoria } from "../../src/app/AlmacenamientoEnMemoria.ts";
import { Aplicacion } from "../../src/app/Aplicacion.ts";
import { CerrarEvento } from "../../src/app/comandos/CerrarEvento.ts";
import { CrearGrupo } from "../../src/app/comandos/CrearGrupo.ts";
import { Ingresar } from "../../src/app/comandos/Ingresar.ts";
import { reglasAJson } from "../../src/app/json/ReglasJson.ts";
import { desempate, dia, reglas } from "../models/factories.ts";

const nuevaAplicacion = (almacenamiento = new AlmacenamientoEnMemoria()) => new Aplicacion(almacenamiento, desempate);

const aplicacionConGrupo = (almacenamiento = new AlmacenamientoEnMemoria()) => {
  const aplicacion = nuevaAplicacion(almacenamiento);
  aplicacion.crearGrupo("Fútbol de los jueves", reglas());
  return aplicacion;
};

const aplicacionConDeudaDeAna = (almacenamiento = new AlmacenamientoEnMemoria()) => {
  const aplicacion = aplicacionConGrupo(almacenamiento);
  aplicacion.ingresar("ana", dia(1));
  aplicacion.ingresar("beto", dia(1));
  aplicacion.cerrarEvento(dia(2), ["beto"]);
  return aplicacion;
};

describe("Aplicacion", () => {
  describe("creación del grupo", () => {
    it("una aplicación nueva no tiene grupo", () => {
      const aplicacion = nuevaAplicacion();

      expect(aplicacion.tieneGrupo()).toBe(false);
    });

    it("crear grupo deja el grupo creado con su nombre y sus reglas iniciales", () => {
      const aplicacion = nuevaAplicacion();
      const reglasIniciales = reglas();

      aplicacion.crearGrupo("Fútbol de los jueves", reglasIniciales);

      expect(aplicacion.tieneGrupo()).toBe(true);
      expect(aplicacion.nombreDelGrupo()).toBe("Fútbol de los jueves");
      expect(aplicacion.grupo().reglas()).toBe(reglasIniciales);
    });
  });

  describe("persistencia", () => {
    it("cada comando ejecutado deja guardada la bitácora", () => {
      const almacenamiento = new AlmacenamientoEnMemoria();
      const aplicacion = nuevaAplicacion(almacenamiento);

      aplicacion.crearGrupo("Fútbol de los jueves", reglas());

      expect(almacenamiento.leer()).toBe(aplicacion.exportar());
    });

    it("al iniciar se carga la bitácora guardada", () => {
      const almacenamiento = new AlmacenamientoEnMemoria();
      nuevaAplicacion(almacenamiento).crearGrupo("Fútbol de los jueves", reglas());

      const aplicacion = nuevaAplicacion(almacenamiento);

      expect(aplicacion.tieneGrupo()).toBe(true);
      expect(aplicacion.nombreDelGrupo()).toBe("Fútbol de los jueves");
      expect(aplicacion.avisoDeInicio()).toBeUndefined();
    });

    it("si lo guardado no se puede leer, se empieza sin grupo y se avisa que se ignoró", () => {
      const almacenamiento = new AlmacenamientoEnMemoria();
      almacenamiento.guardar("esto no es JSON");

      const aplicacion = nuevaAplicacion(almacenamiento);

      expect(aplicacion.tieneGrupo()).toBe(false);
      expect(aplicacion.avisoDeInicio()).toBe("Los datos guardados no se pudieron leer y se ignoraron");
    });

    it("si lo guardado tiene un comando que el grupo rechaza, se empieza sin grupo y se avisa que se ignoró", () => {
      const almacenamiento = new AlmacenamientoEnMemoria();
      almacenamiento.guardar(
        JSON.stringify({
          version: 1,
          comandos: [{ tipo: "ingresar", nombre: "ana", fecha: dia(1).toISOString() }],
        }),
      );

      const aplicacion = nuevaAplicacion(almacenamiento);

      expect(aplicacion.tieneGrupo()).toBe(false);
      expect(aplicacion.avisoDeInicio()).toBe("Los datos guardados no se pudieron leer y se ignoraron");
    });

    it("un comando que el grupo rechaza no modifica lo guardado", () => {
      const almacenamiento = new AlmacenamientoEnMemoria();
      const aplicacion = aplicacionConGrupo(almacenamiento);
      aplicacion.ingresar("ana", dia(1));
      const guardadoAntes = almacenamiento.leer();

      expect(() => {
        aplicacion.ingresar("ana", dia(2));
      }).toThrow("ana ya tiene una participación activa");
      expect(almacenamiento.leer()).toBe(guardadoAntes);
    });
  });

  describe("comandos", () => {
    it("ingresar hace ingresar a la persona al grupo", () => {
      const aplicacion = aplicacionConGrupo();

      aplicacion.ingresar("ana", dia(1));

      expect(aplicacion.grupo().participanteActivo("ana")).toBeDefined();
    });

    it("cerrar evento registra el evento con sus asistentes en el grupo", () => {
      const aplicacion = aplicacionConGrupo();
      aplicacion.ingresar("ana", dia(1));
      aplicacion.ingresar("beto", dia(1));

      aplicacion.cerrarEvento(dia(2), ["beto"]);

      expect(aplicacion.grupo().eventos()).toHaveLength(1);
      expect(aplicacion.grupo().participanteActivo("ana")?.estado()).toBe("en deuda");
    });

    it("cobrar registra el pago de la persona en el grupo", () => {
      const aplicacion = aplicacionConDeudaDeAna();

      aplicacion.cobrar("ana", 400, dia(3));

      expect(aplicacion.grupo().participanteActivo("ana")?.deudaAl(dia(3))).toBe(600);
    });

    it("repartir entrega los créditos pendientes de la persona", () => {
      const aplicacion = aplicacionConDeudaDeAna();
      aplicacion.cobrar("ana", 1000, dia(3));

      aplicacion.repartir("beto", dia(4));

      expect(aplicacion.grupo().caja().montoPendienteDe("beto")).toBe(0);
      expect(aplicacion.grupo().caja().repartos()).toHaveLength(1);
    });

    it("reingresar hace reingresar a la persona al grupo", () => {
      const aplicacion = aplicacionConDeudaDeAna();
      aplicacion.cerrarEvento(dia(9), ["beto"]);
      aplicacion.cobrar("ana", 1000, dia(10));
      expect(aplicacion.grupo().participanteActivo("ana")).toBeUndefined();

      aplicacion.reingresar("ana", dia(11));

      expect(aplicacion.grupo().participanteActivo("ana")?.estado()).toBe("participando");
    });

    it("cambiar reglas cambia las reglas del grupo", () => {
      const aplicacion = aplicacionConGrupo();
      const nuevasReglas = reglas({ rigeDesde: dia(4) });

      aplicacion.cambiarReglas(nuevasReglas);

      expect(aplicacion.grupo().reglas()).toBe(nuevasReglas);
    });
  });

  describe("historial", () => {
    it("comandos devuelve los comandos ejecutados en orden, empezando por la creación del grupo", () => {
      const aplicacion = aplicacionConGrupo();

      aplicacion.ingresar("ana", dia(1));

      const comandos = aplicacion.comandos();
      expect(comandos).toHaveLength(2);
      expect(comandos[0]).toBeInstanceOf(CrearGrupo);
      expect(comandos[1]).toBeInstanceOf(Ingresar);
    });
  });

  describe("deshacer", () => {
    it("deshacer devuelve el último comando, reconstruye el grupo sin él y deja guardada la bitácora", () => {
      const almacenamiento = new AlmacenamientoEnMemoria();
      const aplicacion = aplicacionConDeudaDeAna(almacenamiento);

      const deshecho = aplicacion.deshacer();

      expect(deshecho).toBeInstanceOf(CerrarEvento);
      expect(aplicacion.grupo().eventos()).toEqual([]);
      expect(almacenamiento.leer()).toBe(aplicacion.exportar());
      expect(aplicacion.ultimoComando()).toBeInstanceOf(Ingresar);
    });

    it("se puede deshacer mientras haya comandos, incluida la creación del grupo", () => {
      const aplicacion = aplicacionConGrupo();
      expect(aplicacion.puedeDeshacer()).toBe(true);

      aplicacion.deshacer();

      expect(aplicacion.tieneGrupo()).toBe(false);
      expect(aplicacion.puedeDeshacer()).toBe(false);
      expect(aplicacion.ultimoComando()).toBeUndefined();
    });
  });

  describe("exportar e importar", () => {
    it("exportar devuelve la bitácora en formato JSON", () => {
      const aplicacion = aplicacionConGrupo();
      aplicacion.ingresar("ana", dia(1));

      const texto = aplicacion.exportar();

      expect(JSON.parse(texto)).toEqual({
        version: 1,
        comandos: [
          { tipo: "crear grupo", nombreDelGrupo: "Fútbol de los jueves", reglas: reglasAJson(reglas()) },
          { tipo: "ingresar", nombre: "ana", fecha: dia(1).toISOString() },
        ],
      });
    });

    it("importar reemplaza la bitácora por la importada y la deja guardada", () => {
      const exportado = aplicacionConDeudaDeAna().exportar();
      const almacenamiento = new AlmacenamientoEnMemoria();
      const aplicacion = aplicacionConGrupo(almacenamiento);
      aplicacion.ingresar("carla", dia(1));

      aplicacion.importar(exportado);

      expect(aplicacion.exportar()).toBe(exportado);
      expect(aplicacion.grupo().participanteActivo("carla")).toBeUndefined();
      expect(aplicacion.grupo().participanteActivo("ana")?.estado()).toBe("en deuda");
      expect(almacenamiento.leer()).toBe(exportado);
    });

    it("no se puede importar un texto que no es una bitácora", () => {
      const almacenamiento = new AlmacenamientoEnMemoria();
      const aplicacion = aplicacionConGrupo(almacenamiento);
      const exportadoAntes = aplicacion.exportar();

      expect(() => {
        aplicacion.importar("esto no es JSON");
      }).toThrow();
      expect(aplicacion.exportar()).toBe(exportadoAntes);
      expect(almacenamiento.leer()).toBe(exportadoAntes);
    });

    it("no se puede importar una bitácora con un comando que el grupo rechaza", () => {
      const almacenamiento = new AlmacenamientoEnMemoria();
      const aplicacion = aplicacionConGrupo(almacenamiento);
      const exportadoAntes = aplicacion.exportar();
      const invalida = JSON.parse(exportadoAntes);
      invalida.comandos.push({ tipo: "cobrar", nombre: "ana", monto: 1000, fecha: dia(3).toISOString() });

      expect(() => {
        aplicacion.importar(JSON.stringify(invalida));
      }).toThrow("ana no tiene una participación activa");
      expect(aplicacion.exportar()).toBe(exportadoAntes);
      expect(almacenamiento.leer()).toBe(exportadoAntes);
    });
  });
});
