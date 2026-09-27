import { describe, expect, it } from "vitest";
import { AlmacenamientoEnMemoria } from "../../src/app/AlmacenamientoEnMemoria.ts";
import { CrearGrupo } from "../../src/app/comandos/CrearGrupo.ts";
import { Cobrar } from "../../src/app/comandos/Cobrar.ts";
import { Ingresar } from "../../src/app/comandos/Ingresar.ts";
import { Reingresar } from "../../src/app/comandos/Reingresar.ts";
import { RegistrarEncuentro } from "../../src/app/comandos/RegistrarEncuentro.ts";
import { reglasAJson } from "../../src/app/json/ReglasJson.ts";
import { dia, reglas } from "../models/factories.ts";
import { type Almacenamientos, aplicacionConGrupo, nuevaAplicacion } from "./factories.ts";

const aplicacionConAnaYBeto = (almacenamientos: Almacenamientos = {}) => {
  const aplicacion = aplicacionConGrupo(almacenamientos);
  aplicacion.ingresar("ana", dia(1));
  aplicacion.ingresar("beto", dia(1));
  return aplicacion;
};

const aplicacionConDeudaDeAna = (almacenamientos: Almacenamientos = {}) => {
  const aplicacion = aplicacionConAnaYBeto(almacenamientos);
  aplicacion.registrarEncuentro(dia(2), ["beto"], ["ana"]);
  return aplicacion;
};

const aplicacionConAnaMorosa = () => {
  const aplicacion = aplicacionConDeudaDeAna();
  aplicacion.registrarEncuentro(dia(3), ["beto"], ["ana"]);
  return aplicacion;
};

const aplicacionConAnaFinalizada = () => {
  const aplicacion = aplicacionConAnaMorosa();
  aplicacion.cobrar("ana", 1000, dia(4));
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
      expect(aplicacion.grupo().nombre()).toBe("Fútbol de los jueves");
      expect(aplicacion.grupo().reglas()).toBe(reglasIniciales);
    });
  });

  describe("persistencia", () => {
    it("cada comando ejecutado deja guardada la bitácora", () => {
      const almacenamiento = new AlmacenamientoEnMemoria();
      const aplicacion = nuevaAplicacion({ bitacora: almacenamiento });

      aplicacion.crearGrupo("Fútbol de los jueves", reglas());

      expect(almacenamiento.leer()).toBe(aplicacion.exportar());
    });

    it("al iniciar se carga la bitácora guardada", () => {
      const almacenamiento = new AlmacenamientoEnMemoria();
      nuevaAplicacion({ bitacora: almacenamiento }).crearGrupo("Fútbol de los jueves", reglas());

      const aplicacion = nuevaAplicacion({ bitacora: almacenamiento });

      expect(aplicacion.tieneGrupo()).toBe(true);
      expect(aplicacion.grupo().nombre()).toBe("Fútbol de los jueves");
      expect(aplicacion.avisoDeInicio()).toBeUndefined();
    });

    it("si lo guardado no se puede leer, se empieza sin grupo y se avisa que se ignoró", () => {
      const almacenamiento = new AlmacenamientoEnMemoria();
      almacenamiento.guardar("esto no es JSON");

      const aplicacion = nuevaAplicacion({ bitacora: almacenamiento });

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

      const aplicacion = nuevaAplicacion({ bitacora: almacenamiento });

      expect(aplicacion.tieneGrupo()).toBe(false);
      expect(aplicacion.avisoDeInicio()).toBe("Los datos guardados no se pudieron leer y se ignoraron");
    });

    it("un comando que el grupo rechaza no modifica lo guardado", () => {
      const almacenamiento = new AlmacenamientoEnMemoria();
      const aplicacion = aplicacionConGrupo({ bitacora: almacenamiento });
      aplicacion.ingresar("ana", dia(1));
      const guardadoAntes = almacenamiento.leer();

      expect(() => {
        aplicacion.ingresar("ana", dia(2));
      }).toThrow("ana ya tiene una participación activa");
      expect(almacenamiento.leer()).toBe(guardadoAntes);
    });
  });

  describe("comandos", () => {
    it("ingresar deja a la persona como participante activo del grupo", () => {
      const aplicacion = aplicacionConGrupo();

      aplicacion.ingresar("ana", dia(1));

      expect(aplicacion.grupo().participanteActivo("ana")).toBeDefined();
    });

    it("registrar encuentro registra el encuentro con sus asistentes en el grupo", () => {
      const aplicacion = aplicacionConAnaYBeto();

      aplicacion.registrarEncuentro(dia(2), ["beto"], ["ana"]);

      expect(aplicacion.grupo().encuentros()).toHaveLength(1);
      expect(aplicacion.grupo().participanteActivo("ana")?.estado()).toBe("en deuda");
    });

    it("cobrar registra el cobro a la persona en el grupo", () => {
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

    it("reingresar vuelve a dejar como participante activo a quien ya participó", () => {
      const aplicacion = aplicacionConAnaFinalizada();

      aplicacion.reingresar("ana", dia(11));

      expect(aplicacion.grupo().participanteActivo("ana")?.estado()).toBe("participando");
    });

    it("cobrar y reingresar a un moroso que paga toda su deuda lo deja participando, con un cobro y un reingreso en el historial", () => {
      const aplicacion = aplicacionConAnaMorosa();

      aplicacion.cobrarYReingresar("ana", 1000, dia(4));

      expect(aplicacion.grupo().participanteActivo("ana")?.estado()).toBe("participando");
      expect(aplicacion.comandos().at(-2)).toBeInstanceOf(Cobrar);
      expect(aplicacion.comandos().at(-1)).toBeInstanceOf(Reingresar);
    });

    it("cobrar y reingresar a un moroso que paga parte de su deuda lo deja moroso por el resto, con sólo el cobro en el historial", () => {
      const aplicacion = aplicacionConAnaMorosa();

      aplicacion.cobrarYReingresar("ana", 400, dia(4));

      const ana = aplicacion.grupo().participanteActivo("ana");
      expect(ana?.estado()).toBe("moroso");
      expect(ana?.deudaAl(dia(4))).toBe(600);
      expect(aplicacion.comandos().at(-2)).toBeInstanceOf(RegistrarEncuentro);
      expect(aplicacion.comandos().at(-1)).toBeInstanceOf(Cobrar);
    });

    it("no se puede cobrar y reingresar a quien no es moroso", () => {
      const aplicacion = aplicacionConDeudaDeAna();

      expect(() => {
        aplicacion.cobrarYReingresar("ana", 1000, dia(4));
      }).toThrow("Cobrar y reingresar sólo aplica a un moroso");
    });

    it("cambiar reglas deja vigentes las nuevas reglas en el grupo", () => {
      const aplicacion = aplicacionConGrupo();
      const nuevasReglas = reglas({ rigeDesde: dia(4) });

      aplicacion.cambiarReglas(nuevasReglas);

      expect(aplicacion.grupo().reglas()).toBe(nuevasReglas);
    });
  });

  describe("historial", () => {
    it("el historial son los comandos ejecutados en orden, empezando por la creación del grupo", () => {
      const aplicacion = aplicacionConGrupo();

      aplicacion.ingresar("ana", dia(1));

      const comandos = aplicacion.comandos();
      expect(comandos).toHaveLength(2);
      expect(comandos[0]).toBeInstanceOf(CrearGrupo);
      expect(comandos[1]).toBeInstanceOf(Ingresar);
    });
  });

  describe("deshacer", () => {
    it("deshacer deja el grupo como estaba antes del último comando", () => {
      const aplicacion = aplicacionConDeudaDeAna();

      aplicacion.deshacer();

      expect(aplicacion.grupo().encuentros()).toEqual([]);
      expect(aplicacion.comandos().at(-1)).toBeInstanceOf(Ingresar);
    });

    it("deshacer devuelve el comando deshecho", () => {
      const aplicacion = aplicacionConDeudaDeAna();
      const ultimo = aplicacion.comandos().at(-1);

      const deshecho = aplicacion.deshacer();

      expect(deshecho).toBe(ultimo);
    });

    it("deshacer la creación del grupo la deja disponible para volver a cargarla", () => {
      const aplicacion = nuevaAplicacion();
      const reglasIniciales = reglas();
      aplicacion.crearGrupo("Fútbol de los jueves", reglasIniciales);

      aplicacion.deshacer();

      expect(aplicacion.creacionDeshecha()?.nombreDelGrupo()).toBe("Fútbol de los jueves");
      expect(aplicacion.creacionDeshecha()?.reglas()).toBe(reglasIniciales);
    });

    it("una aplicación nueva no tiene una creación deshecha", () => {
      const aplicacion = nuevaAplicacion();

      expect(aplicacion.creacionDeshecha()).toBeUndefined();
    });

    it("después de crear el grupo no queda una creación deshecha", () => {
      const aplicacion = aplicacionConGrupo();
      aplicacion.deshacer();

      aplicacion.crearGrupo("Fútbol de los viernes", reglas());

      expect(aplicacion.creacionDeshecha()).toBeUndefined();
    });

    it("deshacer un comando sobre el grupo que no registra un encuentro no empieza una planilla de asistencia ni deja una creación deshecha", () => {
      const aplicacion = aplicacionConGrupo();
      aplicacion.ingresar("ana", dia(1));

      aplicacion.deshacer();

      expect(aplicacion.tienePlanillaDeAsistencia()).toBe(false);
      expect(aplicacion.creacionDeshecha()).toBeUndefined();
    });

    it("deshacer deja guardada la bitácora", () => {
      const almacenamiento = new AlmacenamientoEnMemoria();
      const aplicacion = aplicacionConDeudaDeAna({ bitacora: almacenamiento });

      aplicacion.deshacer();

      expect(almacenamiento.leer()).toBe(aplicacion.exportar());
    });

    it("se puede deshacer mientras haya comandos, incluida la creación del grupo", () => {
      const aplicacion = aplicacionConGrupo();
      expect(aplicacion.puedeDeshacer()).toBe(true);

      aplicacion.deshacer();

      expect(aplicacion.tieneGrupo()).toBe(false);
      expect(aplicacion.puedeDeshacer()).toBe(false);
      expect(aplicacion.comandos()).toEqual([]);
    });
  });

  describe("planilla de asistencia", () => {
    it("empezar la planilla de asistencia la deja sin asistentes y guardada", () => {
      const almacenamientoDePlanilla = new AlmacenamientoEnMemoria();
      const aplicacion = aplicacionConGrupo({ planilla: almacenamientoDePlanilla });

      const planilla = aplicacion.empezarPlanillaDeAsistencia();

      expect(aplicacion.planillaDeAsistencia()).toBe(planilla);
      expect(planilla.asistentes()).toEqual([]);
      expect(JSON.parse(almacenamientoDePlanilla.leer()!)).toEqual({ asistentes: [] });
    });

    it("al principio no hay una planilla de asistencia empezada", () => {
      const aplicacion = aplicacionConGrupo();

      expect(aplicacion.tienePlanillaDeAsistencia()).toBe(false);
      expect(() => {
        aplicacion.planillaDeAsistencia();
      }).toThrow("No hay una planilla de asistencia empezada");
    });

    it("no se puede empezar una planilla de asistencia ya empezada", () => {
      const aplicacion = aplicacionConGrupo();
      aplicacion.empezarPlanillaDeAsistencia().marcarComoPresente("ana");

      expect(() => {
        aplicacion.empezarPlanillaDeAsistencia();
      }).toThrow("Ya hay una planilla de asistencia empezada");
      expect(aplicacion.planillaDeAsistencia().asistentes()).toEqual(["ana"]);
    });

    it("descartar la planilla de asistencia deja a la aplicación sin planilla y borra lo guardado", () => {
      const almacenamientoDePlanilla = new AlmacenamientoEnMemoria();
      const aplicacion = aplicacionConGrupo({ planilla: almacenamientoDePlanilla });
      aplicacion.empezarPlanillaDeAsistencia().marcarComoPresente("ana");

      aplicacion.descartarPlanillaDeAsistencia();

      expect(aplicacion.tienePlanillaDeAsistencia()).toBe(false);
      expect(almacenamientoDePlanilla.leer()).toBeUndefined();
    });

    it("una aplicación nueva sobre el mismo almacenamiento recupera la planilla de asistencia empezada", () => {
      const almacenamientos = { bitacora: new AlmacenamientoEnMemoria(), planilla: new AlmacenamientoEnMemoria() };
      aplicacionConGrupo(almacenamientos).empezarPlanillaDeAsistencia().marcarComoPresente("ana");

      const aplicacion = nuevaAplicacion(almacenamientos);

      expect(aplicacion.planillaDeAsistencia().asistentes()).toEqual(["ana"]);
    });

    it("registrar el encuentro según la planilla lo registra en la fecha dada con los asistentes de la planilla, y la descarta", () => {
      const aplicacion = aplicacionConAnaYBeto();
      aplicacion.empezarPlanillaDeAsistencia().marcarComoPresente("beto");

      aplicacion.registrarEncuentroSegunPlanillaDeAsistencia(dia(3));

      const [encuentro] = aplicacion.grupo().encuentros();
      expect(encuentro.fecha()).toEqual(dia(3));
      expect(encuentro.asistentes()).toEqual(new Set(["beto"]));
      expect(aplicacion.tienePlanillaDeAsistencia()).toBe(false);
    });

    it("registrar el encuentro según la planilla recuerda a los posibles asistentes sin marcar como ausentes", () => {
      const aplicacion = aplicacionConGrupo();
      ["ana", "beto", "carla"].forEach((nombre) => aplicacion.ingresar(nombre, dia(1)));
      aplicacion.empezarPlanillaDeAsistencia().marcarComoPresente("beto");

      aplicacion.registrarEncuentroSegunPlanillaDeAsistencia(dia(3));

      const registro = aplicacion.comandos().at(-1) as RegistrarEncuentro;
      expect(registro.asistencia().ausentes).toEqual(["ana", "carla"]);
    });

    it("un registro de encuentro que el grupo rechaza deja la planilla como estaba", () => {
      const aplicacion = aplicacionConDeudaDeAna();
      aplicacion.empezarPlanillaDeAsistencia().marcarComoPresente("beto");

      expect(() => {
        aplicacion.registrarEncuentroSegunPlanillaDeAsistencia(dia(2));
      }).toThrow("El encuentro debe ser posterior al último registrado");
      expect(aplicacion.planillaDeAsistencia().asistentes()).toEqual(["beto"]);
    });

    it("cobrar en la puerta toda la deuda deja a la persona marcada como presente", () => {
      const aplicacion = aplicacionConDeudaDeAna();
      aplicacion.empezarPlanillaDeAsistencia();

      aplicacion.cobrarEnLaPuerta("ana", 1000, dia(3));

      expect(aplicacion.grupo().participanteActivo("ana")?.estado()).toBe("libre de deuda");
      expect(aplicacion.planillaDeAsistencia().asiste("ana")).toBe(true);
    });

    it("un pago parcial en la puerta no marca a la persona, porque sigue sin poder asistir", () => {
      const aplicacion = aplicacionConDeudaDeAna();
      aplicacion.empezarPlanillaDeAsistencia();

      aplicacion.cobrarEnLaPuerta("ana", 400, dia(3));

      expect(aplicacion.grupo().participanteActivo("ana")?.deudaAl(dia(3))).toBe(600);
      expect(aplicacion.planillaDeAsistencia().asiste("ana")).toBe(false);
    });

    it("cobrar en la puerta toda la deuda a un moroso lo reingresa y lo deja marcado como presente", () => {
      const aplicacion = aplicacionConAnaMorosa();
      aplicacion.empezarPlanillaDeAsistencia();

      aplicacion.cobrarEnLaPuerta("ana", 1000, dia(4));

      expect(aplicacion.grupo().participanteActivo("ana")?.estado()).toBe("participando");
      expect(aplicacion.planillaDeAsistencia().asiste("ana")).toBe(true);
    });

    it("un pago parcial de un moroso en la puerta no lo marca, porque sigue moroso", () => {
      const aplicacion = aplicacionConAnaMorosa();
      aplicacion.empezarPlanillaDeAsistencia();

      aplicacion.cobrarEnLaPuerta("ana", 400, dia(4));

      expect(aplicacion.grupo().participanteActivo("ana")?.estado()).toBe("moroso");
      expect(aplicacion.planillaDeAsistencia().asiste("ana")).toBe(false);
    });

    it("no se puede cobrar en la puerta a quien no debe nada", () => {
      const aplicacion = aplicacionConGrupo();
      aplicacion.ingresar("ana", dia(1));

      expect(() => {
        aplicacion.cobrarEnLaPuerta("ana", 1000, dia(4));
      }).toThrow("Pagar en la puerta no habilita a ana");
    });

    it("ingresar como asistente a alguien nuevo lo deja participando desde la fecha del ingreso y marcado como presente", () => {
      const aplicacion = aplicacionConGrupo();
      aplicacion.empezarPlanillaDeAsistencia();

      aplicacion.ingresarAsistente("carla", dia(3));

      expect(aplicacion.grupo().participanteActivo("carla")?.historial().at(0)?.fecha()).toEqual(dia(3));
      expect(aplicacion.planillaDeAsistencia().asiste("carla")).toBe(true);
    });

    it("ingresar como asistente a quien ya participó lo reingresa desde la fecha del ingreso y lo deja marcado como presente", () => {
      const aplicacion = aplicacionConAnaFinalizada();
      aplicacion.empezarPlanillaDeAsistencia();

      aplicacion.ingresarAsistente("ana", dia(5));

      expect(aplicacion.grupo().participanteActivo("ana")?.estado()).toBe("participando");
      expect(aplicacion.grupo().participanteActivo("ana")?.fechaDelUltimoCambio()).toEqual(dia(5));
      expect(aplicacion.planillaDeAsistencia().asiste("ana")).toBe(true);
    });

    it("ingresar como asistente toma el nombre sin espacios al principio ni al final", () => {
      const aplicacion = aplicacionConGrupo();
      aplicacion.empezarPlanillaDeAsistencia();

      aplicacion.ingresarAsistente(" carla ", dia(3));

      expect(aplicacion.grupo().participanteActivo("carla")).toBeDefined();
      expect(aplicacion.planillaDeAsistencia().asiste("carla")).toBe(true);
    });

    it("quedan ausentes los posibles asistentes sin marcar, incluso quien está en deuda", () => {
      const aplicacion = aplicacionConDeudaDeAna();
      aplicacion.empezarPlanillaDeAsistencia().marcarComoPresente("beto");

      expect(aplicacion.ausentesEnPlanillaDeAsistencia()).toEqual(["ana"]);
    });

    it("un moroso no figura entre los ausentes en la planilla", () => {
      const aplicacion = aplicacionConAnaMorosa();
      aplicacion.empezarPlanillaDeAsistencia();

      expect(aplicacion.ausentesEnPlanillaDeAsistencia()).toEqual(["beto"]);
    });

    it("no se puede registrar el encuentro según la planilla sin una planilla de asistencia empezada", () => {
      const aplicacion = aplicacionConGrupo();
      aplicacion.ingresar("ana", dia(1));

      expect(() => {
        aplicacion.registrarEncuentroSegunPlanillaDeAsistencia(dia(3));
      }).toThrow("No hay una planilla de asistencia empezada");
      expect(aplicacion.grupo().encuentros()).toEqual([]);
    });

    it("no se puede ingresar un asistente sin una planilla de asistencia empezada", () => {
      const aplicacion = aplicacionConGrupo();

      expect(() => {
        aplicacion.ingresarAsistente("carla", dia(3));
      }).toThrow("No hay una planilla de asistencia empezada");
      expect(aplicacion.grupo().participanteActivo("carla")).toBeUndefined();
    });

    it("deshacer el registro de un encuentro restaura su planilla", () => {
      const aplicacion = aplicacionConDeudaDeAna();

      aplicacion.deshacer();

      expect(aplicacion.planillaDeAsistencia().asistentes()).toEqual(["beto"]);
    });

    it("deshacer un cobro en la puerta desmarca a la persona, que vuelve a no poder asistir", () => {
      const aplicacion = aplicacionConDeudaDeAna();
      aplicacion.empezarPlanillaDeAsistencia();
      aplicacion.cobrarEnLaPuerta("ana", 1000, dia(3));

      aplicacion.deshacer();

      expect(aplicacion.planillaDeAsistencia().asiste("ana")).toBe(false);
    });

    it("deshacer el ingreso de un asistente desmarca a la persona, que ya no es participante", () => {
      const aplicacion = aplicacionConGrupo();
      aplicacion.empezarPlanillaDeAsistencia();
      aplicacion.ingresarAsistente("carla", dia(3));

      aplicacion.deshacer();

      expect(aplicacion.planillaDeAsistencia().asiste("carla")).toBe(false);
    });

    it("deshacer un cobro desmarca a quien dejó de estar habilitado por el crédito aplicado", () => {
      const aplicacion = aplicacionConDeudaDeAna();
      aplicacion.ingresar("carla", dia(2));
      aplicacion.registrarEncuentro(dia(3), ["carla"], ["ana", "beto"]);
      const planilla = aplicacion.empezarPlanillaDeAsistencia();
      aplicacion.cobrar("ana", 1000, dia(4)); // el crédito de beto por la falta de ana salda su deuda
      planilla.marcarComoPresente("beto");

      aplicacion.deshacer();

      expect(aplicacion.planillaDeAsistencia().asiste("beto")).toBe(false);
    });

    it("deshacer no toca las marcas de quienes siguen pudiendo asistir", () => {
      const aplicacion = aplicacionConDeudaDeAna();
      aplicacion.empezarPlanillaDeAsistencia().marcarComoPresente("beto");
      aplicacion.ingresarAsistente("carla", dia(3));

      aplicacion.deshacer();

      expect(aplicacion.planillaDeAsistencia().asistentes()).toEqual(["beto"]);
    });

    it("deshacer la creación del grupo descarta la planilla de asistencia", () => {
      const aplicacion = aplicacionConGrupo();
      aplicacion.empezarPlanillaDeAsistencia();

      aplicacion.deshacer();

      expect(aplicacion.tienePlanillaDeAsistencia()).toBe(false);
    });

    it("importar una bitácora descarta la planilla", () => {
      const exportado = aplicacionConDeudaDeAna().exportar();
      const aplicacion = aplicacionConGrupo();
      aplicacion.empezarPlanillaDeAsistencia().marcarComoPresente("carla");

      aplicacion.importar(exportado);

      expect(aplicacion.tienePlanillaDeAsistencia()).toBe(false);
    });
  });

  describe("exportar e importar", () => {
    it("lo exportado es la bitácora en formato JSON", () => {
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

    it("importar reemplaza la bitácora por la importada", () => {
      const exportado = aplicacionConDeudaDeAna().exportar();
      const aplicacion = aplicacionConGrupo();
      aplicacion.ingresar("carla", dia(1));

      aplicacion.importar(exportado);

      expect(aplicacion.exportar()).toBe(exportado);
      expect(aplicacion.grupo().participanteActivo("carla")).toBeUndefined();
      expect(aplicacion.grupo().participanteActivo("ana")?.estado()).toBe("en deuda");
    });

    it("importar deja guardada la bitácora importada", () => {
      const exportado = aplicacionConDeudaDeAna().exportar();
      const almacenamiento = new AlmacenamientoEnMemoria();
      const aplicacion = aplicacionConGrupo({ bitacora: almacenamiento });
      aplicacion.ingresar("carla", dia(1));

      aplicacion.importar(exportado);

      expect(almacenamiento.leer()).toBe(exportado);
    });

    it("no se puede importar un texto que no es JSON", () => {
      const almacenamiento = new AlmacenamientoEnMemoria();
      const aplicacion = aplicacionConGrupo({ bitacora: almacenamiento });
      const exportadoAntes = aplicacion.exportar();

      expect(() => {
        aplicacion.importar("esto no es JSON");
      }).toThrow(/^Formato inválido/);
      expect(aplicacion.exportar()).toBe(exportadoAntes);
      expect(almacenamiento.leer()).toBe(exportadoAntes);
    });

    it("no se puede importar una bitácora con un comando que el grupo rechaza", () => {
      const almacenamiento = new AlmacenamientoEnMemoria();
      const aplicacion = aplicacionConGrupo({ bitacora: almacenamiento });
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
