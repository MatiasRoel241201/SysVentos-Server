import { BadRequestException, Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt'
import { loginUserDto, createUserDto } from './dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) { }

  async create(createUserDto: createUserDto) {
    try {
      const { password, ...userData } = createUserDto;
      const user = this.userRepository.create({
        ...userData,
        password: bcrypt.hashSync(password, 10)
      });

      await this.userRepository.save(user)
      const { password: _, ...userWithoutPassword } = user;

      return {
        ...userWithoutPassword,
        token: this.getJwtToken({ id: user.id })
      };
    } catch (error) {
      this.handleDBerrors(error)
    }
  }

  async login(loginUserDto: loginUserDto) {
    const { userName, password } = loginUserDto;

    const user = await this.userRepository.findOne({
      where: { userName },
      select: { userName: true, password: true, id: true, isActive: true },
      relations: ['userRoles', 'userRoles.role']
    });

    if (!user) throw new UnauthorizedException('Credentials are not valid (userName)');
    if (!bcrypt.compareSync(password, user.password)) throw new UnauthorizedException('Credentials are not valid (password)');

    return {
      id: user.id,
      userName: user.userName,
      isActive: user.isActive,
      role: user.userRoles[0]?.role.name || null,
      token: this.getJwtToken({ id: user.id })
    };
  }

  checkAuthStatus(user: User) {
    const { userName, id, isActive, ...simpleUser } = user;
    return {
      userName,
      token: this.getJwtToken({ id }),
      isActive
    };
  }

  private getJwtToken(poyload: JwtPayload): string {
    return this.jwtService.sign(poyload);
  }

  /* TODO: Extraerlo para hacerlo generico */
  private handleDBerrors(error: any): never {
    if (error.code === '23505') throw new BadRequestException(error.detail);
    throw new InternalServerErrorException('Please check server logs');
  }
}
