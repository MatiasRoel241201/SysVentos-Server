import { IsString, IsNotEmpty, MinLength, MaxLength, IsUUID, Matches } from 'class-validator';

/**
 * DTO para crear un usuario con rol
 */
export class CreateUserDto {
    @IsString()
    @IsNotEmpty({ message: 'El nombre de usuario no puede estar vacío' })
    userName: string;

    @IsString()
    @MinLength(6)
    @MaxLength(50)
    @Matches(
        /(?:(?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/,
        {
            message: 'The password must have a Uppercase, lowercase letter and a number'
        }
    )
    password: string;

    @IsUUID('4', { message: 'El roleId debe ser un UUID válido' })
    @IsNotEmpty({ message: 'El rol es obligatorio' })
    roleId: string;
}
