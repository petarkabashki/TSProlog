type int = number;

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

type ttoken = {
  n?: int, 
  s: string, t: string
}

const   makeToks = (s: string): Array<ttoken> => {
    const e = new RegExp(`(${SPACE})|(${ATOM})|(${VAR})|(${NUM})|(${DOT})`)
    function token(r: RegExpExecArray | null) {
      if (r && r.index === 0) {
        function tkAtom(s: string): ttoken {
          const k = [IF, AND, HOLDS, LISTS, IS].indexOf(s)
          return { t: k < 0 ? ATOM : s, s: s }
        }
        if (r[1]) return { t: SPACE, s: r[0] }
        if (r[2]) return tkAtom(r[0])
        if (r[3]) return { t: VAR, s: r[0] }
        if (r[4]) return { t: NUM, s: r[0], n: parseInt(r[0]) }
        if (r[5]) return { t: DOT, s: r[0] }
      }
    }
    let tokens = [], r;
    while (r = token(e.exec(s))) {
      if (r.t !== SPACE)
        tokens.push(r)
      s = s.substring(r.s.length)
    }
    if (s.length)
      throw ` error at '${s}'`
    return tokens
  }

  export const toSentences = (s: string) => {
    let Wsss = new Array<Array<Array<string>>>();
    let Wss = new Array<Array<string>>();
    let Ws = new Array<string>();
    // const Wsss = []
    // const Wss = []
    // const Ws = []
    makeToks(s).forEach(t => {
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



// package iProlog;
// import java.io.*;
// import java.util.*;

// type Reader = Error;

/**
 * Reads chars from char streams using the current default encoding
 */


//  const IF = "if";
//  const AND = "and";
//  const DOT = ".";
//  const HOLDS = "holds";
//  const LISTS = "lists"; // todo
//  const IS = "is"; // todo

// export default class Toks /*extends StreamTokenizer*/ {

//   // reserved words - with syntactic function

//   public static makeToks(s: string, fromFile: boolean): Toks | null {
//     // return null;
//     try {
//        let R: Reader;
//       if (fromFile) {
//         R = new FileReader(s);
//       } else {
//         R = new stringReader(s);
//       }
//       const T = new Toks(R);
//       return T;

//     } catch (e) {
//       console.log(e)
//       // e.printStackTrace();
//       return null;
//     }
//   }

//   public constructor(reader: Reader) {
//     // super(reader);
//     // resetSyntax();
//     // eolIsSignificant(false);
//     // ordinaryChar('.');
//     // ordinaryChars('!', '/'); // 33-47
//     // ordinaryChars(':', '@'); // 55-64
//     // ordinaryChars('[', '`'); // 91-96
//     // ordinaryChars('{', '~'); // 123-126
//     // wordChars('_', '_');
//     // wordChars('a', 'z');
//     // wordChars('A', 'Z');
//     // wordChars('0', '9');
//     // slashStarComments(true);
//     // slashSlashComments(true);
//     // ordinaryChar('%');
//   }

//   public getWord(): string {
//     //  let t: string = null;

//     //  let c:int = TT_EOF;
//     // try {
//     //   c = nextToken();
//     //   while (Character.isWhitespace(c) && c != TT_EOF) {
//     //     c = nextToken();
//     //   }
//     // } catch (IOException e) {
//     //   return "*** tokenizer error:" + t;
//     // }

//     // switch (c) {
//     //   case TT_WORD: {
//     //     char first = sval.charAt(0);
//     //     if (Character.isUpperCase(first) || '_' == first) {
//     //       t = "v:" + sval;
//     //     } else {
//     //       try {
//     //         int n = Integer.parseInt(sval);
//     //         if (Math.abs(n) < 1 << 28) {
//     //           t = "n:" + sval;
//     //         } else {
//     //           t = "c:" + sval;
//     //         }
//     //       } catch (Exception e) {
//     //         t = "c:" + sval;
//     //       }
//     //     }
//     //   }
//     //   break;

//     //   case StreamTokenizer.TT_EOF: {
//     //     t = null;
//     //   }
//     //   break;

//     //   default: {
//     //     t = "" + (char) c;
//     //   }

//     // }
//     // return t;
//     return "not converted"
//   }

//   public static toSentences(s: string, fromFile: boolean): Array<Array<Array<string>>> {
//     let Wsss = new Array<Array<Array<string>>>();
//     let Wss = new Array<Array<string>>();
//     let Ws = new Array<string>();
//     let toks = this.makeToks(s, fromFile);
//     let t: string = null;
//     while (null != (t = toks.getWord())) {

//       if (DOT == (t)) {
//         Wss.push(Ws);
//         Wsss.push(Wss);
//         Wss = new Array<Array<string>>();
//         Ws = new Array<string>();
//       } else if (("c:" + IF) == (t)) {

//         Wss.push(Ws);

//         Ws = new Array<string>();
//       } else if (("c:" + AND) == (t)) {
//         Wss.push(Ws);

//         Ws = new Array<string>();
//       } else if (("c:" + HOLDS) == (t)) {
//         const w = Ws[0];
//         Ws[0] = "h:" + w.substring(2);
//       } else if (("c:" + LISTS) == (t)) {
//         const w = Ws[0];
//         Ws[0] = "l:" + w.substring(2);
//       } else if (("c:" + IS) == (t)) {
//         const w = Ws[0];
//         Ws[0] = "f:" + w.substring(2);
//       } else {
//         Ws.push(t);
//       }
//     }
//     return Wsss;
//   }

//   static toString(Wsss: any[]): string {
//     // return Arrays.deepTostring(Wsss);
//     return 'uninplemented';
//   }

//   public static main(args: string[]) {
//     // Main.pp(toSentences("prog.nl", true));
//     return ['uninplemented'];
//   }
// }