import { DataBaseRepository } from ".";
import { IPost } from "../../common/interfaces";
import { PostModel } from "../models/index";

export class PostRepository extends DataBaseRepository<IPost> {
  constructor() {
    super(PostModel);
  }
}
