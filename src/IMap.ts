import IntMap from './IntMap';
import IntStack from './IntStack';

type int = number;

export default class IMap<K> {
   static serialVersionUID = 1;

  map = new Map<K, IntMap>;

  IMap() {
    // this.map = new Map<K, IntMap>();
  }

  public clear() {
    this.map = new Map<K, IntMap>();
    // this.map.clear();
  }

  put(key: K, val: number) {
    let vals: IntMap | undefined = this.map.get(key);
    if (null == vals) {
      vals = new IntMap();
      this.map.set(key, vals);
    }
    return vals.add(val);
  }

   get(key: K):IntMap {
    let s: IntMap | undefined = this.map.get(key);
    if (null == s) {
      s = new IntMap();
    }
    return s;
  }

  remove2(key: K, val: number): boolean {
    const vals: IntMap = this.get(key);
    const ok: boolean = vals.delete(val);
    if (vals.isEmpty()) {
      this.map.delete(key);
    }
    return ok;
  }

  remove1(key: K): boolean {
    return null != this.map.delete(key);
  }

  size(): number {
    const I = this.map.keys(); //.iterator();
    let s = 0;
    // while (I.next()) {
    for (let key of this.map.keys()) {
      // const key = I..next();
      const  vals: IntMap = this.get(key);
      s += vals.size();
    }
    return s;
  }

  public  keySet(): Set<K> {
    return new Set(this.map.keys());
  }

  public  keyIterator(): Iterator<K> {
    return this.keySet().values();
  }

  // @Override
  public  toString() {
    return this.map.toString();
  }

  // specialization for array of int maps

  static  create(l: number): IMap<number>[] {
    const first = new IMap<number>();
    
    const imaps = new Array<IMap<number>>(l); // java.lang.reflect.Array.newInstance(first.getClass(), l);
    //new IMap[l];
    imaps[0] = first;
    for (let i = 1; i < l; i++) {
      imaps[i] = new IMap<number>();
    }
    return imaps;
  }

   static  put(  imaps: IMap<number>[], pos: number, key: number, val: number):boolean {
    return imaps[pos].put(key, val);
  }

  static get( iMaps: IMap<number>[],  vmaps: IntMap[],  keys: int[]): int[] {
    const  l:int = iMaps.length;
    const  ms: Array<IntMap> = new Array<IntMap>();
    const  vms: Array<IntMap> = new Array<IntMap>();

    for (let i = 0; i < l; i++) {
      const key: int = keys[i];
      if (0 == key) {
        continue;
      }
      //Main.pp("i=" + i + " ,key=" + key);
      const m: IntMap = iMaps[i].get(key);
      //Main.pp("m=" + m);
      // ms.add(m);
      // vms.add(vmaps[i]);

      ms.push(m);
      vms.push(vmaps[i]);
    }
    const ims: IntMap[] = new Array<IntMap>(ms.length);
    const vims: IntMap[] = new Array<IntMap>(vms.length);

    for (let i = 0; i < ims.length; i++) {
      const im: IntMap = ms[i];
      ims[i] = im;
      const vim: IntMap = vms[i];
      vims[i] = vim;
    }

    //Main.pp("-------ims=" + Arrays.toString(ims));
    //Main.pp("-------vims=" + Arrays.toString(vims));

    const cs: IntStack = IntMap.intersect(ims, vims); // $$$ add vmaps here
    const is: int[] = cs.toArray();
    for (let i = 0; i < is.length; i++) {
      is[i] = is[i] - 1;
    }
    // java.util.Arrays.sort(is);
    return is.sort();
  }

  
  static  show( what: any): string {
    // return Arrays.toString(imaps);
    return JSON.stringify(what);
  }

  // static  show( imaps: IMap<number>[]): string {
  //   // return Arrays.toString(imaps);
  //   return JSON.stringify(imaps);
  // }

  // static show( is: int[]): string {
  //   // return Arrays.toString(is);
  //   return JSON.stringify(is);
  // }

  /*
  public static void main(final String[] args) {
    const imaps: IMap<number>[] = create(3);
    put(imaps, 0, 10, 100);
    put(imaps, 1, 20, 200);
    put(imaps, 2, 30, 777);

    put(imaps, 0, 10, 1000);
    put(imaps, 1, 20, 777);
    put(imaps, 2, 30, 3000);

    put(imaps, 0, 10, 777);
    put(imaps, 1, 20, 20000);
    put(imaps, 2, 30, 30000);

    put(imaps, 0, 10, 888);
    put(imaps, 1, 20, 888);
    put(imaps, 2, 30, 888);

    put(imaps, 0, 10, 0);
    put(imaps, 1, 20, 0);
    put(imaps, 2, 30, 0);

    //Main.pp(show(imaps));

    //final int[] keys = { 10, 20, 30 };
    //Main.pp("get=" + show(get(imaps, keys)));


    const m: IMap<number>[] = create(4);
    Engine.put(m, new int[] { -3, -4, 0, 0 }, 0);
    Engine.put(m, new int[] { -3, -21, 0, -21 }, 1);
    Engine.put(m, new int[] { -19, 0, 0, 0 }, 2);
    
    const ks: int[] = new int[] { -3, -21, -21, 0 };
    Main.pp(show(m));
    Main.pp("ks=" + Arrays.toString(ks));
    
    Main.pp("get=" + show(get(m, ks)));

  }*/

}

// end
