import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTagColumn1757996435846 implements MigrationInterface {
    name = 'AddTagColumn1757996435846'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`article\` ADD \`tag\` varchar(30) NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`article\` DROP COLUMN \`tag\``);
    }

}
