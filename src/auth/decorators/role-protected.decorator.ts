import { SetMetadata } from '@nestjs/common';
import { META_ROLES } from '../helpers/meta-herlpers';
import { ValidRoles } from '../interfaces';

export const RoleProtected = (...args: ValidRoles[]) => {
    return SetMetadata(META_ROLES, args);
};
