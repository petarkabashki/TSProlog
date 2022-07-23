/* Generated from Java with JSweet 3.0.0 - http://www.jsweet.org */
  export default class IntStack {
      /*private*/ stack: number[];

      /*private*/ top: number = 0;

      static SIZE: number = 16;

      static MINSIZE: number = 1 << 15;

      public constructor(size?: any) {
          if (((typeof size === 'number') || size === null)) {
              let __args = arguments;
              if (this.top === undefined) { this.top = 0; } 
              this.stack = (s => { let a=[]; while(s-->0) a.push(0); return a; })(size);
              this.clear();
          } else if (size === undefined) {
              let __args = arguments;
              {
                  let __args = arguments;
                  let size: any = IntStack.SIZE;
                  if (this.top === undefined) { this.top = 0; } 
                  this.stack = (s => { let a=[]; while(s-->0) a.push(0); return a; })(size);
                  this.clear();
              }
              if (this.top === undefined) { this.top = 0; } 
          } else throw new Error('invalid overload');
      }

      getTop(): number {
          return this.top;
      }

      setTop(top: number): number {
          return this.top = top;
      }

      clear() {
          this.top = -1;
      }

      isEmpty(): boolean {
          return this.top < 0;
      }

      /**
       * Pushes an element - top is incremented first than the
       * element is assigned. This means top point to the last assigned
       * element - which can be returned with peek().
       * @param {number} i
       */
      push(i: number) {
          if (++this.top >= this.stack.length){
              this.expand();
          }
          this.stack[this.top] = i;
      }

      pop(): number {
          const r: number = this.stack[this.top--];
          this.shrink();
          return r;
      }

      public get(i: number): number {
          return this.stack[i];
      }

      public set(i: number, val: number) {
          this.stack[i] = val;
      }

      public size(): number {
          return this.top + 1;
      }

      /**
       * dynamic array operation: doubles when full
       * @private
       */
      /*private*/ expand() {
          const l: number = this.stack.length;
          const newstack: number[] = (s => { let a=[]; while(s-->0) a.push(0); return a; })(l << 1);
          /* arraycopy */((srcPts, srcOff, dstPts, dstOff, size) => { if(srcPts !== dstPts || dstOff >= srcOff + size) { while (--size >= 0) dstPts[dstOff++] = srcPts[srcOff++];} else { let tmp = srcPts.slice(srcOff, srcOff + size); for (let i = 0; i < size; i++) dstPts[dstOff++] = tmp[i]; }})(this.stack, 0, newstack, 0, l);
          this.stack = newstack;
      }

      /**
       * dynamic array operation: shrinks to 1/2 if more than than 3/4 empty
       * @private
       */
      /*private*/ shrink() {
          let l: number = this.stack.length;
          if (l <= IntStack.MINSIZE || this.top << 2 >= l)return;
          l = 1 + (this.top << 1);
          if (this.top < IntStack.MINSIZE){
              l = IntStack.MINSIZE;
          }
          const newstack: number[] = (s => { let a=[]; while(s-->0) a.push(0); return a; })(l);
          /* arraycopy */((srcPts, srcOff, dstPts, dstOff, size) => { if(srcPts !== dstPts || dstOff >= srcOff + size) { while (--size >= 0) dstPts[dstOff++] = srcPts[srcOff++];} else { let tmp = srcPts.slice(srcOff, srcOff + size); for (let i = 0; i < size; i++) dstPts[dstOff++] = tmp[i]; }})(this.stack, 0, newstack, 0, this.top + 1);
          this.stack = newstack;
      }

      public toArray(): number[] {
          const array: number[] = (s => { let a=[]; while(s-->0) a.push(0); return a; })(this.size());
          if (this.size() > 0){
              /* arraycopy */((srcPts, srcOff, dstPts, dstOff, size) => { if(srcPts !== dstPts || dstOff >= srcOff + size) { while (--size >= 0) dstPts[dstOff++] = srcPts[srcOff++];} else { let tmp = srcPts.slice(srcOff, srcOff + size); for (let i = 0; i < size; i++) dstPts[dstOff++] = tmp[i]; }})(this.stack, 0, array, 0, this.size());
          }
          return array;
      }

      public reverse() {
          const l: number = this.size();
          const h: number = l >> 1;
          for(let i: number = 0; i < h; i++) {{
              const temp: number = this.stack[i];
              this.stack[i] = this.stack[l - i - 1];
              this.stack[l - i - 1] = temp;
          };}
      }

      /**
       * 
       * @return {string}
       */
      public toString(): string {
          return JSON.stringify(this.toArray());
      }
  }

