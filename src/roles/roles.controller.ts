import { Controller, Get, Param } from '@nestjs/common';
import { RolesService } from './roles.service';
import { Auth } from '../auth/decorators';
import { ValidRoles } from '../auth/interfaces';

@Controller('roles')
@Auth(ValidRoles.admin)
export class RolesController {
    constructor(private readonly rolesService: RolesService) { }

    /**
     * Listar roles disponibles para asignar
     */
    @Get('available')
    findAvailable() {
        return this.rolesService.findAvailable();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.rolesService.findOne(id);
    }
}
