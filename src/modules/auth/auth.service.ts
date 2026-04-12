import { LoginDto, SignUpDto } from "./auth.dto";
import { IUser } from "../../common/interfaces";
import { UserRepository } from "../../DB/repository";
import { BadRequestException, ConflictException } from "../../common/exceptions";
import { generateEncryption, generateHash } from "../../common/utils/security";
import { emailTemplate, sendEmail } from "../../common/utils/email";

export class AuthenticationService {
   private userRepository:UserRepository;
  constructor() {
   this.userRepository=new UserRepository();
  }
 public login(data:LoginDto):LoginDto{
    return data;
 }
// the in to db is raw data and the out data is hydrated wit recpect to the service and the out to front is raw data to can not update it 
 public async signup({email,username,password,phone}: SignUpDto): Promise<IUser> {
   const checUserExist=await this.userRepository.findOne({
    filter:{email},
    projection:email,
    options:{lean:true}
   })
   if(checUserExist){
    throw new ConflictException("User already exist")
   } 
    const user = await this.userRepository.createOne({
      data :{
        email,
        username,
        password:await generateHash({plaintext:password}),
        phone:phone? await generateEncryption(phone): undefined
}
    })

    if (!user) {
        throw new BadRequestException("Fail")
    }
    await sendEmail({
    to: email,
    subject: "Confirmation Email",
    html: emailTemplate({code: 123456, title: "Verify account"}),
    })
    return user.toJSON()
}  
}
export default new AuthenticationService;
