import { type Bootstrap } from "..";

export interface InitHandler {
  setNext: (handler: InitHandler) => InitHandler;
  handle: (bootstrap: Bootstrap) => Promise<Bootstrap>;
}
