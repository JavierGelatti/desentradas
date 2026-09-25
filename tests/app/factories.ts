import { AlmacenamientoEnMemoria } from "../../src/app/AlmacenamientoEnMemoria.ts";
import { PlanillaDeAsistencia } from "../../src/app/PlanillaDeAsistencia.ts";
import { dia } from "../models/factories.ts";

export const ahora = () => dia(5);

export const nuevaPlanillaDeAsistencia = (almacenamiento = new AlmacenamientoEnMemoria(), reloj = ahora) =>
  new PlanillaDeAsistencia(almacenamiento, reloj);
