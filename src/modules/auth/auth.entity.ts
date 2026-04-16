//we use this to make the front end know what the tyoe of data he must expect from the backend and to make the code more organized and maintainable
export interface ILoginResponse{
    email:string;
    password:string;
}

export interface ISignUpResponse extends ILoginResponse{
   username:string;
   _id:string;
}

export interface ILoginResponse{ access_token: string; refresh_token: string }