import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    login(loginDto: LoginDto, req: any): Promise<{
        access_token: string;
        user: any;
    } | {
        statusCode: number;
        message: string;
    }>;
    register(registerDto: RegisterDto): Promise<{
        access_token: string;
        user: any;
    } | {
        message: string;
        pendingApproval: boolean;
    }>;
    getProfile(req: any): any;
}
