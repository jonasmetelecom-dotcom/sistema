import { Module } from '@nestjs/common';
import { SuperAdminController } from './super-admin.controller';
import { TenantsModule } from '../tenants/tenants.module';
import { AuthModule } from '../auth/auth.module';

@Module({
    imports: [TenantsModule, AuthModule],
    controllers: [SystemController, SuperAdminController],
})
export class SystemModule { }
