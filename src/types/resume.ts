// Core Resume Data Types
export interface ResumeData {
  id: string;
  userId: string;
  title: string;
  lastModified: Date;
  template: string;
  sections: ResumeSections;
  metadata: ResumeMetadata;
}

export interface ResumeSections {
  personalInfo: PersonalInfo;
  summary: string;
  experience: WorkExperience[];
  education: Education[];
  skills: Skill[];
  certifications: Certification[];
  projects: Project[];
  customSections: CustomSection[];
}

// Personal Information
export interface PersonalInfo {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  linkedIn?: string;
  website?: string;
  profileImage?: string;
}

// Work Experience
export interface WorkExperience {
  id: string;
  company: string;
  position: string;
  startDate: Date;
  endDate?: Date;
  isCurrent: boolean;
  description: string;
  achievements: string[];
  location: string;
}

// Education
export interface Education {
  id: string;
  institution: string;
  degree: string;
  field: string;
  startDate: Date;
  endDate?: Date;
  gpa?: number;
  honors?: string[];
}

// Skills
export interface Skill {
  id: string;
  name: string;
  category: SkillCategory;
  proficiency: SkillProficiency;
}

export type SkillCategory = 'technical' | 'soft' | 'language' | 'other';
export type SkillProficiency = 'beginner' | 'intermediate' | 'advanced' | 'expert';

// Certifications
export interface Certification {
  id: string;
  name: string;
  issuer: string;
  issueDate: Date;
  expiryDate?: Date;
  credentialId?: string;
  url?: string;
}

// Projects
export interface Project {
  id: string;
  name: string;
  description: string;
  technologies: string[];
  startDate: Date;
  endDate?: Date;
  url?: string;
  githubUrl?: string;
}

// Custom Sections
export interface CustomSection {
  id: string;
  title: string;
  type: CustomSectionType;
  content: any;
  order: number;
}

export type CustomSectionType = 'text' | 'list' | 'achievements' | 'awards';

// Resume Metadata
export interface ResumeMetadata {
  version: number;
  createdAt: Date;
  updatedAt: Date;
  isPublic: boolean;
  tags: string[];
  completionScore: number;
}

// Section Types
export type SectionType = 
  | 'personalInfo' 
  | 'summary' 
  | 'experience' 
  | 'education' 
  | 'skills' 
  | 'certifications' 
  | 'projects' 
  | 'customSections';

export interface ResumeSection {
  id: string;
  type: SectionType;
  title: string;
  content: any;
  isRequired: boolean;
  validation: ValidationRules;
  order: number;
}

// Validation
export interface ValidationRules {
  required: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  customValidator?: (value: any) => ValidationResult;
}

export interface ValidationResult {
  isValid: boolean;
  message?: string;
}

// State Management Types
export interface ResumeState {
  currentResume: ResumeData | null;
  activeSection: SectionType | null;
  isEditing: boolean;
  hasUnsavedChanges: boolean;
  validationErrors: Record<string, string[]>;
  isLoading: boolean;
  error: string | null;
}

export interface ResumeAction {
  type: ResumeActionType;
  payload?: any;
}

export type ResumeActionType =
  | 'LOAD_RESUME'
  | 'UPDATE_SECTION'
  | 'SET_ACTIVE_SECTION'
  | 'ADD_ITEM'
  | 'REMOVE_ITEM'
  | 'REORDER_ITEMS'
  | 'VALIDATE_SECTION'
  | 'SAVE_RESUME'
  | 'SET_LOADING'
  | 'SET_ERROR'
  | 'CLEAR_ERROR';