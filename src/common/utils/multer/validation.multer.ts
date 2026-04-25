import { Request } from "express";
import { FileFilterCallback } from "multer";
import { BadRequestException } from "../../exceptions";
export const fileFieldValidation = {
  image: ["image/jpeg", "image/png", "image/jpg"],
  video: ["video/mp4", "video/mkv", "video/avi"],
  audio: ["audio/mpeg", "audio/wav", "audio/ogg"],
};
export const fileFilter = (validation: string[]) => {
  return function (
    req: Request,
    file: Express.Multer.File,
    cb: FileFilterCallback,
  ) {
    if (!validation.includes(file.mimetype)) {
      return cb(new BadRequestException("Invalid file format"));
    }

    return cb(null, true);
  };
};
