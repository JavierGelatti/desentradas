export interface Almacenamiento {
  guardar(texto: string): void;
  leer(): string | undefined;
  borrar(): void;
}
