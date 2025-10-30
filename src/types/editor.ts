// Editor and Auto-Save Types
export interface AutoSaveState {
  isSaving: boolean;
  lastSaved: Date | null;
  hasUnsavedChanges: boolean;
  isOffline: boolean;
  saveQueue: SaveQueueItem[];
  error: string | null;
}

export interface SaveQueueItem {
  id: string;
  resumeId: string;
  changes: Partial<any>;
  timestamp: Date;
  retryCount: number;
}

export interface SaveStatus {
  isSaving: boolean;
  lastSaved: Date | null;
  hasUnsavedChanges: boolean;
  isOffline: boolean;
  error?: string;
}

// Export Types
export interface ExportOptions {
  format: ExportFormat;
  fileName: string;
  includeProfileImage: boolean;
  pageSize: PageSize;
  margins: Spacing;
  quality: ExportQuality;
}

export type ExportFormat = 'pdf' | 'word' | 'text' | 'html';
export type PageSize = 'A4' | 'Letter' | 'Legal';
export type ExportQuality = 'low' | 'medium' | 'high';

export interface ExportResult {
  success: boolean;
  filePath?: string;
  fileName?: string;
  error?: string;
  fileSize?: number;
}

// Editor State
export interface EditorState {
  splitScreenMode: SplitScreenMode;
  activePanel: EditorPanel;
  zoomLevel: number;
  showPreview: boolean;
  showGrid: boolean;
  highlightedSection: string | null;
  isFullscreen: boolean;
  sidebarCollapsed: boolean;
}

export type SplitScreenMode = 'horizontal' | 'vertical' | 'tabs';
export type EditorPanel = 'editor' | 'preview' | 'both';

// Live Preview Types
export interface PreviewState {
  isRendering: boolean;
  renderError: string | null;
  lastRenderTime: Date | null;
  performanceMetrics: PerformanceMetrics;
}

export interface PerformanceMetrics {
  renderTime: number;
  memoryUsage: number;
  componentCount: number;
  updateCount: number;
}

// Validation Types
export interface ValidationState {
  sectionErrors: Record<string, ValidationError[]>;
  globalErrors: ValidationError[];
  warnings: ValidationWarning[];
  completionScore: number;
  isValid: boolean;
}

export interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning';
  code: string;
}

export interface ValidationWarning {
  field: string;
  message: string;
  suggestion?: string;
}

// Editor Actions
export interface EditorAction {
  type: EditorActionType;
  payload?: any;
}

export type EditorActionType =
  | 'SET_SPLIT_SCREEN_MODE'
  | 'SET_ACTIVE_PANEL'
  | 'SET_ZOOM_LEVEL'
  | 'TOGGLE_PREVIEW'
  | 'TOGGLE_GRID'
  | 'HIGHLIGHT_SECTION'
  | 'TOGGLE_FULLSCREEN'
  | 'TOGGLE_SIDEBAR'
  | 'START_AUTO_SAVE'
  | 'COMPLETE_AUTO_SAVE'
  | 'QUEUE_SAVE'
  | 'SET_OFFLINE_MODE'
  | 'START_EXPORT'
  | 'COMPLETE_EXPORT'
  | 'UPDATE_PERFORMANCE_METRICS';

// Touch and Gesture Types
export interface TouchState {
  isScrolling: boolean;
  isPinching: boolean;
  lastTouchPosition: { x: number; y: number };
  gestureVelocity: { x: number; y: number };
}

export interface GestureConfig {
  enablePinchZoom: boolean;
  enableSwipeNavigation: boolean;
  enableDoubleTapZoom: boolean;
  minimumZoom: number;
  maximumZoom: number;
  zoomStep: number;
}