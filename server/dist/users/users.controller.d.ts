import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    create(createUserDto: CreateUserDto, req: any): Promise<import("./entities/user.entity").User>;
    findAll(req: any): Promise<import("./entities/user.entity").User[]>;
    updateProfile(req: any, updateUserDto: UpdateUserDto): Promise<import("./entities/user.entity").User | null>;
    getUserSessions(req: any): Promise<import("./entities/user-session.entity").UserSession[]>;
    findOne(id: string): Promise<import("./entities/user.entity").User | null>;
    update(id: string, updateUserDto: UpdateUserDto): Promise<import("./entities/user.entity").User | null>;
    remove(id: string): Promise<void>;
}
