import IntList from './IntList';

type int = number;

export default class Spine {
    public constructor(gs0?: any, base?: any, gs?: any, ttop?: any, k?: any, cs?: any) {
        if (((gs0 != null && gs0 instanceof <any>Array && (gs0.length == 0 || gs0[0] == null || (typeof gs0[0] === 'number'))) || gs0 === null) && ((typeof base === 'number') || base === null) && ((gs != null && gs instanceof <any>IntList) || gs === null) && ((typeof ttop === 'number') || ttop === null) && ((typeof k === 'number') || k === null) && ((cs != null && cs instanceof <any>Array && (cs.length == 0 || cs[0] == null || (typeof cs[0] === 'number'))) || cs === null)) {
            let __args = arguments;
            this.hd = gs0[0];
            this.base = base;
            this.gs = IntList.tail(IntList.app(gs0, gs));
            this.ttop = ttop;
            this.k = k;
            this.cs = cs;
        } else if (((typeof gs0 === 'number') || gs0 === null) && ((typeof base === 'number') || base === null) && gs === undefined && ttop === undefined && k === undefined && cs === undefined) {
            let __args = arguments;
            let hd: any = __args[0];
            let ttop: any = __args[1];
            this.hd = hd;
            this.base = 0;
            this.gs = IntList.empty;
            this.ttop = ttop;
            this.k = -1;
        } else throw new Error('invalid overload');
    }

    hd: number;

    base: number;

    gs: IntList | null;

    ttop: number;

    k: number;

    xs: int[] = [];

    cs: int[] = [];
}
// Spine["__class"] = "Spine";
