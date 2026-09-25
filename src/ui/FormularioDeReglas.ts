import { InteresFijoPorDia, InteresMensual, type PoliticaDeInteres, SinInteres } from "../models/PoliticaDeInteres.ts";
import { Reglas } from "../models/Reglas.ts";
import { campoDeOpciones, campoNumerico, controlDe } from "./Campos.ts";
import { crear, numeroDe, valorDe } from "./dom.ts";

type TipoDeInteres = "sin interés" | "fijo por día" | "mensual";

const tiposDeInteres: readonly [TipoDeInteres, string][] = [
  ["sin interés", "Sin interés"],
  ["fijo por día", "Monto fijo por día"],
  ["mensual", "Porcentaje por mes"],
];

// Cómo se llama el valor que pide cada política; las que no lo usan no lo piden.
const etiquetaDelValor: Record<TipoDeInteres, string | undefined> = {
  "sin interés": undefined,
  "fijo por día": "Monto por día",
  mensual: "Porcentaje mensual",
};

// El tipo y el valor con los que se muestra una política en el formulario.
const interesDe = (politica: PoliticaDeInteres): [TipoDeInteres, number] => {
  if (politica instanceof InteresFijoPorDia) return ["fijo por día", politica.montoPorDia()];
  if (politica instanceof InteresMensual) return ["mensual", politica.porcentaje()];
  return ["sin interés", 1];
};

// Los campos de unas reglas, prellenados con las dadas; se leen con reglasDesde.
export const camposDeReglas = (reglas?: Reglas): HTMLElement[] => [
  campoNumerico("Tolerancia de faltas", "toleranciaDeFaltas", reglas?.toleranciaDeFaltas() ?? 1, 1),
  campoNumerico("Monto por falta", "montoPorFalta", reglas?.montoPorFalta() ?? 1, 1),
  ...camposDeInteres(reglas?.politicaDeInteres() ?? new SinInteres()),
];

// El campo del valor sigue a la política elegida: cambia de nombre, y para las políticas que no lo usan
// no está en la página.
const camposDeInteres = (politica: PoliticaDeInteres): HTMLElement[] => {
  const [tipoInicial, valorInicial] = interesDe(politica);
  const tipo = campoDeOpciones("Interés", "tipoDeInteres", tiposDeInteres, tipoInicial);
  const nombreDelValor = document.createTextNode("");
  const campoDelValor = crear(
    "label",
    {},
    nombreDelValor,
    crear("input", {
      type: "number",
      name: "valorDelInteres",
      value: valorInicial,
      min: 1,
      required: true,
    }),
  );
  const etiquetaElegida = () => etiquetaDelValor[controlDe(tipo).value as TipoDeInteres];
  const ajustar = () => {
    const etiqueta = etiquetaElegida();
    if (etiqueta === undefined) {
      campoDelValor.remove();
    } else {
      nombreDelValor.textContent = `${etiqueta} `;
      tipo.after(campoDelValor);
    }
  };
  controlDe(tipo).addEventListener("change", ajustar);
  ajustar();
  return etiquetaElegida() === undefined ? [tipo] : [tipo, campoDelValor];
};

export const reglasDesde = (formulario: HTMLFormElement, rigeDesde: Date): Reglas =>
  new Reglas(
    rigeDesde,
    numeroDe(formulario, "toleranciaDeFaltas"),
    numeroDe(formulario, "montoPorFalta"),
    politicaDeInteresDesde(formulario),
  );

const politicaDeInteresDesde = (formulario: HTMLFormElement): PoliticaDeInteres => {
  switch (valorDe(formulario, "tipoDeInteres")) {
    case "fijo por día":
      return new InteresFijoPorDia(numeroDe(formulario, "valorDelInteres"));
    case "mensual":
      return new InteresMensual(numeroDe(formulario, "valorDelInteres"));
    default:
      return new SinInteres();
  }
};
