import { Prog } from './TyProlog';
import { readFileSync } from 'fs';
import process from 'node:process';

const testDir = './test';
process.argv.slice(2).map(p => `${testDir}/${p}`).forEach(script_nl => {

  const prog = new Prog({
    writeln: function (l: string) {
      // textln(out_elem, l)
      console.log(l);
    },
    nl_source: readFileSync(script_nl).toString()
  })
  prog.run(true);
})
// Main(
//   ['add.pl'].map(p => `${progDir}/${p}`)
// );
// const script_nl = './atest.pl.nl'
// const script_nl = './hhprolog/test/mperms.pl.nl'
// const prog = new Prog({
//   writeln: function (l: string) {
//     // textln(out_elem, l)
//     console.log(l);
//   },
//   nl_source: readFileSync(script_nl).toString()
// })
// prog.run(true);
