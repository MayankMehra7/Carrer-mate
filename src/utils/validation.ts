import { Education, PersonalInfo, SectionType, ValidationResult, WorkExperience } from '../types';

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Phone validation regex (basic international format)
const PHONE_REGEX = /^[\+]?[1-9][\d]{0,15}$/;

// URL validation regex
const URL_REGEX = /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/;

export const validateSection = (sectionType: SectionType, data: any): ValidationResult => {
  switch (sectionType) {
    case 'personalInfo':
      return validatePersonalInfo(data);
    case 'summary':
      return validateSummary(data);
    case 'experience':
      return validateExperience(data);
    case 'education':
      return validateEducation(data);
    case 'skills':
      return validateSkills(data);
    case 'certifications':
      return validateCertifications(data);
    case 'projects':
      return validateProjects(data);
    case 'customSections':
      return validateCustomSections(data);
    default:
      return { isValid: true };
  }
};

const validatePersonalInfo = (data: PersonalInfo): ValidationResult => {
  const errors: string[] = [];

  // Required fields
  if (!data.fullName?.trim()) {
    errors.push('Full name is required');
  }

  if (!data.email?.trim()) {
    errors.push('Email is required');
  } else if (!EMAIL_REGEX.test(data.email)) {
    errors.push('Please enter a valid email address');
  }

  if (!data.phone?.trim()) {
    errors.push('Phone number is required');
  } else if (!PHONE_REGEX.test(data.phone.replace(/[\s\-\(\)]/g, ''))) {
    errors.push('Please enter a valid phone number');
  }

  // Optional field validation
  if (data.linkedIn && !URL_REGEX.test(data.linkedIn)) {
    errors.push('Please enter a valid LinkedIn URL');
  }

  if (data.website && !URL_REGEX.test(data.website)) {
    errors.push('Please enter a valid website URL');
  }

  return {
    isValid: errors.length === 0,
    message: errors.join(', '),
  };
};

const validateSummary = (data: string): ValidationResult => {
  if (!data?.trim()) {
    return {
      isValid: false,
      message: 'Professional summary is required',
    };
  }

  if (data.length < 50) {
    return {
      isValid: false,
      message: 'Summary should be at least 50 characters long',
    };
  }

  if (data.length > 500) {
    return {
      isValid: false,
      message: 'Summary should not exceed 500 characters',
    };
  }

  return { isValid: true };
};

const validateExperience = (data: WorkExperience[]): ValidationResult => {
  if (!Array.isArray(data) || data.length === 0) {
    return {
      isValid: false,
      message: 'At least one work experience entry is required',
    };
  }

  const errors: string[] = [];

  data.forEach((experience, index) => {
    if (!experience.company?.trim()) {
      errors.push(`Experience ${index + 1}: Company name is required`);
    }

    if (!experience.position?.trim()) {
      errors.push(`Experience ${index + 1}: Position title is required`);
    }

    if (!experience.startDate) {
      errors.push(`Experience ${index + 1}: Start date is required`);
    }

    if (!experience.isCurrent && !experience.endDate) {
      errors.push(`Experience ${index + 1}: End date is required for past positions`);
    }

    if (experience.startDate && experience.endDate && experience.startDate > experience.endDate) {
      errors.push(`Experience ${index + 1}: Start date cannot be after end date`);
    }

    if (!experience.description?.trim()) {
      errors.push(`Experience ${index + 1}: Job description is required`);
    }
  });

  return {
    isValid: errors.length === 0,
    message: errors.join(', '),
  };
};

const validateEducation = (data: Education[]): ValidationResult => {
  if (!Array.isArray(data) || data.length === 0) {
    return {
      isValid: false,
      message: 'At least one education entry is required',
    };
  }

  const errors: string[] = [];

  data.forEach((education, index) => {
    if (!education.institution?.trim()) {
      errors.push(`Education ${index + 1}: Institution name is required`);
    }

    if (!education.degree?.trim()) {
      errors.push(`Education ${index + 1}: Degree is required`);
    }

    if (!education.field?.trim()) {
      errors.push(`Education ${index + 1}: Field of study is required`);
    }

    if (!education.startDate) {
      errors.push(`Education ${index + 1}: Start date is required`);
    }

    if (education.startDate && education.endDate && education.startDate > education.endDate) {
      errors.push(`Education ${index + 1}: Start date cannot be after end date`);
    }

    if (education.gpa && (education.gpa < 0 || education.gpa > 4.0)) {
      errors.push(`Education ${index + 1}: GPA must be between 0.0 and 4.0`);
    }
  });

  return {
    isValid: errors.length === 0,
    message: errors.join(', '),
  };
};

const validateSkills = (data: any[]): ValidationResult => {
  if (!Array.isArray(data) || data.length === 0) {
    return {
      isValid: false,
      message: 'At least one skill is required',
    };
  }

  const errors: string[] = [];

  data.forEach((skill, index) => {
    if (!skill.name?.trim()) {
      errors.push(`Skill ${index + 1}: Skill name is required`);
    }

    if (!skill.category) {
      errors.push(`Skill ${index + 1}: Skill category is required`);
    }

    if (!skill.proficiency) {
      errors.push(`Skill ${index + 1}: Proficiency level is required`);
    }
  });

  return {
    isValid: errors.length === 0,
    message: errors.join(', '),
  };
};

const validateCertifications = (data: any[]): ValidationResult => {
  // Certifications are optional, so empty array is valid
  if (!Array.isArray(data)) {
    return {
      isValid: false,
      message: 'Certifications must be an array',
    };
  }

  const errors: string[] = [];

  data.forEach((cert, index) => {
    if (!cert.name?.trim()) {
      errors.push(`Certification ${index + 1}: Name is required`);
    }

    if (!cert.issuer?.trim()) {
      errors.push(`Certification ${index + 1}: Issuer is required`);
    }

    if (!cert.issueDate) {
      errors.push(`Certification ${index + 1}: Issue date is required`);
    }

    if (cert.url && !URL_REGEX.test(cert.url)) {
      errors.push(`Certification ${index + 1}: Please enter a valid URL`);
    }
  });

  return {
    isValid: errors.length === 0,
    message: errors.join(', '),
  };
};

const validateProjects = (data: any[]): ValidationResult => {
  // Projects are optional, so empty array is valid
  if (!Array.isArray(data)) {
    return {
      isValid: false,
      message: 'Projects must be an array',
    };
  }

  const errors: string[] = [];

  data.forEach((project, index) => {
    if (!project.name?.trim()) {
      errors.push(`Project ${index + 1}: Name is required`);
    }

    if (!project.description?.trim()) {
      errors.push(`Project ${index + 1}: Description is required`);
    }

    if (!project.startDate) {
      errors.push(`Project ${index + 1}: Start date is required`);
    }

    if (project.startDate && project.endDate && project.startDate > project.endDate) {
      errors.push(`Project ${index + 1}: Start date cannot be after end date`);
    }

    if (project.url && !URL_REGEX.test(project.url)) {
      errors.push(`Project ${index + 1}: Please enter a valid project URL`);
    }

    if (project.githubUrl && !URL_REGEX.test(project.githubUrl)) {
      errors.push(`Project ${index + 1}: Please enter a valid GitHub URL`);
    }
  });

  return {
    isValid: errors.length === 0,
    message: errors.join(', '),
  };
};

const validateCustomSections = (data: any[]): ValidationResult => {
  // Custom sections are optional
  if (!Array.isArray(data)) {
    return {
      isValid: false,
      message: 'Custom sections must be an array',
    };
  }

  const errors: string[] = [];

  data.forEach((section, index) => {
    if (!section.title?.trim()) {
      errors.push(`Custom section ${index + 1}: Title is required`);
    }

    if (!section.type) {
      errors.push(`Custom section ${index + 1}: Type is required`);
    }

    if (!section.content) {
      errors.push(`Custom section ${index + 1}: Content is required`);
    }
  });

  return {
    isValid: errors.length === 0,
    message: errors.join(', '),
  };
};

// Calculate completion score based on filled sections
export const calculateCompletionScore = (resumeData: any): number => {
  let totalSections = 0;
  let completedSections = 0;

  // Check each section
  const sections = [
    'personalInfo',
    'summary',
    'experience',
    'education',
    'skills',
  ];

  sections.forEach(sectionType => {
    totalSections++;
    const validation = validateSection(sectionType as SectionType, resumeData.sections[sectionType]);
    if (validation.isValid) {
      completedSections++;
    }
  });

  return Math.round((completedSections / totalSections) * 100);
};