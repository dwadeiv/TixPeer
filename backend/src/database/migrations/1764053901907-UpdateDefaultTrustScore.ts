import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Migration: Update Default Trust Score
 *
 * Changes trust score system from "earn trust" (start at 0) to "trust by default" (start at 5.0)
 *
 * Rationale:
 * - Encourages new user participation
 * - Builds community trust as default
 * - Trust can only be lost through negative actions/reviews
 * - More welcoming to newcomers
 *
 * Changes:
 * 1. Update column default from 0 to 5.0
 * 2. Update existing users with 0 trust score to 5.0 (assumes they haven't had negative reviews)
 */
export class UpdateDefaultTrustScore1764053901907 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Update column default value to 5.0 for new users
        await queryRunner.query(`
            ALTER TABLE "users"
            ALTER COLUMN "trustScore"
            SET DEFAULT 5.0
        `);

        // Update existing users who have 0 trust score to 5.0
        // This assumes users with 0 trust haven't received negative reviews yet
        await queryRunner.query(`
            UPDATE "users"
            SET "trustScore" = 5.0
            WHERE "trustScore" = 0
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Revert column default back to 0
        await queryRunner.query(`
            ALTER TABLE "users"
            ALTER COLUMN "trustScore"
            SET DEFAULT 0
        `);

        // Revert users back to 0 (optional - may not want to do this in production)
        // Commented out to preserve data in case of rollback
        // await queryRunner.query(`
        //     UPDATE "users"
        //     SET "trustScore" = 0
        //     WHERE "trustScore" = 5.0
        // `);
    }

}
