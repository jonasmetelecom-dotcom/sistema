import {
    Controller,
    Get,
    Post,
    Patch,
    Param,
    Body,
    UseGuards,
} from '@nestjs/common';
import { TenantsService } from '../tenants/tenants.service';
import { AuthService } from '../auth/auth.service';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

@Controller('admin/tenants')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('super_admin')
export class SuperAdminController {
    constructor(
        private readonly tenantsService: TenantsService,
        private readonly authService: AuthService
    ) { }

    @Get()
    findAll() {
        return this.tenantsService.findAll();
    }

    @Patch(':id/approve')
    async approve(@Param('id') id: string) {
        // Approve and set default 30 days for safety
        return this.tenantsService.update(id, {
            isActive: true,
            subscriptionEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        } as any);
    }

    @Patch(':id/plan')
    async updatePlan(@Param('id') id: string, @Body() body: { plan: string, expiresAt?: Date }) {
        const updateData: any = { plan: body.plan };
        if (body.expiresAt) {
            updateData.subscriptionEndsAt = body.expiresAt;
        }
        return this.tenantsService.update(id, updateData);
    }

    @Patch(':id/status')
    async updateStatus(@Param('id') id: string, @Body() body: { isActive: boolean }) {
        return this.tenantsService.update(id, { isActive: body.isActive } as any);
    }

    @Post('manual')
    async createManual(@Body() body: any) {
        // body should have: companyName, name, email, password
        return this.authService.registerManual(body);
    }
}
