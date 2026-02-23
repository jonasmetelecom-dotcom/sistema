import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Request,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { AuthGuard } from '@nestjs/passport';
import { Public } from './public.decorator';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) { }

  @Public()
  @Post('login')
  async login(@Body() loginDto: LoginDto, @Request() req: any) {
    const user = await this.authService.validateUser(
      loginDto.email,
      loginDto.password,
    );
    if (!user) {
      return {
        statusCode: 401,
        message: 'Unauthorized',
      };
    }

    // Try to get IP from request
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;

    return this.authService.login(user, {
      deviceId: loginDto.deviceId,
      deviceName: loginDto.deviceName,
      latitude: loginDto.latitude,
      longitude: loginDto.longitude,
      ipAddress: typeof ipAddress === 'string' ? ipAddress : ipAddress?.[0],
    });
  }

  @Public()
  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('profile')
  getProfile(@Request() req: any) {
    return req.user;
  }
}
