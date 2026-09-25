import "./ui/estilos.css";
import { AlmacenamientoEnStorage } from "./app/AlmacenamientoEnStorage.ts";
import { Aplicacion } from "./app/Aplicacion.ts";
import { DesempateAleatorioReproducible } from "./models/Desempate.ts";
import { PlanillaDeAsistencia } from "./app/PlanillaDeAsistencia.ts";
import { VistaPrincipal } from "./ui/VistaPrincipal.ts";

const ahora = () => new Date();
const aplicacion = new Aplicacion(
  new AlmacenamientoEnStorage(localStorage, "bitacora"),
  new DesempateAleatorioReproducible(),
  new PlanillaDeAsistencia(new AlmacenamientoEnStorage(localStorage, "planilla"), ahora),
);
const vista = new VistaPrincipal(aplicacion, new AlmacenamientoEnStorage(localStorage, "pantalla"), ahora);
vista.montarEn(document.querySelector<HTMLElement>("#app")!);
