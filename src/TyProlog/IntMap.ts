/**
 * derived from code at https://github.com/mikvor/hashmapTest
 */
import IntStack from './IntStack';

  export default class IntMap {
// package iProlog;
// class IntMap implements java.io.Serializable {
   static serialVersionUID: number = 1;

   static FREE_KEY = 0;

  static  NO_VALUE = 0;

  /** Keys and values */
  m_data: number[] = [];

  /** Do we have 'free' key in the map? */
  m_hasFreeKey: boolean = false;
  /** Value of 'free' key */
  m_freeValue: number = 0;

  /** Fill factor, must be between (0 and 1) */
  m_fillFactor: number = 0;
  /** We will resize a map once it reaches this size */
  m_threshold: number = 0;
  /** Current map size */
  m_size: number = 0;

  /** Mask to calculate the original position */
  m_mask: number = 0;
  m_mask2: number = 0;

  // public constructor IntMap() {
  //   this(1 << 2);
  // }

  // IntMap(size: number) {
  //   this(size, 0.75f);
  // }

  public constructor (size: number = 1 << 2, fillFactor: number = 0.75) {
    if (fillFactor <= 0 || fillFactor >= 1)
      throw new Error("FillFactor must be in (0, 1)");
    if (size <= 0)
      throw new Error("Size must be positive!");
    const capacity = this.arraySize(size, fillFactor);
    this.m_mask = capacity - 1;
    this.m_mask2 = capacity * 2 - 1;
    this.m_fillFactor = fillFactor;

    this.m_data = new Array<number>(capacity * 2);
    this.m_threshold = (capacity * fillFactor);
  }

  get(key: number) {
    let ptr = (IntMap.phiMix(key) & this.m_mask) << 1;

    if (key == IntMap.FREE_KEY)
      return this.m_hasFreeKey ? this.m_freeValue : IntMap.NO_VALUE;

    let k = this.m_data[ptr];

    if (k == IntMap.FREE_KEY)
      return IntMap.NO_VALUE; //end of chain already
    if (k == key) //we check FREE prior to this call
      return this.m_data[ptr + 1];

    while (true) {
      ptr = ptr + 2 & this.m_mask2; //that's next index
      k = this.m_data[ptr];
      if (k == IntMap.FREE_KEY)
        return IntMap.NO_VALUE;
      if (k == key)
        return this.m_data[ptr + 1];
    }
  }

  // // for use as IntSet - Paul Tarau

  contains(key: number) {
    return IntMap.NO_VALUE != this.get(key);
  }

  add(key: number) {
    return IntMap.NO_VALUE != this.put(key, 666);
  }

   delete(key: number) {
    return IntMap.NO_VALUE != this.remove(key);
  }

   isEmpty() {
    return 0 == this.m_size;
  }

  static  intersect0(  m: IntMap, maps: IntMap[], vmaps: IntMap[], r: IntStack) {
    const data = m.m_data;
    for (let k = 0; k < data.length; k += 2) {
      let found = true;
      const key = data[k];
      if (IntMap.FREE_KEY == key) {
        continue;
      }
      for (let i = 1; i < maps.length; i++) {
        const map = maps[i];
        const val = map.get(key);

        if (IntMap.NO_VALUE == val) {
          const vmap = vmaps[i];
          const vval = vmap.get(key);
          if (IntMap.NO_VALUE == vval) {
            found = false;
            break;
          }
        }
      }
      if (found) {
        r.push(key);
      }
    }
  }

   static intersect(  maps: IntMap[],  vmaps: IntMap[]) {
    const  r = new IntStack();

    IntMap.intersect0(maps[0], maps, vmaps, r);
    IntMap.intersect0(vmaps[0], maps, vmaps, r);
    return r;
  }

  // // end changes

  put(key: number, value: number): number {
    if (key == IntMap.FREE_KEY) {
      const ret = this.m_freeValue;
      if (!this.m_hasFreeKey) {
        ++this.m_size;
      }
      this.m_hasFreeKey = true;
      this.m_freeValue = value;
      return ret;
    }

    let ptr = (IntMap.phiMix(key) & this.m_mask) << 1;
    let k = this.m_data[ptr];
    if (k == IntMap.FREE_KEY) //end of chain already
    {
      this.m_data[ptr] = key;
      this.m_data[ptr + 1] = value;
      if (this.m_size >= this.m_threshold) {
        this.rehash(this.m_data.length * 2); //size is set inside
      } else {
        ++this.m_size;
      }
      return IntMap.NO_VALUE;
    } else if (k == key) //we check FREE prior to this call
    {
      let ret = this.m_data[ptr + 1];
      this.m_data[ptr + 1] = value;
      return ret;
    }

    while (true) {
      ptr = ptr + 2 & this.m_mask2; //that's next index calculation
      k = this.m_data[ptr];
      if (k == IntMap.FREE_KEY) {
        this.m_data[ptr] = key;
        this.m_data[ptr + 1] = value;
        if (this.m_size >= this.m_threshold) {
          this.rehash(this.m_data.length * 2); //size is set inside
        } else {
          ++this.m_size;
        }
        return IntMap.NO_VALUE;
      } else if (k == key) {
        const ret = this.m_data[ptr + 1];
        this.m_data[ptr + 1] = value;
        return ret;
      }
    }
  }

  remove(key: number) {
    if (key == IntMap.FREE_KEY) {
      if (!this.m_hasFreeKey)
        return IntMap.NO_VALUE;
        this.m_hasFreeKey = false;
      --this.m_size;
      return this.m_freeValue; //value is not cleaned
    }

    let ptr = (IntMap.phiMix(key) & this.m_mask) << 1;
    let k = this.m_data[ptr];
    if (k == key) //we check FREE prior to this call
    {
      const res = this.m_data[ptr + 1];
      this.shiftKeys(ptr);
      --this.m_size;
      return res;
    } else if (k == IntMap.FREE_KEY)
      return IntMap.NO_VALUE; //end of chain already
    while (true) {
      ptr = ptr + 2 & this.m_mask2; //that's next index calculation
      k = this.m_data[ptr];
      if (k == key) {
        const res = this.m_data[ptr + 1];
        this.shiftKeys(ptr);
        --this.m_size;
        return res;
      } else if (k == IntMap.FREE_KEY)
        return IntMap.NO_VALUE;
    }
  }

  shiftKeys(pos: number) {
    // Shift entries with the same hash.
    let last, slot;
    let k;
    const data = this.m_data;
    while (true) {
      pos = (last = pos) + 2 & this.m_mask2;
      while (true) {
        if ((k = data[pos]) == IntMap.FREE_KEY) {
          data[last] = IntMap.FREE_KEY;
          return last;
        }
        slot = (IntMap.phiMix(k) & this.m_mask) << 1; //calculate the starting slot for the current key
        if (last <= pos ? last >= slot || slot > pos : last >= slot && slot > pos) {
          break;
        }
        pos = pos + 2 & this.m_mask2; //go to the next entry
      }
      data[last] = k;
      data[last + 1] = data[pos + 1];
    }
  }

  size() {
    return this.m_size;
  }

  rehash(newCapacity:number) {
    this.m_threshold = (newCapacity / 2 * this.m_fillFactor);
    this.m_mask = newCapacity / 2 - 1;
    this.m_mask2 = newCapacity - 1;

    const oldCapacity = this.m_data.length;
    const oldData: number[] = this.m_data;

    this.m_data = new Array<number>(newCapacity);
    this.m_size = this.m_hasFreeKey ? 1 : 0;

    for (let i = 0; i < oldCapacity; i += 2) {
      const oldKey = oldData[i];
      if (oldKey != IntMap.FREE_KEY) {
        this.put(oldKey, oldData[i + 1]);
      }
    }
  }

  // /** Taken from FastUtil implementation */

  // /** Return the least power of two greater than or equal to the specified value.
  //  *
  //  * <p>Note that this function will return 1 when the argument is 0.
  //  *
  //  * @param x a long integer smaller than or equal to 2<sup>62</sup>.
  //  * @return the least power of two greater than or equal to the specified value.
  //  */
  static nextPowerOfTwo(x: number) {
    if (x == 0)
      return 1;
    x--;
    x |= x >> 1;
    x |= x >> 2;
    x |= x >> 4;
    x |= x >> 8;
    x |= x >> 16;
    return (x | x >> 32) + 1;
  }

  // /** Returns the least power of two smaller than or equal to 2<sup>30</sup>
  //  * and larger than or equal to <code>Math.ceil( expected / f )</code>.
  //  *
  //  * @param expected the expected number of elements in a hash table.
  //  * @param f the load factor.
  //  * @return the minimum possible size for a backing array.
  //  * @throws IllegalArgumentException if the necessary size is larger than 2<sup>30</sup>.
  //  */
  arraySize(expected: number, f:number): number {
    const s = Math.max(2, IntMap.nextPowerOfTwo(Math.ceil(expected / f)));
    if (s > 1 << 30)
      throw new Error(`Too large (${expected} expected elements with load factor ${fetch})`);
    return s;
  }

  // //taken from FastUtil
  static INT_PHI = 0x9E3779B9;

  static phiMix(x: number) {
    const h = x * IntMap.INT_PHI;
    return h ^ h >> 16;
  }

  // @Override
  public toString() {
    //return java.util.Arrays.toString(m_data);
    let b = "{";
    const l = this.m_data.length;
    let first = true;
    for (let i = 0; i < l; i += 2) {

      const v = this.m_data[i];
      if (v != IntMap.FREE_KEY) {
        if (!first) {
          b = b + ',';
        }
        first = false;
        b = b + (v - 1);
      }
    }
    b = b + ("}");
    return b.toString();
  }
  }
