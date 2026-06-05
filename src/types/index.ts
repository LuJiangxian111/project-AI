export interface User {
  id: string;
  email: string;
  full_name: string;
  is_active: boolean;
  is_superuser: boolean;
  preferences: Record<string, unknown>;
  created_at: string;
  updated_at?: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user_id: string;
  email: string;
  full_name: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  status: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled';
  progress: number;
  start_date?: string;
  end_date?: string;
  deadline?: string;
  budget?: number;
  actual_cost: number;
  owner_id: string;
  team_members: string[];
  created_at: string;
  updated_at?: string;
}

export interface ProjectStats {
  total_tasks: number;
  completed_tasks: number;
  pending_tasks: number;
  total_resources: number;
  active_risks: number;
  open_positions: number;
  total_interviews: number;
  budget_utilization: number;
}

export interface ProjectOverview extends Project {
  stats?: ProjectStats;
  owner_name?: string;
  team_member_names: string[];
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'review' | 'done' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  project_id: string;
  assignee_id?: string;
  parent_task_id?: string;
  due_date?: string;
  progress: number;
  estimated_hours?: number;
  actual_hours: number;
  tags: string[];
  dependencies: string[];
  created_at: string;
  updated_at?: string;
}

export interface TaskDetail extends Task {
  project_name?: string;
  assignee_name?: string;
  assignee_email?: string;
  parent_task_title?: string;
  subtask_count: number;
  comment_count: number;
}

export interface TaskComment {
  id: string;
  content: string;
  task_id: string;
  user_id: string;
  user_name?: string;
  user_email?: string;
  created_at: string;
  updated_at?: string;
}

export interface TaskStats {
  total: number;
  todo: number;
  in_progress: number;
  review: number;
  done: number;
  cancelled: number;
  overdue: number;
  high_priority: number;
  total_estimated_hours: number;
  total_actual_hours: number;
}

export interface JobPosition {
  id: string;
  title: string;
  department?: string;
  location?: string;
  employment_type: string;
  description?: string;
  requirements?: string;
  status: 'open' | 'closed' | 'on_hold' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  target_hire_count: number;
  hired_count: number;
  project_id: string;
  posting_date: string;
  created_at: string;
  updated_at?: string;
}

export interface Resume {
  id: string;
  candidate_name: string;
  candidate_email: string;
  candidate_phone?: string;
  status: 'new' | 'screening' | 'interview' | 'offer' | 'hired' | 'rejected' | 'archived';
  rating?: number;
  job_position_id: string;
  file_path: string;
  file_name: string;
  skills: string[];
  experience: Array<Record<string, unknown>>;
  education: Array<Record<string, unknown>>;
  created_at: string;
  updated_at?: string;
}

export interface Interview {
  id: string;
  title: string;
  round_number: number;
  interview_type: string;
  format: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  result?: 'passed' | 'failed' | 'pending' | 'on_hold';
  rating?: number;
  resume_id: string;
  interviewer_id: string;
  scheduled_start: string;
  scheduled_end: string;
  feedback?: string;
  location?: string;
  meeting_link?: string;
  created_at: string;
  updated_at?: string;
}

export interface LLMConfig {
  id: string;
  name: string;
  provider: string;
  api_key?: string;
  base_url?: string;
  model: string;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
}