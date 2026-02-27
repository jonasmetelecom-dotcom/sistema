import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { UserSession } from './entities/user-session.entity';
import { UpdateUserDto } from './dto/update-user.dto';
export declare class UsersService {
    private userRepository;
    private sessionRepository;
    constructor(userRepository: Repository<User>, sessionRepository: Repository<UserSession>);
    getUserSessions(userId?: string, tenantId?: string): Promise<UserSession[]>;
    create(userData: any): Promise<User>;
    findAll(tenantId: string): Promise<User[]>;
    findByEmail(email: string): Promise<User | null>;
    findOne(id: string): Promise<User | null>;
    update(id: string, updateUserDto: UpdateUserDto): Promise<User | null>;
    remove(id: string): Promise<void>;
}
