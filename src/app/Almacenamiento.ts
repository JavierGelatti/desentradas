// Un texto que sobrevive entre sesiones (la bitácora, la planilla de asistencia, la última pantalla).
export interface Almacenamiento {
  guardar(texto: string): void;
  leer(): string | undefined;
  borrar(): void;
}
