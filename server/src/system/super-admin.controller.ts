import {
    Controller,
    Get,
    Patch,
    Param,
    Body,
    UseGuards,
} from '@nestjs/common';
import { TenantsService } from '../tenants/tenants.service';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

@Controller('admin/tenants')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('super_admin')
export class SuperAdminController {
    constructor(private readonly tenantsService: TenantsService) { }

    @Get()
    findAll() {
        return this.tenantsService.findAll();
    }

    @Patch(':id/approve')
    async approve(@Param('id') id: string) {
        return this.tenantsService.update(id, { isActive: true } as any);
    }

    @Patch(':id/plan')
    async updatePlan(@Param('id') id: string, @Body() body: { plan: string }) {
        return this.tenantsService.update(id, { plan: body.plan } as any);
    }

    @Patch(':id/status')
    async updateStatus(@Param('id') id: string, @Body() body: { isActive: boolean }) {
        return this.tenantsService.update(id, { isActive: body.isActive } as any);
    }
}
