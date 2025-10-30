import { seedDatabase } from "@/lib/supabase/seed";

// Run the seed script
seedDatabase()
  .then(() => {
    console.log("✅ Database seeding completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  });
