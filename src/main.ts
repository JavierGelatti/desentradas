import "./ui/estilos.css";
import { AlmacenamientoEnStorage } from "./app/AlmacenamientoEnStorage.ts";
import { Aplicacion } from "./app/Aplicacion.ts";
import { DesempateAleatorioReproducible } from "./models/Desempate.ts";
import { BorradorDeEvento } from "./ui/BorradorDeEvento.ts";
import { VistaPrincipal } from "./ui/VistaPrincipal.ts";

const aplicacion = new Aplicacion(
  new AlmacenamientoEnStorage(localStorage, "bitacora"),
  new DesempateAleatorioReproducible(),
);
const vista = new VistaPrincipal(
  aplicacion,
  new BorradorDeEvento(new AlmacenamientoEnStorage(localStorage, "borrador")),
  new AlmacenamientoEnStorage(localStorage, "pantalla"),
  () => new Date(),
);
vista.montarEn(document.querySelector<HTMLElement>("#app")!);
