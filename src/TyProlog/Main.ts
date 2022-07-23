import Engine from './Engine';
import {pp, println} from './utils';
import Prog from './Prog';
import {nanoseconds} from './nanoTime';

const run = (fname0: string) => {
  let p = true;

  const fname = fname0 + ".nl";
  let P: Engine;

  if (p) {
    P = new Prog(fname);
    pp("CODE");
    (P as Prog).ppCode();
  } else {
    P = new Engine(fname);
  }

  pp("RUNNING");
  const t1 = nanoseconds();
  P.run();
  const t2 = nanoseconds();
  console.log(`time=${t2.subtract(t1).divide(1000000000.0)}`);

}

const srun = (fname0: string) => {
  const fname = fname0 + ".nl";
  const P = new Prog(fname);

  pp("CODE");
  P.ppCode();

  pp("RUNNING");
  const t1 = nanoseconds();

  //TODO: convert
  // let S = P.stream();
  // S.forEach(x => pp(P.showTerm(x)));
  // for(x of P)


  const t2 = nanoseconds();
  console.log(`time=${t2.subtract(t1).divide(1000000000.0)}`);
}

export const Main = (args: string[]) => {
  const fname = args[0];
  run(fname);
}
// export default {
//   pp,
//   println,
//   Main,
// }
