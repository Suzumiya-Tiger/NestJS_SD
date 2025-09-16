import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUserTable1757949617094 implements MigrationInterface {
    name = 'AddUserTable1757949617094'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`user\` DROP COLUMN \`age\``);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`user\` ADD \`age\` int NOT NULL`);
    }

}
