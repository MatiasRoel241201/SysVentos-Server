import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from './entities/role.entity';

@Injectable()
export class RolesService {
    constructor(
        @InjectRepository(Role)
        private readonly roleRepository: Repository<Role>,
    ) { }

    /**
     * Listar roles disponibles para asignar (sin admin)
     */
    async findAvailable(): Promise<Role[]> {
        return await this.roleRepository
            .createQueryBuilder('role')
            .where('LOWER(role.name) != :adminRole', { adminRole: 'admin' })
            .orderBy('role.name', 'ASC')
            .getMany();
    }

    async findOne(id: string): Promise<Role> {
        const role = await this.roleRepository.findOne({ where: { id } });
        if (!role) throw new NotFoundException(`Role with ID "${id}" not found`);
        return role;
    }
}
