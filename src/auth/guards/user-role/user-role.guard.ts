import { Reflector } from '@nestjs/core';
import { BadRequestException, CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';
import { User } from '../../../users/entities/user.entity';
import { META_ROLES } from '../../helpers/meta-herlpers';

@Injectable()
export class UserRoleGuard implements CanActivate {

  constructor(
    private readonly reflector: Reflector
  ) { }

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const validRoles: string[] =
      this.reflector.get<string[]>(META_ROLES, context.getHandler()) ||
      this.reflector.get<string[]>(META_ROLES, context.getClass());

    if (!validRoles) return true;
    if (!validRoles.length) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user as User;

    if (!user) throw new BadRequestException('User not found');
    if (!user.userRoles || !Array.isArray(user.userRoles)) throw new ForbiddenException(`${user.userName} does not have any roles assigned`);
    
    for (const userRole of user.userRoles) {
      if (userRole.role && validRoles.includes(userRole.role.name)) return true;
    }

    throw new ForbiddenException(`${user.userName} does not have access`);
  }
}
