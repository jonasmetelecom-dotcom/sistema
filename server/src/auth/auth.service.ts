import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Tenant } from '../tenants/entities/tenant.entity';
import { Repository } from 'typeorm';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    @InjectRepository(Tenant)
    private tenantRepository: Repository<Tenant>,
  ) { }

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (user && (await bcrypt.compare(pass, user.passwordHash))) {
      const { passwordHash, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    const payload = {
      username: user.email,
      sub: user.id,
      tenantId: user.tenantId,
      role: user.role,
    };
    return {
      access_token: this.jwtService.sign(payload),
      user: user,
    };
  }

  async register(registerDto: RegisterDto) {
    const existingUser = await this.usersService.findByEmail(registerDto.email);
    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    // Generate unique slug
    let slug = registerDto.companyName.toLowerCase().trim()
      .replace(/[^\w\s-]/g, '') // remove special chars
      .replace(/[\s_-]+/g, '-')  // replace spaces/underscores with -
      .replace(/^-+|-+$/g, '');   // trim -

    let baseSlug = slug;
    let counter = 2;
    while (await this.tenantRepository.findOne({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Create Tenant
    const tenant = this.tenantRepository.create({
      slug: slug,
      name: registerDto.companyName,
      plan: 'free',
      isActive: true,
    });
    const savedTenant = await this.tenantRepository.save(tenant);

    // Hash Password
    const salt = await bcrypt.genSalt();
    const hash = await bcrypt.hash(registerDto.password, salt);

    // Create User
    await this.usersService.create({
      name: registerDto.name,
      email: registerDto.email,
      passwordHash: hash, // Saving hashed password
      tenantId: savedTenant.id,
      role: 'admin',
    });

    return this.login(await this.usersService.findByEmail(registerDto.email));
  }
}
