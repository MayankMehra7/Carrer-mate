import React, { createContext, useCallback, useContext, useEffect, useReducer } from 'react';
import { AutoSaveManager } from '../services/AutoSaveManager';
import { ResumeData, ResumeState, SectionType, ValidationResult } from '../types';
import { validateSection } from '../utils/validation';
import { initialResumeState, resumeReducer } from './resumeReducer';

interface ResumeContextType {
  state: ResumeState;
  // Resume operations
  loadResume: (resumeId: string) => Promise<void>;
  updateSection: (sectionType: SectionType, data: any) => void;
  setActiveSection: (sectionType: SectionType | null) => void;
  addItem: (sectionType: SectionType, item: any) => void;
  removeItem: (sectionType: SectionType, itemId: string) => void;
  reorderItems: (sectionType: SectionType, fromIndex: number, toIndex: number) => void;
  // Validation
  validateCurrentSection: () => ValidationResult;
  validateAllSections: () => Record<string, ValidationResult>;
  // Save operations
  saveResume: () => Promise<void>;
  enableAutoSave: () => void;
  disableAutoSave: () => void;
  // Utility
  clearError: () => void;
  resetResume: () => void;
}

const ResumeContext = createContext<ResumeContextType | undefined>(undefined);

interface ResumeProviderProps {
  children: React.ReactNode;
  autoSaveEnabled?: boolean;
}

export const ResumeProvider: React.FC<ResumeProviderProps> = ({ 
  children, 
  autoSaveEnabled = true 
}) => {
  const [state, dispatch] = useReducer(resumeReducer, initialResumeState);
  const autoSaveManager = new AutoSaveManager();

  // Auto-save effect
  useEffect(() => {
    if (autoSaveEnabled && state.hasUnsavedChanges && state.currentResume) {
      const timeoutId = setTimeout(() => {
        saveResume();
      }, 3000); // 3-second debounce

      return () => clearTimeout(timeoutId);
    }
  }, [state.hasUnsavedChanges, state.currentResume, autoSaveEnabled]);

  const loadResume = useCallback(async (resumeId: string) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      // TODO: Implement actual API call
      // const resume = await resumeApi.getResume(resumeId);
      // For now, create a mock resume
      const mockResume: ResumeData = {
        id: resumeId,
        userId: 'user-1',
        title: 'My Resume',
        lastModified: new Date(),
        template: 'modern-professional',
        sections: {
          personalInfo: {
            fullName: '',
            email: '',
            phone: '',
            address: '',
          },
          summary: '',
          experience: [],
          education: [],
          skills: [],
          certifications: [],
          projects: [],
          customSections: [],
        },
        metadata: {
          version: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
          isPublic: false,
          tags: [],
          completionScore: 0,
        },
      };
      
      dispatch({ type: 'LOAD_RESUME', payload: mockResume });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const updateSection = useCallback((sectionType: SectionType, data: any) => {
    dispatch({ 
      type: 'UPDATE_SECTION', 
      payload: { sectionType, data } 
    });
    
    // Validate the updated section
    const validationResult = validateSection(sectionType, data);
    if (!validationResult.isValid) {
      dispatch({
        type: 'VALIDATE_SECTION',
        payload: { sectionType, errors: [validationResult.message] }
      });
    }
  }, []);

  const setActiveSection = useCallback((sectionType: SectionType | null) => {
    dispatch({ type: 'SET_ACTIVE_SECTION', payload: sectionType });
  }, []);

  const addItem = useCallback((sectionType: SectionType, item: any) => {
    dispatch({ 
      type: 'ADD_ITEM', 
      payload: { sectionType, item } 
    });
  }, []);

  const removeItem = useCallback((sectionType: SectionType, itemId: string) => {
    dispatch({ 
      type: 'REMOVE_ITEM', 
      payload: { sectionType, itemId } 
    });
  }, []);

  const reorderItems = useCallback((sectionType: SectionType, fromIndex: number, toIndex: number) => {
    dispatch({ 
      type: 'REORDER_ITEMS', 
      payload: { sectionType, fromIndex, toIndex } 
    });
  }, []);

  const validateCurrentSection = useCallback((): ValidationResult => {
    if (!state.activeSection || !state.currentResume) {
      return { isValid: true };
    }

    const sectionData = state.currentResume.sections[state.activeSection];
    return validateSection(state.activeSection, sectionData);
  }, [state.activeSection, state.currentResume]);

  const validateAllSections = useCallback((): Record<string, ValidationResult> => {
    if (!state.currentResume) {
      return {};
    }

    const results: Record<string, ValidationResult> = {};
    Object.entries(state.currentResume.sections).forEach(([sectionType, data]) => {
      results[sectionType] = validateSection(sectionType as SectionType, data);
    });

    return results;
  }, [state.currentResume]);

  const saveResume = useCallback(async () => {
    if (!state.currentResume) return;

    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      await autoSaveManager.saveContent(state.currentResume);
      dispatch({ type: 'SAVE_RESUME' });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [state.currentResume]);

  const enableAutoSave = useCallback(() => {
    autoSaveManager.enable();
  }, []);

  const disableAutoSave = useCallback(() => {
    autoSaveManager.disable();
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  const resetResume = useCallback(() => {
    dispatch({ type: 'LOAD_RESUME', payload: null });
  }, []);

  const contextValue: ResumeContextType = {
    state,
    loadResume,
    updateSection,
    setActiveSection,
    addItem,
    removeItem,
    reorderItems,
    validateCurrentSection,
    validateAllSections,
    saveResume,
    enableAutoSave,
    disableAutoSave,
    clearError,
    resetResume,
  };

  return (
    <ResumeContext.Provider value={contextValue}>
      {children}
    </ResumeContext.Provider>
  );
};

export const useResume = (): ResumeContextType => {
  const context = useContext(ResumeContext);
  if (context === undefined) {
    throw new Error('useResume must be used within a ResumeProvider');
  }
  return context;
};