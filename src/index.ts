import {Main} from './TyProlog/Main';

const progDir = './IP/progs'
Main(
  ['queens'].map(p => `${progDir}/${p}`)
);