// package iProlog;
// import java.io.*;
// import java.util.*;

type Reader = Error;

/**
 * Reads chars from char streams using the current default encoding
 */
export default class Toks /*extends StreamTokenizer*/ {

  // reserved words - with syntactic function

   static  IF = "if";
   static  AND = "and";
   static  DOT = ".";
   static  HOLDS = "holds";
   static  LISTS = "lists"; // todo
   static  IS = "is"; // todo

  public static  makeToks(  s: string,  fromFile: boolean): Toks |null {
    return null;
    // try {
    //    R: Reader;
    //   if (fromFile) {
    //     R = new FileReader(s);
    //   } else {
    //     R = new stringReader(s);
    //   }
    //   Toks T = new Toks(R);
    //   return T;

    // } catch (IOException e) {
    //   e.printStackTrace();
    //   return null;
    // }
  }

  public constructor( reader: Reader) {
    // super(reader);
    // resetSyntax();
    // eolIsSignificant(false);
    // ordinaryChar('.');
    // ordinaryChars('!', '/'); // 33-47
    // ordinaryChars(':', '@'); // 55-64
    // ordinaryChars('[', '`'); // 91-96
    // ordinaryChars('{', '~'); // 123-126
    // wordChars('_', '_');
    // wordChars('a', 'z');
    // wordChars('A', 'Z');
    // wordChars('0', '9');
    // slashStarComments(true);
    // slashSlashComments(true);
    // ordinaryChar('%');
  }

  public  getWord() :string{
    //  let t: string = null;

    //  let c:int = TT_EOF;
    // try {
    //   c = nextToken();
    //   while (Character.isWhitespace(c) && c != TT_EOF) {
    //     c = nextToken();
    //   }
    // } catch (IOException e) {
    //   return "*** tokenizer error:" + t;
    // }

    // switch (c) {
    //   case TT_WORD: {
    //     char first = sval.charAt(0);
    //     if (Character.isUpperCase(first) || '_' == first) {
    //       t = "v:" + sval;
    //     } else {
    //       try {
    //         int n = Integer.parseInt(sval);
    //         if (Math.abs(n) < 1 << 28) {
    //           t = "n:" + sval;
    //         } else {
    //           t = "c:" + sval;
    //         }
    //       } catch (Exception e) {
    //         t = "c:" + sval;
    //       }
    //     }
    //   }
    //   break;

    //   case StreamTokenizer.TT_EOF: {
    //     t = null;
    //   }
    //   break;

    //   default: {
    //     t = "" + (char) c;
    //   }

    // }
    // return t;
    return "not converted"
  }

  public static toSentences( s:string,  fromFile:boolean): Array<Array<Array<string>>>  {
     let Wsss = new Array<Array<Array<string>>>();
    // let Wss = new Array<Array<string>>();
    // let Ws = new Array<string>();
    // let toks: Toks = this.makeToks(s, fromFile);
    //  let t:string = null;
    // while (null != (t = toks.getWord())) {

    //   if (DOT.equals(t)) {
    //     Wss.add(Ws);
    //     Wsss.add(Wss);
    //     Wss = new Array<Array<string>>();
    //     Ws = new Array<string>();
    //   } else if (("c:" + IF).equals(t)) {

    //     Wss.add(Ws);

    //     Ws = new Array<string>();
    //   } else if (("c:" + AND).equals(t)) {
    //     Wss.add(Ws);

    //     Ws = new Array<string>();
    //   } else if (("c:" + HOLDS).equals(t)) {
    //     string w = Ws.get(0);
    //     Ws.set(0, "h:" + w.substring(2));
    //   } else if (("c:" + LISTS).equals(t)) {
    //     string w = Ws.get(0);
    //     Ws.set(0, "l:" + w.substring(2));
    //   } else if (("c:" + IS).equals(t)) {
    //     string w = Ws.get(0);
    //     Ws.set(0, "f:" + w.substring(2));
    //   } else {
    //     Ws.add(t);
    //   }
    // }
    return Wsss;
  }

  static  tostring( Wsss: any[]) : string{
    // return Arrays.deepTostring(Wsss);
    return 'uninplemented';
  }

  public static  main( args: string[]) {
    // Main.pp(toSentences("prog.nl", true));
    return ['uninplemented'];
  }
}