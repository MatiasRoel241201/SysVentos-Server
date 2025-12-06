import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UserRole } from '../user-roles/entities/user-role.entity';
import { Role } from '../roles/entities/role.entity';
import { UsersController } from './users.controller';
import { UsersService } from './services/users.service';
import { UserRolesService } from './services/user-roles.service';
import { AuthModule } from '../auth/auth.module';

/**
 * Módulo para gestión de usuarios
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([User, UserRole, Role]),
    AuthModule,
  ],
  controllers: [UsersController],
  providers: [UsersService, UserRolesService],
  exports: [UsersService, UserRolesService],
})
export class UsersModule { }
