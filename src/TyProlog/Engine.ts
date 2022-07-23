import Clause from './Clause';
import Toks from './Toks'
import IntStack from './IntStack';
import { pp, println} from './utils';
import Spine from './Spine';
import IMap from './IMap';
import IntMap from './IntMap';
import IntList from './IntList';
import { Map } from 'typescript';
import ObStack from './ObStack';
/**
 * Implements execution mechanism
 */
type int = number;
type long = number;

// Engine statics 

const MAXIND: int = 3; // number of index args
const START_INDEX: int = 20;
const MINSIZE: int = 1 << 15; // power of 2

/**
 * tags of our this.heap cells - that can also be seen as
 * instruction codes in a compiled implementation
 */
const V: int = 0;
const U: int = 1;
const R: int = 2;

const C: int = 3;
const N: int = 4;

const A: int = 5;

// G - ground?

const BAD: int = 7;


/**
* expands a "Xs lists .." statements to "Xs holds" statements
*/

const maybeExpand = (Ws: Array<string>): Array < string[] > | null => {
  const W: string = Ws[0];
  if (W.length < 2 || !("l:" != W.substring(0, 2)))
    return null;

  const l: int = Ws.length;
  const Rss = new Array<string[]>();
  const V: string = W.substring(2);
  for (let i: int = 1; i < l; i++) {
    const Rs = new Array<string>(4);
    const Vi: string = 1 == i ? V : V + "__" + (i - 1);
    const Vii: string = V + "__" + i;
    Rs[0] = "h:" + Vi;
    Rs[1] = "c:list";
    Rs[2] = Ws[i];
    Rs[3] = i == l - 1 ? "c:nil" : "v:" + Vii;
    Rss.push(Rs);
  }
  return Rss;

}

/**
 * expands, if needed, "lists" statements in sequence of statements
 */
const mapExpand = (Wss: Array<Array<string>>): Array < string[] > => {
  const Rss = new Array<string[]>();
  for(let Ws of Wss) {

    const Hss: Array<string[]> | null = maybeExpand(Ws);

    if (null == Hss) {
      const ws: string[] = new Array<string>(Ws.length);
      for (let i = 0; i < ws.length; i++) {
        ws[i] = Ws[i];
      }
      Rss.push(ws);
    } else {
      for (let X of Hss) {
        Rss.push(X);
      }
    }
  }
    return Rss;
}

/**
 * tags an int value while fliping it into a negative
 * number to ensure that untagged cells are always negative and the tagged
 * ones are always positive - a simple way to ensure we do not mix them up
 * at runtime
 */
const tag = (t: int, w: int): int => {
  return -((w << 3) + t);
}

/**
 * removes tag after flipping sign
 */
const detag = (w: int): int => {
  return -w >> 3;
}

/**
 * extracts the tag of a cell
 */
const tagOf = (w: int): int => {
  return -w & 7;
}

const toNums = (clauses: Clause[]): int[] => {
  const l: int = clauses.length;
  const cls: int[] = new Array<int>(l);
  for (let i: int = 0; i < l; i++) {
    cls[i] = i;
  }
  return cls;
}


/**
 * true if cell x is a variable
 * assumes that variables are tagged with 0 or 1
 */
const isVAR = (x: int): boolean => {
  // t: int = tagOf(x);
  //return V == t || U == t;
  return tagOf(x) < 2;
}


/**
 * extracts an int array pointing to
 * the skeleton of a clause: a cell
 * pointing to its head followed by cells pointing to its body's
 * goals
 */
const getSpine = (cs: int[]): int[] | null => {
  const a: int = cs[1];
  const w: int = detag(a);
  const rs: int[] = new Array<int>(w - 1);
  for (let i: int = 0; i < w - 1; i++) {
    const x: int = cs[3 + i];
    const t: int = tagOf(x);
    if (R != t) {
      pp("*** getSpine: unexpected tag=" + t);
      return null;
    }
    rs[i] = detag(x);
  }
  return rs;
}

/**
  * relocates a variable or array reference cell by b
  * assumes var/ref codes V,U,R are 0,1,2
  */
const relocate = (b: int, cell: int): int => {
  return tagOf(cell) < 3 ? cell + b : cell;
}


// indexing extensions - ony active if START_INDEX clauses or more

const vcreate = (l: int): IntMap[] => {
  const vss: IntMap[] = new Array<IntMap>(l);
  for (let i: int = 0; i < l; i++) {
    vss[i] = new IntMap();
  }
  return vss;
}

const put = (imaps: IMap < int > [], vss: IntMap[], keys: int[], val: int) => {
  for (let i: int = 0; i < imaps.length; i++) {
    const key: int = keys[i];
    if (key != 0) {
      IMap.put(imaps, i, key, val);
    } else {
      vss[i].add(val);
    }
  }
}

// --------



export default class Engine {

  // switches off indexing for less then START_INDEX clauses e.g. <20

  /**
   * Builds a new engine from a natural-language style assembler.nl file
   */
  public constructor (fname: string) {
    this.syms = new Map<string, int>();
    this.slist = new Array<string>();

    this.heap = new Array<int>(MINSIZE);
    // this.makeHeap();

    this.trail = new IntStack();
    this.ustack = new IntStack();

    this.clauses = this.dload(fname);

    this.cls = toNums(this.clauses);

    this.query = this.init();

    this.vmaps = vcreate(MAXIND);
    this.imaps = this.index(this.clauses, this.vmaps);
  }

  /**
   * trimmed down clauses ready to be quickly relocated to the this.heap
   */
  clauses: Clause[];

  cls: int[];
  /** symbol table made of map + reverse map from ints to syms */

  syms: Map<int>;
  slist: Array<string>;

  /** runtime areas:
   *
   * the this.heap contains code for and clauses their their copies
   * created during execution
   *
   * the trail is an undo list for variable bindings
   * that facilitates retrying failed goals with alternative
   * matching clauses
   *
   * the unification stack ustack helps handling term unification non-recursively
   *
   * the spines stack contains abstractions of clauses and goals and performs the
   * functions of  both a choice-postack: int and goal stack
   *
   * imaps: contains indexes for up toMAXIND>0 arg positions (0 for pred symbol itself)
   *
   * vmaps: contains clause numbers for which vars occur in indexed arg positions
   */

  heap: int[];
  top: int = 0;


  trail: IntStack;
  ustack: IntStack;
  spines: ObStack<Spine> = new ObStack<Spine>();

  query: Spine;

  imaps: IMap<int>[] | null;
  vmaps: IntMap[];

  /**
   * places an identifier in the symbol table
   */
  addSym(sym: string) {
    let I = this.syms.get(sym);
    if (null == I) {
      const i = this.syms.size;
      // I = new int(i);
      //CONVERT to ts
      I = i;
      this.syms.set(sym, I);
      this.slist.push(sym);
    }
    return I;
  }

  /**
   * returns the symbol associated to an int index
   * in the symbol table
   */
  getSym(w: int): string {
    if (w < 0 || w >= this.slist.length)
      return "BADSYMREF=" + w;
    return this.slist[w];
  }

  // makeHeap() {
  //   makeHeap(MINSIZE);
  // }

  // makeHeap(size: int) {
  //   this.heap = new Array<int>(size);
  //   clear();
  // }

  getTop(): int {
    return this.top;
  }

  setTop(top: int) {
    return this.top = top;
  }

  clear() {
    //for (let i: int = 0; i <= top; i++)
    //heap[i] = 0;
    this.top = -1;
  }

  /**
   * Pushes an element - top is incremented frirst than the
   * element is assigned. This means top poto: int the last assigned
   * element - which can be returned with peek().
   */
  push(i: int) {
    this.heap[++this.top] = i;
  }

  size(): int {
    return this.top + 1;
  }

  /**
   * dynamic array operation: doubles when full
   */
  expand() {
    const l: int = this.heap.length;
    const newstack: int[] = new Array<int>(l << 1);

    //TODO: convert
    // System.arraycopy(this.heap, 0, newstack, 0, l);
    this.heap = newstack;
  }

  ensureSize(more: int) {
    if (1 + this.top + more >= this.heap.length) {
      this.expand();
    }
  }


  /**
   * loads a program from a .nl file of
   * "natural language" equivalents of Prolog/HiLog statements
   */
  dload(s: string): Clause[] {
    const fromFile: boolean = true;
    const Wsss: Array<Array<Array<string>>> = Toks.toSentences(s, fromFile);

    const Cs: Array<Clause> = new Array<Clause>();

    for (let Wss of Wsss) {
      // clause starts here

      const refs = new Map<string, IntStack>();
      const cs: IntStack = new IntStack();
      const gs: IntStack = new IntStack();

      const Rss: Array<string[]> = mapExpand(Wss);
      let k: int = 0;
      for (let ws  of Rss) {

        // head or body element starts here

        const l: int = ws.length;
        gs.push(tag(R, k++));
        cs.push(tag(A, l));

        for (let w of ws) {

          // head or body subterm starts here

          if (1 == w.length) {
            w = "c:" + w;
          }

          const L: string = w.substring(2);
          
          switch (w.charAt(0)) {
            case 'c':
              cs.push(this.encode(C, L));
              k++;
              break;
            case 'n':
              cs.push(this.encode(N, L));
              k++;
              break;
            case 'v': {
              let Is: IntStack | undefined = refs.get(L);
              if (undefined == Is) {
                Is = new IntStack();
                refs.set(L, Is);
              }
              Is.push(k);
              cs.push(tag(BAD, k)); // just in case we miss this
              k++;
            }
              break;
            case 'h': {
              let Is: IntStack | undefined = refs.get(L);
              if (undefined == Is) {
                Is = new IntStack();
                refs.set(L, Is);
              }
              Is.push(k - 1);
              cs.set(k - 1, tag(A, l - 1));
              gs.pop();
            }
              break;
            default:
              pp("FORGOTTEN=" + w);
          } // end subterm
        } // end element
      } // end clause

      // linker
      const K = refs.values();

      for (let Is of K) {
        // let Is: IntStack = K.next();

        // finding the A among refs
        let leader: int = -1;
        for (let j  of Is.toArray()) {
          if (A == tagOf(cs.get(j))) {
            leader = j;

            break;
          }
        }
        if (-1 == leader) {
          // for vars, first V others U
          leader = Is.get(0);
          for (let i  of Is.toArray()) {
            if (i == leader) {
              cs.set(i, tag(V, i));
            } else {
              cs.set(i, tag(U, leader));
            }

          }
        } else {
          for (let i  of Is.toArray()) {
            if (i == leader) {
              continue;
            }
            cs.set(i, tag(R, leader));
          }
        }
      }

      let neck: int = 1 == gs.size() ? cs.size() : detag(gs.get(1));
      const tgs: int[] = gs.toArray();

      const Cl: Clause = this.putClause(cs.toArray(), tgs, neck);

      Cs.push(Cl);

    } // end clause set

    const ccount: int = Cs.length;
    const cls: Clause[] = new Array<Clause>(ccount);
    for (let i: int = 0; i < ccount; i++) {
      cls[i] = Cs[i];
    }
    return cls;
  }

  /*
   * encodes constants: string into symbols while leaving
   * other data types untouched
   */
  encode(t: int, s: string): int {
    let w: int;
    try {
      w = Number.parseInt(s);
    } catch (e) {
      if (C == t) {
        w = this.addSym(s);
      } else
        //pp("bad in encode=" + t + ":" + s);
        return tag(BAD, 666);
    }
    return tag(t, w);
  }

  /**
   * returns the this.heap cell another cell points to
   */
  getRef(x: int): int {
    return this.heap[detag(x)];
  }

  /*
   * sets a this.heap cell to poto: int another one
   */
  setRef(w: int, r: int) {
    this.heap[detag(w)] = r;
  }

  /**
   * removes binding for variable cells
   * above savedTop
   */
  unwindTrail(savedTop: int) {
    while (savedTop < this.trail.getTop()) {
      const href: int = this.trail.pop();
      // assert href is var

      this.setRef(href, href);
    }
  }

  /**
   * scans reference chains starting from a variable
   * until it points to an unbound root variable or some
   * non-variable cell
   */
  deref(x: int): int {
    while (isVAR(x)) {
      const r: int = this.getRef(x);
      if (r == x) {
        break;
      }
      x = r;
    }
    return x;
  }

  /**
   * raw display of a term - to be overridden
   */
  // showTerm(x: int): string {
  //   return this.showTerm(this.exportTerm(x));
  // }

  /**
   * raw display of a externalized term
   */
  showTerm(O: any): string {
    return JSON.stringify(O);
    // if (O instanceof Object[])
    //   return Arrays.deepTostring((Object[]) O);
    // return O.tostring();
  }

  /**
   * prints out content of the trail
   */
  ppTrail() {
    for (let i: int = 0; i <= this.trail.getTop(); i++) {
      const t: int = this.trail.get(i);
      pp("trail[" + i + "]=" + this.showCell(t) + ":" + this.showTerm(t));
    }
  }

  /**
   * builds an array of embedded arrays from a this.heap cell
   * representing a term for interaction with an external function
   * including a displayer
   */
  exportTerm(x: int): Object {
    x = this.deref(x);

    const t: int = tagOf(x);
    const w: int = detag(x);

    let res: any = null;
    switch (t) {
      case C:
        res = this.getSym(w);
        break;
      case N:
        res = w;
        break;
      case V:
        //case U:
        res = "V" + w;
        break;
      case R: {

        const a: int = this.heap[w];
        if (A != tagOf(a))
          return "*** should be A, found=" + this.showCell(a);
        const n: int = detag(a);
        const arr: Object[] = new Array<object>(n);
        const k: int = w + 1;
        for (let i: int = 0; i < n; i++) {
          const j: int = k + i;
          arr[i] = this.exportTerm(this.heap[j]);
        }
        res = arr;
      }
        break;
      default:
        res = "*BAD TERM*" + this.showCell(x);
    }
    return res;
  }

  /**
   * raw display of a cell as tag : value
   */
  showCell(w: int): string {
    const t: int = tagOf(w);
    const val: int = detag(w);
    let s: string;
    switch (t) {
      case V:
        s = "v:" + val;
        break;
      case U:
        s = "u:" + val;
        break;
      case N:
        s = "n:" + val;
        break;
      case C:
        s = "c:" + this.getSym(val);
        break;
      case R:
        s = "r:" + val;
        break;
      case A:
        s = "a:" + val;
        break;
      default:
        s = "*BAD*=" + w;
    }
    return s;
  }

  /**
   * a displayer for cells
   */

  showCells(base: int, len: int): string {
    const buf = new Array<string>();
    for (let k: int = 0; k < len; k++) {
      const instr: int = this.heap[base + k];

      buf.push("[" + (base + k) + "]");
      buf.push(this.showCell(instr));
      buf.push(" ");
    }
    return buf.join('\n');
  }

  showCellsa(cs: int[]): string {
    const buf = new Array<string>();
    for (let k: int = 0; k < cs.length; k++) {
      buf.push("[" + k + "]");
      buf.push(this.showCell(cs[k]));
      buf.push(" ");
    }
    return buf.join('\n');
  }

  /**
  * to be overridden as a printer of a spine
  */
  ppc(C: Spine) {
    // override
  }

  /**
   * to be overridden as a printer for current goals
   * in a spine
   */
  ppGoals(gs: IntList) {
    // override
  }

  /**
   * to be overriden as a printer for spines
   */
  ppSpines() {
    // override
  }

  /**
   * unification algorithm for cells X1 and X2 on ustack that also takes care
   * to trail bindigs below a given this.heap address "base"
   */
  unify(base: int): boolean {
    while (!this.ustack.isEmpty()) {
      const x1: int = this.deref(this.ustack.pop());
      const x2: int = this.deref(this.ustack.pop());
      if (x1 != x2) {
        const t1: int = tagOf(x1);
        const t2: int = tagOf(x2);
        const w1: int = detag(x1);
        const w2: int = detag(x2);

        if (isVAR(x1)) { /* unb. var. v1 */
          if (isVAR(x2) && w2 > w1) { /* unb. var. v2 */
            this.heap[w2] = x1;
            if (w2 <= base) {
              this.trail.push(x2);
            }
          } else { // x2 nonvar or older
            this.heap[w1] = x2;
            if (w1 <= base) {
              this.trail.push(x1);
            }
          }
        } else if (isVAR(x2)) { /* x1 is NONVAR */
          this.heap[w2] = x1;
          if (w2 <= base) {
            this.trail.push(x2);
          }
        } else if (R == t1 && R == t2) { // both should be R
          if (!this.unify_args(w1, w2))
            return false;
        } else
          return false;
      }
    }
    return true;
  }

  unify_args(w1: int, w2: int): boolean {
    const v1: int = this.heap[w1];
    const v2: int = this.heap[w2];
    // both should be A
    const n1: int = detag(v1);
    const n2: int = detag(v2);
    if (n1 != n2)
      return false;
    const b1: int = 1 + w1;
    const b2: int = 1 + w2;
    for (let i: int = n1 - 1; i >= 0; i--) {
      const i1: int = b1 + i;
      const i2: int = b2 + i;
      const u1: int = this.heap[i1];
      const u2: int = this.heap[i2];
      if (u1 == u2) {
        continue;
      }
      this.ustack.push(u2);
      this.ustack.push(u1);
    }
    return true;
  }

  /**
   * places a clause built by the Toks reader on the this.heap
   */
  putClause(cs: int[], gs: int[], neck: int): Clause {
    const base: int = this.size();
    const b: int = tag(V, base);
    const len: int = cs.length;
    this.pushCellsa(b, 0, len, cs);
    for (let i: int = 0; i < gs.length; i++) {
      gs[i] = relocate(b, gs[i]);
    }
    const xs: int[] = this.getIndexables(gs[0]);
    return new Clause(len, gs, base, neck, xs);
  }


  /**
   * pushes slice[from,to] of array cs of cells to this.heap
   */
  pushCells(b: int, from: int, to: int, base: int) {
    this.ensureSize(to - from);
    for (let i: int = from; i < to; i++) {
      this.push(relocate(b, this.heap[base + i]));
    }
  }

  /**
   * pushes slice[from,to] of array cs of cells to this.heap
   */
  pushCellsa(b: int, from: int, to: int, cs: int[]) {
    this.ensureSize(to - from);
    for (let i: int = from; i < to; i++) {
      this.push(relocate(b, cs[i]));
    }
  }

  /**
   * copies and relocates head of clause at offset from this.heap to this.heap
   */
  pushHead(b: int, C: Clause): int {
    this.pushCells(b, 0, C.neck, C.base);
    const head: int = C.hgs[0];
    return relocate(b, head);
  }

  /**
   * copies and relocates body of clause at offset from this.heap to this.heap
   * while also placing head as the first element of array gs that
   * when returned contains references to the toplevel spine of the clause
   */
  pushBody(b: int, head: int, C: Clause): int[] {
    this.pushCells(b, C.neck, C.len, C.base);
    const l: int = C.hgs.length;
    const gs: int[] = new Array<int>(l);
    gs[0] = head;
    for (let k: int = 1; k < l; k++) {
      const cell: int = C.hgs[k];
      gs[k] = relocate(b, cell);
    }
    return gs;
  }

  /**
   * makes, if needed, registers associated to top goal of a Spine
   * these registers will be reused when matching with candidate clauses
   * note that xs contains dereferenced cells - this is done once for
   * each goal's toplevel subterms
   */
  makeIndexArgs(G: Spine, goal: int) {
    if (null != G.xs)
      return;

    const p: int = 1 + detag(goal);
    const n: int = Math.min(MAXIND, detag(this.getRef(goal)));

    const xs: int[] = new Array<int>(MAXIND);

    for (let i: int = 0; i < n; i++) {
      const cell: int = this.deref(this.heap[p + i]);
      xs[i] = this.cell2index(cell);
    }

    G.xs = xs;

    if (null == this.imaps)
      return;
    const cs: int[] = IMap.get(this.imaps, this.vmaps, xs);
    G.cs = cs;
  }

  getIndexables(ref: int): int[] {
    const p: int = 1 + detag(ref);
    const n: int = detag(this.getRef(ref));
    const xs: int[] = new Array<int>(MAXIND);
    for (let i: int = 0; i < MAXIND && i < n; i++) {
      const cell: int = this.deref(this.heap[p + i]);
      xs[i] = this.cell2index(cell);
    }
    return xs;
  }

  cell2index(cell: int): int {
    let x: int = 0;
    const t: int = tagOf(cell);
    switch (t) {
      case R:
        x = this.getRef(cell);
        break;
      case C:
      case N:
        x = cell;
        break;
      // 0 otherwise - assert: tagging with R,C,N <>0
    }
    return x;
  }

  /**
   * tests if the head of a clause, not yet copied to the this.heap
   * for execution could possibly match the current goal, an
   * abstraction of which has been placed in xs
   */
  match( xs:int[],  C0: Clause): boolean {
    for (let i: int = 0; i < MAXIND; i++) {
      const x: int = xs[i];
      const y: int = C0.xs[i];
      if (0 == x || 0 == y) {
        continue;
      }
      if (x != y)
        return false;
    }
    return true;
  }

  /**
   * transforms a spine containing references to choice poand: int
   * immutable list of goals into a new spine, by reducing the
   * first goal in the list with a clause that successfully
   * unifies with it - in which case places the goals of the
   * clause at the top of the new list of goals, in reverse order
   */
  unfold( Gs: Spine): Spine | null {

    const ttop: int = this.trail.getTop();
    const htop: int = this.getTop();
    const base: int = htop + 1;

    const goal: int | null = Gs.gs && IntList.head(Gs.gs);
    if(null == goal)
      return null;

    this.makeIndexArgs(Gs, goal);

    const last: int | null = Gs.cs && Gs.cs.length;

    if(null != last)
      for (let k: int = Gs.k; k < last; k++) {
        const C0: Clause = this.clauses[Gs.cs[k]];

        if (!this.match(Gs.xs, C0))
          continue;

        const base0: int = base - C0.base;
        const b: int = tag(V, base0);
        const head: int = this.pushHead(b, C0);

        this.ustack.clear(); // set up unification stack

        this.ustack.push(head);
        this.ustack.push(goal);

        if (!this.unify(base)) {
          this.unwindTrail(ttop);
          this.setTop(htop);
          continue;
        }
        const gs: int[] = this.pushBody(b, head, C0);
        const newgs = IntList.tail(IntList.app(gs, IntList.tail(Gs.gs) ));
        Gs.k = k + 1;
        if (!IntList.isEmpty(newgs))
          return new Spine(gs, base, IntList.tail(Gs.gs), ttop, 0, this.cls);
        else
          return this.answer(ttop);
      } // end for
    return null;
  }

  /**
   * extracts a query - by convention of the form
   * goal(Vars):-body to be executed by the engine
   */
  getQuery(): Clause {
    return this.clauses[this.clauses.length - 1];
  }

  /**
   * returns the initial spine built from the
   * query from which execution starts
   */
  init(): Spine {
    const base: int = this.size();

    const G: Clause = this.getQuery();
    const Q: Spine = new Spine(G.hgs, base, IntList.empty, this.trail.getTop(), 0, this.cls);
    this.spines.push(Q);
    return Q;
  }

  /**
   * returns an answer as a Spine while recording in it
   * the top of the trail to allow the caller to retrieve
   * more answers by forcing backtracking
   */
  answer(ttop: int): Spine {
    return new Spine(this.spines[0].hd, ttop);
  }

  /**
   * detects availability of alternative clauses for the
   * top goal of this spine
   */
  hasClauses(Sp: Spine): boolean {
    return Sp.k < Sp.cs.length;
  }

  /**
   * true when there are no more goals left to solve
   */
  hasGoals(S: Spine): boolean {
    return !IntList.isEmpty(S.gs);
  }

  /**
   * removes this spines for the spine stack and
   * resets trail and this.heap to where they where at its
   * creating time - while undoing variable binding
   * up to that point
   */
  popSpine() {
    const G: Spine | undefined = this.spines.pop();
    if(undefined == G)
      return;

    this.unwindTrail(G.ttop);
    this.setTop(G.base - 1);
  }

  /**
   * main interpreter loop: starts from a spine and works
   * though a stream of answers, returned to the caller one
   * at a time, until the spines stack is empty - when it
   * returns null
   */
  yieldd(): Spine |null {
    while (!this.spines.isEmpty()) {
      const G: Spine = this.spines.peek();
      if (!this.hasClauses(G)) {
        this.popSpine(); // no clauses left
        continue;
      }
      const Cp: Spine | null = this.unfold(G);
      if (null == Cp) {
        this.popSpine(); // no matches
        continue;
      }
      if (this.hasGoals(Cp)) {
        this.spines.push(Cp);
        continue;
      }
      return Cp; // answer
    }
    return null;
  }

  /**
   * retrieves an answers and ensure the engine can be resumed
   * by unwinding the trail of the query Spine
   * returns an external "human readable" representation of the answer
   */
  ask(): any {
    let query = this.yieldd();
    if (null == query)
      return null;
    const res: int = this.answer(query.ttop).hd;
    const R: Object = this.exportTerm(res);
    this.unwindTrail(query.ttop);
    return R;
  }

  /**
   * initiator and consumer of the stream of answers
   * generated by this engine
   */
  run() {
    let ctr: long = 0;
    for (; ; ctr++) {
      const A: Object = this.ask();
      if (null == A) {
        break;
      }
      if (ctr < 5) println("[" + ctr + "] " + "*** ANSWER=" + this.showTerm(A));
    }
    if (ctr > 5) println("...");
    println("TOTAL ANSWERS=" + ctr);
  }

  index(clauses: Clause[], vmaps: IntMap[]): IMap<int>[] | null {
    if (clauses.length < START_INDEX)
      return null;

    const imaps: IMap<int>[] = IMap.create(vmaps.length);
    for (let i: int = 0; i < clauses.length; i++) {
      const c: Clause = clauses[i];

      put(imaps, vmaps, c.xs, i + 1); // $$$ UGLY INC

    }
    pp("INDEX");
    // pp(IMap.sh§ow(this.imaps));
    pp(JSON.stringify(this.vmaps));
    pp("");
    return imaps;
  }
}
