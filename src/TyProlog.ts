/*
 * Description: hitchhiker Prolog
 * 
 * Original Java code by Paul Tarau.
 * The reference document: http://www.cse.unt.edu/~tarau/research/2017/eng.pdf
 * Rewritten to vanilla Javascript.
 * 
 * Version: 1.0.0
 * License: MIT
 * Copyright (c) 2018,2019 Carlo Capelli
 */

import internal from "stream";

// ;(function(context) {
// "use strict";

type int = number;

function pp(...rest: any[]) {
  let msg = Array.from(rest).map(
    e => typeof e === 'string' ? e : JSON.stringify(e)
  ).join(' ')
  if (typeof document != 'undefined')
    document.write('<pre>' + msg + '</pre>')
  else
    console.log(msg)
}

const SPACE = '\\s+'
const ATOM = '[a-z]\\w*'
const VAR = '[A-Z_]\\w*'
const NUM = '-?\\d+'
const DOT = '\\.'

// atom keywords
const IF = 'if'
const AND = 'and'
const HOLDS = 'holds'
const LISTS = 'lists'
const IS = 'is'  // ?

function tkAtom(s: string) {
  const k = [IF, AND, HOLDS, LISTS, IS].indexOf(s)
  return { t: k < 0 ? ATOM : s, s: s }
}
class Toks {
  makeToks(s: string) {
    const e = new RegExp(`(${SPACE})|(${ATOM})|(${VAR})|(${NUM})|(${DOT})`)
    function token(r: RegExpExecArray | null) {
      if (r && r.index === 0) {

        if (r[1]) return { t: SPACE, s: r[0] }
        if (r[2]) return tkAtom(r[0])
        if (r[3]) return { t: VAR, s: r[0] }
        if (r[4]) return { t: NUM, s: r[0], n: parseInt(r[0]) }
        if (r[5]) return { t: DOT, s: r[0] }
      }
    }
    let tokens = [], r
    while (r = token(e.exec(s))) {
      if (r.t !== SPACE)
        tokens.push(r)
      s = s.substring(r.s.length)
    }
    if (s.length)
      throw ` error at '${s}'`
    return tokens
  }

  toSentences(s: string) {
    let Wsss = new Array<Array<Array<string>>>();
    let Wss = new Array<Array<string>>();
    let Ws = new Array<string>();
    // let Wsss = []
    // let Wss = []
    // let Ws = []
    this.makeToks(s).forEach((t: { n?: number, t: string, s: string }) => {
      switch (t.t) {
        case DOT:
          Wss.push(Ws)
          Wsss.push(Wss)
          Wss = []
          Ws = []
          break
        case IF:
          Wss.push(Ws)
          Ws = []
          break
        case AND:
          Wss.push(Ws)
          Ws = []
          break
        case HOLDS:
          Ws[0] = "h:" + Ws[0].substring(2)
          break
        case LISTS:
          Ws[0] = "l:" + Ws[0].substring(2)
          break
        case IS:
          Ws[0] = "f:" + Ws[0].substring(2)
          break
        case VAR:
          Ws.push("v:" + t.s)
          break
        case NUM:
          Ws.push((t.n! < (1 << 28) ? "n:" : "c:") + t.s)
          break
        case ATOM:
          Ws.push("c:" + t.s)
          break
        default:
          throw 'unknown token:' + JSON.stringify(t)
      }
    })
    return Wsss
  }
}

/**
 * representation of a clause
 */
type TClause = {
  len: int, 
  hgs: Array<any>, 
  base: int, 
  neck: int, 
  xs: any[],
}

type TGoal = {
  gs: int[];
  xs: any[]
}

function Clause(len: int, hgs: Array<any>, base: int, neck: int, xs: any[]): TClause {
  return {
    hgs: hgs,     // head+goals pointing to cells in cs
    base: base,    // heap where this starts
    len: len,     // length of heap slice
    neck: neck,    // first after the end of the head
    xs: xs,      // indexables in head
  }
}

/**
 * runtime representation of an immutable list of goals
 * together with top of heap and trail pointers
 * and current clause tried out by head goal
 * as well as registers associated to it
 *
 * note that parts of this immutable lists
 * are shared among alternative branches
 */
function Spine6(gs0: any[], base: int, gs: any[], ttop: int, k: int, cs: any[]): TQuery {
  // creates a spine - as a snapshot of some runtime elements
  return {
    hd: gs0[0],  // head of the clause to which this corresponds
    base: base,    // top of the heap when this was created
    gs: gs0.concat(gs).slice(1),
    ttop: ttop,    // top of the trail when this was created
    k: k,
    cs: cs,      // array of clauses known to be unifiable with top goal in gs
    xs: [],
  }
}

/**
 * creates a specialized spine returning an answer (with no goals left to solve)
 */
function Spine2(hd: int, ttop: int) {
  return {
    hd: hd,
    base: 0,
    gs: [],  // goals - with the top one ready to unfold
    ttop: ttop,
    k: -1,
    cs: null,
    xs: [],
  }
}

const MINSIZE = 1 << 15
const MAXIND = 3
const START_INDEX = 20

/**
 * tags of our heap cells - that can also be seen as
 * instruction codes in a compiled implementation
 */
const V = 0
const U = 1
const R = 2
const C = 3
const N = 4
const A = 5
const B = 6 // CC: add builtins
const BAD = 7

/**
 * Implements execution mechanism
 */
type TOptions = {
  nl_source: string,
  writeln: (s: string) => void
}
type TQuery = {
  // hd: any,  // head of the clause to which this corresponds
  // base: int,    // top of the heap when this was created
  // gs: any,
  // ttop: int,    // top of the trail when this was created
  // k: int,
  // cs: any[],      // array of clauses known to be unifiable with top goal in gs
  // xs: any[],

  hd: number; base: number; gs: any[]; ttop: number; k: number; cs: any[] | null ; xs: any[]; 
};

export class Engine {

  clauses: TClause[] = [];

  cls: int[] = [];
  /** symbol table made of map + reverse map from ints to syms */

  syms: int[] = [];
  slist: string[] = [];
  heap: int[] = [];
  top: int = 0;

  options?: TOptions;
  query: TQuery | null;
  //  = {
  //   nl_source: null,
  //   writeln: (s) => { },
  // }

  trail: any[];
  ustack: any[];
  spines: any[];
  // spines: ObStack<Spine> = new ObStack<Spine>();

  // query: Spine;

  imaps: any[] | null;
  vmaps: any[];
  // Builds a new engine from a natural-language style assembler.nl file
  constructor(options: TOptions) {

    if (options.writeln === undefined)
      options.writeln = pp
    this.options = options

    this.syms = []
    this.makeHeap(MINSIZE);
    this.trail = []
    this.ustack = []
    this.spines = []

    // trimmed down clauses ready to be quickly relocated to the heap
    this.clauses = this.dload(options.nl_source)

    this.cls = toNums(this.clauses)
    this.query = this.init()
    this.vmaps = this.vcreate(MAXIND)
    this.imaps = this.index(this.clauses, this.vmaps)
  }

  // places an identifier in the symbol table
  addSym(sym: any) {
    let I = this.syms.indexOf(sym)
    if (I === -1) {
      I = this.syms.length
      this.syms.push(sym)
    }
    return I
  }

  // returns the symbol associated to an integer index
  // in the symbol table
  getSym(w: int) {
    if (w < 0 || w >= this.syms.length)
      throw "BADSYMREF=" + w
    return this.syms[w]
  }

  /** runtime areas:
   *
   * the heap contains code for clauses and their copies
   * created during execution
   *
   * the trail is an undo list for variable bindings
   * that facilitates retrying failed goals with alternative
   * matching clauses
   *
   * the unification stack ustack helps handling term unification non-recursively
   *
   * the spines stack contains abstractions of clauses and goals and performs the
   * functions of both a choice-point stack and goal stack
   *
   * imaps: contains indexes for up to MAXIND>0 arg positions (0 for pred symbol itself)
   *
   * vmaps: contains clause numbers for which vars occur in indexed arg positions
   */
  makeHeap(size: int) {
    size = size || MINSIZE
    this.heap = Array(size).fill(0)
    this.clear()
  }
  clear() {
    for (let i = 0; i <= this.top; i++)
      this.heap[i] = 0
    this.top = -1
  }

  /**
   * Pushes an element - top is incremented first than the
   * element is assigned. This means top point to the last assigned
   * element - which can be returned with peek().
   */
  push(i: int) {
    this.heap[++this.top] = i
  }

  size() {
    return this.top + 1
  }
  expand() {
    this.heap.length = this.heap.length * 2
  }
  ensureSize(more: int) {
    if (1 + this.top + more >= this.heap.length)
      this.expand()
  }

  /**
   * loads a program from a .nl file of
   * "natural language" equivalents of Prolog/HiLog statements
   */
  dload(s: string) {
    let Wsss = (new Toks()).toSentences(s)
    let Cs = []
    for (let Wss of Wsss) {
      let refs: Map<string,int[]> = new Map<string,int[]>();
      let cs = []
      let gs = []
      let Rss = mapExpand(Wss)
      let k = 0
      for (let ws of Rss) {
        let l = ws.length
        gs.push(tag(R, k++))
        cs.push(tag(A, l))
        for (let w of ws) {
          if (1 == w.length)
            w = "c:" + w
          let L = w.substring(2)
          switch (w[0]) {
            case 'c':
              cs.push(this.encode(C, L))
              k++
              break
            case 'n':
              cs.push(this.encode(N, L))
              k++
              break
            case 'v':
              if (refs.get(L) === undefined)
              refs.set(L, []);
              refs.get(L)!.push(k)
              cs.push(tag(BAD, k))
              k++
              break
            case 'h':
              if (refs.get(L) === undefined)
                refs.set(L, []);
              refs.get(L)!.push(k - 1)
              cs[k - 1] = tag(A, l - 1)
              gs.pop()
              break
            default:
              throw "FORGOTTEN=" + w
          }
        }
      }

      for (let kIs of refs.keys()) {
        let Is = refs.get(kIs)!
        let leader = -1
        for (let j of Is)
          if (A == tagOf(cs[j])) {
            leader = j
            break
          }
        if (-1 == leader) {
          leader = Is[0]
          for (let i of Is)
            if (i == leader)
              cs[i] = tag(V, i)
            else
              cs[i] = tag(U, leader)
        } else
          for (let i of Is) {
            if (i == leader)
              continue
            cs[i] = tag(R, leader)
          }
      }
      let neck = 1 == gs.length ? cs.length : detag(gs[1])
      let tgs = gs
      Cs.push(this.putClause(cs, tgs, neck))
    }
    return Cs
  }

  /**
   * returns the heap cell another cell points to
   */
  getRef(x: int) { return this.heap[detag(x)] }

  /**
   * sets a heap cell to point to another one
   */
  setRef(w: int, r: int) { this.heap[detag(w)] = r }

  /**
   * encodes string constants into symbols while leaving
   * other data types untouched
   */
  encode(t: int, s: string) {
    let w = parseInt(s)
    if (isNaN(w)) {
      if (C == t)
        w = this.addSym(s)
      else
        throw "bad in encode=" + t + ":" + s
    }
    return tag(t, w)
  }

  /**
   * removes binding for variable cells
   * above savedTop
   */
  unwindTrail(savedTop: int) {
    while (savedTop < this.trail.length - 1) {
      let href = this.trail.pop()
      this.setRef(href, href)
    }
  }

  /**
   * scans reference chains starting from a variable
   * until it points to an unbound root variable or some
   * non-variable cell
   */
  deref(x: int) {
    while (isVAR(x)) {
      let r = this.getRef(x)
      if (r == x)
        break
      x = r
    }
    return x
  }
  showTerm(x: any): string {
    if (typeof x === 'number')
      return this.showTerm(this.exportTerm(x))
    if (x instanceof Array)
      return x.join(',')
    return '' + x
  }
  ppTrail() {
    for (let i = 0; i <= array_last(this.trail, -1); i++) {
      let t = this.trail[i]
      this.options!.writeln("trail[" + i + "]=" + this.showCell(t) + ":" + this.showTerm(t))
    }
  }

  /**
   * builds an array of embedded arrays from a heap cell
   * representing a term for interaction with an external function
   * including a displayer
   */
  exportTerm(x: int): string | number | any[] {
    x = this.deref(x)
    let t = tagOf(x)
    let w = detag(x)
    let res = null
    switch (t) {
      case C:
        res = this.getSym(w)
        break
      case N:
        res = parseInt(w.toString())
        break
      case V:
        //case U:
        res = "V" + w
        break
      case R: {
        let a = this.heap[w]
        if (A != tagOf(a))
          throw "*** should be A, found=" + this.showCell(a)
        let n = detag(a)
        let arr = Array(n).fill(0)
        let k = w + 1
        for (let i = 0; i < n; i++) {
          let j = k + i
          arr[i] = this.exportTerm(this.heap[j])
        }
        res = arr
      } break
      default:
        throw "*BAD TERM*" + this.showCell(x)
    }
    return res
  }

  /**
   * raw display of a cell as tag : value
   */
  showCell(w: int) {
    let t = tagOf(w)
    let val = detag(w)
    let s = null
    switch (t) {
      case V:
        s = "v:" + val
        break
      case U:
        s = "u:" + val
        break
      case N:
        s = "n:" + val
        break
      case C:
        s = "c:" + this.getSym(val)
        break
      case R:
        s = "r:" + val
        break
      case A:
        s = "a:" + val
        break
      default:
        s = "*BAD*=" + w
    }
    return s
  }
  showCells2(base: int, len: int) {
    let buf = ''
    for (let k = 0; k < len; k++) {
      let instr = this.heap[base + k]
      buf += "[" + (base + k) + "]" + this.showCell(instr) + " "
    }
    return buf
  }
  showCells1(cs: any[]) {
    let buf = ''
    for (let k = 0; k < cs.length; k++)
      buf += "[" + k + "]" + this.showCell(cs[k]) + " "
    return buf
  }

  ppc(C: any) { }
  ppGoals(gs: any) { }
  ppSpines() { }

  /**
   * unification algorithm for cells X1 and X2 on ustack that also takes care
   * to trail bindigs below a given heap address "base"
   */
  unify(base: int) {
    while (this.ustack.length) {
      let x1 = this.deref(this.ustack.pop())
      let x2 = this.deref(this.ustack.pop())
      if (x1 != x2) {
        let t1 = tagOf(x1)
        let t2 = tagOf(x2)
        let w1 = detag(x1)
        let w2 = detag(x2)
        if (isVAR(x1)) {
          if (isVAR(x2) && w2 > w1) {
            this.heap[w2] = x1
            if (w2 <= base)
              this.trail.push(x2)
          } else {
            this.heap[w1] = x2
            if (w1 <= base)
              this.trail.push(x1)
          }
        } else if (isVAR(x2)) {
          this.heap[w2] = x1
          if (w2 <= base)
            this.trail.push(x2)
        } else if (R == t1 && R == t2) {
          if (!this.unify_args(w1, w2))
            return false
        } else
          return false
      }
    }
    return true
  }

  unify_args(w1: int, w2: int) {
    let v1 = this.heap[w1]
    let v2 = this.heap[w2]
    // both should be A
    let n1 = detag(v1)
    let n2 = detag(v2)
    if (n1 != n2)
      return false
    let b1 = 1 + w1
    let b2 = 1 + w2
    for (let i = n1 - 1; i >= 0; i--) {
      let i1 = b1 + i
      let i2 = b2 + i
      let u1 = this.heap[i1]
      let u2 = this.heap[i2]
      if (u1 == u2)
        continue
      this.ustack.push(u2)
      this.ustack.push(u1)
    }
    return true
  }

  /**
   * places a clause built by the Toks reader on the heap
   */
  putClause(cs: any[], gs: any[], neck: int) {
    let base = this.size()
    let b = tag(V, base)
    let len = cs.length
    this.pushCells2(b, 0, len, cs)
    for (let i = 0; i < gs.length; i++)
      gs[i] = relocate(b, gs[i])
    let xs = this.getIndexables(gs[0])
    return Clause(len, gs, base, neck, xs)
  }

  /**
   * pushes slice[from,to] of array cs of cells to heap
   */
  pushCells1(b: int, from: int, to: int, base: int) {
    this.ensureSize(to - from)
    for (let i = from; i < to; i++)
      this.push(relocate(b, this.heap[base + i]))
  }
  pushCells2(b: int, from: int, to: int, cs: any[]) {
    this.ensureSize(to - from)
    for (let i = from; i < to; i++)
      this.push(relocate(b, cs[i]))
  }

  /**
   * copies and relocates head of clause at offset from heap to heap
   */
  pushHead(b: int, C: TClause) {
    this.pushCells1(b, 0, C.neck, C.base)
    return relocate(b, C.hgs[0])
  }

  /**
   * copies and relocates body of clause at offset from heap to heap
   * while also placing head as the first element of array gs that
   * when returned contains references to the toplevel spine of the clause
   */
  pushBody(b: int, head: int, C: TClause) {
    this.pushCells1(b, C.neck, C.len, C.base)
    let l = C.hgs.length
    let gs = Array(l).fill(0)
    gs[0] = head
    for (let k = 1; k < l; k++) {
      let cell = C.hgs[k]
      gs[k] = relocate(b, cell)
    }
    return gs
  }


  /**
   * makes, if needed, registers associated to top goal of a Spine
   * these registers will be reused when matching with candidate clauses
   * note that regs contains dereferenced cells - this is done once for
   * each goal's toplevel subterms
   */
  makeIndexArgs(G: TGoal) {
    let goal = G.gs[0]
    if (G.xs.length)
      return
    let p = 1 + detag(goal)
    let n = Math.min(MAXIND, detag(this.getRef(goal)))

    let xs = Array(MAXIND).fill(0)
    for (let i = 0; i < n; i++) {
      let cell = this.deref(this.heap[p + i])
      xs[i] = this.cell2index(cell)
    }
    G.xs = xs
    if (this.imaps) throw "IMap TBD"
  }

  getIndexables(ref: int) {
    let p = 1 + detag(ref)
    let n = detag(this.getRef(ref))
    let xs = Array(MAXIND).fill(0)
    for (let i = 0; i < MAXIND && i < n; i++) {
      let cell = this.deref(this.heap[p + i])
      xs[i] = this.cell2index(cell)
    }
    return xs
  }
  cell2index(cell: int) {
    let x = 0
    let t = tagOf(cell)
    switch (t) {
      case R:
        x = this.getRef(cell)
        break
      case C:
      case N:
        x = cell
        break
    }
    return x
  }

  /**
   * tests if the head of a clause, not yet copied to the heap
   * for execution could possibly match the current goal, an
   * abstraction of which has been place in regs
   */
  match(xs: any, C0: TClause) {
    for (let i = 0; i < MAXIND; i++) {
      let x = xs[i]
      let y = C0.xs[i]
      if (0 == x || 0 == y)
        continue
      if (x != y)
        return false
    }
    return true
  }

  /**
   * transforms a spine containing references to choice point and
   * immutable list of goals into a new spine, by reducing the
   * first goal in the list with a clause that successfully
   * unifies with it - in which case places the goals of the
   * clause at the top of the new list of goals, in reverse order
   */
  unfold(G: {k:int, cs: any[], xs:any[], gs: any[]}) {
    let ttop = this.trail.length - 1
    let htop = this.top
    let base = htop + 1

    this.makeIndexArgs(G)

    let last = G.cs.length
    for (let k = G.k; k < last; k++) {
      let C0 = this.clauses[G.cs[k]]
      if (!this.match(G.xs, C0))
        continue
      let base0 = base - C0.base
      let b = tag(V, base0)
      let head = this.pushHead(b, C0)
      this.ustack.length = 0
      this.ustack.push(head)
      this.ustack.push(G.gs[0])
      if (!this.unify(base)) {
        this.unwindTrail(ttop)
        this.top = htop
        continue
      }
      let gs = this.pushBody(b, head, C0)
      let newgs = gs.concat(G.gs.slice(1)).slice(1)
      G.k = k + 1
      if (newgs.length)
        return Spine6(gs, base, G.gs.slice(1), ttop, 0, this.cls)
      else
        return this.answer(ttop)
    }
    return null
  }

  /**
   * extracts a query - by convention of the form
   * goal(Vars):-body to be executed by the engine
   */
  getQuery() { return array_last(this.clauses, null) }

  /**
   * returns the initial spine built from the
   * query from which execution starts
   */
  init(): TQuery {
    let base = this.size()
    let G = this.getQuery()
    let Q = Spine6(G.hgs, base, [], array_last(this.trail, -1), 0, this.cls)
    this.spines.push(Q)
    return Q
  }

  /**
   * returns an answer as a Spine while recording in it
   * the top of the trail to allow the caller to retrieve
   * more answers by forcing backtracking
   */
  answer(ttop:int) { return Spine2(this.spines[0].hd, ttop) }

  /**
   * removes this spines for the spine stack and
   * resets trail and heap to where they where at its
   * creating time - while undoing variable binding
   * up to that point
   */
  popSpine() {
    let G = this.spines.pop()
    this.unwindTrail(G.ttop)
    this.top = G.base - 1
  }

  /**
   * main interpreter loop: starts from a spine and works
   * though a stream of answers, returned to the caller one
   * at a time, until the spines stack is empty - when it
   * returns null
   */
  yield_() {
    while (this.spines.length) {
      let G = array_last(this.spines, null)
      let C = this.unfold(G)
      if (null == C) {
        this.popSpine() // no matches
        continue
      }
      if (hasGoals(C)) {
        this.spines.push(C)
        continue
      }
      return C // answer
    }
    return null
  }
  heap2s() { return '[' + this.top + ' ' + this.heap.slice(0, this.top).map((x, y) => heapCell(x)).join(',') + ']' }

  /**
   * retrieves an answers and ensure the engine can be resumed
   * by unwinding the trail of the query Spine
   * returns an external "human readable" representation of the answer
   */
  ask() {
    this.query = this.yield_()
    if (null == this.query)
      return null
    let res = this.answer(this.query.ttop).hd
    let R = this.exportTerm(res)
    this.unwindTrail(this.query.ttop)
    return R
  }

  /**
   * initiator and consumer of the stream of answers
   * generated by this engine
   */
  run(print_ans: boolean) {
    let ctr = 0
    for (; ; ctr++) {
      let A = this.ask()
      if (null == A)
        break
      if (print_ans)
        this.options!.writeln!("[" + ctr + "] " + "*** ANSWER=" + this.showTerm(A))
    }
    this.options!.writeln!("TOTAL ANSWERS=" + ctr)
  }
  vcreate(l:int) {
    let vss = []
    for (let i = 0; i < l; i++)
      vss.push([])
    return vss
  }
  put(imaps: any[], vss: any[], keys: any[], val: any) {
    for (let i = 0; i < imaps.length; i++) {
      let key = keys[i]
      if (key != 0)
        imaps[i][key] = val
      else
        vss[i].add(val)
    }
  }
  index(clauses: any[], vmaps: any[]) {
    if (clauses.length < START_INDEX)
      return null
    let T = JSON.stringify
    let imaps = Array(vmaps.length)
    for (let i = 0; i < clauses.length; i++) {
      let c = clauses[i]
      this.options!.writeln("!!!xs=" + T(c.xs) + ":" + this.showCells1(c.xs) + "=>" + i)
      this.put(imaps, vmaps, c.xs, i + 1) // $$$ UGLY INC
      this.options!.writeln(T(imaps))
    }
    this.options!.writeln("INDEX")
    this.options!.writeln(T(imaps))
    this.options!.writeln(T(vmaps))
    this.options!.writeln("")
    return imaps
  }
}

/**
 * tags an integer value while flipping it into a negative
 * number to ensure that untagged cells are always negative and the tagged
 * ones are always positive - a simple way to ensure we do not mix them up
 * at runtime
 */
const tag = (t: int, w: int) => -((w << 3) + t)

/**
 * removes tag after flipping sign
 */
const detag = (w: int) => -w >> 3

/**
 * extracts the tag of a cell
 */
const tagOf = (w: int) => -w & 7
const tagSym = (t: int) =>
  t === V ? "V" :
    t === U ? "U" :
      t === R ? "R" :
        t === C ? "C" :
          t === N ? "N" :
            t === A ? "A" : "?"

const heapCell = (w: int) => tagSym(tagOf(w)) + ":" + detag(w) + "[" + w + "]"

/**
 * true if cell x is a variable
 * assumes that variables are tagged with 0 or 1
 */
const isVAR = (x: int) => tagOf(x) < 2

/**
 * expands a "Xs lists .." statements to "Xs holds" statements
 */
function maybeExpand(Ws:string[]) :string[][] | null {
  let W = Ws[0]
  if (W.length < 2 || "l:" !== W.substring(0, 2))
    return null
  let l = Ws.length
  let Rss = []
  let V = W.substring(2)
  for (let i = 1; i < l; i++) {
    let Vi = 1 == i ? V : V + "__" + (i - 1)
    let Vii = V + "__" + i
    let Rs = ["h:" + Vi, "c:list", Ws[i], i == l - 1 ? "c:nil" : "v:" + Vii]
    Rss.push(Rs)
  }
  return Rss
}

/**
 * expands, if needed, "lists" statements in sequence of statements
 */
function mapExpand(Wss:any[]):string[][] {
  let Rss = []
  for (let Ws of Wss) {
    let Hss = maybeExpand(Ws)
    if (null == Hss)
      Rss.push(Ws)
    else
      for (let X of Hss)
        Rss.push(X)
  }
  return Rss
}

const toNums = (clauses:any[]) => Array(clauses.length).fill(0).map((_, i) => i)

function getSpine(cs:int[]) {
  let a = cs[1]
  let w = detag(a)
  let rs = Array(w - 1).fill(0)
  for (let i = 0; i < w - 1; i++) {
    let x = cs[3 + i]
    let t = tagOf(x)
    if (R != t)
      throw "*** getSpine: unexpected tag=" + t
    rs[i] = detag(x)
  }
  return rs;
}
const relocate = (b: int, cell: int) => tagOf(cell) < 3 ? cell + b : cell
const array_last = (a: any[], def: any) => a.length ? a[a.length - 1] : def
const hasClauses = (S:TQuery) => S.k < S.cs!.length
const hasGoals = (S:TQuery) => S.gs.length > 0

export class Prog extends Engine {
  // declare options?: TOptions;

  constructor(options: TOptions ) {
    super(options);
      this.options = options;
  }

  ppCode() {
    this.options!.writeln("\nSYMS:")
    this.options!.writeln(this.syms.toString())
    this.options!.writeln("\nCLAUSES:\n")
    for (let i = 0; i < this.clauses.length; i++) {
      let C = this.clauses[i]
      this.options!.writeln("[" + i + "]:" + this.showClause(C))
    }
    this.options!.writeln("")
  }
  showClause(s:TClause) {
    let r = ''
    let l = s.hgs.length
    r += "---base:[" + s.base + "] neck: " + s.neck + "-----\n"
    r += this.showCells2(s.base, s.len); // TODO
    r += "\n"
    r += this.showCell(s.hgs[0])

    r += " :- ["
    for (let i = 1; i < l; i++) {
      let e = s.hgs[i]
      r += this.showCell(e)
      if (i < l - 1)
        r += ", "
    }
    r += "]\n"
    r += this.showTerm(s.hgs[0])
    if (l > 1) {
      r += " :- \n"
      for (let i = 1; i < l; i++) {
        let e = s.hgs[i]
        r += "  "
        r += this.showTerm(e)
        r += "\n"
      }
    } else
      r += "\n"
    return r
  }
  showTerm(O:any) {
    if (typeof O === 'number')
      return super.showTerm(O)
    if (O instanceof Array)
      return st0(O)
    return JSON.stringify(O)
  }
  ppGoals(bs:any[]) {
    while (bs.length) {
      this.options!.writeln(this.showTerm(bs[0]))
      bs = bs.slice(1);
    }
  }
  ppc(S:TQuery) {
    let bs = S.gs
    this.options!.writeln("\nppc: t=" + S.ttop + ",k=" + S.k + "len=" + bs.length)
    this.ppGoals(bs)
  }
}

const maybeNull = (O:any) =>
  null == O ? "$null" :
    O instanceof Array ? st0(O) :
      '' + O
const isListCons = (name: string) => "." === name || "[|]" === name || "list" === name
const isOp = (name: string) => "/" === name || "-" === name || "+" === name || "=" === name
function st0(args: any[]) {
  let r = ''
  let name: string = '' + args[0]
  if (args.length == 3 && isOp(name)) {
    r += "("
    r += maybeNull(args[0])
    r += " " + name + " "
    r += maybeNull(args[1])
    r += ")"
  } else if (args.length == 3 && isListCons(name)) {
    r += '['
    r += maybeNull(args[1])
    let tail = args[2]
    for (; ;) {
      if ("[]" === tail || "nil" === tail)
        break
      if (!(tail instanceof Array)) {
        r += '|'
        r += maybeNull(tail)
        break
      }
      let list = tail
      if (!(list.length == 3 && isListCons(list[0]))) {
        r += '|'
        r += maybeNull(tail)
        break
      } else {
        r += ','
        r += maybeNull(list[1])
        tail = list[2]
      }
    }
    r += ']'
  } else if (args.length == 2 && "$VAR" === name) {
    r += "_" + args[1]
  } else {
    let qname = maybeNull(args[0])
    r += qname
    r += "("
    for (let i = 1; i < args.length; i++) {
      let O = args[i]
      r += maybeNull(O)
      if (i < args.length - 1)
        r += ","
    }
    r += ")"
  }
  return r
}

// context.Prog = Prog

// })(typeof module !== 'undefined' ? module.exports : self);
