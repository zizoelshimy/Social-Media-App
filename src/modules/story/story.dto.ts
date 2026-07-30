import { z } from "zod";
import { generalValidationFields } from "../../common/validation";

export const createStory = {
  body: z.object({
    content: z.string().optional(),
  }),
};

export const storyParams = {
  params: z.strictObject({
    storyId: generalValidationFields.id,
  }),
};

export type CreateStoryDto = z.infer<typeof createStory.body>;
export type StoryParamsDto = z.infer<typeof storyParams.params>;
