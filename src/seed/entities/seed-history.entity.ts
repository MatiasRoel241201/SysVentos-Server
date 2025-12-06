import {
    Column,
    CreateDateColumn,
    Entity,
    PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'seed_history' })
export class SeedHistory {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'varchar', length: 100, unique: true })
    name: string;

    @Column({ type: 'varchar', length: 20, default: 'success' })
    status: string;

    @CreateDateColumn({
        name: 'executed_at',
        type: 'timestamp without time zone',
        default: () => 'now()',
    })
    executedAt: Date;
}
