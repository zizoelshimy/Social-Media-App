import { confirmEmailDto, LoginDto, resendConfirmEmailDto, SignUpDto } from "./auth.dto";
import { IUser } from "../../common/interfaces";
import { UserRepository } from "../../DB/repository";
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from "../../common/exceptions";
import { generateEncryption, generateHash } from "../../common/utils/security";
import { emailEvent, emailTemplate, sendEmail } from "../../common/utils/email";
import { RedisService } from "../../common/services";
import redisService from "../../common/services/redis.service";
import { EmailEnum, ProviderEnum } from "../../common/enums";
import { createRandomOtp } from "../../common/utils/otp";
import { compareHash } from "../../common/utils/security";
import { TokenService } from "../../common/services/token.servic";
import { OAuth2Client } from "google-auth-library/build/src/auth/oauth2client";
import { GOOGLE_CLIENT_ID } from "../../config/config";
import { TokenPayload } from "google-auth-library";
export class AuthenticationService {
  private userRepository: UserRepository;
  private readonly redis: RedisService;
  private readonly tokenService: TokenService;
  constructor() {
    this.userRepository = new UserRepository();
    this.redis = redisService;
    this.tokenService = new TokenService();
  }
public async login  (inputs:LoginDto, issuer:string):Promise<{ access_token: string; refresh_token: string }> { {
  const { email, password } = inputs;
  const user = await this.userRepository.findOne({
    filter: { email, provider: ProviderEnum.SYSTEM ,confirmEmail: { $exists: true, $ne: null } },
  });
  if (!user) {
    throw new NotFoundException("Invalid email or password");
  }
  if (
    !(await compareHash({
      plaintext: password,
      ciphertext: user.password
    }))
  ) {
    throw new NotFoundException("Invalid email or password");
  }
  return await this.tokenService.createLoginCredentials(user, issuer);
};
}
  // the in to db is raw data and the out data is hydrated wit recpect to the service and the out to front is raw data to can not update it

  private async sendEmailOtp({
    email,
    subject,
    title,
  }: {
    email: string;
    subject: EmailEnum;
    title: string;
  }): Promise<void> {
    const isBlocked = await this.redis.ttl(
      this.redis.blockOtpKey({ email, subject }),
    );
    if (isBlocked > 0) {
      throw new BadRequestException(
        `Sorry, you have been blocked from requesting new OTPs.while you are blocked. Please try again after ${isBlocked} seconds`,
      );
    }

    const remainingOtpTTL = await this.redis.ttl(
      this.redis.otpKey({ email, subject }),
    );
    if (remainingOtpTTL > 0) {
      throw new BadRequestException(
        `Sorry, you cannot request a new OTP while the current OTP is still valid. Please try again after ${remainingOtpTTL} seconds`,
      );
    }
    // Check the number of resend attempts and block if it exceeds the limit
    const maxtrial = Number(
      (await this.redis.get(this.redis.maxAttemptOtpKey({ email, subject }))) ||
        0,
    );
    if (maxtrial >= 3) {
      await this.redis.set({
        key: this.redis.blockOtpKey({ email, subject }),
        value: 1,
        ttl: 7 * 60,
      });
      throw new BadRequestException(
        `Sorry, you have exceeded the maximum number of OTP resend attempts. Please try again after 7 minutes`,
      );
    }
    const code = await createRandomOtp();
    await this.redis.set({
      key: this.redis.otpKey({ email, subject }),
      value: await generateHash({
        plaintext: `${code}`,
      }),
      ttl: 120,
    });
    emailEvent.emit("sendEmail", async () => {
      await sendEmail({
        to: email,
        subject,
        html: emailTemplate({ code, title }),
      });
      await this.redis.incr(this.redis.maxAttemptOtpKey({ email, subject }));
    });
  }
  public async signup({
    email,
    username,
    password,
    phone,
  }: SignUpDto): Promise<IUser> {
    const checUserExist = await this.userRepository.findOne({
      filter: { email },
      projection: email,
      options: { lean: true },
    });
    if (checUserExist) {
      throw new ConflictException("User already exist");
    }
    const user = await this.userRepository.createOne({
      data: {
        email,
        username,
        password: await generateHash({ plaintext: password }),
        phone: phone ? await generateEncryption(phone) : undefined,
      },
    });

    if (!user) {
      throw new BadRequestException("Fail");
    }
    await this.sendEmailOtp({
      email,
      subject: EmailEnum.CONFIRM_EMAIL,
      title: "verify Your Email",
    });
    return user.toJSON();
  }

  public async confirmEmail({ email, otp }: confirmEmailDto) {
    const account = await this.userRepository.findOne({
      filter: {
        email,
        $or: [{ confirmEmail: { $exists: false } }, { confirmEmail: null }],
        provider: ProviderEnum.SYSTEM,
      },
    });

    if (!account) {
      throw new NotFoundException("Account not found or already confirmed");
    }

    const hashOtp = await this.redis.get(
      this.redis.otpKey({ email, subject: EmailEnum.CONFIRM_EMAIL }),
    );
    if (!hashOtp) {
      throw new NotFoundException("OTP expired");
    }

    if (
      !(await compareHash({
        plaintext: otp,
        ciphertext: hashOtp,
      }))
    ) {
      throw new ConflictException("Invalid OTP");
    }

    account.confirmEmail = new Date();
    await account.save();
    await this.redis.deleteKey(
      this.redis.otpKey({ email, subject: EmailEnum.CONFIRM_EMAIL }),
    );

    return account;
  }

  // resend confirm email if OTP expired
  public async resendConfirmEmail({ email }: resendConfirmEmailDto) {
    const account = await this.userRepository.findOne({
      filter: {
        email,
        $or: [{ confirmEmail: { $exists: false } }, { confirmEmail: null }],
        provider: ProviderEnum.SYSTEM,
      },
    });

    if (!account) {
      throw new NotFoundException("Account not found or already confirmed");
    }

    await this.sendEmailOtp({
      email,
      subject: EmailEnum.CONFIRM_EMAIL,
      title: "Verify your email for Saraha account",
    });
  }


 private async verifyGoogleAccount  (idToken:string):Promise<TokenPayload>  {
  const client = new OAuth2Client();
  if (!GOOGLE_CLIENT_ID) {
  throw new Error("GOOGLE_CLIENT_ID is not configured");
}
  const ticket = await client.verifyIdToken({
    idToken,
    audience: GOOGLE_CLIENT_ID,
  });
  const payload = ticket.getPayload();
  if (!payload?.email_verified) {
   throw new  BadRequestException("fail to verify by google" );
  }
  return payload;
};
async loginWithGmail(idToken: string, issuer: string) {
    
    const payload = await this.verifyGoogleAccount(idToken)

    const user = await this.userRepository.findOne({
        filter: {
            email: payload.email as string,
            provider: ProviderEnum.GOOGLE
        }
    })

    if (!user) {
        throw new NotFoundException("Invalid account provider or not register account")
    }

    return await this.tokenService.createLoginCredentials(user, issuer);
}
signupWithGmail = async (idToken:string, issuer:string) => {
  const payload = await this.verifyGoogleAccount(idToken);
  console.log(payload);
  const checkExist = await this.userRepository.findOne({
    filter: { email: payload.email as string },
  });
  if (checkExist) {
    if (checkExist.provider != ProviderEnum.GOOGLE) {
      throw new ConflictException("Invalid provider");
    }
    return {
      status: 200,
      Credentials: await this.loginWithGmail(idToken, issuer),
    };
  }
  const user = await this.userRepository.createOne({
      data: {
      firstName: payload.given_name as string,
      lastName: payload.family_name as string,
      email: payload.email as string,
      profilePicture: payload.picture as string,
      provider: ProviderEnum.GOOGLE,
      confirmEmail: new Date(),
    },
  });
  return {
    status: 201,
    Credentials: await this.tokenService.createLoginCredentials(user, issuer),
  };
};

}
export default new AuthenticationService();
