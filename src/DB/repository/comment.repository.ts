import { DataBaseRepository } from ".";
import { IComment} from "../../common/interfaces";
import { CommentModel } from "../models/index";

export class CommentRepository extends DataBaseRepository<IComment> {
  constructor() {
    super(CommentModel);
  }
}
