import crypto from 'node:crypto';
import { ENC_KEY, ENC_IV_LENGTH } from '../../../config/config';
import { BadRequestException } from '../../exceptions';
export const generateEncryption = async(plainText: string): Promise<string> => {
    //first step come here 
//console.log(crypto.randomBytes(IV_LENGTH).toString('hex')) //this only to generate random IV for encryption and decryption process, it should be stored in the database with the cipher text to be used in decryption process

const iv = crypto.randomBytes(ENC_IV_LENGTH);
const cipher = crypto.createCipheriv('aes-256-cbc', ENC_KEY, iv);
let cipherText = cipher.update(plainText, 'utf-8', 'hex');
cipherText += cipher.final('hex');
return `${iv.toString('hex')}:${cipherText}`;
}
export const generateDecryption = async(cipherText : string): Promise<string> => {
    const [iv, encryptedData] = cipherText.split(':')|| [] as string[];
    if (!iv || !encryptedData) {
        throw new BadRequestException('Invalid cipher text format');
    }
    const ivLikeBinary = Buffer.from(iv, 'hex');
    let decipher = crypto.createDecipheriv('aes-256-cbc', ENC_KEY, ivLikeBinary);
let plainText = decipher.update(encryptedData, 'hex', 'utf-8');
plainText += decipher.final('utf-8');
return plainText;

}