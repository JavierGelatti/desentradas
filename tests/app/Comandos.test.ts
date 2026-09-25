import { describe, expect, it } from "vitest";
import { CrearGrupo } from "../../src/app/comandos/CrearGrupo.ts";
import { Ingresar } from "../../src/app/comandos/Ingresar.ts";
import { Reingresar } from "../../src/app/comandos/Reingresar.ts";
import { CerrarEvento } from "../../src/app/comandos/CerrarEvento.ts";
import { Cobrar } from "../../src/app/comandos/Cobrar.ts";
import { Repartir } from "../../src/app/comandos/Repartir.ts";
import { CambiarReglas } from "../../src/app/comandos/CambiarReglas.ts";
import { comandoDesdeJson } from "../../src/app/json/ComandoJson.ts";
import { reglasAJson } from "../../src/app/json/ReglasJson.ts";
import { desempate, dia, nuevoEvento, nuevoGrupo, reglas } from "../models/factories.ts";

describe("CrearGrupo", () => {
  it("crea el grupo con su nombre y sus reglas iniciales", () => {
    const reglasIniciales = reglas();
    const comando = new CrearGrupo("Fútbol de los jueves", reglasIniciales);

    const grupo = comando.ejecutar(undefined, desempate);

    expect(grupo.nombre()).toBe("Fútbol de los jueves");
    expect(grupo.reglas()).toBe(reglasIniciales);
    expect(grupo.participantes()).toEqual([]);
  });

  it("se convierte a JSON con el nombre del grupo y las reglas, y vuelve igual", () => {
    const comando = new CrearGrupo("Fútbol de los jueves", reglas());

    const json = comando.aJson();

    expect(json).toEqual({
      tipo: "crear grupo",
      nombreDelGrupo: "Fútbol de los jueves",
      reglas: reglasAJson(reglas()),
    });
    expect(comandoDesdeJson(json).aJson()).toEqual(json);
  });

  it("conoce el nombre del grupo y las reglas iniciales, para poder volver a pedirlos si se deshace", () => {
    const reglasIniciales = reglas();
    const comando = new CrearGrupo("Fútbol de los jueves", reglasIniciales);

    expect(comando.nombreDelGrupo()).toBe("Fútbol de los jueves");
    expect(comando.reglas()).toBe(reglasIniciales);
  });

  it("no se puede crear un grupo con el nombre vacío", () => {
    const comando = new CrearGrupo("   ", reglas());

    expect(() => {
      comando.ejecutar(undefined, desempate);
    }).toThrow("El nombre del grupo no puede estar vacío");
  });

  it("no se puede crear el grupo si ya fue creado", () => {
    const grupo = nuevoGrupo();
    const comando = new CrearGrupo("Fútbol de los jueves", reglas());

    expect(() => {
      comando.ejecutar(grupo, desempate);
    }).toThrow("El grupo ya fue creado");
  });
});

describe("ComandoSobreElGrupo", () => {
  it("ejecutarlo sobre el grupo creado lo modifica sin reemplazarlo", () => {
    const grupo = nuevoGrupo();
    const comando = new Ingresar("ana", dia(1));

    const resultado = comando.ejecutar(grupo, desempate);

    expect(resultado).toBe(grupo);
    expect(grupo.participanteActivo("ana")).toBeDefined();
  });

  it("no se puede ejecutar antes de crear el grupo", () => {
    const comando = new Ingresar("ana", dia(1));

    expect(() => {
      comando.ejecutar(undefined, desempate);
    }).toThrow("El grupo no está creado");
  });
});

describe("Ingresar", () => {
  it("deja a la persona como participante activo desde la fecha indicada", () => {
    const grupo = nuevoGrupo();
    const comando = new Ingresar("ana", dia(1));

    comando.ejecutar(grupo, desempate);

    const ana = grupo.participanteActivo("ana");
    expect(ana?.historial().at(0)?.fecha()).toEqual(dia(1));
  });

  it("se convierte a JSON con el nombre y la fecha en formato ISO, y vuelve igual", () => {
    const comando = new Ingresar("ana", dia(1));

    const json = comando.aJson();

    expect(json).toEqual({ tipo: "ingresar", nombre: "ana", fecha: dia(1).toISOString() });
    expect(comandoDesdeJson(json).aJson()).toEqual(json);
  });
});

describe("Reingresar", () => {
  it("vuelve a dejar como participante activo a quien ya participó, desde la fecha indicada", () => {
    const grupo = nuevoGrupo();
    const ana = grupo.ingresar("ana", dia(1));
    grupo.ingresar("beto", dia(1));
    grupo.cerrarEvento(nuevoEvento({ numero: 2, asistentes: ["beto"] }));
    grupo.cerrarEvento(nuevoEvento({ numero: 9, asistentes: ["beto"] }));
    grupo.cobrar("ana", 1000, dia(10));
    expect(ana.estaActivo()).toBe(false);
    const comando = new Reingresar("ana", dia(11));

    comando.ejecutar(grupo, desempate);

    expect(grupo.participanteActivo("ana")).toBe(ana);
    expect(ana.fechaDelUltimoCambio()).toEqual(dia(11));
  });

  it("se convierte a JSON con el nombre y la fecha en formato ISO, y vuelve igual", () => {
    const comando = new Reingresar("ana", dia(11));

    const json = comando.aJson();

    expect(json).toEqual({ tipo: "reingresar", nombre: "ana", fecha: dia(11).toISOString() });
    expect(comandoDesdeJson(json).aJson()).toEqual(json);
  });
});

describe("CerrarEvento", () => {
  it("registra el evento en el grupo con su fecha y sus asistentes", () => {
    const grupo = nuevoGrupo();
    grupo.ingresar("ana", dia(1));
    grupo.ingresar("beto", dia(1));
    const comando = new CerrarEvento(dia(2), ["beto"]);

    comando.ejecutar(grupo, desempate);

    const [evento] = grupo.eventos();
    expect(evento.fecha()).toEqual(dia(2));
    expect(evento.asistentes()).toEqual(new Set(["beto"]));
    expect(grupo.participanteActivo("ana")?.estado()).toBe("en deuda");
  });

  it("se convierte a JSON con la fecha en formato ISO y los asistentes, y vuelve igual", () => {
    const comando = new CerrarEvento(dia(2), ["beto", "carla"]);

    const json = comando.aJson();

    expect(json).toEqual({ tipo: "cerrar evento", fecha: dia(2).toISOString(), asistentes: ["beto", "carla"] });
    expect(comandoDesdeJson(json).aJson()).toEqual(json);
  });
});

describe("Cobrar", () => {
  it("registra el cobro a la persona por el monto y en la fecha indicados", () => {
    const grupo = nuevoGrupo();
    const ana = grupo.ingresar("ana", dia(1));
    grupo.ingresar("beto", dia(1));
    grupo.cerrarEvento(nuevoEvento({ numero: 2, asistentes: ["beto"] }));
    const comando = new Cobrar("ana", 400, dia(3));

    comando.ejecutar(grupo, desempate);

    expect(ana.deudaAl(dia(3))).toBe(600);
    const [cobro] = grupo.caja().cobros();
    expect(cobro.fecha()).toEqual(dia(3));
  });

  it("se convierte a JSON con el nombre, el monto y la fecha en formato ISO, y vuelve igual", () => {
    const comando = new Cobrar("ana", 400, dia(3));

    const json = comando.aJson();

    expect(json).toEqual({ tipo: "cobrar", nombre: "ana", monto: 400, fecha: dia(3).toISOString() });
    expect(comandoDesdeJson(json).aJson()).toEqual(json);
  });
});

describe("Repartir", () => {
  it("entrega los créditos pendientes de la persona en la fecha indicada", () => {
    const grupo = nuevoGrupo();
    grupo.ingresar("ana", dia(1));
    grupo.ingresar("beto", dia(1));
    grupo.cerrarEvento(nuevoEvento({ numero: 2, asistentes: ["beto"] }));
    grupo.cobrar("ana", 1000, dia(3));
    const comando = new Repartir("beto", dia(4));

    comando.ejecutar(grupo, desempate);

    expect(grupo.caja().montoPendienteDe("beto")).toBe(0);
    const [reparto] = grupo.caja().repartos();
    expect(reparto.fecha()).toEqual(dia(4));
  });

  it("se convierte a JSON con el nombre y la fecha en formato ISO, y vuelve igual", () => {
    const comando = new Repartir("beto", dia(4));

    const json = comando.aJson();

    expect(json).toEqual({ tipo: "repartir", nombre: "beto", fecha: dia(4).toISOString() });
    expect(comandoDesdeJson(json).aJson()).toEqual(json);
  });
});

describe("CambiarReglas", () => {
  it("deja vigentes las nuevas reglas", () => {
    const grupo = nuevoGrupo();
    const nuevasReglas = reglas({ rigeDesde: dia(4) });
    const comando = new CambiarReglas(nuevasReglas);

    comando.ejecutar(grupo, desempate);

    expect(grupo.reglas()).toBe(nuevasReglas);
  });

  it("se convierte a JSON con las reglas y vuelve igual", () => {
    const nuevasReglas = reglas({ rigeDesde: dia(4) });
    const comando = new CambiarReglas(nuevasReglas);

    const json = comando.aJson();

    expect(json).toEqual({ tipo: "cambiar reglas", reglas: reglasAJson(nuevasReglas) });
    expect(comandoDesdeJson(json).aJson()).toEqual(json);
  });
});

describe("Comandos en JSON", () => {
  it("no se puede leer un comando de tipo desconocido", () => {
    expect(() => {
      comandoDesdeJson({ tipo: "expulsar", nombre: "ana" });
    }).toThrow('Formato inválido: comando desconocido "expulsar"');
  });
});

describe("Descripción de los comandos", () => {
  it("crear grupo lleva la fecha desde la que rigen las reglas y se describe con el nombre del grupo", () => {
    const comando = new CrearGrupo("Fútbol de los jueves", reglas({ rigeDesde: dia(1) }));

    expect(comando.fecha()).toEqual(dia(1));
    expect(comando.describir()).toBe('Creación del grupo "Fútbol de los jueves"');
  });

  it("ingresar lleva la fecha de ingreso y se describe como un registro con el nombre", () => {
    const comando = new Ingresar("ana", dia(1));

    expect(comando.fecha()).toEqual(dia(1));
    expect(comando.describir()).toBe("Registro de ana");
  });

  it("reingresar lleva la fecha de reingreso y se describe con el nombre", () => {
    const comando = new Reingresar("ana", dia(11));

    expect(comando.fecha()).toEqual(dia(11));
    expect(comando.describir()).toBe("Reingreso de ana");
  });

  it("cerrar evento lleva la fecha del evento y se describe con sus asistentes", () => {
    const comando = new CerrarEvento(dia(2), ["beto", "carla"]);

    expect(comando.fecha()).toEqual(dia(2));
    expect(comando.describir()).toBe("Evento con beto, carla");
  });

  it("cobrar lleva la fecha del cobro y se describe con el monto y el nombre", () => {
    const comando = new Cobrar("ana", 1000, dia(3));

    expect(comando.fecha()).toEqual(dia(3));
    expect(comando.describir()).toBe("Cobro de $1000 a ana");
  });

  it("repartir lleva la fecha del reparto y se describe con el nombre", () => {
    const comando = new Repartir("beto", dia(4));

    expect(comando.fecha()).toEqual(dia(4));
    expect(comando.describir()).toBe("Reparto a beto");
  });

  it("cambiar reglas lleva la fecha desde la que rigen las nuevas reglas y se describe sin más datos", () => {
    const comando = new CambiarReglas(reglas({ rigeDesde: dia(4) }));

    expect(comando.fecha()).toEqual(dia(4));
    expect(comando.describir()).toBe("Cambio de reglas");
  });
});
