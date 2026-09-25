// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AlmacenamientoEnMemoria } from "../../src/app/AlmacenamientoEnMemoria.ts";
import { Aplicacion } from "../../src/app/Aplicacion.ts";
import { VistaPrincipal } from "../../src/ui/VistaPrincipal.ts";
import { aEntradaDeFecha } from "../../src/ui/Formato.ts";
import { InteresFijoPorDia, InteresMensual } from "../../src/models/PoliticaDeInteres.ts";
import { ahora, nuevoBorrador } from "../app/factories.ts";
import { desempate, dia, reglas } from "../models/factories.ts";

const nuevosAlmacenamientos = () => ({
  bitacora: new AlmacenamientoEnMemoria(),
  borrador: new AlmacenamientoEnMemoria(),
  pantalla: new AlmacenamientoEnMemoria(),
});

type Almacenamientos = ReturnType<typeof nuevosAlmacenamientos>;

const nuevaAplicacion = (almacenamientos: Almacenamientos) =>
  new Aplicacion(almacenamientos.bitacora, desempate, nuevoBorrador(almacenamientos.borrador));

// ana faltó al primer evento y está en deuda; beto, carla y dani están participando.
const almacenamientosConGrupo = () => {
  const almacenamientos = nuevosAlmacenamientos();
  const aplicacion = nuevaAplicacion(almacenamientos);
  aplicacion.crearGrupo("Fútbol de los jueves", reglas());
  ["ana", "beto", "carla", "dani"].forEach((nombre) => aplicacion.ingresar(nombre, dia(1)));
  aplicacion.cerrarEvento(dia(2), ["beto", "carla", "dani"]);
  return almacenamientos;
};

const montar = (almacenamientos = nuevosAlmacenamientos()) => {
  const aplicacion = nuevaAplicacion(almacenamientos);
  const vista = new VistaPrincipal(aplicacion, almacenamientos.pantalla, ahora);
  vista.montarEn(document.body);
  return { aplicacion, almacenamientos };
};

const textoDe = (elemento: Element) => elemento.textContent?.replace(/\s+/g, " ").trim() ?? "";

const elementoConTexto = <T extends Element>(selector: string, texto: string, raiz: ParentNode = document): T => {
  const encontrado = [...raiz.querySelectorAll<T>(selector)].find((elemento) => textoDe(elemento) === texto);
  if (encontrado === undefined) throw new Error(`No se encontró <${selector}> con el texto "${texto}"`);

  return encontrado;
};

const hayElementoConTexto = (selector: string, texto: string, raiz: ParentNode = document) =>
  [...raiz.querySelectorAll(selector)].some((elemento) => textoDe(elemento) === texto);

const boton = (texto: string, raiz: ParentNode = document) =>
  elementoConTexto<HTMLButtonElement>("button", texto, raiz);

const hacerClic = (textoDelBoton: string, raiz: ParentNode = document) => boton(textoDelBoton, raiz).click();

const etiqueta = (texto: string, raiz: ParentNode = document) => {
  const label = [...raiz.querySelectorAll("label")].find((label) => textoDe(label).startsWith(texto));
  if (label === undefined) throw new Error(`No se encontró la etiqueta "${texto}"`);

  return label;
};

const hayEtiqueta = (texto: string, raiz: ParentNode = document) =>
  [...raiz.querySelectorAll("label")].some((label) => textoDe(label).startsWith(texto));

const campo = (texto: string, raiz: ParentNode = document) => {
  const label = etiqueta(texto, raiz);
  if (label.control == null) throw new Error(`No se encontró el campo "${texto}"`);

  return label.control as HTMLInputElement;
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

const pantallaActual = () => textoDe(document.querySelector("main h2")!);

const hayDesplegable = (titulo: string) => hayElementoConTexto("summary", titulo);

// El cambio de hash se avisa en una tarea aparte, como en el navegador.
const navegarA = async (pestania: string) => {
  elementoConTexto<HTMLAnchorElement>("nav a", pestania).click();
  await new Promise((resolver) => setTimeout(resolver, 0));
};

const fila = (nombre: string) => {
  const fila = [...document.querySelectorAll("tbody tr")].find((fila) =>
    [...fila.querySelectorAll("td")].some((celda) => textoDe(celda) === nombre),
  );
  if (fila === undefined) throw new Error(`No se encontró la fila de "${nombre}"`);

  return fila;
};

const casillaDeAsistencia = (nombre: string) => fila(nombre).querySelector<HTMLInputElement>("input[type=checkbox]")!;

const dialogoAbierto = () => {
  const dialogo = document.querySelector<HTMLDialogElement>("dialog[open]");
  if (dialogo === null) throw new Error("No hay un diálogo abierto");

  return dialogo;
};

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
    await navegarA("Repartos");
    expect(document.querySelector("table")).toBeNull();
    expect(hayDesplegable("Repartos hechos")).toBe(false);
    await navegarA("Reglas");
    expect(hayDesplegable("Versiones anteriores")).toBe(false);

    const preparacion = nuevaAplicacion(almacenamientos);
    preparacion.cerrarEvento(dia(3), ["beto", "carla", "dani"]);
    preparacion.cobrar("ana", 1000, dia(4));
    document.body.replaceChildren();
    montar(almacenamientos);
    await navegarA("Participantes");
    expect(hayDesplegable("Participaciones finalizadas")).toBe(true);
    expect(fila("ana")).toBeDefined();
  });

  describe("formulario inicial", () => {
    it("crear el grupo, con reglas que rigen desde ahora, muestra su nombre y las pantallas", () => {
      const { aplicacion } = montar();
      expect(document.querySelector("nav")).toBeNull();
      expect(pantallaActual()).toBe("Crear el grupo");
      expect(hayEtiqueta("Rige desde")).toBe(false);

      completar("Nombre del grupo", "Fútbol de los jueves");
      completar("Tolerancia de faltas", "2");
      completar("Monto por falta", "1000");
      hacerClic("Crear");

      expect(aplicacion.grupo().nombre()).toBe("Fútbol de los jueves");
      expect(aplicacion.grupo().reglas().toleranciaDeFaltas()).toBe(2);
      expect(aplicacion.grupo().reglas().montoPorFalta()).toBe(1000);
      expect(aplicacion.grupo().reglas().rigeDesde()).toEqual(ahora());
      expect(textoDe(document.querySelector("h1")!)).toBe("Fútbol de los jueves");
      expect([...document.querySelectorAll("nav a")].map(textoDe)).toEqual([
        "Participantes",
        "Repartos",
        "Evento",
        "Historial",
        "Reglas",
      ]);
      expect(pantallaActual()).toBe("Evento");
    });

    it("el valor del interés sólo se pide para las políticas que lo usan, con el nombre propio de cada una", () => {
      const { aplicacion } = montar();
      expect(campo("Interés").value).toBe("sin interés");
      expect(document.querySelector("[name=valorDelInteres]")).toBeNull();

      completar("Interés", "fijo por día");
      expect(hayEtiqueta("Monto por día")).toBe(true);
      expect(hayEtiqueta("Porcentaje mensual")).toBe(false);
      completar("Interés", "mensual");
      expect(hayEtiqueta("Monto por día")).toBe(false);
      expect(hayEtiqueta("Porcentaje mensual")).toBe(true);
      completar("Porcentaje mensual", "5");
      completar("Nombre del grupo", "Fútbol de los jueves");
      completar("Tolerancia de faltas", "2");
      completar("Monto por falta", "1000");
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
      expect(campo("Tolerancia de faltas").value).toBe("3");
      expect(campo("Monto por falta").value).toBe("1500");
      expect(campo("Interés").value).toBe("fijo por día");
      expect(hayEtiqueta("Monto por día")).toBe(true);
      expect(campo("Monto por día").value).toBe("10");
    });
  });

  describe("pantalla de participantes", () => {
    it("registrar un participante y reingresar a uno finalizado se hacen con la fecha actual", async () => {
      const almacenamientos = almacenamientosConGrupo();
      const preparacion = nuevaAplicacion(almacenamientos);
      preparacion.cerrarEvento(dia(3), ["beto", "carla", "dani"]);
      preparacion.cobrar("ana", 1000, dia(4)); // ana queda finalizada por pago de morosidad
      const { aplicacion } = montar(almacenamientos);
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
      const almacenamientos = almacenamientosConGrupo();
      const preparacion = nuevaAplicacion(almacenamientos);
      preparacion.cerrarEvento(dia(3), ["beto", "carla", "dani"]);
      preparacion.cobrar("ana", 1000, dia(4)); // ana queda finalizada por pago de morosidad
      const { aplicacion } = montar(almacenamientos);
      await navegarA("Participantes");

      hacerClic("Reingresar", fila("ana"));

      expect(document.querySelector("dialog[open]")).toBeNull();
      expect(aplicacion.grupo().participanteActivo("ana")?.estado()).toBe("participando");
    });

    it("se puede cobrar a un moroso, y sigue en la tabla mientras deba", async () => {
      const almacenamientos = almacenamientosConGrupo();
      nuevaAplicacion(almacenamientos).cerrarEvento(dia(3), ["beto", "carla", "dani"]);
      const { aplicacion } = montar(almacenamientos);
      await navegarA("Participantes");
      expect(textoDe(fila("ana"))).toContain("moroso");

      hacerClic("Cobrar", fila("ana"));
      expect(campo("Monto", dialogoAbierto()).value).toBe("1000");
      completar("Monto", "400", dialogoAbierto());
      hacerClic("Cobrar", dialogoAbierto());

      expect(aplicacion.grupo().participanteActivo("ana")?.deudaAl(ahora())).toBe(600);
      expect(textoDe(fila("ana"))).toContain("moroso");
      expect(boton("Cobrar", fila("ana"))).toBeDefined();
    });
  });

  describe("pantalla del evento", () => {
    it("cerrar el evento registra a los marcados como asistentes, incluso a quien pagó en la puerta, y descarta el borrador", () => {
      const { aplicacion, almacenamientos } = montar(almacenamientosConGrupo());
      expect(pantallaActual()).toBe("Evento");

      casillaDeAsistencia("beto").click();
      casillaDeAsistencia("carla").click();
      expect(casillaDeAsistencia("ana").disabled).toBe(true);
      hacerClic("Cobrar y habilitar", fila("ana"));
      expect(campo("Monto", dialogoAbierto()).value).toBe("1000");
      expect(campo("Fecha", dialogoAbierto()).value).toBe(aEntradaDeFecha(ahora()));
      hacerClic("Cobrar", dialogoAbierto());
      expect(casillaDeAsistencia("ana").disabled).toBe(false);
      expect(casillaDeAsistencia("ana").checked).toBe(true);
      hacerClic("Cerrar evento");
      expect(textoDe(dialogoAbierto())).toContain("Quedan ausentes: dani.");
      hacerClic("Confirmar", dialogoAbierto());

      const [, evento] = aplicacion.grupo().eventos();
      expect(evento.fecha()).toEqual(ahora());
      expect(evento.asistentes()).toEqual(new Set(["beto", "carla", "ana"]));
      expect(aplicacion.grupo().participanteActivo("dani")?.estado()).toBe("en deuda");
      expect(almacenamientos.borrador.leer()).toBeUndefined();
      expect(casillaDeAsistencia("beto").checked).toBe(false);
    });

    it("la confirmación del cierre nombra a los activos sin marcar, en deuda incluidos, pero no a los morosos", () => {
      const almacenamientos = almacenamientosConGrupo();
      const preparacion = nuevaAplicacion(almacenamientos);
      preparacion.ingresar("eva", dia(2));
      preparacion.cerrarEvento(dia(3), ["beto", "carla", "dani"]); // ana queda morosa y eva en deuda
      montar(almacenamientos);

      casillaDeAsistencia("beto").click();
      hacerClic("Cerrar evento");

      expect(textoDe(dialogoAbierto())).toContain("Quedan ausentes: carla, dani, eva.");
      expect(textoDe(dialogoAbierto())).not.toContain("ana");
    });

    it("si sólo quedan sin marcar los morosos, la confirmación del cierre dice que nadie queda ausente", () => {
      const almacenamientos = almacenamientosConGrupo();
      nuevaAplicacion(almacenamientos).cerrarEvento(dia(3), ["beto", "carla", "dani"]);
      montar(almacenamientos);

      ["beto", "carla", "dani"].forEach((nombre) => casillaDeAsistencia(nombre).click());
      hacerClic("Cerrar evento");

      expect(textoDe(dialogoAbierto())).toContain("Nadie queda ausente.");
    });

    it("el borrador del evento sobrevive a una recarga y vuelve a abrir la pantalla del evento", () => {
      const almacenamientos = almacenamientosConGrupo();
      montar(almacenamientos);
      casillaDeAsistencia("beto").click();
      almacenamientos.pantalla.guardar("participantes");
      document.body.replaceChildren();

      montar(almacenamientos);

      expect(pantallaActual()).toBe("Evento");
      expect(casillaDeAsistencia("beto").checked).toBe(true);
      expect(casillaDeAsistencia("carla").checked).toBe(false);
    });
  });

  describe("pantalla de reglas", () => {
    it("las reglas cambiadas rigen desde el momento del cambio", async () => {
      const { aplicacion } = montar(almacenamientosConGrupo());
      await navegarA("Reglas");
      expect(hayEtiqueta("Rige desde")).toBe(false);

      completar("Monto por falta", "1500");
      hacerClic("Cambiar reglas");

      expect(aplicacion.grupo().reglas().montoPorFalta()).toBe(1500);
      expect(aplicacion.grupo().reglas().rigeDesde()).toEqual(ahora());
    });
  });

  describe("pantalla del historial", () => {
    it("deshacer el cierre de un evento lo restaura como borrador", async () => {
      const { aplicacion } = montar(almacenamientosConGrupo());
      await navegarA("Historial");
      expect(pantallaActual()).toBe("Historial");

      hacerClic("Deshacer");

      expect(aplicacion.grupo().eventos()).toEqual([]);
      expect(pantallaActual()).toBe("Evento");
      expect(campo("Fecha y hora").value).toBe(aEntradaDeFecha(dia(2)));
      expect(["ana", "beto", "carla", "dani"].map((nombre) => casillaDeAsistencia(nombre).checked)).toEqual([
        false,
        true,
        true,
        true,
      ]);
    });

    it("importar en un dispositivo nuevo lo exportado en otro reproduce los mismos participantes", async () => {
      const { aplicacion: original } = montar(almacenamientosConGrupo());
      await navegarA("Historial");
      const exportado = await exportar();
      document.body.replaceChildren();
      const almacenamientos = nuevosAlmacenamientos();
      nuevaAplicacion(almacenamientos).crearGrupo("Otro grupo", reglas());
      const { aplicacion } = montar(almacenamientos);
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
