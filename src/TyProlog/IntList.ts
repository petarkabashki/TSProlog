import IntStack from './IntStack';

export default class IntList {
  /*private*/ __head: number = 0;

  /*private*/ __tail: IntList | null = null;

    public constructor(X?: any, Xs?: any) {
      if (((typeof X === 'number') || X === null) && ((Xs != null && Xs instanceof <any>IntList) || Xs === null)) {
        let __args = arguments;
        if (this.__head === undefined) { this.__head = 0; }
        this.__head = X;
        this.__tail = Xs;
      } else if (((typeof X === 'number') || X === null) && Xs === undefined) {
        let __args = arguments;
        let head: any = __args[0];
        if (this.__head === undefined) { this.__head = 0; }
        this.__head = head;
        // this.__tail = null;
      } else throw new Error('invalid overload');
    }

    static isEmpty(Xs: IntList| null): boolean {
      return null == Xs;
    }

    static head(Xs: IntList): number {
      return Xs.__head;
    }

    static empty: IntList | null = null;

    static tail(Xs: IntList | null): IntList | null {
      return Xs && Xs.__tail || null;
    }

    static cons(X: number, Xs: IntList | null ): IntList {
      return new IntList(X, Xs);
    }

    static app(xs: number[], Ys: IntList | null): IntList | null {
      let Zs: IntList | null = Ys;
      for (let i: number = xs.length - 1; i >= 0; i--) {
        {
          Zs = IntList.cons(xs[i], Zs);
        };
      }
      return Zs;
    }

    static toInts(Xs: IntList): IntStack {
      const is: IntStack = new IntStack();
      let xxs: IntList | null = Xs;
      while ((!IntList.isEmpty(xxs)) && xxs != null) {
        {
          is.push(IntList.head(xxs));
          xxs = IntList.tail(xxs);
        }
      };
      return is;
    }

    static len(Xs: IntList): number {
      return IntList.toInts(Xs).size();
    }

    /**
     * 
     * @return {string}
     */
    public toString(): string {
      return IntList.toInts(this).toString();
    }
  }
  // IntList["__class"] = "IntList";

