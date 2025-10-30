import { Database, Globe, Zap, Settings, Server, LifeBuoy, Container, Info } from "lucide-react";
import { Application, Team, Document } from "@/types";

// Shared applications across all teams
export const applications: Application[] = [
  {
    id: "frontend",
    name: "Frontend App",
    icon: Globe,
    color: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    baseDocuments: [
      {
        id: "frontend-base-server",
        title: "Server & Container Info",
        category: "Infrastructure",
        type: "base",
        content: "# Server & Container Information\n\n## Production Servers\n- **Primary Server**: `app-frontend-prod-01`\n- **Container Registry**: `registry.company.com/frontend`\n- **Docker Image**: `frontend:latest`\n- **Port**: 3000\n\n## Container Details\n- **Base Image**: `node:18-alpine`\n- **Memory Limit**: 512MB\n- **CPU Limit**: 0.5 cores",
        updated: "1 week ago",
        appId: "frontend",
      },
      {
        id: "frontend-base-support",
        title: "Support & Contact Info",
        category: "Support",
        type: "base",
        content: "# Support & Contact Information\n\n## Primary Contacts\n- **Team Lead**: team-lead@company.com\n- **DevOps**: devops@company.com\n- **On-Call**: +1 (555) 123-4567\n\n## Support Channels\n- **Slack**: #frontend-support\n- **Email**: frontend-support@company.com\n- **Emergency**: pager-duty-frontend\n\n## Common Issues\n- See troubleshooting guide\n- Check logs in CloudWatch\n- Review recent deployments",
        updated: "2 weeks ago",
        appId: "frontend",
      },
      {
        id: "frontend-base-overview",
        title: "Application Overview",
        category: "General",
        type: "base",
        content: "# Frontend Application Overview\n\n## Description\nMain customer-facing web application built with React and Next.js.\n\n## Key Features\n- Server-side rendering\n- Progressive Web App support\n- Real-time updates\n\n## Tech Stack\n- React 18\n- Next.js 14\n- TypeScript\n- Tailwind CSS",
        updated: "3 weeks ago",
        appId: "frontend",
      },
    ],
  },
  {
    id: "backend",
    name: "Backend API",
    icon: Database,
    color: "bg-green-500/20 text-green-400 border-green-500/30",
    baseDocuments: [
      {
        id: "backend-base-server",
        title: "Server & Container Info",
        category: "Infrastructure",
        type: "base",
        content: "# Server & Container Information\n\n## Production Servers\n- **Primary Server**: `api-backend-prod-01`\n- **Container Registry**: `registry.company.com/backend`\n- **Docker Image**: `backend:latest`\n- **Port**: 8000\n\n## Container Details\n- **Base Image**: `python:3.11-slim`\n- **Memory Limit**: 1GB\n- **CPU Limit**: 1 core",
        updated: "1 week ago",
        appId: "backend",
      },
      {
        id: "backend-base-support",
        title: "Support & Contact Info",
        category: "Support",
        type: "base",
        content: "# Support & Contact Information\n\n## Primary Contacts\n- **Team Lead**: backend-lead@company.com\n- **DevOps**: devops@company.com\n- **On-Call**: +1 (555) 234-5678\n\n## Support Channels\n- **Slack**: #backend-support\n- **Email**: backend-support@company.com\n- **Emergency**: pager-duty-backend\n\n## Common Issues\n- Database connection issues\n- API rate limiting\n- Authentication failures",
        updated: "2 weeks ago",
        appId: "backend",
      },
      {
        id: "backend-base-overview",
        title: "Application Overview",
        category: "General",
        type: "base",
        content: "# Backend API Overview\n\n## Description\nRESTful API service handling business logic and data processing.\n\n## Key Features\n- RESTful endpoints\n- GraphQL support\n- WebSocket connections\n\n## Tech Stack\n- Python 3.11\n- FastAPI\n- PostgreSQL\n- Redis",
        updated: "3 weeks ago",
        appId: "backend",
      },
    ],
  },
  {
    id: "mobile",
    name: "Mobile App",
    icon: Zap,
    color: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    baseDocuments: [
      {
        id: "mobile-base-server",
        title: "Server & Container Info",
        category: "Infrastructure",
        type: "base",
        content: "# Server & Container Information\n\n## Build Servers\n- **CI/CD Server**: `mobile-build-01`\n- **Container Registry**: `registry.company.com/mobile`\n- **Build Image**: `mobile-builder:latest`\n\n## Container Details\n- **Base Image**: `react-native:latest`\n- **Build Tools**: Xcode, Android SDK\n- **Memory Limit**: 2GB",
        updated: "1 week ago",
        appId: "mobile",
      },
      {
        id: "mobile-base-support",
        title: "Support & Contact Info",
        category: "Support",
        type: "base",
        content: "# Support & Contact Information\n\n## Primary Contacts\n- **Team Lead**: mobile-lead@company.com\n- **DevOps**: devops@company.com\n- **On-Call**: +1 (555) 345-6789\n\n## Support Channels\n- **Slack**: #mobile-support\n- **Email**: mobile-support@company.com\n- **Emergency**: pager-duty-mobile\n\n## Common Issues\n- Build failures\n- App Store rejections\n- Push notification issues",
        updated: "2 weeks ago",
        appId: "mobile",
      },
      {
        id: "mobile-base-overview",
        title: "Application Overview",
        category: "General",
        type: "base",
        content: "# Mobile Application Overview\n\n## Description\nCross-platform mobile application for iOS and Android.\n\n## Key Features\n- Native performance\n- Offline support\n- Push notifications\n\n## Tech Stack\n- React Native\n- TypeScript\n- Redux",
        updated: "3 weeks ago",
        appId: "mobile",
      },
    ],
  },
  {
    id: "devops",
    name: "DevOps",
    icon: Settings,
    color: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    baseDocuments: [
      {
        id: "devops-base-server",
        title: "Server & Container Info",
        category: "Infrastructure",
        type: "base",
        content: "# Server & Container Information\n\n## Infrastructure\n- **Kubernetes Cluster**: `k8s-prod-cluster`\n- **Container Registry**: `registry.company.com`\n- **Monitoring**: Prometheus + Grafana\n\n## Container Details\n- **Orchestration**: Kubernetes\n- **CI/CD**: Jenkins + GitHub Actions\n- **IaC**: Terraform",
        updated: "1 week ago",
        appId: "devops",
      },
      {
        id: "devops-base-support",
        title: "Support & Contact Info",
        category: "Support",
        type: "base",
        content: "# Support & Contact Information\n\n## Primary Contacts\n- **Team Lead**: devops-lead@company.com\n- **On-Call**: +1 (555) 456-7890\n\n## Support Channels\n- **Slack**: #devops-support\n- **Email**: devops@company.com\n- **Emergency**: pager-duty-devops\n\n## Common Issues\n- Deployment failures\n- Infrastructure scaling\n- Monitoring alerts",
        updated: "2 weeks ago",
        appId: "devops",
      },
      {
        id: "devops-base-overview",
        title: "Application Overview",
        category: "General",
        type: "base",
        content: "# DevOps Overview\n\n## Description\nInfrastructure and deployment automation.\n\n## Key Features\n- CI/CD pipelines\n- Infrastructure as Code\n- Monitoring and alerting\n\n## Tech Stack\n- Kubernetes\n- Docker\n- Terraform\n- Ansible",
        updated: "3 weeks ago",
        appId: "devops",
      },
    ],
  },
];

// Mock teams
export const teams: Team[] = [
  {
    id: "team-alpha",
    name: "Team Alpha",
    documents: [
      {
        document: {
          id: "alpha-frontend-features",
          title: "Custom Features Implementation",
          category: "Development",
          type: "team",
          content: "Team Alpha specific frontend features...",
          updated: "2 hours ago",
          appId: "frontend",
        },
        teamId: "team-alpha",
      },
      {
        document: {
          id: "alpha-backend-endpoints",
          title: "Custom API Endpoints",
          category: "API",
          type: "team",
          content: "Team Alpha specific backend endpoints...",
          updated: "5 hours ago",
          appId: "backend",
        },
        teamId: "team-alpha",
      },
      {
        document: {
          id: "alpha-mobile-config",
          title: "Mobile App Configuration",
          category: "Configuration",
          type: "team",
          content: "Team Alpha mobile app settings...",
          updated: "1 day ago",
          appId: "mobile",
        },
        teamId: "team-alpha",
      },
    ],
  },
  {
    id: "team-beta",
    name: "Team Beta",
    documents: [
      {
        document: {
          id: "beta-frontend-components",
          title: "Shared Component Library",
          category: "Components",
          type: "team",
          content: "Team Beta component library documentation...",
          updated: "3 hours ago",
          appId: "frontend",
        },
        teamId: "team-beta",
      },
      {
        document: {
          id: "beta-backend-integrations",
          title: "Third-party Integrations",
          category: "Integration",
          type: "team",
          content: "Team Beta third-party service integrations...",
          updated: "6 hours ago",
          appId: "backend",
        },
        teamId: "team-beta",
      },
      {
        document: {
          id: "beta-devops-deployments",
          title: "Deployment Procedures",
          category: "Deployment",
          type: "team",
          content: "Team Beta specific deployment steps...",
          updated: "2 days ago",
          appId: "devops",
        },
        teamId: "team-beta",
      },
    ],
  },
  {
    id: "team-gamma",
    name: "Team Gamma",
    documents: [
      {
        document: {
          id: "gamma-frontend-testing",
          title: "Testing Strategy",
          category: "Testing",
          type: "team",
          content: "Team Gamma testing approach...",
          updated: "1 hour ago",
          appId: "frontend",
        },
        teamId: "team-gamma",
      },
      {
        document: {
          id: "gamma-backend-performance",
          title: "Performance Optimization",
          category: "Performance",
          type: "team",
          content: "Team Gamma backend optimizations...",
          updated: "4 hours ago",
          appId: "backend",
        },
        teamId: "team-gamma",
      },
      {
        document: {
          id: "gamma-mobile-analytics",
          title: "Analytics Setup",
          category: "Analytics",
          type: "team",
          content: "Team Gamma mobile analytics configuration...",
          updated: "12 hours ago",
          appId: "mobile",
        },
        teamId: "team-gamma",
      },
    ],
  },
];

// Helper function to get team documents for an application
export function getTeamDocumentsForApp(teamId: string, appId: string): Document[] {
  const team = teams.find((t) => t.id === teamId);
  if (!team) return [];
  
  return team.documents
    .filter((td) => td.document.appId === appId)
    .map((td) => td.document);
}

// Helper function to get all documents for an application (base + team)
export function getAllDocumentsForApp(teamId: string, appId: string): Document[] {
  const app = applications.find((a) => a.id === appId);
  if (!app) return [];
  
  const baseDocs = app.baseDocuments;
  const teamDocs = getTeamDocumentsForApp(teamId, appId);
  
  return [...baseDocs, ...teamDocs];
}
