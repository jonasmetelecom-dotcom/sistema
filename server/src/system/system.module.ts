import { Module } from '@nestjs/common';
import { SystemController } from './system.controller';
import { SuperAdminController } from './super-admin.controller';
import { TenantsModule } from '../tenants/tenants.module';

@Module({
    imports: [TenantsModule],
    controllers: [SystemController, SuperAdminController],
})
export class SystemModule { }
