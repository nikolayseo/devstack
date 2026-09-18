import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUsersTable1720000000000 implements MigrationInterface {
  name = 'CreateUsersTable1720000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const existingUsers = await queryRunner.getTable('users');

    if (existingUsers) {
      const columns = new Set(existingUsers.columns.map((column) => column.name));
      const isAuthUsersTable =
        columns.has('email') &&
        columns.has('password_hash') &&
        columns.has('created_at');

      if (isAuthUsersTable) {
        return;
      }

      await queryRunner.renameTable('users', 'legacy_users');
    }

    await queryRunner.query(`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT now()
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE users`);
  }
}
