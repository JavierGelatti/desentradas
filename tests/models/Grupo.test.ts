import { describe, expect, it } from "vitest";
import { Grupo } from "../../src/models/Grupo.ts";
import { InteresFijoPorDia } from "../../src/models/PoliticaDeInteres.ts";
import { dia, nuevoEvento, reglas } from "./factories.ts";

const nuevoGrupo = (toleranciaDeFaltas = 2) => new Grupo(reglas({ toleranciaDeFaltas }));

describe("Grupo", () => {
  describe("reglas", () => {
    it("se crea con sus reglas iniciales, que son la única versión del historial", () => {
      const reglasIniciales = reglas();

      const grupo = new Grupo(reglasIniciales);

      expect(grupo.reglas()).toBe(reglasIniciales);
      expect(grupo.historialDeReglas()).toEqual([reglasIniciales]);
    });

    it("cambiar las reglas después de un evento agrega una versión al historial", () => {
      const reglasIniciales = reglas();
      const grupo = new Grupo(reglasIniciales);
      grupo.ingresar("beto", dia(1));
      grupo.registrarEvento(nuevoEvento({ numero: 2, asistentes: ["beto"] }));
      const nuevasReglas = reglas({ rigeDesde: dia(3) });

      grupo.cambiarReglas(nuevasReglas);

      expect(grupo.reglas()).toBe(nuevasReglas);
      expect(grupo.historialDeReglas()).toEqual([reglasIniciales, nuevasReglas]);
    });

    it("las nuevas reglas deben regir desde después del último evento registrado", () => {
      const reglasIniciales = reglas();
      const grupo = new Grupo(reglasIniciales);
      grupo.ingresar("beto", dia(1));
      grupo.registrarEvento(nuevoEvento({ numero: 9, asistentes: ["beto"] }));

      expect(() => {
        grupo.cambiarReglas(reglas({ rigeDesde: dia(9) }));
      }).toThrow("Las nuevas reglas deben regir desde después del último evento registrado");
      expect(grupo.historialDeReglas()).toEqual([reglasIniciales]);
    });

    it("las nuevas reglas pueden regir desde una fecha futura", () => {
      const grupo = new Grupo(reglas());
      grupo.ingresar("beto", dia(1));
      grupo.registrarEvento(nuevoEvento({ numero: 2, asistentes: ["beto"] }));
      const nuevasReglas = reglas({ rigeDesde: dia(30) });

      grupo.cambiarReglas(nuevasReglas);

      expect(grupo.reglas()).toBe(nuevasReglas);
    });

    it("si no hubo eventos desde que rige la versión actual, las nuevas reglas la reemplazan", () => {
      const reglasIniciales = reglas();
      const grupo = new Grupo(reglasIniciales);
      grupo.ingresar("beto", dia(1));
      grupo.registrarEvento(nuevoEvento({ numero: 2, asistentes: ["beto"] }));
      grupo.cambiarReglas(reglas({ rigeDesde: dia(3) }));
      const reglasDefinitivas = reglas({ rigeDesde: dia(4) });

      grupo.cambiarReglas(reglasDefinitivas);

      expect(grupo.historialDeReglas()).toEqual([reglasIniciales, reglasDefinitivas]);
    });

    it("las reglas iniciales también se reemplazan si todavía no hubo eventos", () => {
      const grupo = new Grupo(reglas());
      const reglasDefinitivas = reglas({ rigeDesde: dia(4) });

      grupo.cambiarReglas(reglasDefinitivas);

      expect(grupo.historialDeReglas()).toEqual([reglasDefinitivas]);
    });

    it("las faltas a un evento se rigen por las reglas vigentes en su fecha", () => {
      const grupo = new Grupo(reglas({ montoPorFalta: 1000 }));
      const ana = grupo.ingresar("ana", dia(1));
      grupo.ingresar("beto", dia(1));
      grupo.registrarEvento(nuevoEvento({ numero: 2, asistentes: ["ana", "beto"] }));
      grupo.cambiarReglas(reglas({ rigeDesde: dia(5), montoPorFalta: 2000 }));

      grupo.registrarEvento(nuevoEvento({ numero: 9, asistentes: ["beto"] }));

      expect(ana.deudaAl(dia(10))).toBe(2000);
    });

    it("un evento anterior a que rijan las nuevas reglas se rige por las anteriores", () => {
      const grupo = new Grupo(reglas({ montoPorFalta: 1000 }));
      const ana = grupo.ingresar("ana", dia(1));
      grupo.ingresar("beto", dia(1));
      grupo.registrarEvento(nuevoEvento({ numero: 2, asistentes: ["ana", "beto"] }));
      grupo.cambiarReglas(reglas({ rigeDesde: dia(20), montoPorFalta: 2000 }));

      grupo.registrarEvento(nuevoEvento({ numero: 9, asistentes: ["beto"] }));

      expect(ana.deudaAl(dia(10))).toBe(1000);
    });

    it("la tolerancia de faltas que se aplica en un evento es la de las reglas vigentes en su fecha", () => {
      const grupo = new Grupo(reglas({ toleranciaDeFaltas: 2 }));
      const ana = grupo.ingresar("ana", dia(1));
      grupo.ingresar("beto", dia(1));
      grupo.registrarEvento(nuevoEvento({ numero: 2, asistentes: ["beto"] }));
      grupo.registrarPago("ana", dia(3));
      grupo.cambiarReglas(reglas({ rigeDesde: dia(5), toleranciaDeFaltas: 1 }));

      grupo.registrarEvento(nuevoEvento({ numero: 9, asistentes: ["beto"] }));

      expect(ana.motivoDeFinalizacion()).toBe("por faltas");
    });

    it("un cambio de reglas no altera las deudas existentes", () => {
      const grupo = new Grupo(reglas({ montoPorFalta: 1000 }));
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
      const grupo = new Grupo(reglas({ rigeDesde: dia(5) }));
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
  });

  describe("finalización", () => {
    it("una participación finalizada deja de estar activa y pasa a los participantes históricos", () => {
      const grupo = nuevoGrupo();
      const ana = grupo.ingresar("ana", dia(1));
      const beto = grupo.ingresar("beto", dia(1));
      grupo.registrarEvento(nuevoEvento({ numero: 2, asistentes: ["beto"] }));
      grupo.registrarEvento(nuevoEvento({ numero: 9, asistentes: ["beto"] }));

      grupo.registrarPago("ana", dia(10));

      expect(ana.estaActivo()).toBe(false);
      expect(grupo.participanteActivo("ana")).toBeUndefined();
      expect(grupo.participantes()).toEqual([beto]);
      expect(grupo.participantesHistoricos()).toEqual([ana]);
    });

    it("una persona puede volver a ingresar una vez finalizada su participación", () => {
      const grupo = nuevoGrupo();
      const primeraParticipacion = grupo.ingresar("ana", dia(1));
      const beto = grupo.ingresar("beto", dia(1));
      grupo.registrarEvento(nuevoEvento({ numero: 2, asistentes: ["beto"] }));
      grupo.registrarEvento(nuevoEvento({ numero: 9, asistentes: ["beto"] }));
      grupo.registrarPago("ana", dia(10));
      expect(primeraParticipacion.estaActivo()).toBe(false);

      const segundaParticipacion = grupo.ingresar("ana", dia(11));

      expect(grupo.participanteActivo("ana")).toBe(segundaParticipacion);
      expect(grupo.participantes()).toEqual([beto, segundaParticipacion]);
      expect(grupo.participantesHistoricos()).toEqual([primeraParticipacion]);
    });

    it("quien queda finalizado por faltas al registrar un evento pasa a los participantes históricos", () => {
      const grupo = nuevoGrupo(2);
      const ana = grupo.ingresar("ana", dia(1));
      const beto = grupo.ingresar("beto", dia(1));
      grupo.registrarEvento(nuevoEvento({ numero: 2, asistentes: ["beto"] }));
      grupo.registrarPago("ana", dia(3));
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
      const grupo = nuevoGrupo();
      const ana = grupo.ingresar("ana", dia(1));
      grupo.ingresar("beto", dia(1));
      grupo.registrarEvento(nuevoEvento({ numero: 2, asistentes: ["beto"] }));
      grupo.registrarEvento(nuevoEvento({ numero: 9, asistentes: ["beto"] }));
      grupo.registrarPago("ana", dia(10));
      expect(ana.estado()).toBe("finalizado");
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

  describe("pagos", () => {
    it("registrar un pago hace pagar al participante", () => {
      const grupo = nuevoGrupo();
      const ana = grupo.ingresar("ana", dia(1));
      grupo.ingresar("beto", dia(1));
      grupo.registrarEvento(nuevoEvento({ asistentes: ["beto"] }));

      grupo.registrarPago("ana", dia(3));

      expect(ana.estado()).toBe("libre de deuda");
    });

    it("no se puede registrar un pago de quien no tiene una participación activa", () => {
      const grupo = nuevoGrupo();

      expect(() => {
        grupo.registrarPago("ana", dia(3));
      }).toThrow("ana no tiene una participación activa");
    });

    it("quien debe puede pagar en la puerta y asistir al mismo evento", () => {
      const grupo = nuevoGrupo();
      const ana = grupo.ingresar("ana", dia(1));
      grupo.ingresar("beto", dia(1));
      grupo.registrarEvento(nuevoEvento({ numero: 2, asistentes: ["beto"] }));
      const siguienteEvento = nuevoEvento({ numero: 9, asistentes: ["ana", "beto"] });

      grupo.registrarPago("ana", siguienteEvento.fecha());
      grupo.registrarEvento(siguienteEvento);

      expect(ana.estado()).toBe("participando");
    });
  });
});
