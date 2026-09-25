import { describe, expect, it } from "vitest";
import { AlmacenamientoEnMemoria } from "../../src/app/AlmacenamientoEnMemoria.ts";
import { Aplicacion } from "../../src/app/Aplicacion.ts";
import { CrearGrupo } from "../../src/app/comandos/CrearGrupo.ts";
import { Ingresar } from "../../src/app/comandos/Ingresar.ts";
import { CerrarEvento } from "../../src/app/comandos/CerrarEvento.ts";
import { reglasAJson } from "../../src/app/json/ReglasJson.ts";
import { desempate, dia, reglas } from "../models/factories.ts";
import { nuevaPlanillaDeAsistencia } from "./factories.ts";

const nuevaAplicacion = (almacenamiento = new AlmacenamientoEnMemoria()) =>
  new Aplicacion(almacenamiento, desempate, nuevaPlanillaDeAsistencia());

const aplicacionConGrupo = (almacenamiento = new AlmacenamientoEnMemoria()) => {
  const aplicacion = nuevaAplicacion(almacenamiento);
  aplicacion.crearGrupo("Fútbol de los jueves", reglas());
  return aplicacion;
};

const aplicacionConDeudaDeAna = (almacenamiento = new AlmacenamientoEnMemoria()) => {
  const aplicacion = aplicacionConGrupo(almacenamiento);
  aplicacion.ingresar("ana", dia(1));
  aplicacion.ingresar("beto", dia(1));
  aplicacion.cerrarEvento(dia(2), ["beto"], ["ana"]);
  return aplicacion;
};

const aplicacionConAnaMorosa = (almacenamiento = new AlmacenamientoEnMemoria()) => {
  const aplicacion = aplicacionConDeudaDeAna(almacenamiento);
  aplicacion.cerrarEvento(dia(3), ["beto"], ["ana"]);
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
      const aplicacion = nuevaAplicacion(almacenamiento);

      aplicacion.crearGrupo("Fútbol de los jueves", reglas());

      expect(almacenamiento.leer()).toBe(aplicacion.exportar());
    });

    it("al iniciar se carga la bitácora guardada", () => {
      const almacenamiento = new AlmacenamientoEnMemoria();
      nuevaAplicacion(almacenamiento).crearGrupo("Fútbol de los jueves", reglas());

      const aplicacion = nuevaAplicacion(almacenamiento);

      expect(aplicacion.tieneGrupo()).toBe(true);
      expect(aplicacion.grupo().nombre()).toBe("Fútbol de los jueves");
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
    it("ingresar deja a la persona como participante activo del grupo", () => {
      const aplicacion = aplicacionConGrupo();

      aplicacion.ingresar("ana", dia(1));

      expect(aplicacion.grupo().participanteActivo("ana")).toBeDefined();
    });

    it("cerrar evento registra el evento con sus asistentes en el grupo", () => {
      const aplicacion = aplicacionConGrupo();
      aplicacion.ingresar("ana", dia(1));
      aplicacion.ingresar("beto", dia(1));

      aplicacion.cerrarEvento(dia(2), ["beto"], ["ana"]);

      expect(aplicacion.grupo().eventos()).toHaveLength(1);
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
      const aplicacion = aplicacionConDeudaDeAna();
      aplicacion.cerrarEvento(dia(9), ["beto"], ["ana"]);
      aplicacion.cobrar("ana", 1000, dia(10));
      expect(aplicacion.grupo().participanteActivo("ana")).toBeUndefined();

      aplicacion.reingresar("ana", dia(11));

      expect(aplicacion.grupo().participanteActivo("ana")?.estado()).toBe("participando");
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

      expect(aplicacion.grupo().eventos()).toEqual([]);
      expect(aplicacion.comandos().at(-1)).toBeInstanceOf(Ingresar);
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

    it("deshacer un comando sobre el grupo que no es un cierre no empieza una planilla de asistencia ni deja una creación deshecha", () => {
      const aplicacion = aplicacionConGrupo();
      aplicacion.ingresar("ana", dia(1));

      aplicacion.deshacer();

      expect(aplicacion.planillaDeAsistencia().existe()).toBe(false);
      expect(aplicacion.creacionDeshecha()).toBeUndefined();
    });

    it("deshacer deja guardada la bitácora", () => {
      const almacenamiento = new AlmacenamientoEnMemoria();
      const aplicacion = aplicacionConDeudaDeAna(almacenamiento);

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
    it("cerrar el evento según la planilla lo registra con su fecha y sus asistentes", () => {
      const aplicacion = aplicacionConGrupo();
      aplicacion.ingresar("ana", dia(1));
      aplicacion.ingresar("beto", dia(1));
      aplicacion.planillaDeAsistencia().cambiarFecha(dia(3));
      aplicacion.planillaDeAsistencia().marcarComoPresente("beto");

      aplicacion.cerrarEventoSegunPlanillaDeAsistencia();

      const [evento] = aplicacion.grupo().eventos();
      expect(evento.fecha()).toEqual(dia(3));
      expect(evento.asistentes()).toEqual(new Set(["beto"]));
    });

    it("cerrar el evento según la planilla recuerda a los posibles asistentes sin marcar como ausentes", () => {
      const aplicacion = aplicacionConGrupo();
      ["ana", "beto", "carla"].forEach((nombre) => aplicacion.ingresar(nombre, dia(1)));
      aplicacion.planillaDeAsistencia().cambiarFecha(dia(3));
      aplicacion.planillaDeAsistencia().marcarComoPresente("beto");

      aplicacion.cerrarEventoSegunPlanillaDeAsistencia();

      const cierre = aplicacion.comandos().at(-1) as CerrarEvento;
      expect(cierre.ausentes()).toEqual(["ana", "carla"]);
    });

    it("cerrar el evento según la planilla la descarta", () => {
      const aplicacion = aplicacionConGrupo();
      aplicacion.ingresar("ana", dia(1));
      aplicacion.ingresar("beto", dia(1));
      aplicacion.planillaDeAsistencia().cambiarFecha(dia(3));
      aplicacion.planillaDeAsistencia().marcarComoPresente("beto");

      aplicacion.cerrarEventoSegunPlanillaDeAsistencia();

      expect(aplicacion.planillaDeAsistencia().existe()).toBe(false);
    });

    it("un cierre que el grupo rechaza deja la planilla como estaba", () => {
      const aplicacion = aplicacionConDeudaDeAna();
      aplicacion.planillaDeAsistencia().cambiarFecha(dia(2));
      aplicacion.planillaDeAsistencia().marcarComoPresente("beto");

      expect(() => {
        aplicacion.cerrarEventoSegunPlanillaDeAsistencia();
      }).toThrow("El evento debe ser posterior al último registrado");
      expect(aplicacion.planillaDeAsistencia().fecha()).toEqual(dia(2));
      expect(aplicacion.planillaDeAsistencia().asistentes()).toEqual(["beto"]);
    });

    it("cobrar en la puerta toda la deuda deja a la persona marcada como presente", () => {
      const aplicacion = aplicacionConDeudaDeAna();

      aplicacion.cobrarEnLaPuerta("ana", 1000, dia(3));

      expect(aplicacion.grupo().participanteActivo("ana")?.estado()).toBe("libre de deuda");
      expect(aplicacion.planillaDeAsistencia().asiste("ana")).toBe(true);
    });

    it("un pago parcial en la puerta no marca a la persona, porque sigue sin poder asistir", () => {
      const aplicacion = aplicacionConDeudaDeAna();

      aplicacion.cobrarEnLaPuerta("ana", 400, dia(3));

      expect(aplicacion.grupo().participanteActivo("ana")?.deudaAl(dia(3))).toBe(600);
      expect(aplicacion.planillaDeAsistencia().asiste("ana")).toBe(false);
    });

    it("no se puede cobrar en la puerta a un moroso, porque pagar no lo habilita a asistir", () => {
      const aplicacion = aplicacionConAnaMorosa();

      expect(() => {
        aplicacion.cobrarEnLaPuerta("ana", 1000, dia(4));
      }).toThrow("Pagar en la puerta no habilita a ana");
    });

    it("no se puede cobrar en la puerta a quien no debe nada", () => {
      const aplicacion = aplicacionConGrupo();
      aplicacion.ingresar("ana", dia(1));

      expect(() => {
        aplicacion.cobrarEnLaPuerta("ana", 1000, dia(4));
      }).toThrow("Pagar en la puerta no habilita a ana");
    });

    it("ingresar como asistente a alguien nuevo lo deja participando desde la fecha de la planilla y marcado como presente", () => {
      const aplicacion = aplicacionConGrupo();
      aplicacion.planillaDeAsistencia().cambiarFecha(dia(3));

      aplicacion.ingresarAsistente("carla");

      expect(aplicacion.grupo().participanteActivo("carla")?.historial().at(0)?.fecha()).toEqual(dia(3));
      expect(aplicacion.planillaDeAsistencia().asiste("carla")).toBe(true);
    });

    it("ingresar como asistente a quien ya participó lo reingresa desde la fecha de la planilla y lo deja marcado como presente", () => {
      const aplicacion = aplicacionConAnaMorosa();
      aplicacion.cobrar("ana", 1000, dia(4)); // ana queda finalizada por pago de morosidad
      aplicacion.planillaDeAsistencia().cambiarFecha(dia(5));

      aplicacion.ingresarAsistente("ana");

      expect(aplicacion.grupo().participanteActivo("ana")?.estado()).toBe("participando");
      expect(aplicacion.grupo().participanteActivo("ana")?.fechaDelUltimoCambio()).toEqual(dia(5));
      expect(aplicacion.planillaDeAsistencia().asiste("ana")).toBe(true);
    });

    it("ingresar como asistente toma el nombre sin espacios al principio ni al final", () => {
      const aplicacion = aplicacionConGrupo();
      aplicacion.planillaDeAsistencia().cambiarFecha(dia(3));

      aplicacion.ingresarAsistente(" carla ");

      expect(aplicacion.grupo().participanteActivo("carla")).toBeDefined();
      expect(aplicacion.planillaDeAsistencia().asiste("carla")).toBe(true);
    });

    it("quedan ausentes los posibles asistentes sin marcar, incluso quien está en deuda", () => {
      const aplicacion = aplicacionConDeudaDeAna();
      aplicacion.planillaDeAsistencia().marcarComoPresente("beto");

      expect(aplicacion.ausentesEnPlanillaDeAsistencia()).toEqual(["ana"]);
    });

    it("un moroso no figura entre los ausentes en la planilla", () => {
      const aplicacion = aplicacionConAnaMorosa();

      expect(aplicacion.ausentesEnPlanillaDeAsistencia()).toEqual(["beto"]);
    });

    it("deshacer el cierre de un evento restaura su planilla", () => {
      const aplicacion = aplicacionConDeudaDeAna();

      aplicacion.deshacer();

      expect(aplicacion.planillaDeAsistencia().existe()).toBe(true);
      expect(aplicacion.planillaDeAsistencia().fecha()).toEqual(dia(2));
      expect(aplicacion.planillaDeAsistencia().asistentes()).toEqual(["beto"]);
    });

    it("importar una bitácora descarta la planilla", () => {
      const exportado = aplicacionConDeudaDeAna().exportar();
      const aplicacion = aplicacionConGrupo();
      aplicacion.planillaDeAsistencia().marcarComoPresente("carla");

      aplicacion.importar(exportado);

      expect(aplicacion.planillaDeAsistencia().existe()).toBe(false);
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
      const aplicacion = aplicacionConGrupo(almacenamiento);
      aplicacion.ingresar("carla", dia(1));

      aplicacion.importar(exportado);

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
