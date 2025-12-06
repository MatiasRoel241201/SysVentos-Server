import { createParamDecorator, ExecutionContext, InternalServerErrorException } from "@nestjs/common";

export const RawHeaders = createParamDecorator(
    (data: string, ctx: ExecutionContext) => {
        const request = ctx.switchToHttp().getRequest();
        const rawHeaders = request.rawHeaders;
        if (!rawHeaders) throw new InternalServerErrorException('Headers not found');

        if (!data) return rawHeaders;
        return rawHeaders[data];
    }
)