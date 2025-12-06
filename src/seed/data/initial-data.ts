import { ValidRoles } from '../../auth/interfaces/valid-roles';

interface SeedUser {
    userName: string;
    password: string;
    role: ValidRoles;
}

export const getSeedUsers = (
    adminPassword: string,
    cajeroPassword: string,
    cocinaPassword: string,
): SeedUser[] => [
        {
            userName: 'admin',
            password: adminPassword,
            role: ValidRoles.admin,
        },
        {
            userName: 'cajero',
            password: cajeroPassword,
            role: ValidRoles.cajero,
        },
        {
            userName: 'cocina',
            password: cocinaPassword,
            role: ValidRoles.cocina,
        },
    ];

export const SEED_ROLES = [
    ValidRoles.admin,
    ValidRoles.cajero,
    ValidRoles.cocina
];
