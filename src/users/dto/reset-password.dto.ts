import { IsString, MinLength, MaxLength, Matches } from 'class-validator';

/**
 * DTO para blanqueo de contraseña
 */
export class ResetPasswordDto {
    @IsString()
    @MinLength(6)
    @MaxLength(50)
    @Matches(
        /(?:(?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/,
        {
            message: 'The password must have a Uppercase, lowercase letter and a number'
        }
    )
    newPassword: string;
}
