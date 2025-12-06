import { createParamDecorator, ExecutionContext, InternalServerErrorException } from "@nestjs/common";
import { User } from "../../users/entities/user.entity";

export const GetUser = createParamDecorator(
    (data: string, ctx: ExecutionContext) => {
        const request = ctx.switchToHttp().getRequest();
        const user = request.user as User;
        if (!user) throw new InternalServerErrorException('User not found');

        if (!data) return user;
        return user[data];
    }
)