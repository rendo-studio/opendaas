export type TaskStatus = "pending" | "in_progress" | "done" | "blocked";
export type DiffSource = "human" | "agent" | "unknown";
export type DecisionCategory = "goal" | "scope" | "change" | "architecture" | "release" | "policy" | "other";
export type DecisionStatus = "pending" | "approved" | "rejected";
export type ReleaseRecordStatus = "draft" | "frozen" | "published";
export type PageBoundaryMode = "editable" | "projection" | "hybrid";

export interface GoalState {
  goalId: string;
  name: string;
  summary: string;
  successCriteria: string[];
  nonGoals: string[];
}

export interface ProjectOverviewState {
  name: string;
  summary: string;
  docPath: string;
}

export interface PlanNode {
  id: string;
  name: string;
  summary: string | null;
  status: TaskStatus;
  parentPlanId: string | null;
}

export interface PlansState {
  endGoalRef: string;
  items: PlanNode[];
}

export interface TaskNode {
  id: string;
  name: string;
  summary: string | null;
  status: TaskStatus;
  planRef: string;
  parentTaskId: string | null;
  countedForProgress: boolean;
}

export interface TasksState {
  items: TaskNode[];
}

export interface TaskArchiveEntry {
  id: string;
  name: string;
  planRef: string;
  parentTaskId: string | null;
  status: TaskStatus;
  closedAt: string;
  closedByChange: string | null;
  summary: string | null;
}

export interface TaskArchiveState {
  items: TaskArchiveEntry[];
}

export interface ProgressState {
  percent: number;
  countedTasks: number;
  doneTasks: number;
  computedAt: string | null;
}

export interface WorkspaceState {
  activeChange: string | null;
  currentRoundId: string | null;
  lastDiffCheckAt: string | null;
  lastDiffAckAt: string | null;
}

export interface PendingHunk {
  oldStart: number;
  oldCount: number;
  newStart: number;
  newCount: number;
}

export interface PendingFile {
  path: string;
  changeType: "added" | "modified" | "deleted";
  source: DiffSource;
  hunks: PendingHunk[];
}

export interface PendingDiffState {
  generatedAt: string | null;
  files: PendingFile[];
}

export interface DiffHistoryEntry {
  id: string;
  kind: "check" | "ack";
  generatedAt: string;
  fileCount: number;
  addedCount: number;
  modifiedCount: number;
  deletedCount: number;
  files: PendingFile[];
}

export interface DiffHistoryState {
  items: DiffHistoryEntry[];
}

export interface WorkspaceMetaState {
  schemaVersion: number;
  workspaceName: string;
  docsRoot: string;
  workspaceRoot: string;
  bootstrapMode: "init" | "adopt";
  templateVersion: string;
  projectKind: "general" | "frontend" | "library" | "service";
  docsMode: "minimal" | "standard";
  createdAt: string;
  lastUpgradedAt: string | null;
}

export interface WorkspaceConfigState {
  requireDiffCheckBeforeTask: boolean;
  docsSiteEnabled: boolean;
  defaultDiffMode: "line";
  siteFramework: string;
  packageManager: string;
  projectKind: "general" | "frontend" | "library" | "service";
  docsMode: "minimal" | "standard";
  workspaceSchemaVersion: number;
}

export interface TaskTreeNode extends TaskNode {
  children: TaskTreeNode[];
}

export interface PlanTreeNode extends PlanNode {
  children: PlanTreeNode[];
}

export interface DecisionRecord {
  id: string;
  name: string;
  description: string;
  category: DecisionCategory;
  proposedBy: string;
  context: string;
  impactOfNoAction: string;
  expectedOutcome: string;
  boundary: string;
  status: DecisionStatus;
  decisionSummary: string | null;
  revisitCondition: string | null;
  createdAt: string;
  decidedAt: string | null;
}

export interface DecisionState {
  items: DecisionRecord[];
}

export interface ReleaseRecord {
  id: string;
  version: string;
  title: string;
  summary: string;
  status: ReleaseRecordStatus;
  changeRefs: string[];
  decisionRefs: string[];
  highlights: string[];
  breakingChanges: string[];
  migrationNotes: string[];
  validationSummary: string | null;
  startedAt: string;
  closedAt: string | null;
  publishedAt: string | null;
}

export interface ReleaseState {
  items: ReleaseRecord[];
}

export interface PageBoundary {
  path: string;
  slug: string[];
  title: string;
  mode: PageBoundaryMode;
  managedSections: string[];
  reason: string;
}
