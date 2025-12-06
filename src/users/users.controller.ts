import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  ParseUUIDPipe,
  ParseBoolPipe,
  ParseIntPipe,
} from '@nestjs/common';
import { UsersService } from './services/users.service';
import { CreateUserDto, ResetPasswordDto } from './dto';
import { Auth } from '../auth/decorators';
import { ValidRoles } from '../auth/interfaces';

/**
 * Controlador para gestión de usuarios
 * Todos los endpoints requieren rol ADMIN
 */
@Controller('users')
@Auth(ValidRoles.admin)
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  /**
   * Crear usuario con rol
   */
  @Post()
  async create(@Body() createUserDto: CreateUserDto) {
    const user = await this.usersService.create(createUserDto);
    return this.transformUserResponse(user);
  }

  /**
   * Transformar respuesta de usuario (quitar userId y roleId redundantes)
   */
  private transformUserResponse(user: any) {
    return {
      id: user.id,
      userName: user.userName,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      userRoles: user.userRoles?.map((ur: any) => ({
        role: ur.role,
        assignedAt: ur.assignedAt,
      })),
    };
  }

  /**
   * Listar usuarios con filtros
   */
  @Get()
  findAll(
    @Query('isActive', new ParseBoolPipe({ optional: true }))
    isActive?: boolean,
    @Query('limit', new ParseIntPipe({ optional: true }))
    limit?: number,
    @Query('offset', new ParseIntPipe({ optional: true }))
    offset?: number,
  ) {
    return this.usersService.findAll({ isActive, limit, offset });
  }

  /**
   * Obtener usuario por ID
   */
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.findOne(id);
  }

  /**
   * Activar usuario
   */
  @Patch(':id/activate')
  activate(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.activate(id);
  }

  /**
   * Desactivar usuario
   */
  @Patch(':id/deactivate')
  deactivate(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.deactivate(id);
  }

  /**
   * Blanqueo de contraseña
   */
  @Patch(':id/reset-password')
  async resetPassword(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() resetPasswordDto: ResetPasswordDto,
  ) {
    await this.usersService.resetPassword(id, resetPasswordDto.newPassword);

    return {
      message: 'Contraseña blanqueada exitosamente',
    };
  }
}
