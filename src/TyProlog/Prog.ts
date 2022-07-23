
import Engine from './Engine';
import {pp, println} from './utils';
import Clause from './Clause';
import IntList from './IntList';
import Spine from './Spine';

type long = number;
type int = number;
type Spliterator = null;


// @Override
const showTerm = (O: any): string => {
  if (null == O)
    return "$null";
  if (O instanceof Array<object>)
    return st0(O as object[]);
  return O.toString();
}

const maybeNull = (O: any): string => {
  if (null == O)
    return "$null";
  if (O instanceof Array<object>)
    return st0(O as object[]);
  return O.toString();
}

const isListCons = (name: string): boolean => {
  return ("." === (name)) || ("[|]" === (name)) || ("list" == (name));
}

const isOp = (name: string): boolean => {
  return "/" == (name) || "-" == (name) || "+" == (name) || "=" == (name);
}

const st0 = (args: object[]): string => {
  let buf = new Array<string>();
  let name = args[0].toString();
  if (args.length == 3 && isOp(name)) {
    buf.push("(");
    buf.push(maybeNull(args[0]));
    buf.push(" " + name + " ");
    buf.push(maybeNull(args[1]));
    buf.push(")");
  } else if (args.length == 3 && isListCons(name)) {
    buf.push('[');
    {
      buf.push(maybeNull(args[1]));
      let tail = args[2];
      for (; ;) {

        if (tail.toString() == "[]"  || tail.toString() == "nil" ) {
          break;
        }
        if (!(tail instanceof Array<object>)) {
          buf.push('|');
          buf.push(maybeNull(tail));
          break;
        }
        let  list: any[] =  tail as object[];
        if (!(list.length == 3 && isListCons(list[0]))) {
          buf.push('|');
          buf.push(maybeNull(tail));
          break;
        } else {
          //if (i > 1)
          buf.push(',');
          buf.push(maybeNull(list[1]));
          tail = list[2];
        }
      }
    }
    buf.push(']');
  } else if (args.length == 2 && "$VAR" == (name)) {
    buf.push("_" + args[1]);
  } else {
    let qname = maybeNull(args[0]);
    buf.push(qname);
    buf.push("(");
    for (let i = 1; i < args.length; i++) {
      let O = args[i];
      buf.push(maybeNull(O));
      if (i < args.length - 1) {
        buf.push(",");
      }
    }
    buf.push(")");
  }
  return buf.toString();
}


export default class Prog extends Engine /*implements Spliterator<object>*/ {
  public constructor(fname: string) {
    super(fname);
  }

  ppCode  ()  {
    pp("\nSYMS:");
    pp(this.syms);
    pp("\nCLAUSES:\n");
  
    for (let i = 0; i < this.clauses.length; i++) {
  
      let C: Clause = this.clauses[i];
      pp("[" + i + "]:" + this.showClause(C));
    }
    pp("");
  
  }
  
  showClause(s: Clause): string {
    let buf = new Array<string>();
    let l = s.hgs.length;
    buf.push("---base:[" + s.base + "] neck: " + s.neck + "-----\n");
    buf.push(this.showCells(s.base, s.len)); // TODO
    buf.push("\n");
    buf.push(this.showCell(s.hgs[0]));
  
    buf.push(" :- [");
    for (let i = 1; i < l; i++) {
  
      let e = s.hgs[i];
      buf.push(this.showCell(e));
      if (i < l - 1) {
        buf.push(", ");
      }
    }
  
    buf.push("]\n");
  
    buf.push(this.showTerm(s.hgs[0]));
    if (l > 1) {
      buf.push(" :- \n");
      for (let i = 1; i < l; i++) {
        let e = s.hgs[i];
        buf.push("  ");
        buf.push(this.showTerm(e));
        buf.push("\n");
      }
    } else {
      buf.push("\n");
    }
    return buf.toString();
  }
  
  /*
  string showHead(final Cls s) {
    final int h = s.gs[0];
    return showCell(h) + "=>" + showTerm(h);
  }
  */

  // @Override
 ppGoals(bs:IntList |null) {
    while (!IntList.isEmpty(bs)) {
      pp(this.showTerm(bs && IntList.head(bs)));
      bs = IntList.tail(bs);
    }

  }

  // @Override
 ppc(  S: Spine) {
    //stats();
    let  bs: IntList | null = S.gs;
    pp("\nppc: t=" + S.ttop + ",k=" + S.k + "len=" +(bs && IntList.len(bs)));
    this.ppGoals(bs);
  }

  /////////////// end of show

  // possibly finite Stream support

  // public  stream() : Stream<any>{
  //   // return StreamSupport.stream(this, false);
  //   //TODO: convert
  //   return null;
  // }

//   // @Override
//   public  trySplit() :Spliterator<object> {
//     return null;
//   }

//   // @Override
//   public  characteristics(): int {
//     return (Spliterator.ORDERED | Spliterator.NONNULL) & ~Spliterator.SIZED;
//   }

//   // @Override
//   public  estimateSize(): long {
//     return Number.MAX_VALUE;
//   }

//   // @Override
//   public  tryAdvance( action: Consumer <object >):boolean {
//     let  R = this.ask();
//     let  ok = null != R;
//   if (ok) {
//     action.accept(R);
//   }
//   return ok;
// }

}
