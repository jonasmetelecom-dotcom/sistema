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
import { UserSession } from '../users/entities/user-session.entity';
import { Repository } from 'typeorm';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    @InjectRepository(Tenant)
    private tenantRepository: Repository<Tenant>,
    @InjectRepository(UserSession)
    private sessionRepository: Repository<UserSession>,
  ) { }

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (user && (await bcrypt.compare(pass, user.passwordHash))) {
      // Auto-promote master user to super_admin if not already
      if (email.toLowerCase() === 'jonascan@gmail.com' && user.role !== 'super_admin') {
        user.role = 'super_admin';
        await this.usersService.update(user.id, { role: 'super_admin' } as any);
      }

      // Check if tenant is active
      if (!user.tenant?.isActive && user.role !== 'super_admin') {
        throw new UnauthorizedException('Seu cadastro está aguardando aprovação do administrador.');
      }

      // Check for subscription expiration (ignore for Free plan or super_admin)
      if (user.role !== 'super_admin' && user.tenant?.plan !== 'free') {
        const now = new Date();
        if (user.tenant?.subscriptionEndsAt && new Date(user.tenant.subscriptionEndsAt) < now) {
          throw new UnauthorizedException('Sua assinatura expirou. Entre em contato com o suporte.');
        }
      }

      const { passwordHash, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any, sessionData?: { deviceId?: string; deviceName?: string; latitude?: number; longitude?: number; ipAddress?: string }) {
    const payload = {
      username: user.email,
      sub: user.id,
      tenantId: user.tenantId,
      role: user.role,
    };

    // Track Session
    if (sessionData?.deviceId) {
      const existingSession = await this.sessionRepository.findOne({
        where: { userId: user.id, deviceId: sessionData.deviceId }
      });

      if (existingSession) {
        existingSession.deviceName = sessionData.deviceName || existingSession.deviceName;
        existingSession.latitude = sessionData.latitude || existingSession.latitude;
        existingSession.longitude = sessionData.longitude || existingSession.longitude;
        existingSession.ipAddress = sessionData.ipAddress || existingSession.ipAddress;
        existingSession.lastSeen = new Date();
        existingSession.isActive = true;
        await this.sessionRepository.save(existingSession);
      } else {
        const newSession = this.sessionRepository.create({
          userId: user.id,
          deviceId: sessionData.deviceId,
          deviceName: sessionData.deviceName,
          tenantId: user.tenantId,
          latitude: sessionData.latitude,
          longitude: sessionData.longitude,
          ipAddress: sessionData.ipAddress,
          lastSeen: new Date(),
          isActive: true,
        });
        await this.sessionRepository.save(newSession);
      }
    }

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
      isActive: false, // Inactive by default, requires approval
    });
    const savedTenant = await this.tenantRepository.save(tenant);

    // Hash Password
    const salt = await bcrypt.genSalt();
    const hash = await bcrypt.hash(registerDto.password, salt);

    // Create User
    const isAdminMaster = registerDto.email === 'jonascan@gmail.com';
    const user = await this.usersService.create({
      name: registerDto.name,
      email: registerDto.email,
      passwordHash: hash, // Saving hashed password
      tenantId: savedTenant.id,
      role: isAdminMaster ? 'super_admin' : 'admin',
    });

    // If it's the master admin, activate his tenant automatically
    if (isAdminMaster) {
      savedTenant.isActive = true;
      await this.tenantRepository.save(savedTenant);
      return this.login(user); // Auto-login master
    }

    // For others, return a message that approval is pending
    return {
      message: 'Cadastro realizado com sucesso! Aguarde a aprovação do administrador para acessar o sistema.',
      pendingApproval: true
    };
  }

  async registerManual(registerDto: RegisterDto) {
    // Manual registration creates an ACTIVE tenant immediately
    const existingUser = await this.usersService.findByEmail(registerDto.email);
    if (existingUser) {
      throw new ConflictException('O e-mail já está em uso.');
    }

    // Generate unique slug
    let slug = registerDto.companyName.toLowerCase().trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');

    let baseSlug = slug;
    let counter = 2;
    while (await this.tenantRepository.findOne({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Create Tenant (ACTIVE by default for manual creation)
    const tenant = this.tenantRepository.create({
      slug: slug,
      name: registerDto.companyName,
      plan: 'pro', // Default to Pro for manual
      isActive: true,
      subscriptionEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    });
    const savedTenant = await this.tenantRepository.save(tenant);

    // Hash Password
    const salt = await bcrypt.genSalt();
    const hash = await bcrypt.hash(registerDto.password, salt);

    // Create User
    await this.usersService.create({
      name: registerDto.name,
      email: registerDto.email,
      passwordHash: hash,
      tenantId: savedTenant.id,
      role: 'admin',
    });

    return { message: 'Empresa criada com sucesso!', tenantId: savedTenant.id };
  }
}
