import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from './user.entity';
import { LogExecutionTime } from '../common/decorators/log-execution-time.decorator';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  @LogExecutionTime()
  async create(
    email: string,
    password: string,
    name: string,
    role: UserRole,
  ): Promise<User> {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = this.usersRepository.create({
      email,
      password: hashedPassword,
      name,
      role,
    });
    await this.usersRepository.save(user);
    return this.usersRepository.findOneByOrFail({ id: user.id });
  }

  @LogExecutionTime()
  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.createQueryBuilder('user').addSelect('user.password').where('user.email = :email', { email }).getOne();
  }

  @LogExecutionTime()
  async findById(id: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  @LogExecutionTime()
  async validatePassword(
    plainPassword: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  @LogExecutionTime()
  async findSubSuppliers(tier1SupplierId: string): Promise<User[]> {
    return this.usersRepository.find({
      where: {
        parentSupplierId: tier1SupplierId,
        role: UserRole.TIER2PLUS_SUPPLIER,
      },
      select: ['id', 'email', 'name', 'role', 'createdAt'],
      order: { name: 'ASC' },
    });
  }

  @LogExecutionTime()
  async findTier1Suppliers(): Promise<User[]> {
    return this.usersRepository.find({
      where: { role: UserRole.TIER1_SUPPLIER },
      select: ['id', 'email', 'name', 'role', 'createdAt'],
      order: { name: 'ASC' },
    });
  }

  @LogExecutionTime()
  async findAll(currentUser: User): Promise<User[]> {
    // 1차 협력사: 자신의 하위 협력사 목록 조회
    if (currentUser.role === UserRole.TIER1_SUPPLIER) {
      return this.usersRepository.find({
        where: { parentSupplierId: currentUser.id },
        select: ['id', 'email', 'name', 'role', 'createdAt'],
        order: { name: 'ASC' },
      });
    }

    // 2차+ 협력사: 같은 상위 협력사를 가진 협력사들 조회
    if (currentUser.parentSupplierId) {
      return this.usersRepository.find({
        where: { parentSupplierId: currentUser.parentSupplierId },
        select: ['id', 'email', 'name', 'role', 'createdAt'],
        order: { name: 'ASC' },
      });
    }

    return [];
  }

  @LogExecutionTime()
  async update(
    id: string,
    updateUserDto: UpdateUserDto,
    currentUserId: string,
  ): Promise<User> {
    // 본인만 수정 가능
    if (id !== currentUserId) {
      throw new ForbiddenException('You can only update your own profile');
    }

    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // 비밀번호 변경 시 해싱
    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    // 업데이트할 필드만 적용
    Object.assign(user, updateUserDto);

    await this.usersRepository.save(user);
    return this.usersRepository.findOneByOrFail({ id: user.id });
  }
}
