// Dónde se guarda la bitácora serializada entre sesiones.
export interface Almacenamiento {
  guardar(texto: string): void;
  leer(): string | undefined;
  borrar(): void;
}
