import AsyncStorage from '@react-native-async-storage/async-storage';
import { ResumeData, SaveQueueItem, SaveStatus } from '../types';

export class AutoSaveManager {
  private isEnabled: boolean = true;
  private saveQueue: SaveQueueItem[] = [];
  private isProcessingQueue: boolean = false;
  private saveTimeout: NodeJS.Timeout | null = null;
  private lastSaveTime: Date | null = null;

  constructor() {
    this.initializeOfflineSync();
  }

  // Enable auto-save functionality
  enable(): void {
    this.isEnabled = true;
  }

  // Disable auto-save functionality
  disable(): void {
    this.isEnabled = false;
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
      this.saveTimeout = null;
    }
  }

  // Save resume content with debouncing
  async saveContent(resumeData: ResumeData): Promise<void> {
    if (!this.isEnabled) return;

    // Clear existing timeout
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }

    // Set new timeout for debounced save
    this.saveTimeout = setTimeout(async () => {
      try {
        await this.performSave(resumeData);
        this.lastSaveTime = new Date();
      } catch (error) {
        console.error('Auto-save failed:', error);
        // Add to queue for retry
        this.addToSaveQueue(resumeData);
      }
    }, 3000); // 3-second debounce
  }

  // Get current save status
  getSaveStatus(): SaveStatus {
    return {
      isSaving: this.isProcessingQueue,
      lastSaved: this.lastSaveTime,
      hasUnsavedChanges: this.saveQueue.length > 0,
      isOffline: !this.isOnline(),
    };
  }

  // Enable offline mode
  enableOfflineMode(): void {
    console.log('Offline mode enabled - queuing saves locally');
  }

  // Sync queued changes when back online
  async syncWhenOnline(): Promise<void> {
    if (!this.isOnline() || this.saveQueue.length === 0) return;

    this.isProcessingQueue = true;
    
    try {
      // Process all queued saves
      for (const queueItem of this.saveQueue) {
        try {
          await this.performSave(queueItem.changes as ResumeData);
          // Remove from queue on successful save
          this.saveQueue = this.saveQueue.filter(item => item.id !== queueItem.id);
        } catch (error) {
          // Increment retry count
          queueItem.retryCount++;
          
          // Remove from queue if max retries reached
          if (queueItem.retryCount >= 3) {
            console.error(`Max retries reached for save ${queueItem.id}:`, error);
            this.saveQueue = this.saveQueue.filter(item => item.id !== queueItem.id);
          }
        }
      }
    } finally {
      this.isProcessingQueue = false;
    }
  }

  // Private methods
  private async performSave(resumeData: ResumeData): Promise<void> {
    try {
      // Save to local storage first
      await this.saveToLocalStorage(resumeData);
      
      // If online, also save to backend
      if (this.isOnline()) {
        await this.saveToBackend(resumeData);
      } else {
        // Add to queue for later sync
        this.addToSaveQueue(resumeData);
      }
    } catch (error) {
      throw new Error(`Save failed: ${error.message}`);
    }
  }

  private async saveToLocalStorage(resumeData: ResumeData): Promise<void> {
    try {
      const key = `resume_${resumeData.id}`;
      const serializedData = JSON.stringify({
        ...resumeData,
        lastModified: new Date().toISOString(),
      });
      
      await AsyncStorage.setItem(key, serializedData);
      
      // Also save to a list of all resumes
      const resumesList = await this.getResumesList();
      const existingIndex = resumesList.findIndex(r => r.id === resumeData.id);
      
      const resumeMetadata = {
        id: resumeData.id,
        title: resumeData.title,
        lastModified: new Date().toISOString(),
      };
      
      if (existingIndex >= 0) {
        resumesList[existingIndex] = resumeMetadata;
      } else {
        resumesList.push(resumeMetadata);
      }
      
      await AsyncStorage.setItem('resumes_list', JSON.stringify(resumesList));
    } catch (error) {
      throw new Error(`Local storage save failed: ${error.message}`);
    }
  }

  private async saveToBackend(resumeData: ResumeData): Promise<void> {
    // TODO: Implement actual API call
    // For now, simulate API call
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (Math.random() > 0.1) { // 90% success rate
          resolve();
        } else {
          reject(new Error('Network error'));
        }
      }, 1000);
    });
  }

  private addToSaveQueue(resumeData: ResumeData): void {
    const queueItem: SaveQueueItem = {
      id: `save_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      resumeId: resumeData.id,
      changes: resumeData,
      timestamp: new Date(),
      retryCount: 0,
    };

    this.saveQueue.push(queueItem);
  }

  private async getResumesList(): Promise<any[]> {
    try {
      const listData = await AsyncStorage.getItem('resumes_list');
      return listData ? JSON.parse(listData) : [];
    } catch (error) {
      console.error('Failed to get resumes list:', error);
      return [];
    }
  }

  private isOnline(): boolean {
    // TODO: Implement actual network connectivity check
    // For now, assume online
    return true;
  }

  private async initializeOfflineSync(): void {
    // Set up network connectivity listener
    // TODO: Implement with NetInfo or similar
    
    // For now, simulate periodic sync attempts
    setInterval(() => {
      if (this.isOnline() && this.saveQueue.length > 0) {
        this.syncWhenOnline();
      }
    }, 30000); // Check every 30 seconds
  }

  // Public utility methods
  async loadResumeFromStorage(resumeId: string): Promise<ResumeData | null> {
    try {
      const key = `resume_${resumeId}`;
      const data = await AsyncStorage.getItem(key);
      
      if (data) {
        const resumeData = JSON.parse(data);
        // Convert date strings back to Date objects
        resumeData.lastModified = new Date(resumeData.lastModified);
        resumeData.metadata.createdAt = new Date(resumeData.metadata.createdAt);
        resumeData.metadata.updatedAt = new Date(resumeData.metadata.updatedAt);
        
        return resumeData;
      }
      
      return null;
    } catch (error) {
      console.error('Failed to load resume from storage:', error);
      return null;
    }
  }

  async getAllResumes(): Promise<any[]> {
    return this.getResumesList();
  }

  async deleteResume(resumeId: string): Promise<void> {
    try {
      // Remove from storage
      await AsyncStorage.removeItem(`resume_${resumeId}`);
      
      // Remove from list
      const resumesList = await this.getResumesList();
      const filteredList = resumesList.filter(r => r.id !== resumeId);
      await AsyncStorage.setItem('resumes_list', JSON.stringify(filteredList));
      
      // Remove from save queue
      this.saveQueue = this.saveQueue.filter(item => item.resumeId !== resumeId);
    } catch (error) {
      throw new Error(`Failed to delete resume: ${error.message}`);
    }
  }
}