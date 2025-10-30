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
  const tableNames = ['teams', 'applications', 'base_documents', 'team_documents', 'document_templates', 'document_versions'];
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

  // Insert applications (test applications)
  const applications = [
    {
      id: "test-app-1",
      name: "Customer Portal",
      icon_name: "Globe",
      color: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    },
    {
      id: "test-app-2",
      name: "Admin Dashboard",
      icon_name: "Database",
      color: "bg-green-500/20 text-green-400 border-green-500/30",
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

  // Insert base documents for test applications
  const baseDocuments = [
    // Customer Portal base documents
    {
      application_id: "test-app-1",
      title: "Server & Container Info",
      category: "Infrastructure",
      content: `<h1>Server & Container Information</h1>

<h2>Production Servers</h2>
<ul>
  <li><strong>Primary Server:</strong> <code>customer-portal-prod-01</code></li>
  <li><strong>Container Registry:</strong> <code>registry.company.com/customer-portal</code></li>
  <li><strong>Docker Image:</strong> <code>customer-portal:latest</code></li>
  <li><strong>Port:</strong> 3000</li>
</ul>

<h2>Container Details</h2>
<ul>
  <li><strong>Base Image:</strong> <code>node:18-alpine</code></li>
  <li><strong>Memory Limit:</strong> 1GB</li>
  <li><strong>CPU Limit:</strong> 1 core</li>
</ul>

<h2>Environment Variables</h2>
<ul>
  <li><code>NODE_ENV=production</code></li>
  <li><code>API_URL=https://api.company.com</code></li>
</ul>`,
    },
    {
      application_id: "test-app-1",
      title: "Support & Contact Info",
      category: "Support",
      content: `<h1>Support & Contact Information</h1>

<h2>Primary Contacts</h2>
<ul>
  <li><strong>Team Lead:</strong> application-team@company.com</li>
  <li><strong>DevOps:</strong> systems-team@company.com</li>
  <li><strong>On-Call:</strong> +1 (555) 100-0001</li>
</ul>

<h2>Support Channels</h2>
<ul>
  <li><strong>Slack:</strong> #customer-portal-support</li>
  <li><strong>Email:</strong> support@company.com</li>
  <li><strong>Emergency:</strong> pager-duty-portal</li>
</ul>

<h2>Common Issues</h2>
<ul>
  <li>Login authentication failures</li>
  <li>Payment processing errors</li>
  <li>Session timeout issues</li>
</ul>`,
    },
    {
      application_id: "test-app-1",
      title: "Application Overview",
      category: "General",
      content: `<h1>Customer Portal Overview</h1>

<h2>Description</h2>
<p>Customer-facing web application for managing accounts, orders, and support tickets.</p>

<h2>Key Features</h2>
<ul>
  <li>User authentication and authorization</li>
  <li>Order management</li>
  <li>Support ticket system</li>
  <li>Payment processing integration</li>
</ul>

<h2>Tech Stack</h2>
<ul>
  <li>Next.js 14</li>
  <li>React 18</li>
  <li>TypeScript</li>
  <li>Tailwind CSS</li>
  <li>PostgreSQL</li>
</ul>`,
    },
    // Admin Dashboard base documents
    {
      application_id: "test-app-2",
      title: "Server & Container Info",
      category: "Infrastructure",
      content: `<h1>Server & Container Information</h1>

<h2>Production Servers</h2>
<ul>
  <li><strong>Primary Server:</strong> <code>admin-dashboard-prod-01</code></li>
  <li><strong>Container Registry:</strong> <code>registry.company.com/admin-dashboard</code></li>
  <li><strong>Docker Image:</strong> <code>admin-dashboard:latest</code></li>
  <li><strong>Port:</strong> 3001</li>
</ul>

<h2>Container Details</h2>
<ul>
  <li><strong>Base Image:</strong> <code>node:18-alpine</code></li>
  <li><strong>Memory Limit:</strong> 2GB</li>
  <li><strong>CPU Limit:</strong> 2 cores</li>
</ul>

<h2>Database</h2>
<ul>
  <li><strong>PostgreSQL:</strong> admin-db-prod.cluster.company.com</li>
  <li><strong>Redis:</strong> admin-redis-prod.cluster.company.com</li>
</ul>`,
    },
    {
      application_id: "test-app-2",
      title: "Support & Contact Info",
      category: "Support",
      content: `<h1>Support & Contact Information</h1>

<h2>Primary Contacts</h2>
<ul>
  <li><strong>Team Lead:</strong> application-team@company.com</li>
  <li><strong>Systems Admin:</strong> systems-team@company.com</li>
  <li><strong>On-Call:</strong> +1 (555) 100-0002</li>
</ul>

<h2>Support Channels</h2>
<ul>
  <li><strong>Slack:</strong> #admin-dashboard-support</li>
  <li><strong>Email:</strong> admin-support@company.com</li>
  <li><strong>Emergency:</strong> pager-duty-admin</li>
</ul>

<h2>Common Issues</h2>
<ul>
  <li>Database connection timeouts</li>
  <li>Permission access denied</li>
  <li>Report generation failures</li>
</ul>`,
    },
    {
      application_id: "test-app-2",
      title: "Application Overview",
      category: "General",
      content: `<h1>Admin Dashboard Overview</h1>

<h2>Description</h2>
<p>Internal administrative dashboard for managing users, content, and system settings.</p>

<h2>Key Features</h2>
<ul>
  <li>User management</li>
  <li>Analytics and reporting</li>
  <li>Content management</li>
  <li>System configuration</li>
</ul>

<h2>Tech Stack</h2>
<ul>
  <li>Next.js 14</li>
  <li>React 18</li>
  <li>TypeScript</li>
  <li>Ant Design</li>
  <li>PostgreSQL</li>
  <li>Redis</li>
</ul>`,
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
    { name: "Application" },
    { name: "Systems" },
    { name: "Support" },
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
      team_id: teamIds[0], // Application team
      application_id: "test-app-1",
      title: "Feature Development Guide",
      category: "Development",
      content: `<h1>Feature Development Guide</h1>

<h2>Development Process</h2>
<p>Our team follows agile development practices with 2-week sprints.</p>

<h2>Code Standards</h2>
<ul>
  <li>ESLint configuration must be followed</li>
  <li>All components must have TypeScript types</li>
  <li>Unit tests required for new features</li>
</ul>

<h2>Pull Request Process</h2>
<ol>
  <li>Create feature branch from main</li>
  <li>Implement changes with tests</li>
  <li>Create PR with description</li>
  <li>Wait for code review approval</li>
  <li>Merge after CI passes</li>
</ol>`,
    },
    {
      team_id: teamIds[0], // Application team
      application_id: "test-app-2",
      title: "Admin Dashboard Customizations",
      category: "Customization",
      content: `<h1>Admin Dashboard Customizations</h1>

<h2>Available Customizations</h2>
<ul>
  <li>Custom user roles and permissions</li>
  <li>Dashboard widget configuration</li>
  <li>Report template customization</li>
</ul>

<h2>Configuration Files</h2>
<ul>
  <li><code>config/roles.json</code> - User role definitions</li>
  <li><code>config/widgets.json</code> - Dashboard widgets</li>
  <li><code>config/reports.json</code> - Report templates</li>
</ul>`,
    },
    {
      team_id: teamIds[1], // Systems team
      application_id: "test-app-1",
      title: "Deployment Runbook",
      category: "Operations",
      content: `<h1>Deployment Runbook</h1>

<h2>Pre-Deployment Checklist</h2>
<ul>
  <li>Review all changes in staging</li>
  <li>Verify database migrations</li>
  <li>Check environment variables</li>
  <li>Confirm backup completion</li>
</ul>

<h2>Deployment Steps</h2>
<ol>
  <li>Tag release in Git</li>
  <li>Build Docker image</li>
  <li>Push to registry</li>
  <li>Update Kubernetes deployment</li>
  <li>Monitor rollout status</li>
</ol>

<h2>Rollback Procedure</h2>
<p>If issues occur, immediately rollback to previous version:</p>
<pre><code>kubectl rollout undo deployment/customer-portal</code></pre>`,
    },
    {
      team_id: teamIds[1], // Systems team
      application_id: "test-app-2",
      title: "Monitoring & Alerts",
      category: "Operations",
      content: `<h1>Monitoring & Alerts</h1>

<h2>Monitoring Tools</h2>
<ul>
  <li><strong>Prometheus:</strong> Metrics collection</li>
  <li><strong>Grafana:</strong> Visualization dashboards</li>
  <li><strong>AlertManager:</strong> Alert routing</li>
</ul>

<h2>Key Metrics</h2>
<ul>
  <li>Response time (p95, p99)</li>
  <li>Error rate</li>
  <li>Request throughput</li>
  <li>Database connection pool usage</li>
</ul>

<h2>Alert Thresholds</h2>
<ul>
  <li>Error rate > 5% for 5 minutes</li>
  <li>Response time > 2s for 10 minutes</li>
  <li>CPU usage > 80% for 15 minutes</li>
</ul>`,
    },
    {
      team_id: teamIds[2], // Support team
      application_id: "test-app-1",
      title: "Common Support Issues",
      category: "Support",
      content: `<h1>Common Support Issues</h1>

<h2>Account Access Issues</h2>
<ul>
  <li><strong>Forgot Password:</strong> Use password reset link</li>
  <li><strong>Account Locked:</strong> Wait 15 minutes or contact support</li>
  <li><strong>2FA Issues:</strong> Reset via security settings</li>
</ul>

<h2>Payment Issues</h2>
<ul>
  <li>Verify payment method is valid</li>
  <li>Check for sufficient funds</li>
  <li>Review transaction history</li>
</ul>

<h2>Escalation Path</h2>
<ol>
  <li>Level 1: Support team (email/chat)</li>
  <li>Level 2: Application team (technical issues)</li>
  <li>Level 3: Systems team (infrastructure issues)</li>
</ol>`,
    },
    {
      team_id: teamIds[2], // Support team
      application_id: "test-app-2",
      title: "Admin User Training Guide",
      category: "Training",
      content: `<h1>Admin User Training Guide</h1>

<h2>Getting Started</h2>
<ul>
  <li>Login with admin credentials</li>
  <li>Review dashboard overview</li>
  <li>Navigate main sections</li>
</ul>

<h2>Key Features</h2>
<ul>
  <li><strong>User Management:</strong> Create, edit, and manage users</li>
  <li><strong>Reports:</strong> Generate and export reports</li>
  <li><strong>Settings:</strong> Configure system settings</li>
</ul>

<h2>Best Practices</h2>
<ul>
  <li>Always verify before making bulk changes</li>
  <li>Use filters to narrow down searches</li>
  <li>Export reports before major operations</li>
</ul>`,
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

  // Insert document templates
  const templates = [
    {
      name: "Meeting Notes",
      description: "Template for recording meeting minutes",
      category: "General",
      content: `<h1>Meeting Notes</h1>
<p><strong>Date:</strong> </p>
<p><strong>Attendees:</strong> </p>
<h2>Agenda</h2>
<ul>
  <li></li>
</ul>
<h2>Discussion Points</h2>
<ul>
  <li></li>
</ul>
<h2>Action Items</h2>
<ul>
  <li></li>
</ul>
<h2>Next Steps</h2>
<p></p>`,
    },
    {
      name: "Project Plan",
      description: "Template for project planning and documentation",
      category: "Planning",
      content: `<h1>Project Plan</h1>
<h2>Overview</h2>
<p></p>
<h2>Objectives</h2>
<ul>
  <li></li>
</ul>
<h2>Timeline</h2>
<p><strong>Start Date:</strong> </p>
<p><strong>End Date:</strong> </p>
<h2>Resources</h2>
<ul>
  <li></li>
</ul>
<h2>Milestones</h2>
<ul>
  <li></li>
</ul>
<h2>Risks & Mitigation</h2>
<ul>
  <li></li>
</ul>`,
    },
    {
      name: "API Documentation",
      description: "Template for API endpoint documentation",
      category: "Development",
      content: `<h1>API Endpoint</h1>
<h2>Overview</h2>
<p></p>
<h2>Endpoint</h2>
<p><code>GET /api/endpoint</code></p>
<h2>Description</h2>
<p></p>
<h2>Parameters</h2>
<table>
  <thead>
    <tr>
      <th>Parameter</th>
      <th>Type</th>
      <th>Required</th>
      <th>Description</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td></td>
      <td></td>
      <td></td>
      <td></td>
    </tr>
  </tbody>
</table>
<h2>Response</h2>
<pre><code>{
  "status": "success",
  "data": {}
}</code></pre>
<h2>Example</h2>
<pre><code></code></pre>`,
    },
    {
      name: "Bug Report",
      description: "Template for documenting bugs and issues",
      category: "Support",
      content: `<h1>Bug Report</h1>
<h2>Summary</h2>
<p></p>
<h2>Steps to Reproduce</h2>
<ol>
  <li></li>
</ol>
<h2>Expected Behavior</h2>
<p></p>
<h2>Actual Behavior</h2>
<p></p>
<h2>Environment</h2>
<ul>
  <li><strong>OS:</strong> </li>
  <li><strong>Browser:</strong> </li>
  <li><strong>Version:</strong> </li>
</ul>
<h2>Additional Information</h2>
<p></p>
<h2>Severity</h2>
<p></p>`,
    },
    {
      name: "Runbook",
      description: "Template for operational runbooks and procedures",
      category: "Operations",
      content: `<h1>Runbook: [Procedure Name]</h1>
<h2>Purpose</h2>
<p></p>
<h2>Prerequisites</h2>
<ul>
  <li></li>
</ul>
<h2>Steps</h2>
<ol>
  <li>
    <h3>Step 1</h3>
    <p></p>
  </li>
</ol>
<h2>Verification</h2>
<p></p>
<h2>Troubleshooting</h2>
<h3>Common Issues</h3>
<ul>
  <li></li>
</ul>
<h2>Rollback</h2>
<p></p>
<h2>Contact</h2>
<p><strong>On-Call:</strong> </p>
<p><strong>Escalation:</strong> </p>`,
    },
    {
      name: "Architecture Document",
      description: "Template for system architecture documentation",
      category: "Architecture",
      content: `<h1>System Architecture</h1>
<h2>Overview</h2>
<p></p>
<h2>System Components</h2>
<ul>
  <li></li>
</ul>
<h2>Data Flow</h2>
<p></p>
<h2>Technology Stack</h2>
<ul>
  <li></li>
</ul>
<h2>Scalability</h2>
<p></p>
<h2>Security</h2>
<p></p>
<h2>Deployment</h2>
<p></p>`,
    },
  ];

  console.log("\n📋 Inserting document templates...");
  let templateCount = 0;
  for (const template of templates) {
    // Check if template already exists
    const { data: existing } = await supabaseAdmin
      .from("document_templates")
      .select("id")
      .eq("name", template.name)
      .maybeSingle();

    if (existing) {
      console.log(`  ✓ Template "${template.name}" already exists (skipping)`);
      templateCount++;
    } else {
      const { error } = await supabaseAdmin.from("document_templates").insert(template);

      if (error) {
        console.error(`  ❌ Error inserting template "${template.name}":`, error.message);
      } else {
        templateCount++;
        console.log(`  ✅ Created "${template.name}"`);
      }
    }
  }
  console.log(`  ✅ Inserted ${templateCount}/${templates.length} templates`);

  console.log("\n🎉 Database seeded successfully!");
  console.log(`\n📊 Summary:`);
  console.log(`   • ${applications.length} applications`);
  console.log(`   • ${baseDocCount} base documents`);
  console.log(`   • ${teamIds.length} teams`);
  console.log(`   • ${teamDocCount} team documents`);
  console.log(`   • ${templateCount} document templates`);
}
