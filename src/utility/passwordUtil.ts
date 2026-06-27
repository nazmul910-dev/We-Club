import bcrypt from 'bcryptjs';
import config from '../config';

const  DEFAULT_SALT_ROUNDS = 12;

const getSaltRounds = (): number => {
    const saltRounds = Number(config.SALT_ROUNDS);

    if(!Number.isInteger(saltRounds) || saltRounds < 10) {
        return DEFAULT_SALT_ROUNDS;;
    }

    return saltRounds;
};

export const hashPassword = async (password: string): Promise<string> =>{
    return bcrypt.hash(password,getSaltRounds());
}

export const comparePassword = async (password: string, hashedPassword: string): Promise<boolean> => {
    return bcrypt.compare(password, hashedPassword);
} 