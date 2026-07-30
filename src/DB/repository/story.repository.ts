import { DataBaseRepository } from ".";
import { IStory } from "../../common/interfaces";
import { StoryModel } from "../models/story.model";

export class StoryRepository extends DataBaseRepository<IStory> {
  constructor() {
    super(StoryModel);
  }
}