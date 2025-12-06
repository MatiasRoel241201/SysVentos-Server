import {
    IsDateString,
    IsNotEmpty,
    IsString,
    MinLength,
} from 'class-validator';

/**
 * DTO para crear un nuevo evento
 */
export class CreateEventDto {
    /**
     * Nombre del evento
     * @type string
     * Requerido, mínimo 3 caracteres
     */
    @IsString()
    @IsNotEmpty()
    @MinLength(3)
    name: string;

    /**
     * Fecha de inicio del evento
     * @type Date
     * ISO string, debe ser anterior a endDate
     */
    @IsDateString()
    @IsNotEmpty()
    startDate: string;

    /**
     * Fecha de fin del evento
     * @type Date
     * ISO string, debe ser posterior a startDate
     */
    @IsDateString()
    @IsNotEmpty()
    endDate: string;
}
