import { HydratedDocument } from "mongoose";

export interface IPaginate<TRawDoc> {
    docs: HydratedDocument<TRawDoc>[];    
    currentPage?:number|string|undefined;
    size?:number|string|undefined;
    pages?:number|string|undefined;
  } 