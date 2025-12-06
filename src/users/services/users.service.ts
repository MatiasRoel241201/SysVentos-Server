import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { CreateUserDto } from '../dto';
import { UserRolesService } from './user-roles.service';
import * as bcrypt from 'bcrypt';

/**
 * Servicio para gestionar usuarios
 */
@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        private readonly userRolesService: UserRolesService,
    ) { }

    /**
     * Crear usuario con rol
     */
    async create(createUserDto: CreateUserDto): Promise<User> {
        const { userName, password, roleId } = createUserDto;

        // Validar que el userName no exista
        await this.validateUniqueUserName(userName);

        // Hashear contraseña
        const hashedPassword = await bcrypt.hash(password, 10);

        // Crear usuario
        const user = this.userRepository.create({
            userName,
            password: hashedPassword,
        });

        const savedUser = await this.userRepository.save(user);

        // Asignar rol (incluye validación de que no sea admin)
        await this.userRolesService.assignRole(savedUser.id, roleId);

        // Retornar usuario con roles
        return this.findOne(savedUser.id);
    }

    /**
     * Listar todos los usuarios con filtros
     */
    async findAll(filters?: {
        isActive?: boolean;
        limit?: number;
        offset?: number;
    }): Promise<User[]> {
        const query = this.userRepository
            .createQueryBuilder('user')
            .leftJoinAndSelect('user.userRoles', 'userRoles')
            .leftJoinAndSelect('userRoles.role', 'role')
            .orderBy('user.createdAt', 'DESC');

        if (filters?.isActive !== undefined) query.andWhere('user.isActive = :isActive', { isActive: filters.isActive });
        if (filters?.limit) query.take(filters.limit);
        if (filters?.offset) query.skip(filters.offset);

        return query.getMany();
    }

    /**
     * Obtener usuario por ID
     */
    async findOne(id: string): Promise<User> {
        const user = await this.userRepository.findOne({
            where: { id },
            relations: ['userRoles', 'userRoles.role'],
        });

        if (!user) throw new NotFoundException('Usuario no encontrado');

        return user;
    }

    /**
     * Activar usuario
     */
    async activate(id: string): Promise<User> {
        const user = await this.findOne(id);

        if (user.isActive) throw new BadRequestException('El usuario ya está activo');

        user.isActive = true;
        return this.userRepository.save(user);
    }

    /**
     * Desactivar usuario
     */
    async deactivate(id: string): Promise<User> {
        const user = await this.findOne(id);

        if (!user.isActive) throw new BadRequestException('El usuario ya está inactivo');

        // Validar que no sea el último admin
        await this.userRolesService.validateCanDeactivateUser(id);

        user.isActive = false;
        return this.userRepository.save(user);
    }

    /**
     * Blanqueo de contraseña
     */
    async resetPassword(id: string, newPassword: string): Promise<void> {
        const user = await this.findOne(id);

        // Hashear nueva contraseña
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        user.password = hashedPassword;
        await this.userRepository.save(user);
    }

    /**
     * Buscar usuario por userName (auxiliar, puede ser usado por auth)
     */
    async findByUserName(userName: string): Promise<User | null> {
        const user = await this.userRepository
            .createQueryBuilder('user')
            .addSelect('user.password') // Incluir password para login
            .leftJoinAndSelect('user.userRoles', 'userRoles')
            .leftJoinAndSelect('userRoles.role', 'role')
            .where('user.userName = :userName', { userName: userName.toLowerCase().trim() })
            .getOne();

        return user;
    }

    /**
     * Validar que userName sea único (privado)
     */
    private async validateUniqueUserName(userName: string): Promise<void> {
        const normalizedUserName = userName.toLowerCase().trim();
        const existing = await this.userRepository.findOne({
            where: { userName: normalizedUserName },
        });

        if (existing) throw new BadRequestException(`El nombre de usuario "${userName}" ya está en uso`);
    }
}
