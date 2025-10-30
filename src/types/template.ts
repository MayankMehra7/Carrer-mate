// Template System Types
export interface ResumeTemplate {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  components: TemplateComponent[];
  styles: TemplateStyles;
  layout: LayoutConfig;
  preview: string; // URL to preview image
  isPremium: boolean;
}

export type TemplateCategory = 'professional' | 'creative' | 'modern' | 'classic' | 'minimal';

export interface TemplateComponent {
  id: string;
  type: ComponentType;
  section: string;
  styles: ComponentStyles;
  layout: ComponentLayout;
  isVisible: boolean;
  order: number;
}

export type ComponentType = 
  | 'header'
  | 'section-title'
  | 'text-block'
  | 'list-item'
  | 'contact-info'
  | 'experience-item'
  | 'education-item'
  | 'skill-item'
  | 'divider';

export interface ComponentStyles {
  fontSize: number;
  fontWeight: FontWeight;
  fontFamily: string;
  color: string;
  backgroundColor?: string;
  padding: Spacing;
  margin: Spacing;
  borderRadius?: number;
  borderWidth?: number;
  borderColor?: string;
  textAlign?: TextAlign;
  lineHeight?: number;
}

export type FontWeight = 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';
export type TextAlign = 'left' | 'center' | 'right' | 'justify';

export interface ComponentLayout {
  width: string;
  height?: string;
  flexDirection?: 'row' | 'column';
  justifyContent?: 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around' | 'space-evenly';
  alignItems?: 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline';
  flexWrap?: 'nowrap' | 'wrap' | 'wrap-reverse';
  gap?: number;
}

export interface Spacing {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface TemplateStyles {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  headingColor: string;
  fontFamily: string;
  headingFontFamily: string;
  fontSize: {
    small: number;
    medium: number;
    large: number;
    xlarge: number;
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  borderRadius: number;
  shadows: {
    light: string;
    medium: string;
    heavy: string;
  };
}

export interface LayoutConfig {
  columns: number;
  maxWidth: number;
  pageMargins: Spacing;
  sectionSpacing: number;
  itemSpacing: number;
  headerHeight?: number;
  footerHeight?: number;
}

// Template Customization
export interface TemplateCustomization {
  templateId: string;
  primaryColor: string;
  fontFamily: string;
  fontSize: number;
  spacing: SpacingConfig;
  layout: LayoutCustomization;
}

export interface SpacingConfig {
  compact: boolean;
  sectionSpacing: number;
  itemSpacing: number;
}

export interface LayoutCustomization {
  columns: number;
  showProfileImage: boolean;
  headerStyle: 'centered' | 'left' | 'right';
  sectionOrder: string[];
}

// Template Manager Types
export interface TemplateManagerState {
  availableTemplates: ResumeTemplate[];
  currentTemplate: ResumeTemplate | null;
  customizations: TemplateCustomization | null;
  isLoading: boolean;
  error: string | null;
}

export interface TemplateAction {
  type: TemplateActionType;
  payload?: any;
}

export type TemplateActionType =
  | 'LOAD_TEMPLATES'
  | 'SET_CURRENT_TEMPLATE'
  | 'UPDATE_CUSTOMIZATION'
  | 'RESET_CUSTOMIZATION'
  | 'SET_LOADING'
  | 'SET_ERROR';