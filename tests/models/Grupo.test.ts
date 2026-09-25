import { describe, expect, it } from "vitest";
import type { Credito } from "../../src/models/Credito.ts";
import { Grupo } from "../../src/models/Grupo.ts";
import { InteresFijoPorDia } from "../../src/models/PoliticaDeInteres.ts";
import { desempate, dia, nuevoEvento, nuevoGrupo, reglas } from "./factories.ts";

const grupoConAnaFinalizada = () => {
  const grupo = nuevoGrupo();
  const ana = grupo.ingresar("ana", dia(1));
  const beto = grupo.ingresar("beto", dia(1));
  grupo.registrarEvento(nuevoEvento({ numero: 2, asistentes: ["beto"] }));
  grupo.registrarEvento(nuevoEvento({ numero: 9, asistentes: ["beto"] }));
  grupo.cobrar("ana", 1000, dia(10));
  expect(ana.estaActivo()).toBe(false);
  return { grupo, ana, beto };
};

describe("Grupo", () => {
  describe("nombre", () => {
    it("se crea con su nombre", () => {
      const grupo = new Grupo("Fútbol de los jueves", reglas(), desempate);

      const nombre = grupo.nombre();

      expect(nombre).toBe("Fútbol de los jueves");
    });

    it("se guarda sin espacios al principio ni al final", () => {
      const grupo = new Grupo("  Fútbol de los jueves ", reglas(), desempate);

      const nombre = grupo.nombre();

      expect(nombre).toBe("Fútbol de los jueves");
    });

    it("no puede estar vacío", () => {
      expect(() => {
        new Grupo("   ", reglas(), desempate);
      }).toThrow("El nombre del grupo no puede estar vacío");
    });
  });

  describe("reglas", () => {
    it("se crea con sus reglas iniciales, que son la única versión del historial", () => {
      const reglasIniciales = reglas();

      const grupo = nuevoGrupo(reglasIniciales);

      expect(grupo.reglas()).toBe(reglasIniciales);
      expect(grupo.historialDeReglas()).toEqual([reglasIniciales]);
    });

    it("cambiar las reglas después de un evento agrega una versión al historial", () => {
      const reglasIniciales = reglas();
      const grupo = nuevoGrupo(reglasIniciales);
      grupo.ingresar("beto", dia(1));
      grupo.registrarEvento(nuevoEvento({ numero: 2, asistentes: ["beto"] }));
      const nuevasReglas = reglas({ rigeDesde: dia(3) });

      grupo.cambiarReglas(nuevasReglas);

      expect(grupo.reglas()).toBe(nuevasReglas);
      expect(grupo.historialDeReglas()).toEqual([reglasIniciales, nuevasReglas]);
    });

    it("las reglas anteriores son todas las versiones salvo la vigente, de la más antigua a la más nueva", () => {
      const reglasIniciales = reglas();
      const grupo = nuevoGrupo(reglasIniciales);
      grupo.ingresar("beto", dia(1));
      grupo.registrarEvento(nuevoEvento({ numero: 2, asistentes: ["beto"] }));
      const segundasReglas = reglas({ rigeDesde: dia(3) });
      grupo.cambiarReglas(segundasReglas);
      grupo.registrarEvento(nuevoEvento({ numero: 4, asistentes: ["beto"] }));

      grupo.cambiarReglas(reglas({ rigeDesde: dia(5) }));

      expect(grupo.reglasAnteriores()).toEqual([reglasIniciales, segundasReglas]);
    });

    it("las nuevas reglas deben regir desde después del último evento registrado", () => {
      const reglasIniciales = reglas();
      const grupo = nuevoGrupo(reglasIniciales);
      grupo.ingresar("beto", dia(1));
      grupo.registrarEvento(nuevoEvento({ numero: 9, asistentes: ["beto"] }));

      expect(() => {
        grupo.cambiarReglas(reglas({ rigeDesde: dia(9) }));
      }).toThrow("Las nuevas reglas deben regir desde después del último evento registrado");
      expect(grupo.historialDeReglas()).toEqual([reglasIniciales]);
    });

    it("las nuevas reglas pueden regir desde una fecha futura", () => {
      const grupo = nuevoGrupo(reglas());
      grupo.ingresar("beto", dia(1));
      grupo.registrarEvento(nuevoEvento({ numero: 2, asistentes: ["beto"] }));
      const nuevasReglas = reglas({ rigeDesde: dia(30) });

      grupo.cambiarReglas(nuevasReglas);

      expect(grupo.reglas()).toBe(nuevasReglas);
    });

    it("si no hubo eventos desde que rige la versión actual, las nuevas reglas la reemplazan", () => {
      const reglasIniciales = reglas();
      const grupo = nuevoGrupo(reglasIniciales);
      grupo.ingresar("beto", dia(1));
      grupo.registrarEvento(nuevoEvento({ numero: 2, asistentes: ["beto"] }));
      grupo.cambiarReglas(reglas({ rigeDesde: dia(3) }));
      const reglasDefinitivas = reglas({ rigeDesde: dia(4) });

      grupo.cambiarReglas(reglasDefinitivas);

      expect(grupo.historialDeReglas()).toEqual([reglasIniciales, reglasDefinitivas]);
    });

    it("las reglas iniciales también se reemplazan si todavía no hubo eventos", () => {
      const grupo = nuevoGrupo(reglas());
      const reglasDefinitivas = reglas({ rigeDesde: dia(4) });

      grupo.cambiarReglas(reglasDefinitivas);

      expect(grupo.historialDeReglas()).toEqual([reglasDefinitivas]);
    });

    it("el monto por falta de un evento es el de las reglas vigentes en su fecha", () => {
      const grupo = nuevoGrupo(reglas({ montoPorFalta: 1000 }));
      const ana = grupo.ingresar("ana", dia(1));
      grupo.ingresar("beto", dia(1));
      grupo.registrarEvento(nuevoEvento({ numero: 2, asistentes: ["ana", "beto"] }));
      grupo.cambiarReglas(reglas({ rigeDesde: dia(5), montoPorFalta: 2000 }));

      grupo.registrarEvento(nuevoEvento({ numero: 9, asistentes: ["beto"] }));

      expect(ana.deudaAl(dia(10))).toBe(2000);
    });

    it("mientras las nuevas reglas no rijan, los eventos se siguen rigiendo por las anteriores", () => {
      const grupo = nuevoGrupo(reglas({ montoPorFalta: 1000 }));
      const ana = grupo.ingresar("ana", dia(1));
      grupo.ingresar("beto", dia(1));
      grupo.registrarEvento(nuevoEvento({ numero: 2, asistentes: ["ana", "beto"] }));
      grupo.cambiarReglas(reglas({ rigeDesde: dia(20), montoPorFalta: 2000 }));

      grupo.registrarEvento(nuevoEvento({ numero: 9, asistentes: ["beto"] }));

      expect(ana.deudaAl(dia(10))).toBe(1000);
    });

    it("la tolerancia de faltas que se aplica en un evento es la de las reglas vigentes en su fecha", () => {
      const grupo = nuevoGrupo(reglas({ toleranciaDeFaltas: 2 }));
      const ana = grupo.ingresar("ana", dia(1));
      grupo.ingresar("beto", dia(1));
      grupo.registrarEvento(nuevoEvento({ numero: 2, asistentes: ["beto"] }));
      grupo.cobrar("ana", 1000, dia(3));
      grupo.cambiarReglas(reglas({ rigeDesde: dia(5), toleranciaDeFaltas: 1 }));

      grupo.registrarEvento(nuevoEvento({ numero: 9, asistentes: ["beto"] }));

      expect(ana.motivoDeFinalizacion()).toBe("por faltas");
    });

    it("un cambio de reglas no altera las deudas existentes", () => {
      const grupo = nuevoGrupo(reglas({ montoPorFalta: 1000 }));
      const ana = grupo.ingresar("ana", dia(1));
      grupo.ingresar("beto", dia(1));
      grupo.registrarEvento(nuevoEvento({ numero: 2, asistentes: ["beto"] }));
      grupo.cambiarReglas(
        reglas({ rigeDesde: dia(5), montoPorFalta: 2000, politicaDeInteres: new InteresFijoPorDia(10) }),
      );

      grupo.registrarEvento(nuevoEvento({ numero: 9, asistentes: ["beto"] }));

      expect(ana.estado()).toBe("moroso");
      expect(ana.deudaAl(dia(12))).toBe(1000);
    });

    it("no se puede registrar un evento anterior a que rijan las reglas iniciales", () => {
      const grupo = nuevoGrupo(reglas({ rigeDesde: dia(5) }));
      grupo.ingresar("beto", dia(1));

      expect(() => {
        grupo.registrarEvento(nuevoEvento({ numero: 2, asistentes: ["beto"] }));
      }).toThrow("No hay reglas vigentes en esa fecha");
      expect(grupo.eventos()).toEqual([]);
    });
  });

  describe("ingreso", () => {
    it("al ingresar, la persona queda como participante activo", () => {
      const grupo = nuevoGrupo();

      const ana = grupo.ingresar("ana", dia(1));

      expect(grupo.participanteActivo("ana")).toBe(ana);
      expect(grupo.participantes()).toEqual([ana]);
    });

    it("no hay participante activo para quien no ingresó", () => {
      const grupo = nuevoGrupo();

      expect(grupo.participanteActivo("ana")).toBeUndefined();
    });

    it("una persona no puede ingresar mientras tenga una participación activa", () => {
      const grupo = nuevoGrupo();
      grupo.ingresar("ana", dia(1));

      expect(() => {
        grupo.ingresar("ana", dia(2));
      }).toThrow("ana ya tiene una participación activa");
    });

    it("una persona que ya participó no puede volver a ingresar: debe reingresar", () => {
      const { grupo, ana } = grupoConAnaFinalizada();

      expect(() => {
        grupo.ingresar("ana", dia(11));
      }).toThrow("ana ya participó del grupo, debe reingresar");
      expect(grupo.participantesHistoricos()).toEqual([ana]);
    });

    it("el nombre de la persona se guarda sin espacios al principio ni al final", () => {
      const grupo = nuevoGrupo();

      const ana = grupo.ingresar("  ana ", dia(1));

      expect(ana.nombre()).toBe("ana");
      expect(grupo.participanteActivo("ana")).toBe(ana);
    });

    it("el nombre de la persona no puede estar vacío", () => {
      const grupo = nuevoGrupo();

      expect(() => {
        grupo.ingresar("   ", dia(1));
      }).toThrow("El nombre no puede estar vacío");
      expect(grupo.participantes()).toEqual([]);
    });

    it("los nombres distinguen mayúsculas de minúsculas", () => {
      const grupo = nuevoGrupo();

      const ana = grupo.ingresar("ana", dia(1));
      const anaConMayuscula = grupo.ingresar("Ana", dia(1));

      expect(grupo.participanteActivo("ana")).toBe(ana);
      expect(grupo.participanteActivo("Ana")).toBe(anaConMayuscula);
    });
  });

  describe("reingreso", () => {
    it("quien tiene la participación finalizada puede reingresar y retoma esa misma participación", () => {
      const { grupo, ana, beto } = grupoConAnaFinalizada();

      const reingresada = grupo.reingresar("ana", dia(11));

      expect(reingresada).toBe(ana);
      expect(ana.estado()).toBe("participando");
      expect(grupo.participanteActivo("ana")).toBe(ana);
      expect(grupo.participantes()).toEqual([beto, ana]);
      expect(grupo.participantesHistoricos()).toEqual([]);
    });

    it("el nombre de la persona también se toma sin espacios al principio ni al final", () => {
      const { grupo, ana } = grupoConAnaFinalizada();

      const reingresada = grupo.reingresar("  ana ", dia(11));

      expect(reingresada).toBe(ana);
      expect(grupo.participanteActivo("ana")).toBe(ana);
    });

    it("no se puede reingresar a quien tiene una participación activa", () => {
      const grupo = nuevoGrupo();
      grupo.ingresar("ana", dia(1));

      expect(() => {
        grupo.reingresar("ana", dia(2));
      }).toThrow("ana ya tiene una participación activa");
    });

    it("no se puede reingresar a quien nunca ingresó", () => {
      const grupo = nuevoGrupo();

      expect(() => {
        grupo.reingresar("ana", dia(2));
      }).toThrow("ana nunca ingresó al grupo");
    });

    it("ya participó quien tiene una participación finalizada", () => {
      const { grupo } = grupoConAnaFinalizada();

      const anaYaParticipo = grupo.yaParticipo("ana");
      const betoYaParticipo = grupo.yaParticipo("beto");
      const carlaYaParticipo = grupo.yaParticipo("carla");

      expect(anaYaParticipo).toBe(true);
      expect(betoYaParticipo).toBe(false);
      expect(carlaYaParticipo).toBe(false);
    });

    it("para saber si ya participó, el nombre se toma sin espacios al principio ni al final", () => {
      const { grupo } = grupoConAnaFinalizada();

      const yaParticipo = grupo.yaParticipo(" ana ");

      expect(yaParticipo).toBe(true);
    });

    it("quien reingresa conserva los créditos pendientes a su nombre", () => {
      const grupo = nuevoGrupo();
      const ana = grupo.ingresar("ana", dia(1));
      grupo.ingresar("beto", dia(1));
      grupo.ingresar("carla", dia(1));
      grupo.registrarEvento(nuevoEvento({ numero: 2, asistentes: ["ana", "carla"] }));
      grupo.registrarEvento(nuevoEvento({ numero: 9, asistentes: ["carla"] }));
      grupo.registrarEvento(nuevoEvento({ numero: 16, asistentes: ["carla"] }));
      grupo.cobrar("ana", 1000, dia(17));
      expect(ana.estaActivo()).toBe(false);
      grupo.cobrar("beto", 1000, dia(18));
      expect(grupo.caja().montoPendienteDe("ana")).toBe(500);

      grupo.reingresar("ana", dia(19));

      expect(grupo.caja().montoPendienteDe("ana")).toBe(500);
    });
  });

  describe("finalización", () => {
    it("una participación finalizada deja de estar activa y pasa a los participantes históricos", () => {
      const grupo = nuevoGrupo();
      const ana = grupo.ingresar("ana", dia(1));
      const beto = grupo.ingresar("beto", dia(1));
      grupo.registrarEvento(nuevoEvento({ numero: 2, asistentes: ["beto"] }));
      grupo.registrarEvento(nuevoEvento({ numero: 9, asistentes: ["beto"] }));

      grupo.cobrar("ana", 1000, dia(10));

      expect(ana.estaActivo()).toBe(false);
      expect(grupo.participanteActivo("ana")).toBeUndefined();
      expect(grupo.participantes()).toEqual([beto]);
      expect(grupo.participantesHistoricos()).toEqual([ana]);
    });

    it("quien queda finalizado por faltas al registrar un evento pasa a los participantes históricos", () => {
      const grupo = nuevoGrupo(reglas({ toleranciaDeFaltas: 2 }));
      const ana = grupo.ingresar("ana", dia(1));
      const beto = grupo.ingresar("beto", dia(1));
      grupo.registrarEvento(nuevoEvento({ numero: 2, asistentes: ["beto"] }));
      grupo.cobrar("ana", 1000, dia(3));
      grupo.registrarEvento(nuevoEvento({ numero: 9, asistentes: ["beto"] }));
      expect(ana.estaActivo()).toBe(true);

      grupo.registrarEvento(nuevoEvento({ numero: 16, asistentes: ["beto"] }));

      expect(ana.motivoDeFinalizacion()).toBe("por faltas");
      expect(grupo.participanteActivo("ana")).toBeUndefined();
      expect(grupo.participantes()).toEqual([beto]);
      expect(grupo.participantesHistoricos()).toEqual([ana]);
    });
  });

  describe("eventos", () => {
    it("registrar un evento hace ir a los asistentes y faltar al resto de los participantes activos", () => {
      const grupo = nuevoGrupo();
      const ana = grupo.ingresar("ana", dia(1));
      const beto = grupo.ingresar("beto", dia(1));
      const evento = nuevoEvento({ asistentes: ["ana"] });

      grupo.registrarEvento(evento);

      expect(ana.estado()).toBe("participando");
      expect(beto.estado()).toBe("en deuda");
      expect(grupo.eventos()).toEqual([evento]);
    });

    it("los participantes finalizados no son afectados por los eventos", () => {
      const { grupo, ana } = grupoConAnaFinalizada();
      const transicionesAlFinalizar = ana.historial().length;

      grupo.registrarEvento(nuevoEvento({ numero: 16, asistentes: ["beto"] }));

      expect(ana.historial()).toHaveLength(transicionesAlFinalizar);
    });

    it("no se puede registrar un evento anterior al último registrado", () => {
      const grupo = nuevoGrupo();
      grupo.ingresar("beto", dia(1));
      grupo.registrarEvento(nuevoEvento({ numero: 9, asistentes: ["beto"] }));

      expect(() => {
        grupo.registrarEvento(nuevoEvento({ numero: 2, asistentes: ["beto"] }));
      }).toThrow("El evento debe ser posterior al último registrado");
    });

    it("no se puede registrar un evento en la misma fecha que el último registrado", () => {
      const grupo = nuevoGrupo();
      grupo.ingresar("beto", dia(1));
      grupo.registrarEvento(nuevoEvento({ numero: 9, asistentes: ["beto"] }));

      expect(() => {
        grupo.registrarEvento(nuevoEvento({ numero: 9, asistentes: ["beto"] }));
      }).toThrow("El evento debe ser posterior al último registrado");
    });

    it("los asistentes a un evento deben ser participantes activos del grupo", () => {
      const grupo = nuevoGrupo();
      const ana = grupo.ingresar("ana", dia(1));
      const evento = nuevoEvento({ asistentes: ["ana", "alguien de afuera"] });

      expect(() => {
        grupo.registrarEvento(evento);
      }).toThrow("alguien de afuera no es un participante activo");
      expect(ana.estado()).toBe("participando");
      expect(grupo.eventos()).toEqual([]);
    });

    it("quien debe no puede figurar como asistente de un evento", () => {
      const grupo = nuevoGrupo();
      const ana = grupo.ingresar("ana", dia(1));
      const beto = grupo.ingresar("beto", dia(1));
      grupo.registrarEvento(nuevoEvento({ numero: 2, asistentes: ["beto"] }));
      expect(ana.puedeAsistir()).toBe(false);
      const evento = nuevoEvento({ numero: 9, asistentes: ["beto", "ana"] });

      expect(() => {
        grupo.registrarEvento(evento);
      }).toThrow("ana no puede asistir");
      expect(ana.estado()).toBe("en deuda");
      expect(beto.estado()).toBe("participando");
      expect(grupo.eventos()).toHaveLength(1);
    });
  });

  describe("posibles asistentes", () => {
    it("quien está en deuda es un posible asistente, y un moroso no", () => {
      const grupo = nuevoGrupo();
      grupo.ingresar("ana", dia(1));
      const beto = grupo.ingresar("beto", dia(1));
      const carla = grupo.ingresar("carla", dia(1));
      grupo.registrarEvento(nuevoEvento({ numero: 2, asistentes: ["beto", "carla"] })); // ana queda en deuda
      grupo.registrarEvento(nuevoEvento({ numero: 9, asistentes: ["beto"] })); // ana queda morosa y carla en deuda

      const posibles = grupo.posiblesAsistentes();

      expect(posibles).toEqual([beto, carla]);
    });
  });

  describe("cobros", () => {
    it("cobrar hace pagar al participante", () => {
      const grupo = nuevoGrupo();
      const ana = grupo.ingresar("ana", dia(1));
      grupo.ingresar("beto", dia(1));
      grupo.registrarEvento(nuevoEvento({ asistentes: ["beto"] }));

      grupo.cobrar("ana", 1000, dia(3));

      expect(ana.estado()).toBe("libre de deuda");
    });

    it("no se puede cobrar a quien no tiene una participación activa", () => {
      const grupo = nuevoGrupo();

      expect(() => {
        grupo.cobrar("ana", 1000, dia(3));
      }).toThrow("ana no tiene una participación activa");
    });

    it("quien está en deuda puede pagar en la puerta y asistir al mismo evento", () => {
      const grupo = nuevoGrupo();
      const ana = grupo.ingresar("ana", dia(1));
      grupo.ingresar("beto", dia(1));
      grupo.registrarEvento(nuevoEvento({ numero: 2, asistentes: ["beto"] }));
      const siguienteEvento = nuevoEvento({ numero: 9, asistentes: ["ana", "beto"] });

      grupo.cobrar("ana", 1000, siguienteEvento.fecha());
      grupo.registrarEvento(siguienteEvento);

      expect(ana.estado()).toBe("participando");
    });
  });

  describe("caja", () => {
    it("cobrar registra un cobro en efectivo por el evento faltado", () => {
      const grupo = nuevoGrupo();
      grupo.ingresar("ana", dia(1));
      grupo.ingresar("beto", dia(1));
      grupo.ingresar("carla", dia(1));
      const evento = nuevoEvento({ numero: 2, asistentes: ["beto", "carla"] });
      grupo.registrarEvento(evento);

      grupo.cobrar("ana", 1000, dia(3));

      const caja = grupo.caja();
      expect(caja.cobros()).toHaveLength(1);
      const [cobro] = caja.cobros();
      expect(cobro.deudor()).toBe("ana");
      expect(cobro.monto()).toBe(1000);
      expect(cobro.fecha()).toEqual(dia(3));
      expect(cobro.eventoFaltado()).toBe(evento);
      expect(cobro.esEnEfectivo()).toBe(true);
    });

    it("un cobro se reparte en créditos entre los asistentes al evento faltado", () => {
      const grupo = nuevoGrupo();
      grupo.ingresar("ana", dia(1));
      grupo.ingresar("beto", dia(1));
      grupo.ingresar("carla", dia(1));
      grupo.registrarEvento(nuevoEvento({ numero: 2, asistentes: ["beto", "carla"] }));

      grupo.cobrar("ana", 1000, dia(3));

      const caja = grupo.caja();
      expect(caja.montoPendienteDe("beto")).toBe(500);
      expect(caja.montoPendienteDe("carla")).toBe(500);
    });

    it("un cobro parcial también se reparte", () => {
      const grupo = nuevoGrupo();
      const ana = grupo.ingresar("ana", dia(1));
      grupo.ingresar("beto", dia(1));
      grupo.ingresar("carla", dia(1));
      grupo.registrarEvento(nuevoEvento({ numero: 2, asistentes: ["beto", "carla"] }));

      grupo.cobrar("ana", 400, dia(3));

      expect(ana.estado()).toBe("en deuda");
      expect(ana.deudaAl(dia(3))).toBe(600);
      expect(grupo.caja().montoPendienteDe("beto")).toBe(200);
      expect(grupo.caja().montoPendienteDe("carla")).toBe(200);
    });

    it("el crédito de quien debe se aplica de inmediato a su deuda como un nuevo cobro, que se vuelve a repartir", () => {
      const grupo = nuevoGrupo();
      grupo.ingresar("ana", dia(1));
      const beto = grupo.ingresar("beto", dia(1));
      grupo.ingresar("carla", dia(1));
      grupo.registrarEvento(nuevoEvento({ numero: 2, asistentes: ["beto", "carla"] }));
      const eventoQueDebeBeto = nuevoEvento({ numero: 9, asistentes: ["carla"] });
      grupo.registrarEvento(eventoQueDebeBeto);

      grupo.cobrar("ana", 1000, dia(10));

      expect(beto.deudaAl(dia(10))).toBe(500);
      const caja = grupo.caja();
      expect(caja.montoPendienteDe("beto")).toBe(0);
      expect(caja.montoPendienteDe("carla")).toBe(1000);
      expect(caja.cobros()).toHaveLength(2);
      const [cobroAAna, cobroABeto] = caja.cobros();
      expect(cobroABeto.deudor()).toBe("beto");
      expect(cobroABeto.monto()).toBe(500);
      expect(cobroABeto.fecha()).toEqual(dia(10));
      expect(cobroABeto.eventoFaltado()).toBe(eventoQueDebeBeto);
      const creditoAplicado = cobroABeto.origen() as Credito;
      expect(creditoAplicado.nombre()).toBe("beto");
      expect(creditoAplicado.estado()).toBe("aplicado");
      expect(creditoAplicado.cobro()).toBe(cobroAAna);
    });

    it("si el crédito supera la deuda, se aplica sólo hasta saldarla y el excedente queda pendiente", () => {
      const grupo = nuevoGrupo();
      grupo.ingresar("ana", dia(1));
      const beto = grupo.ingresar("beto", dia(1));
      grupo.ingresar("carla", dia(1));
      grupo.registrarEvento(nuevoEvento({ numero: 2, asistentes: ["beto", "carla"] }));
      grupo.registrarEvento(nuevoEvento({ numero: 9, asistentes: ["carla"] }));
      grupo.cobrar("beto", 600, dia(9));

      grupo.cobrar("ana", 1000, dia(10));

      expect(beto.estado()).toBe("libre de deuda");
      expect(beto.deudaAl(dia(10))).toBe(0);
      expect(grupo.caja().montoPendienteDe("beto")).toBe(100);
      expect(grupo.caja().montoPendienteDe("carla")).toBe(600 + 500 + 400);
    });

    it("saldar la deuda de un moroso con un crédito finaliza su participación por pago de morosidad", () => {
      const grupo = nuevoGrupo();
      const ana = grupo.ingresar("ana", dia(1));
      const beto = grupo.ingresar("beto", dia(1));
      grupo.ingresar("carla", dia(1));
      grupo.registrarEvento(nuevoEvento({ numero: 2, asistentes: ["beto", "carla"] }));
      grupo.registrarEvento(nuevoEvento({ numero: 9, asistentes: ["carla"] }));
      grupo.registrarEvento(nuevoEvento({ numero: 16, asistentes: ["carla"] }));
      grupo.cobrar("beto", 500, dia(16));
      expect(beto.estado()).toBe("moroso");

      grupo.cobrar("ana", 1000, dia(17));

      expect(beto.estado()).toBe("finalizado");
      expect(beto.motivoDeFinalizacion()).toBe("por pago de morosidad");
      expect(grupo.participantesHistoricos()).toEqual([ana, beto]);
      expect(grupo.caja().montoPendienteDe("beto")).toBe(0);
      expect(grupo.caja().montoPendienteDe("carla")).toBe(500 + 500 + 500);
    });

    it("quien debe no queda con créditos pendientes", () => {
      const grupo = nuevoGrupo();
      grupo.ingresar("ana", dia(1));
      const beto = grupo.ingresar("beto", dia(1));
      grupo.ingresar("carla", dia(1));
      grupo.ingresar("dario", dia(1));
      grupo.registrarEvento(nuevoEvento({ numero: 2, asistentes: ["beto", "carla", "dario"] }));
      grupo.registrarEvento(nuevoEvento({ numero: 9, asistentes: ["carla", "dario"] }));

      grupo.cobrar("ana", 300, dia(10));

      expect(beto.deudaAl(dia(10))).toBe(900);
      expect(grupo.caja().montoPendienteDe("beto")).toBe(0);
      expect(grupo.caja().totalPendiente()).toBe(300);
    });

    it("los créditos de quien ya no participa quedan pendientes a su nombre", () => {
      const grupo = nuevoGrupo(reglas({ toleranciaDeFaltas: 1 }));
      grupo.ingresar("ana", dia(1));
      const beto = grupo.ingresar("beto", dia(1));
      grupo.ingresar("carla", dia(1));
      grupo.registrarEvento(nuevoEvento({ numero: 2, asistentes: ["beto", "carla"] }));
      grupo.registrarEvento(nuevoEvento({ numero: 9, asistentes: ["carla"] }));
      grupo.cobrar("beto", 1000, dia(10));
      grupo.registrarEvento(nuevoEvento({ numero: 16, asistentes: ["carla"] }));
      expect(beto.estaActivo()).toBe(false);

      grupo.cobrar("ana", 1000, dia(17));

      expect(grupo.caja().montoPendienteDe("beto")).toBe(500);
    });

    it("no se puede cobrar en una fecha anterior al último cobro", () => {
      const grupo = nuevoGrupo();
      const ana = grupo.ingresar("ana", dia(1));
      grupo.ingresar("beto", dia(1));
      grupo.registrarEvento(nuevoEvento({ numero: 2, asistentes: ["beto"] }));
      grupo.cobrar("ana", 400, dia(5));

      expect(() => {
        grupo.cobrar("ana", 100, dia(4));
      }).toThrow("El cobro no puede ser anterior al último cobro");
      expect(ana.deudaAl(dia(5))).toBe(600);
      expect(grupo.caja().cobros()).toHaveLength(1);
    });

    it("repartir entrega los créditos pendientes de una persona y queda registrado en la caja", () => {
      const grupo = nuevoGrupo();
      grupo.ingresar("ana", dia(1));
      grupo.ingresar("beto", dia(1));
      grupo.registrarEvento(nuevoEvento({ numero: 2, asistentes: ["beto"] }));
      grupo.cobrar("ana", 1000, dia(3));

      const reparto = grupo.repartir("beto", dia(4));

      expect(reparto.monto()).toBe(1000);
      expect(grupo.caja().montoPendienteDe("beto")).toBe(0);
      expect(grupo.caja().repartos()).toEqual([reparto]);
    });
  });
});
