import { supabase } from "@/lib/supabase/client";
import { log } from "@/lib/logger";

export interface DocumentTemplate {
  id: string;
  name: string;
  description?: string;
  content: string;
  category?: string;
  application_id?: string;
}

// Fetch all templates
export async function getTemplates(appId?: string): Promise<DocumentTemplate[]> {
  let query = supabase.from("document_templates").select("*").order("name");

  if (appId) {
    query = query.eq("application_id", appId);
  }

  const { data, error } = await query;

  if (error) {
    log.error("Error fetching templates:", error);
    return [];
  }

  return (data || []).map((template: any) => ({
    id: template.id,
    name: template.name,
    description: template.description,
    content: template.content,
    category: template.category,
    application_id: template.application_id,
  }));
}

// Predefined templates
export const defaultTemplates: DocumentTemplate[] = [
  {
    id: "meeting-notes",
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
    id: "project-plan",
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
    id: "api-documentation",
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
    id: "bug-report",
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
    id: "runbook",
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
    id: "architecture",
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
