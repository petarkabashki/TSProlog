
export default class Clause {
  constructor(len: number, hgs: number[], base: number, neck: number, xs: number[]) {
      // if (this.len === undefined) { this.len = 0; }
      // if (this.hgs === undefined) { this.hgs = null; }
      // if (this.base === undefined) { this.base = 0; }
      // if (this.neck === undefined) { this.neck = 0; }
      // if (this.xs === undefined) { this.xs = null; }
      this.hgs = hgs;
      this.base = base;
      this.len = len;
      this.neck = neck;
      this.xs = xs;
  }

  len: number;

  public hgs: number[];

  base: number;

  neck: number;

  xs: number[];
}
// Clause["__class"] = "Clause";



