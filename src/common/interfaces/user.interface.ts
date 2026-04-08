import { GenderEnum, ProviderEnum, RoleEnum } from "../enums";

export interface IUser {
    firstName: string;
    lastName: string;
    username?: string;
    email: string;
    phone?: string;
    password: string;
    profilePicture?: string;
    profileCoverPictures?: string[];

    gender:GenderEnum;
    role:RoleEnum;
    provider:ProviderEnum;


    changeCredentialsTime?: Date;
    DOB?: Date;
    confirmEmail?: Date;

    createdAt?: Date;
    updatedAt?: Date;
}