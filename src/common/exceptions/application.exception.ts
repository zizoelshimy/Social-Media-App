
export class ApplicationException extends Error {
    constructor( message:string,public statusCode:number,cause?:unknown){
        super(message,{cause}); // Pass the message and cause to the base Error class
        this.name=this.constructor.name; // Set the name property to the name of the derived class when we make a forbiden exception it will be named forbidden exception not the error class 
        Error.captureStackTrace(this,this.constructor); // Capture the stack trace for better debugging 
    }
}
