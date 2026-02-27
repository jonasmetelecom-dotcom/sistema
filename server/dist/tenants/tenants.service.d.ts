import { Repository } from 'typeorm';
import { Tenant } from './entities/tenant.entity';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
export declare class TenantsService {
    private tenantRepository;
    constructor(tenantRepository: Repository<Tenant>);
    create(createTenantDto: CreateTenantDto): Promise<Tenant>;
    findAll(): Promise<Tenant[]>;
    findOne(id: string): Promise<Tenant>;
    update(id: string, updateTenantDto: UpdateTenantDto): Promise<Tenant>;
    remove(id: string): Promise<void>;
}
