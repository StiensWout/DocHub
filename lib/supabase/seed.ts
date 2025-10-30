import { createClient } from "@supabase/supabase-js";

// Load environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Missing Supabase environment variables. Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.");
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

/**
 * Seed the database with initial data
 * Run this once to populate the database with mock data
 */
export async function seedDatabase() {
  console.log("🌱 Starting database seed...\n");
  
  // First, verify tables exist
  const tableNames = ['teams', 'applications', 'base_documents', 'team_documents'];
  console.log("🔍 Checking if tables exist...");
  
  for (const tableName of tableNames) {
    const { error } = await supabaseAdmin.from(tableName).select('*').limit(1);
    if (error && error.code === 'PGRST205') {
      console.error(`\n❌ ERROR: Table '${tableName}' does not exist in the database!`);
      console.error("\n📝 Please run the database schema first:");
      console.error("1. Go to Supabase Dashboard: https://supabase.com/dashboard");
      console.error("2. Select your project");
      console.error("3. Go to SQL Editor");
      console.error(`4. Copy and paste the contents of supabase/schema.sql`);
      console.error("5. Click 'Run'");
      console.error("\nThen run 'bun run seed' again.\n");
      throw new Error(`Database tables not found. Please run supabase/schema.sql first.`);
    }
  }
  
  console.log("✅ All tables exist!\n");

  // Insert applications
  const applications = [
    {
      id: "frontend",
      name: "Frontend App",
      icon_name: "Globe",
      color: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    },
    {
      id: "backend",
      name: "Backend API",
      icon_name: "Database",
      color: "bg-green-500/20 text-green-400 border-green-500/30",
    },
    {
      id: "mobile",
      name: "Mobile App",
      icon_name: "Zap",
      color: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    },
    {
      id: "devops",
      name: "DevOps",
      icon_name: "Settings",
      color: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    },
  ];

  console.log("📦 Inserting applications...");
  for (const app of applications) {
    const { error } = await supabaseAdmin
      .from("applications")
      .upsert(app, { onConflict: "id" });

    if (error) {
      console.error(`  ❌ Error inserting application ${app.id}:`, error.message);
    } else {
      console.log(`  ✅ ${app.name}`);
    }
  }

  // Insert base documents
  const baseDocuments = [
    {
      application_id: "frontend",
      title: "Server & Container Info",
      category: "Infrastructure",
      content: `# Server & Container Information

## Production Servers
- **Primary Server**: \`app-frontend-prod-01\`
- **Container Registry**: \`registry.company.com/frontend\`
- **Docker Image**: \`frontend:latest\`
- **Port**: 3000

## Container Details
- **Base Image**: \`node:18-alpine\`
- **Memory Limit**: 512MB
- **CPU Limit**: 0.5 cores`,
    },
    {
      application_id: "frontend",
      title: "Support & Contact Info",
      category: "Support",
      content: `# Support & Contact Information

## Primary Contacts
- **Team Lead**: team-lead@company.com
- **DevOps**: devops@company.com
- **On-Call**: +1 (555) 123-4567

## Support Channels
- **Slack**: #frontend-support
- **Email**: frontend-support@company.com
- **Emergency**: pager-duty-frontend

## Common Issues
- See troubleshooting guide
- Check logs in CloudWatch
- Review recent deployments`,
    },
    {
      application_id: "frontend",
      title: "Application Overview",
      category: "General",
      content: `# Frontend Application Overview

## Description
Main customer-facing web application built with React and Next.js.

## Key Features
- Server-side rendering
- Progressive Web App support
- Real-time updates

## Tech Stack
- React 18
- Next.js 14
- TypeScript
- Tailwind CSS`,
    },
    {
      application_id: "backend",
      title: "Server & Container Info",
      category: "Infrastructure",
      content: `# Server & Container Information

## Production Servers
- **Primary Server**: \`api-backend-prod-01\`
- **Container Registry**: \`registry.company.com/backend\`
- **Docker Image**: \`backend:latest\`
- **Port**: 8000

## Container Details
- **Base Image**: \`python:3.11-slim\`
- **Memory Limit**: 1GB
- **CPU Limit**: 1 core`,
    },
    {
      application_id: "backend",
      title: "Support & Contact Info",
      category: "Support",
      content: `# Support & Contact Information

## Primary Contacts
- **Team Lead**: backend-lead@company.com
- **DevOps**: devops@company.com
- **On-Call**: +1 (555) 234-5678

## Support Channels
- **Slack**: #backend-support
- **Email**: backend-support@company.com
- **Emergency**: pager-duty-backend

## Common Issues
- Database connection issues
- API rate limiting
- Authentication failures`,
    },
    {
      application_id: "backend",
      title: "Application Overview",
      category: "General",
      content: `# Backend API Overview

## Description
RESTful API service handling business logic and data processing.

## Key Features
- RESTful endpoints
- GraphQL support
- WebSocket connections

## Tech Stack
- Python 3.11
- FastAPI
- PostgreSQL
- Redis`,
    },
    {
      application_id: "mobile",
      title: "Server & Container Info",
      category: "Infrastructure",
      content: `# Server & Container Information

## Build Servers
- **CI/CD Server**: \`mobile-build-01\`
- **Container Registry**: \`registry.company.com/mobile\`
- **Build Image**: \`mobile-builder:latest\`

## Container Details
- **Base Image**: \`react-native:latest\`
- **Build Tools**: Xcode, Android SDK
- **Memory Limit**: 2GB`,
    },
    {
      application_id: "mobile",
      title: "Support & Contact Info",
      category: "Support",
      content: `# Support & Contact Information

## Primary Contacts
- **Team Lead**: mobile-lead@company.com
- **DevOps**: devops@company.com
- **On-Call**: +1 (555) 345-6789

## Support Channels
- **Slack**: #mobile-support
- **Email**: mobile-support@company.com
- **Emergency**: pager-duty-mobile

## Common Issues
- Build failures
- App Store rejections
- Push notification issues`,
    },
    {
      application_id: "mobile",
      title: "Application Overview",
      category: "General",
      content: `# Mobile Application Overview

## Description
Cross-platform mobile application for iOS and Android.

## Key Features
- Native performance
- Offline support
- Push notifications

## Tech Stack
- React Native
- TypeScript
- Redux`,
    },
    {
      application_id: "devops",
      title: "Server & Container Info",
      category: "Infrastructure",
      content: `# Server & Container Information

## Infrastructure
- **Kubernetes Cluster**: \`k8s-prod-cluster\`
- **Container Registry**: \`registry.company.com\`
- **Monitoring**: Prometheus + Grafana

## Container Details
- **Orchestration**: Kubernetes
- **CI/CD**: Jenkins + GitHub Actions
- **IaC**: Terraform`,
    },
    {
      application_id: "devops",
      title: "Support & Contact Info",
      category: "Support",
      content: `# Support & Contact Information

## Primary Contacts
- **Team Lead**: devops-lead@company.com
- **On-Call**: +1 (555) 456-7890

## Support Channels
- **Slack**: #devops-support
- **Email**: devops@company.com
- **Emergency**: pager-duty-devops

## Common Issues
- Deployment failures
- Infrastructure scaling
- Monitoring alerts`,
    },
    {
      application_id: "devops",
      title: "Application Overview",
      category: "General",
      content: `# DevOps Overview

## Description
Infrastructure and deployment automation.

## Key Features
- CI/CD pipelines
- Infrastructure as Code
- Monitoring and alerting

## Tech Stack
- Kubernetes
- Docker
- Terraform
- Ansible`,
    },
  ];

  console.log("\n📄 Inserting base documents...");
  let baseDocCount = 0;
  for (const doc of baseDocuments) {
    const { error } = await supabaseAdmin.from("base_documents").insert(doc);

    if (error) {
      console.error(`  ❌ Error inserting base document "${doc.title}":`, error.message);
    } else {
      baseDocCount++;
    }
  }
  console.log(`  ✅ Inserted ${baseDocCount}/${baseDocuments.length} base documents`);

  // Insert teams (check if they exist first to avoid duplicates)
  const teams = [
    { name: "Team Alpha" },
    { name: "Team Beta" },
    { name: "Team Gamma" },
  ];

  console.log("\n👥 Inserting teams...");
  const teamIds: string[] = [];
  for (const team of teams) {
    // Check if team already exists
    const { data: existing } = await supabaseAdmin
      .from("teams")
      .select("id")
      .eq("name", team.name)
      .maybeSingle();

    if (existing) {
      teamIds.push(existing.id);
      console.log(`  ✓ Team "${team.name}" already exists (skipping)`);
    } else {
      const { data, error } = await supabaseAdmin
        .from("teams")
        .insert(team)
        .select("id")
        .single();

      if (error) {
        console.error(`  ❌ Error inserting team "${team.name}":`, error.message);
      } else if (data) {
        teamIds.push(data.id);
        console.log(`  ✅ Created "${team.name}"`);
      }
    }
  }

  if (teamIds.length === 0) {
    throw new Error("No teams were created or found. Cannot proceed with team documents.");
  }

  // Insert team documents
  const teamDocuments = [
    {
      team_id: teamIds[0], // Team Alpha
      application_id: "frontend",
      title: "Custom Features Implementation",
      category: "Development",
      content: "Team Alpha specific frontend features...",
    },
    {
      team_id: teamIds[0],
      application_id: "backend",
      title: "Custom API Endpoints",
      category: "API",
      content: "Team Alpha specific backend endpoints...",
    },
    {
      team_id: teamIds[0],
      application_id: "mobile",
      title: "Mobile App Configuration",
      category: "Configuration",
      content: "Team Alpha mobile app settings...",
    },
    {
      team_id: teamIds[1], // Team Beta
      application_id: "frontend",
      title: "Shared Component Library",
      category: "Components",
      content: "Team Beta component library documentation...",
    },
    {
      team_id: teamIds[1],
      application_id: "backend",
      title: "Third-party Integrations",
      category: "Integration",
      content: "Team Beta third-party service integrations...",
    },
    {
      team_id: teamIds[1],
      application_id: "devops",
      title: "Deployment Procedures",
      category: "Deployment",
      content: "Team Beta specific deployment steps...",
    },
    {
      team_id: teamIds[2], // Team Gamma
      application_id: "frontend",
      title: "Testing Strategy",
      category: "Testing",
      content: "Team Gamma testing approach...",
    },
    {
      team_id: teamIds[2],
      application_id: "backend",
      title: "Performance Optimization",
      category: "Performance",
      content: "Team Gamma backend optimizations...",
    },
    {
      team_id: teamIds[2],
      application_id: "mobile",
      title: "Analytics Setup",
      category: "Analytics",
      content: "Team Gamma mobile analytics configuration...",
    },
  ];

  console.log("\n📝 Inserting team documents...");
  let teamDocCount = 0;
  for (const doc of teamDocuments) {
    const { error } = await supabaseAdmin.from("team_documents").insert(doc);

    if (error) {
      console.error(`  ❌ Error inserting team document "${doc.title}":`, error.message);
    } else {
      teamDocCount++;
    }
  }
  console.log(`  ✅ Inserted ${teamDocCount}/${teamDocuments.length} team documents`);

  console.log("\n🎉 Database seeded successfully!");
  console.log(`\n📊 Summary:`);
  console.log(`   • ${applications.length} applications`);
  console.log(`   • ${baseDocCount} base documents`);
  console.log(`   • ${teamIds.length} teams`);
  console.log(`   • ${teamDocCount} team documents`);
}
