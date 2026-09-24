import "./ui/style.css";
import { Participante } from "./models/Participante.ts";
import { Reglas } from "./models/Reglas.ts";
import { SinInteres } from "./models/PoliticaDeInteres.ts";
import { VistaDeParticipante } from "./ui/VistaDeParticipante.ts";

const hoy = new Date();
const reglas = new Reglas(2, 1000, new SinInteres());
const crearParticipante = () => new Participante("socio", reglas, hoy);

document.querySelector("#app")!.append(new VistaDeParticipante(crearParticipante, hoy).elemento());
