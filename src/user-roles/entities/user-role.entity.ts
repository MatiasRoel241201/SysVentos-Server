import {
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { User } from '../../users/entities/user.entity';
import { Role } from '../../roles/entities/role.entity';

@Entity({ name: 'user_roles' })
export class UserRole {
  @PrimaryColumn({ name: 'user_id', type: 'uuid' })
  @Exclude() // No incluir en respuestas JSON (redundante)
  userId: string;

  @PrimaryColumn({ name: 'role_id', type: 'uuid' })
  @Exclude() // No incluir en respuestas JSON (redundante)
  roleId: string;

  @ManyToOne(() => User, (user) => user.userRoles, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Role, (role) => role.userRoles, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'role_id' })
  role: Role;

  @CreateDateColumn({
    name: 'assigned_at',
    type: 'timestamp without time zone',
    default: () => 'now()',
  })
  assignedAt: Date;
}
