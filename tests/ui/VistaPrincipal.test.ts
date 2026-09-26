// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AlmacenamientoEnMemoria } from "../../src/app/AlmacenamientoEnMemoria.ts";
import type { Aplicacion } from "../../src/app/Aplicacion.ts";
import { fechaYHora } from "../../src/app/Formato.ts";
import { VistaPrincipal } from "../../src/ui/VistaPrincipal.ts";
import { InteresFijoPorDia, InteresMensual } from "../../src/models/PoliticaDeInteres.ts";
import { ahora, aplicacionConGrupo, nuevaAplicacion } from "../app/factories.ts";
import { dia, reglas } from "../models/factories.ts";

const nuevosAlmacenamientos = () => ({
  bitacora: new AlmacenamientoEnMemoria(),
  planilla: new AlmacenamientoEnMemoria(),
  pantalla: new AlmacenamientoEnMemoria(),
});

const almacenamientosConGrupoSinParticipantes = () => {
  const almacenamientos = nuevosAlmacenamientos();
  aplicacionConGrupo(almacenamientos);
  return almacenamientos;
};

// ana faltó al primer encuentro y está en deuda; beto, carla y dani están participando.
const almacenamientosConGrupo = () => {
  const almacenamientos = almacenamientosConGrupoSinParticipantes();
  const aplicacion = nuevaAplicacion(almacenamientos);
  ["ana", "beto", "carla", "dani"].forEach((nombre) => aplicacion.ingresar(nombre, dia(1)));
  aplicacion.registrarEncuentro(dia(2), ["beto", "carla", "dani"], ["ana"]);
  return almacenamientos;
};

// ana faltó dos veces y pagó su morosidad, así que ya no participa.
const almacenamientosConAnaFinalizada = () => {
  const almacenamientos = almacenamientosConGrupo();
  const aplicacion = nuevaAplicacion(almacenamientos);
  aplicacion.registrarEncuentro(dia(3), ["beto", "carla", "dani"], ["ana"]);
  aplicacion.cobrar("ana", 1000, dia(4));
  return almacenamientos;
};

const montar = (almacenamientos = nuevosAlmacenamientos()) => {
  const aplicacion = nuevaAplicacion(almacenamientos);
  const raiz = document.body.appendChild(document.createElement("div"));
  new VistaPrincipal(aplicacion, almacenamientos.pantalla, ahora).montarEn(raiz);
  return { aplicacion, almacenamientos, raiz };
};

// Como recargar la página o abrirla en otro dispositivo: sólo queda lo que hay en los almacenamientos.
const recargar = (almacenamientos: ReturnType<typeof nuevosAlmacenamientos>) => {
  document.body.replaceChildren();
  return montar(almacenamientos);
};

const textoDe = (elemento: Element) => elemento.textContent?.replace(/\s+/g, " ").trim() ?? "";

const buscar = <T extends Element>(selector: string, coincide: (texto: string) => boolean, raiz: ParentNode) =>
  [...raiz.querySelectorAll<T>(selector)].find((elemento) => coincide(textoDe(elemento)));

const elementoConTexto = <T extends Element>(selector: string, texto: string, raiz: ParentNode = document): T => {
  const encontrado = buscar<T>(selector, (textoDelElemento) => textoDelElemento === texto, raiz);
  if (encontrado === undefined) throw new Error(`No se encontró <${selector}> con el texto "${texto}"`);

  return encontrado;
};

const hayElementoConTexto = (selector: string, texto: string, raiz: ParentNode = document) =>
  buscar(selector, (textoDelElemento) => textoDelElemento === texto, raiz) !== undefined;

const hacerClic = (textoDelBoton: string, raiz: ParentNode = document) =>
  elementoConTexto<HTMLButtonElement>("button", textoDelBoton, raiz).click();

const etiqueta = (texto: string, raiz: ParentNode = document) =>
  buscar<HTMLLabelElement>("label", (textoDeLaEtiqueta) => textoDeLaEtiqueta.startsWith(texto), raiz);

const hayEtiqueta = (texto: string, raiz: ParentNode = document) => etiqueta(texto, raiz) !== undefined;

const campo = (texto: string, raiz: ParentNode = document) => {
  const control = etiqueta(texto, raiz)?.control;
  if (control == null) throw new Error(`No se encontró el campo "${texto}"`);

  return control as HTMLInputElement;
};

const completar = (etiqueta: string, valor: string, raiz: ParentNode = document) => {
  const control = campo(etiqueta, raiz);
  control.value = valor;
  control.dispatchEvent(new Event("change", { bubbles: true }));
};

// El navegador descargaría el archivo; acá se captura el contenido y se evita que el enlace navegue.
const exportar = async () => {
  const crearUrl = vi.spyOn(URL, "createObjectURL");
  const clic = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
  try {
    hacerClic("Exportar");
    const [archivo] = crearUrl.mock.calls[0];
    return await (archivo as Blob).text();
  } finally {
    crearUrl.mockRestore();
    clic.mockRestore();
  }
};

const elegirArchivo = (etiqueta: string, contenido: string) => {
  const entrada = campo(etiqueta);
  const transferencia = new DataTransfer();
  transferencia.items.add(new File([contenido], "bitacora.json", { type: "application/json" }));
  entrada.files = transferencia.files;
  entrada.dispatchEvent(new Event("change", { bubbles: true }));
};

const nombresDeParticipantes = (aplicacion: Aplicacion) =>
  aplicacion
    .grupo()
    .participantes()
    .map((participante) => participante.nombre());

const pantallaActual = (raiz: ParentNode = document) => textoDe(raiz.querySelector("main h2")!);

const hayDesplegable = (titulo: string) => hayElementoConTexto("summary", titulo);

// El cambio de hash se avisa en una tarea aparte, como en el navegador.
const esperarElCambioDeHash = () => new Promise((resolver) => setTimeout(resolver, 0));

const navegarA = async (pestania: string) => {
  elementoConTexto<HTMLAnchorElement>("nav a", pestania).click();
  await esperarElCambioDeHash();
};

const textosDeLasCeldas = (fila: Element) => [...fila.querySelectorAll("td")].map(textoDe);

const fila = (nombre: string) => {
  const fila = [...document.querySelectorAll("tbody tr")].find((fila) => textosDeLasCeldas(fila).includes(nombre));
  if (fila === undefined) throw new Error(`No se encontró la fila de "${nombre}"`);

  return fila;
};

const casillaDeAsistencia = (nombre: string) => fila(nombre).querySelector<HTMLInputElement>("input[type=checkbox]")!;

const hayDialogoAbierto = () => document.querySelector("dialog[open]") !== null;

const dialogoAbierto = () => {
  const dialogo = document.querySelector<HTMLDialogElement>("dialog[open]");
  if (dialogo === null) throw new Error("No hay un diálogo abierto");

  return dialogo;
};

const filasDe = (raiz: ParentNode) => [...raiz.querySelectorAll("tbody tr")].map(textosDeLasCeldas);

describe("VistaPrincipal", () => {
  beforeEach(() => {
    location.hash = "";
    document.body.replaceChildren();
  });

  it("las tablas sin filas no se muestran, ni el desplegable que las contiene, hasta que tienen algo que mostrar", async () => {
    const almacenamientos = almacenamientosConGrupo();
    montar(almacenamientos);
    await navegarA("Participantes");
    expect(hayDesplegable("Participaciones finalizadas")).toBe(false);
    await navegarA("Caja");
    expect(hayDesplegable("Movimientos")).toBe(false);
    await navegarA("Reglas");
    expect(hayDesplegable("Versiones anteriores")).toBe(false);

    const preparacion = nuevaAplicacion(almacenamientos);
    preparacion.registrarEncuentro(dia(3), ["beto", "carla", "dani"], ["ana"]);
    preparacion.cobrar("ana", 1000, dia(4)); // ana queda finalizada por pago de morosidad
    recargar(almacenamientos);
    await navegarA("Participantes");
    expect(hayDesplegable("Participaciones finalizadas")).toBe(true);
    expect(fila("ana")).toBeDefined();
    await navegarA("Caja");
    expect(hayDesplegable("Movimientos")).toBe(true);
  });

  it("una vista que ya no está en el documento deja de seguir la navegación", async () => {
    const { raiz } = montar(almacenamientosConGrupo());
    document.body.replaceChildren();

    location.hash = "#caja";
    await esperarElCambioDeHash();

    expect(pantallaActual(raiz)).toBe("Encuentro");
  });

  describe("formulario inicial", () => {
    it("crear el grupo, con reglas que rigen desde el momento de crearlo, muestra su nombre y las pantallas", () => {
      const { aplicacion } = montar();
      expect(document.querySelector("nav")).toBeNull();
      expect(pantallaActual()).toBe("Crear el grupo");
      expect(hayEtiqueta("Rige desde")).toBe(false);

      completar("Nombre del grupo", "Fútbol de los jueves");
      completar("¿Cuántas faltas se toleran", "2");
      completar("¿Cuánto se paga por falta?", "1000");
      hacerClic("Crear");

      expect(aplicacion.grupo().nombre()).toBe("Fútbol de los jueves");
      expect(aplicacion.grupo().reglas().toleranciaDeFaltas()).toBe(2);
      expect(aplicacion.grupo().reglas().montoPorFalta()).toBe(1000);
      expect(aplicacion.grupo().reglas().rigeDesde()).toEqual(ahora());
      expect(textoDe(document.querySelector("h1")!)).toBe("Fútbol de los jueves");
      expect([...document.querySelectorAll("nav a")].map(textoDe)).toEqual([
        "Participantes",
        "Caja",
        "Encuentro",
        "Historial",
        "Reglas",
      ]);
      expect(pantallaActual()).toBe("Encuentro");
    });

    it("el valor del interés sólo se pide para las políticas que lo usan, con la pregunta propia de cada una", () => {
      const { aplicacion } = montar();
      expect(campo("¿Cómo se calcula el interés").value).toBe("sin interés");
      expect(document.querySelector("[name=valorDelInteres]")).toBeNull();

      completar("¿Cómo se calcula el interés", "fijo por día");
      expect(hayEtiqueta("¿Cuánto se cobra por día de mora?")).toBe(true);
      expect(hayEtiqueta("¿Qué porcentaje se cobra por mes de mora?")).toBe(false);
      completar("¿Cómo se calcula el interés", "mensual");
      expect(hayEtiqueta("¿Cuánto se cobra por día de mora?")).toBe(false);
      expect(hayEtiqueta("¿Qué porcentaje se cobra por mes de mora?")).toBe(true);
      completar("¿Qué porcentaje se cobra por mes de mora?", "5");
      completar("Nombre del grupo", "Fútbol de los jueves");
      completar("¿Cuántas faltas se toleran", "2");
      completar("¿Cuánto se paga por falta?", "1000");
      hacerClic("Crear");

      const politica = aplicacion.grupo().reglas().politicaDeInteres();
      expect(politica).toBeInstanceOf(InteresMensual);
      expect((politica as InteresMensual).porcentaje()).toBe(5);
    });

    it("deshacer la creación del grupo vuelve al formulario inicial con lo que se había cargado", async () => {
      const almacenamientos = nuevosAlmacenamientos();
      nuevaAplicacion(almacenamientos).crearGrupo(
        "Fútbol de los jueves",
        reglas({ toleranciaDeFaltas: 3, montoPorFalta: 1500, politicaDeInteres: new InteresFijoPorDia(10) }),
      );
      const { aplicacion } = montar(almacenamientos);
      await navegarA("Historial");

      hacerClic("Deshacer");

      expect(aplicacion.tieneGrupo()).toBe(false);
      expect(pantallaActual()).toBe("Crear el grupo");
      expect(campo("Nombre del grupo").value).toBe("Fútbol de los jueves");
      expect(campo("¿Cuántas faltas se toleran").value).toBe("3");
      expect(campo("¿Cuánto se paga por falta?").value).toBe("1500");
      expect(campo("¿Cómo se calcula el interés").value).toBe("fijo por día");
      expect(hayEtiqueta("¿Cuánto se cobra por día de mora?")).toBe(true);
      expect(campo("¿Cuánto se cobra por día de mora?").value).toBe("10");
    });
  });

  describe("pantalla de participantes", () => {
    it("registrar un participante y reingresar a uno finalizado se fechan en el momento en que se hacen", async () => {
      const { aplicacion } = montar(almacenamientosConAnaFinalizada());
      await navegarA("Participantes");

      hacerClic("Registrar participante");
      expect(hayEtiqueta("Fecha", dialogoAbierto())).toBe(false);
      completar("Nombre", "gus", dialogoAbierto());
      hacerClic("Registrar", dialogoAbierto());
      hacerClic("Reingresar", fila("ana"));

      expect(aplicacion.grupo().participanteActivo("gus")?.historial().at(0)?.fecha()).toEqual(ahora());
      expect(aplicacion.grupo().participanteActivo("ana")?.fechaDelUltimoCambio()).toEqual(ahora());
    });

    it("reingresar no pide confirmación", async () => {
      const { aplicacion } = montar(almacenamientosConAnaFinalizada());
      await navegarA("Participantes");

      hacerClic("Reingresar", fila("ana"));

      expect(hayDialogoAbierto()).toBe(false);
      expect(aplicacion.grupo().participanteActivo("ana")?.estado()).toBe("participando");
    });

    it("sin participaciones activas dice que todavía no hay nadie", async () => {
      montar(almacenamientosConGrupoSinParticipantes());

      await navegarA("Participantes");

      expect(hayElementoConTexto("p", "Todavía no hay nadie")).toBe(true);
      expect(document.querySelector("table")).toBeNull();
    });
  });

  describe("pantalla de caja", () => {
    it("se puede cobrar a un moroso, y sigue en la tabla mientras deba", async () => {
      const almacenamientos = almacenamientosConGrupo();
      nuevaAplicacion(almacenamientos).registrarEncuentro(dia(3), ["beto", "carla", "dani"], ["ana"]); // ana queda morosa
      const { aplicacion } = montar(almacenamientos);
      await navegarA("Caja");
      expect(textosDeLasCeldas(fila("ana"))).toEqual(["ana", "moroso", "-$ 1.000", "Cobrar"]);

      hacerClic("Cobrar", fila("ana"));
      expect(campo("Monto", dialogoAbierto()).value).toBe("1000");
      expect(hayEtiqueta("Fecha", dialogoAbierto())).toBe(false);
      completar("Monto", "400", dialogoAbierto());
      hacerClic("Cobrar", dialogoAbierto());

      expect(aplicacion.grupo().participanteActivo("ana")?.deudaAl(ahora())).toBe(600);
      expect(textosDeLasCeldas(fila("ana"))).toEqual(["ana", "moroso", "-$ 600", "Cobrar"]);
    });

    it("los saldos muestran primero a quienes deben y después a quienes tienen por recibir, cada grupo por nombre, incluso si ya no participan", async () => {
      const almacenamientos = almacenamientosConGrupo();
      const preparacion = nuevaAplicacion(almacenamientos);
      preparacion.registrarEncuentro(dia(3), ["carla", "dani"], ["ana", "beto"]); // ana queda morosa
      preparacion.ingresar("fede", dia(3));
      preparacion.ingresar("eva", dia(3));
      preparacion.registrarEncuentro(dia(4), ["carla", "dani"], ["beto", "fede", "eva"]); // beto queda moroso
      preparacion.cobrar("beto", 1000, dia(4)); // beto queda finalizado
      preparacion.cobrar("ana", 1000, dia(5)); // beto recibe su parte por haber ido al primer encuentro
      montar(almacenamientos);

      await navegarA("Caja");

      expect(hayElementoConTexto("p > span", "Por cobrar $ 2.000")).toBe(true);
      expect(hayElementoConTexto("p > span", "Por repartir $ 2.000")).toBe(true);
      expect(filasDe(elementoConTexto("caption", "Saldos").parentElement!)).toEqual([
        ["eva", "en deuda", "-$ 1.000", "Cobrar"],
        ["fede", "en deuda", "-$ 1.000", "Cobrar"],
        ["beto", "finalizado", "$ 334", "Repartir"],
        ["carla", "participando", "$ 833", "Repartir"],
        ["dani", "participando", "$ 833", "Repartir"],
      ]);
    });

    it("repartir entrega los créditos pendientes y queda entre los movimientos, que no incluyen los cobros hechos con créditos", async () => {
      const almacenamientos = almacenamientosConGrupo();
      const preparacion = nuevaAplicacion(almacenamientos);
      preparacion.cobrar("ana", 1000, dia(3)); // beto recibe 334, carla y dani 333
      preparacion.registrarEncuentro(dia(4), ["beto", "carla"], ["ana", "dani"]); // el crédito de dani se aplica a su deuda
      const { aplicacion } = montar(almacenamientos);
      await navegarA("Caja");

      hacerClic("Repartir", fila("beto"));
      expect(textoDe(dialogoAbierto())).toContain("Se le van a entregar $ 501.");
      hacerClic("Repartir", dialogoAbierto());

      expect(aplicacion.grupo().caja().montoPendienteDe("beto")).toBe(0);
      expect(filasDe(elementoConTexto("summary", "Movimientos").parentElement!)).toEqual([
        [fechaYHora(ahora()), "beto", "reparto", "$ 501"],
        [fechaYHora(dia(3)), "ana", "cobro", "$ 1.000"],
      ]);
    });

    it("sin saldos dice que no hay nada para cobrar ni repartir", async () => {
      montar(almacenamientosConGrupoSinParticipantes());

      await navegarA("Caja");

      expect(hayElementoConTexto("p", "No hay nada para cobrar ni repartir")).toBe(true);
      expect(document.querySelector("table")).toBeNull();
    });
  });

  describe("pantalla del encuentro", () => {
    it("antes de empezar el encuentro sólo se puede empezarlo", () => {
      montar(almacenamientosConGrupo());

      const botones = [...document.querySelectorAll("main button")].map(textoDe);

      expect(botones).toEqual(["Empezar encuentro"]);
      expect(document.querySelector("main table")).toBeNull();
    });

    it("empezar el encuentro abre la planilla de asistencia sin nadie marcado", () => {
      const { aplicacion } = montar(almacenamientosConGrupo());

      hacerClic("Empezar encuentro");

      expect(aplicacion.tienePlanillaDeAsistencia()).toBe(true);
      expect(casillaDeAsistencia("beto").checked).toBe(false);
      expect(hayElementoConTexto("button", "Empezar encuentro")).toBe(false);
    });

    it("registrar el encuentro toma como presentes a los marcados, incluso a quien pagó en la puerta, y descarta la planilla de asistencia", () => {
      const { aplicacion, almacenamientos } = montar(almacenamientosConGrupo());
      expect(pantallaActual()).toBe("Encuentro");

      hacerClic("Empezar encuentro");
      casillaDeAsistencia("beto").click();
      casillaDeAsistencia("carla").click();
      expect(casillaDeAsistencia("ana").disabled).toBe(true);
      hacerClic("Cobrar y habilitar", fila("ana"));
      expect(campo("Monto", dialogoAbierto()).value).toBe("1000");
      hacerClic("Cobrar", dialogoAbierto());
      expect(casillaDeAsistencia("ana").disabled).toBe(false);
      expect(casillaDeAsistencia("ana").checked).toBe(true);
      hacerClic("Registrar encuentro");
      expect(textoDe(dialogoAbierto())).toContain("Quedan ausentes: dani.");
      hacerClic("Confirmar", dialogoAbierto());

      const [, encuentro] = aplicacion.grupo().encuentros();
      expect(encuentro.fecha()).toEqual(ahora());
      expect(encuentro.asistentes()).toEqual(new Set(["beto", "carla", "ana"]));
      expect(aplicacion.grupo().participanteActivo("dani")?.estado()).toBe("en deuda");
      expect(almacenamientos.planilla.leer()).toBeUndefined();
      expect(hayElementoConTexto("button", "Empezar encuentro")).toBe(true);
    });

    it("cancelar el encuentro sin nadie marcado lo descarta sin pedir confirmación", () => {
      const { aplicacion, almacenamientos } = montar(almacenamientosConGrupo());
      hacerClic("Empezar encuentro");

      hacerClic("Descartar");

      expect(hayDialogoAbierto()).toBe(false);
      expect(aplicacion.tienePlanillaDeAsistencia()).toBe(false);
      expect(almacenamientos.planilla.leer()).toBeUndefined();
      expect(hayElementoConTexto("button", "Empezar encuentro")).toBe(true);
    });

    it("descartar el encuentro con alguien marcado pide confirmación antes de descartar las marcas", () => {
      const { aplicacion } = montar(almacenamientosConGrupo());
      hacerClic("Empezar encuentro");
      casillaDeAsistencia("beto").click();

      hacerClic("Descartar");
      expect(textoDe(dialogoAbierto().querySelector("h3")!)).toBe("Cancelar encuentro");
      expect(textoDe(dialogoAbierto())).toContain("Se van a perder las marcas de asistencia.");
      hacerClic("Descartar", dialogoAbierto());

      expect(aplicacion.tienePlanillaDeAsistencia()).toBe(false);
      expect(hayElementoConTexto("button", "Empezar encuentro")).toBe(true);
    });

    it("la confirmación del registro dice que el encuentro lleva la fecha del momento de registrarlo", () => {
      montar(almacenamientosConGrupo());
      hacerClic("Empezar encuentro");

      hacerClic("Registrar encuentro");

      expect(textoDe(dialogoAbierto())).toContain(`Se va a registrar el encuentro con fecha ${fechaYHora(ahora())}.`);
    });

    it("la confirmación del registro nombra a los posibles asistentes sin marcar, incluso a quien está en deuda", () => {
      const almacenamientos = almacenamientosConGrupo();
      const preparacion = nuevaAplicacion(almacenamientos);
      preparacion.ingresar("eva", dia(2));
      preparacion.registrarEncuentro(dia(3), ["beto", "carla", "dani"], ["ana", "eva"]); // ana queda morosa y eva en deuda
      montar(almacenamientos);

      hacerClic("Empezar encuentro");
      casillaDeAsistencia("beto").click();
      hacerClic("Registrar encuentro");

      expect(textoDe(dialogoAbierto())).toContain("Quedan ausentes: carla, dani, eva.");
      expect(textoDe(dialogoAbierto())).not.toContain("ana");
    });

    it("si sólo quedan sin marcar los morosos, la confirmación del registro dice que nadie queda ausente", () => {
      const almacenamientos = almacenamientosConGrupo();
      nuevaAplicacion(almacenamientos).registrarEncuentro(dia(3), ["beto", "carla", "dani"], ["ana"]);
      montar(almacenamientos);

      hacerClic("Empezar encuentro");
      ["beto", "carla", "dani"].forEach((nombre) => casillaDeAsistencia(nombre).click());
      hacerClic("Registrar encuentro");

      expect(textoDe(dialogoAbierto())).toContain("Nadie queda ausente.");
    });

    it("la planilla de asistencia sobrevive a una recarga y vuelve a abrir la pantalla del encuentro", () => {
      const almacenamientos = almacenamientosConGrupo();
      montar(almacenamientos);
      hacerClic("Empezar encuentro");
      casillaDeAsistencia("beto").click();
      almacenamientos.pantalla.guardar("participantes");

      recargar(almacenamientos);

      expect(pantallaActual()).toBe("Encuentro");
      expect(casillaDeAsistencia("beto").checked).toBe(true);
      expect(casillaDeAsistencia("carla").checked).toBe(false);
    });

    it("sin posibles asistentes dice que todavía no hay nadie", async () => {
      montar(almacenamientosConGrupoSinParticipantes());
      await navegarA("Encuentro");

      hacerClic("Empezar encuentro");

      expect(hayElementoConTexto("p", "Todavía no hay nadie")).toBe(true);
      expect(document.querySelector("table")).toBeNull();
    });
  });

  describe("pantalla de reglas", () => {
    it("las reglas cambiadas rigen desde el momento del cambio", async () => {
      const { aplicacion } = montar(almacenamientosConGrupo());
      await navegarA("Reglas");
      expect(hayEtiqueta("Rige desde")).toBe(false);

      completar("¿Cuánto se paga por falta?", "1500");
      hacerClic("Cambiar reglas");

      expect(aplicacion.grupo().reglas().montoPorFalta()).toBe(1500);
      expect(aplicacion.grupo().reglas().rigeDesde()).toEqual(ahora());
    });

    it("el interés fijo por día se muestra como un monto en pesos", async () => {
      const almacenamientos = nuevosAlmacenamientos();
      nuevaAplicacion(almacenamientos).crearGrupo(
        "Fútbol de los jueves",
        reglas({ politicaDeInteres: new InteresFijoPorDia(1000) }),
      );
      montar(almacenamientos);

      await navegarA("Reglas");

      expect(hayElementoConTexto("dd", "$ 1.000 por día de mora")).toBe(true);
    });
  });

  describe("pantalla del historial", () => {
    it("deshacer el registro de un encuentro restaura su planilla de asistencia", async () => {
      const { aplicacion } = montar(almacenamientosConGrupo());
      await navegarA("Historial");
      expect(pantallaActual()).toBe("Historial");

      hacerClic("Deshacer");

      expect(aplicacion.grupo().encuentros()).toEqual([]);
      expect(pantallaActual()).toBe("Encuentro");
      expect(["ana", "beto", "carla", "dani"].map((nombre) => casillaDeAsistencia(nombre).checked)).toEqual([
        false,
        true,
        true,
        true,
      ]);
    });

    it("deshacer un comando que no es un registro de encuentro, con una planilla empezada, deja la pantalla del historial", async () => {
      const almacenamientos = almacenamientosConGrupo();
      const preparacion = nuevaAplicacion(almacenamientos);
      preparacion.empezarPlanillaDeAsistencia().marcarComoPresente("beto");
      preparacion.cobrar("ana", 500, dia(3));
      montar(almacenamientos);
      await navegarA("Historial");

      hacerClic("Deshacer");

      expect(pantallaActual()).toBe("Historial");
    });

    it("deshacer un comando que no es un registro de encuentro, sin planilla empezada, deja la pantalla del historial", async () => {
      const almacenamientos = almacenamientosConGrupo();
      nuevaAplicacion(almacenamientos).cobrar("ana", 500, dia(3));
      montar(almacenamientos);
      await navegarA("Historial");

      hacerClic("Deshacer");

      expect(pantallaActual()).toBe("Historial");
    });

    it("un encuentro registrado dice cuántos vinieron de los posibles asistentes, y su detalle quién estuvo presente y quién ausente", async () => {
      montar(almacenamientosConGrupo());
      await navegarA("Historial");

      hacerClic("Ver", fila("Encuentro con 3/4 presentes"));
      expect(textoDe(dialogoAbierto().querySelector("h3")!)).toBe(`Encuentro del ${fechaYHora(dia(2))}`);
      expect([...dialogoAbierto().querySelectorAll("th")].map(textoDe)).toEqual(["Nombre", "Asistencia"]);
      expect(filasDe(dialogoAbierto())).toEqual([
        ["ana", "Ausente"],
        ["beto", "Presente"],
        ["carla", "Presente"],
        ["dani", "Presente"],
      ]);
      hacerClic("Cerrar", dialogoAbierto());

      expect(document.querySelector("dialog")).toBeNull();
    });

    it("importar en un dispositivo nuevo lo exportado en otro reproduce los mismos participantes", async () => {
      const { aplicacion: original } = montar(almacenamientosConGrupo());
      await navegarA("Historial");
      const exportado = await exportar();
      const almacenamientos = nuevosAlmacenamientos();
      nuevaAplicacion(almacenamientos).crearGrupo("Otro grupo", reglas());
      const { aplicacion } = recargar(almacenamientos);
      await navegarA("Historial");

      elegirArchivo("Importar", exportado);
      await vi.waitFor(() => dialogoAbierto());
      expect(textoDe(dialogoAbierto())).toContain("reemplazar");
      hacerClic("Reemplazar", dialogoAbierto());

      expect(aplicacion.grupo().nombre()).toBe("Fútbol de los jueves");
      expect(nombresDeParticipantes(aplicacion)).toEqual(nombresDeParticipantes(original));
      expect(aplicacion.grupo().participanteActivo("ana")?.estado()).toBe("en deuda");
      expect(textoDe(document.querySelector("h1")!)).toBe("Fútbol de los jueves");
    });
  });
});
