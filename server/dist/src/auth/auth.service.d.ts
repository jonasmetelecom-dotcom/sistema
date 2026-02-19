import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/register.dto';
import { Tenant } from '../tenants/entities/tenant.entity';
import { Repository } from 'typeorm';
export declare class AuthService {
    private usersService;
    private jwtService;
    private tenantRepository;
    constructor(usersService: UsersService, jwtService: JwtService, tenantRepository: Repository<Tenant>);
    validateUser(email: string, pass: string): Promise<any>;
    login(user: any): Promise<{
        access_token: string;
        user: any;
    }>;
    register(registerDto: RegisterDto): Promise<{
        access_token: string;
        user: any;
    }>;
}
