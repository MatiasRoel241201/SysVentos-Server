import {
    Injectable,
    NotFoundException,
    BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserRole } from '../../user-roles/entities/user-role.entity';
import { Role } from '../../roles/entities/role.entity';

/**
 * Servicio para gestionar asignación de roles a usuarios
 */
@Injectable()
export class UserRolesService {
    constructor(
        @InjectRepository(UserRole)
        private readonly userRoleRepository: Repository<UserRole>,
        @InjectRepository(Role)
        private readonly roleRepository: Repository<Role>,
    ) { }

    /**
     * Asignar rol a un usuario (solo al crear)
     */
    async assignRole(userId: string, roleId: string): Promise<UserRole> {
        // Validar que el rol exista
        const role = await this.roleRepository.findOne({ where: { id: roleId } });
        if (!role) throw new NotFoundException('Rol no encontrado');

        // Validar que NO sea el rol "admin"
        if (role.name.toLowerCase() === 'admin') 
            throw new BadRequestException('No se pueden crear usuarios con rol de administrador');
        

        // Crear asignación de rol
        const userRole = this.userRoleRepository.create({
            userId,
            roleId,
        });

        return this.userRoleRepository.save(userRole);
    }

    /**
     * Obtener roles de un usuario
     */
    async getUserRoles(userId: string): Promise<UserRole[]> {
        return this.userRoleRepository.find({
            where: { userId },
            relations: ['role'],
        });
    }

    /**
     * Verificar si un usuario tiene un rol específico
     */
    async hasRole(userId: string, roleName: string): Promise<boolean> {
        const userRole = await this.userRoleRepository.findOne({
            where: { userId },
            relations: ['role'],
        });

        return userRole?.role.name.toLowerCase() === roleName.toLowerCase();
    }

    /**
     * Validar que se puede desactivar un usuario
     * No permite desactivar al último usuario ADMIN activo
     */
    async validateCanDeactivateUser(userId: string): Promise<void> {
        // Verificar si el usuario es ADMIN
        const isAdmin = await this.hasRole(userId, 'admin');
        if (!isAdmin) return;

        // Contar cuántos usuarios ADMIN activos hay
        const activeAdminsCount = await this.countActiveAdmins();

        if (activeAdminsCount <= 1) 
            throw new BadRequestException('No se puede desactivar al único usuario administrador del sistema');
    }

    /**
     * Contar usuarios ADMIN activos
     * (privado, auxiliar)
     */
    private async countActiveAdmins(): Promise<number> {
        const count = await this.userRoleRepository
            .createQueryBuilder('ur')
            .leftJoinAndSelect('ur.role', 'role')
            .leftJoinAndSelect('ur.user', 'user')
            .where('role.name = :roleName', { roleName: 'admin' })
            .andWhere('user.isActive = :isActive', { isActive: true })
            .getCount();

        return count;
    }
}
