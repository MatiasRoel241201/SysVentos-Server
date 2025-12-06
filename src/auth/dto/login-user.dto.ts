import { IsString, Matches, MaxLength, MinLength } from "class-validator";
import { Transform } from 'class-transformer';

export class loginUserDto {

    @Transform(({ value }) => value.toLowerCase().trim())
    @IsString()
    @MinLength(2)
    userName: string;

    @IsString()
    @MinLength(6)
    @MaxLength(50)
    @Matches(
        /(?:(?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
        message: 'The password must have a Uppercase, lowercase letter and a number'
    })
    password: string;
}