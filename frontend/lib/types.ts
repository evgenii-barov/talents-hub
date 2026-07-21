export type ProjectStage = "idea" | "team_formation" | "prototype" | "pilot" | "active";

export interface ProjectListItem {
  id: string;
  slug: string;
  title: string;
  category: string;
  description: string;
  stage: ProjectStage;
  deadline: string;
  workFormat: string;
  openSeats: number;
  requiredRoles: string[];
  ownerName: string;
}
