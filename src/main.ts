import "./ui/estilos.css";
import { AlmacenamientoEnStorage } from "./app/AlmacenamientoEnStorage.ts";
import { Aplicacion } from "./app/Aplicacion.ts";
import { DesempateAleatorioReproducible } from "./models/Desempate.ts";
import { BorradorDeEvento } from "./app/BorradorDeEvento.ts";
import { VistaPrincipal } from "./ui/VistaPrincipal.ts";

const ahora = () => new Date();
const aplicacion = new Aplicacion(
  new AlmacenamientoEnStorage(localStorage, "bitacora"),
  new DesempateAleatorioReproducible(),
  new BorradorDeEvento(new AlmacenamientoEnStorage(localStorage, "borrador"), ahora),
);
const vista = new VistaPrincipal(aplicacion, new AlmacenamientoEnStorage(localStorage, "pantalla"), ahora);
vista.montarEn(document.querySelector<HTMLElement>("#app")!);
