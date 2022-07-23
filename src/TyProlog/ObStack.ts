
export default class ObStack<T> extends Array<T> {

   static serialVersionUID = 1;
   public isEmpty() : boolean {
    return this.length == 0;
   }

  //   pop() :T{
  //   const last = this.length - 1;
  //   return super.pop();
  // }

  // final void push(final T O) {
  //   add(O);
  // }

   public peek() :T{
    return this.peek();
  }
}
