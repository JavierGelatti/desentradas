import { AlmacenamientoEnMemoria } from "../../src/app/AlmacenamientoEnMemoria.ts";
import { BorradorDeEvento } from "../../src/app/BorradorDeEvento.ts";
import { dia } from "../models/factories.ts";

export const ahora = () => dia(5);

export const nuevoBorrador = (almacenamiento = new AlmacenamientoEnMemoria(), reloj = ahora) =>
  new BorradorDeEvento(almacenamiento, reloj);
