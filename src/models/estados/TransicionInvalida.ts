export class TransicionInvalida extends Error {
  constructor(disparador: string, estado: string) {
    super(`No se puede "${disparador}" estando ${estado}`);
    this.name = "TransicionInvalida";
  }
}
