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

type ValorDelInteres = { pregunta: string; unidadAntes?: string; unidadDespues?: string };
const valorQuePide: Record<TipoDeInteres, ValorDelInteres | undefined> = {
  "sin interés": undefined,
  "fijo por día": { pregunta: "¿Cuánto se cobra por día de mora?", unidadAntes: "$" },
  mensual: { pregunta: "¿Qué porcentaje se cobra por mes de mora?", unidadDespues: "%" },
};

const tipoYValorDe = (politica: PoliticaDeInteres): [TipoDeInteres, number] => {
  if (politica instanceof InteresFijoPorDia) return ["fijo por día", politica.montoPorDia()];
  if (politica instanceof InteresMensual) return ["mensual", politica.porcentaje()];
  return ["sin interés", 1];
};

export const camposDeReglas = (reglas?: Reglas): HTMLElement[] => [
  campoNumerico(
    "¿Cuántas faltas se toleran antes de quedar afuera?",
    "toleranciaDeFaltas",
    reglas?.toleranciaDeFaltas() ?? 1,
    1,
  ),
  campoNumerico("¿Cuánto se paga por falta?", "montoPorFalta", reglas?.montoPorFalta() ?? 1, 1),
  ...camposDeInteres(reglas?.politicaDeInteres() ?? new SinInteres()),
];

const camposDeInteres = (politica: PoliticaDeInteres): HTMLElement[] => {
  const [tipoInicial, valorInicial] = tipoYValorDe(politica);
  const tipo = campoDeOpciones(
    "¿Cómo se calcula el interés en caso de no pagar?",
    "tipoDeInteres",
    tiposDeInteres,
    tipoInicial,
  );
  const preguntaDelValor = document.createTextNode("");
  const unidadAntes = document.createTextNode("");
  const unidadDespues = document.createTextNode("");
  const campoDelValor = crear(
    "label",
    {},
    preguntaDelValor,
    crear(
      "span",
      {},
      unidadAntes,
      crear("input", {
        type: "number",
        name: "valorDelInteres",
        value: valorInicial,
        min: 1,
        required: true,
      }),
      unidadDespues,
    ),
  );
  const valorElegido = () => valorQuePide[controlDe(tipo).value as TipoDeInteres];
  const ajustar = () => {
    const valor = valorElegido();
    if (valor === undefined) {
      campoDelValor.remove();
    } else {
      preguntaDelValor.textContent = `${valor.pregunta} `;
      unidadAntes.textContent = valor.unidadAntes ?? "";
      unidadDespues.textContent = valor.unidadDespues ?? "";
      tipo.after(campoDelValor);
    }
  };
  controlDe(tipo).addEventListener("change", ajustar);
  ajustar();
  return valorElegido() === undefined ? [tipo] : [tipo, campoDelValor];
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
