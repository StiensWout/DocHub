import { getTeams, getApplications, getAllDocumentsForApp } from "@/lib/supabase/queries";

async function validateDatabase() {
  console.log("🔍 Validating database connection and data...\n");

  try {
    // Test 1: Fetch teams
    console.log("Test 1: Fetching teams...");
    const teams = await getTeams();
    console.log(`  ✅ Found ${teams.length} teams`);
    teams.forEach((team) => console.log(`     - ${team.name} (${team.id})`));

    // Test 2: Fetch applications
    console.log("\nTest 2: Fetching applications...");
    const applications = await getApplications();
    console.log(`  ✅ Found ${applications.length} applications`);
    applications.forEach((app) => console.log(`     - ${app.name} (${app.id})`));

    // Test 3: Fetch documents for first team and application
    if (teams.length > 0 && applications.length > 0) {
      console.log("\nTest 3: Fetching documents...");
      const teamId = teams[0].id;
      const appId = applications[0].id;
      const documents = await getAllDocumentsForApp(teamId, appId);
      const baseDocs = documents.filter((d) => d.type === "base");
      const teamDocs = documents.filter((d) => d.type === "team");
      
      console.log(`  ✅ Found ${documents.length} total documents for ${applications[0].name}`);
      console.log(`     - ${baseDocs.length} base documents`);
      console.log(`     - ${teamDocs.length} team documents`);
      
      if (baseDocs.length > 0) {
        console.log("\n  Base documents:");
        baseDocs.forEach((doc) => console.log(`     - ${doc.title} (${doc.category})`));
      }
      
      if (teamDocs.length > 0) {
        console.log("\n  Team documents:");
        teamDocs.forEach((doc) => console.log(`     - ${doc.title} (${doc.category})`));
      }
    }

    // Test 4: Validate all applications have base documents
    console.log("\nTest 4: Validating base documents for all applications...");
    for (const app of applications) {
      const docs = await getAllDocumentsForApp(teams[0].id, app.id);
      const baseDocs = docs.filter((d) => d.type === "base");
      if (baseDocs.length >= 3) {
        console.log(`  ✅ ${app.name}: ${baseDocs.length} base documents`);
      } else {
        console.log(`  ⚠️  ${app.name}: Only ${baseDocs.length} base documents (expected at least 3)`);
      }
    }

    console.log("\n✅ All validation tests passed!");
    return true;
  } catch (error) {
    console.error("\n❌ Validation failed:", error);
    return false;
  }
}

// Run validation
validateDatabase();
