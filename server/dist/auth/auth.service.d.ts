import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/register.dto';
import { Tenant } from '../tenants/entities/tenant.entity';
import { UserSession } from '../users/entities/user-session.entity';
import { Repository } from 'typeorm';
export declare class AuthService {
    private usersService;
    private jwtService;
    private tenantRepository;
    private sessionRepository;
    constructor(usersService: UsersService, jwtService: JwtService, tenantRepository: Repository<Tenant>, sessionRepository: Repository<UserSession>);
    validateUser(email: string, pass: string): Promise<any>;
    login(user: any, sessionData?: {
        deviceId?: string;
        deviceName?: string;
        latitude?: number;
        longitude?: number;
        ipAddress?: string;
    }): Promise<{
        access_token: string;
        user: any;
    }>;
    register(registerDto: RegisterDto): Promise<{
        access_token: string;
        user: any;
    } | {
        message: string;
        pendingApproval: boolean;
    }>;
    registerManual(registerDto: RegisterDto): Promise<{
        message: string;
        tenantId: string;
    }>;
}
