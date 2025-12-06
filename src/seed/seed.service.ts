import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { SeedHistory } from './entities/seed-history.entity';
import { Role } from '../roles/entities/role.entity';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../user-roles/entities/user-role.entity';
import { getSeedUsers, SEED_ROLES } from './data/initial-data';

@Injectable()
export class SeedService implements OnModuleInit {
    private readonly logger = new Logger(SeedService.name);
    private readonly SEED_NAME = 'initial-seed';

    constructor(
        @InjectRepository(SeedHistory)
        private readonly seedHistoryRepository: Repository<SeedHistory>,
        @InjectRepository(Role)
        private readonly roleRepository: Repository<Role>,
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        @InjectRepository(UserRole)
        private readonly userRoleRepository: Repository<UserRole>,
        private readonly configService: ConfigService,
    ) { }

    async onModuleInit() {
        await this.runSeed();
    }

    async runSeed() {
        try {
            // Verificar si el seed está habilitado
            const runSeed = this.configService.get<string>('RUN_SEED');
            if (runSeed !== 'true') {
                this.logger.warn('Seed deshabilitado. Configura run seed para habilitar');
                return;
            }

            // Verificar si el seed ya fue ejecutado
            const seedExists = await this.seedHistoryRepository.findOne({
                where: { name: this.SEED_NAME },
            });

            if (seedExists) {
                this.logger.log(
                    `Seed '${this.SEED_NAME}' ya fue ejecutado anteriormente`,
                );
                return;
            }

            this.logger.log('Ejecutando seed inicial...');

            // 1. Crear roles
            await this.createRoles();

            // 2. Crear usuarios con sus roles
            await this.createUsers();

            // 3. Registrar ejecución del seed
            const seedHistory = this.seedHistoryRepository.create({
                name: this.SEED_NAME,
                status: 'success',
            });
            await this.seedHistoryRepository.save(seedHistory);

            this.logger.log('Seed ejecutado exitosamente');
        } catch (error) {
            this.logger.error('Error al ejecutar seed:', error);
            throw error;
        }
    }

    private async createRoles() {
        for (const roleName of SEED_ROLES) {
            const existingRole = await this.roleRepository.findOne({
                where: { name: roleName },
            });

            if (!existingRole) {
                const role = this.roleRepository.create({ name: roleName });
                await this.roleRepository.save(role);
            } else {
                this.logger.log(`  - Rol '${roleName}' ya existe`);
            }
        }
    }

    private async createUsers() {
        const adminPassword = this.configService.get<string>('SEED_ADMIN_PASSWORD');
        const cajeroPassword = this.configService.get<string>('SEED_CAJERO_PASSWORD');
        const cocinaPassword = this.configService.get<string>('SEED_COCINA_PASSWORD');

        // Validar que todas las contraseñas estén configuradas
        if (!adminPassword || !cajeroPassword || !cocinaPassword) {
            this.logger.error('Faltan variables de entorno para el seed');
            throw new Error('Missing seed password environment variables');
        }

        const SEED_USERS = getSeedUsers(adminPassword, cajeroPassword, cocinaPassword);

        this.logger.log('Creando usuarios...');

        for (const seedUser of SEED_USERS) {
            // Verificar si el usuario ya existe
            const existingUser = await this.userRepository.findOne({
                where: { userName: seedUser.userName },
            });

            if (existingUser) {
                this.logger.log(`  - Usuario '${seedUser.userName}' ya existe`);
                continue;
            }

            // Crear usuario
            const hashedPassword = bcrypt.hashSync(seedUser.password, 10);
            const user = this.userRepository.create({
                userName: seedUser.userName,
                password: hashedPassword,
                isActive: true,
            });
            await this.userRepository.save(user);

            // Buscar el rol
            const role = await this.roleRepository.findOne({
                where: { name: seedUser.role },
            });

            if (role) {
                // Asignar rol al usuario
                const userRole = this.userRoleRepository.create({
                    userId: user.id,
                    roleId: role.id,
                });
                await this.userRoleRepository.save(userRole);
            }
        }
    }
}
