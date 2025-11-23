import { AppDataSource } from '../data-source';
import { seedDatabase } from './seed';

async function runSeed() {
  console.log('🌱 Starting database seed...\n');

  try {
    // Initialize the data source
    await AppDataSource.initialize();
    console.log('✅ Database connection established\n');

    // Run the seeding
    await seedDatabase(AppDataSource);

    console.log('\n✅ Seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    process.exit(1);
  } finally {
    // Close the connection
    await AppDataSource.destroy();
    console.log('\n Database connection closed');
  }
}

runSeed();
