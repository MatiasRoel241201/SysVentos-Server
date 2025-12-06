import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { SeedService } from './seed.service';
import { SeedHistory } from './entities/seed-history.entity';
import { Role } from '../roles/entities/role.entity';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../user-roles/entities/user-role.entity';

@Module({
    imports: [
        ConfigModule,
        TypeOrmModule.forFeature([SeedHistory, Role, User, UserRole]),
    ],
    providers: [SeedService],
})
export class SeedModule { }
