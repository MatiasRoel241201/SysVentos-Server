import { PartialType } from '@nestjs/mapped-types';
import { CreateRawDto } from './create-raw.dto';

export class UpdateRawDto extends PartialType(CreateRawDto) {}
