import { ResumeAction, ResumeState } from '../types';

export const initialResumeState: ResumeState = {
  currentResume: null,
  activeSection: null,
  isEditing: false,
  hasUnsavedChanges: false,
  validationErrors: {},
  isLoading: false,
  error: null,
};

export const resumeReducer = (state: ResumeState, action: ResumeAction): ResumeState => {
  switch (action.type) {
    case 'LOAD_RESUME':
      return {
        ...state,
        currentResume: action.payload,
        hasUnsavedChanges: false,
        validationErrors: {},
        error: null,
        isEditing: !!action.payload,
      };

    case 'UPDATE_SECTION':
      if (!state.currentResume) return state;
      
      const { sectionType, data } = action.payload;
      return {
        ...state,
        currentResume: {
          ...state.currentResume,
          sections: {
            ...state.currentResume.sections,
            [sectionType]: data,
          },
          lastModified: new Date(),
        },
        hasUnsavedChanges: true,
      };

    case 'SET_ACTIVE_SECTION':
      return {
        ...state,
        activeSection: action.payload,
      };

    case 'ADD_ITEM':
      if (!state.currentResume) return state;
      
      const { sectionType: addSectionType, item } = action.payload;
      const currentSection = state.currentResume.sections[addSectionType];
      
      // Handle array sections (experience, education, skills, etc.)
      if (Array.isArray(currentSection)) {
        return {
          ...state,
          currentResume: {
            ...state.currentResume,
            sections: {
              ...state.currentResume.sections,
              [addSectionType]: [...currentSection, { ...item, id: generateId() }],
            },
            lastModified: new Date(),
          },
          hasUnsavedChanges: true,
        };
      }
      
      return state;

    case 'REMOVE_ITEM':
      if (!state.currentResume) return state;
      
      const { sectionType: removeSectionType, itemId } = action.payload;
      const sectionToUpdate = state.currentResume.sections[removeSectionType];
      
      if (Array.isArray(sectionToUpdate)) {
        return {
          ...state,
          currentResume: {
            ...state.currentResume,
            sections: {
              ...state.currentResume.sections,
              [removeSectionType]: sectionToUpdate.filter(item => item.id !== itemId),
            },
            lastModified: new Date(),
          },
          hasUnsavedChanges: true,
        };
      }
      
      return state;

    case 'REORDER_ITEMS':
      if (!state.currentResume) return state;
      
      const { sectionType: reorderSectionType, fromIndex, toIndex } = action.payload;
      const sectionItems = state.currentResume.sections[reorderSectionType];
      
      if (Array.isArray(sectionItems)) {
        const reorderedItems = [...sectionItems];
        const [movedItem] = reorderedItems.splice(fromIndex, 1);
        reorderedItems.splice(toIndex, 0, movedItem);
        
        return {
          ...state,
          currentResume: {
            ...state.currentResume,
            sections: {
              ...state.currentResume.sections,
              [reorderSectionType]: reorderedItems,
            },
            lastModified: new Date(),
          },
          hasUnsavedChanges: true,
        };
      }
      
      return state;

    case 'VALIDATE_SECTION':
      const { sectionType: validateSectionType, errors } = action.payload;
      return {
        ...state,
        validationErrors: {
          ...state.validationErrors,
          [validateSectionType]: errors,
        },
      };

    case 'SAVE_RESUME':
      return {
        ...state,
        hasUnsavedChanges: false,
        error: null,
      };

    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        isLoading: false,
      };

    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };

    default:
      return state;
  }
};

// Utility function to generate unique IDs
const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};