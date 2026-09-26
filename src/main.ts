import "./ui/estilos.css";
import { registerSW } from "virtual:pwa-register";
import { AlmacenamientoEnStorage } from "./app/AlmacenamientoEnStorage.ts";
import { Aplicacion } from "./app/Aplicacion.ts";
import { DesempateAleatorioReproducible } from "./models/Desempate.ts";
import { VistaPrincipal } from "./ui/VistaPrincipal.ts";

const ahora = () => new Date();
const aplicacion = new Aplicacion(
  new AlmacenamientoEnStorage(localStorage, "bitacora"),
  new DesempateAleatorioReproducible(),
  new AlmacenamientoEnStorage(localStorage, "planilla"),
);
const vista = new VistaPrincipal(aplicacion, new AlmacenamientoEnStorage(localStorage, "pantalla"), ahora);
vista.montarEn(document.querySelector<HTMLElement>("#app")!);

registerSW();
navigator.storage?.persist?.();
