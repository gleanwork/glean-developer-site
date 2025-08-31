import { describe, it, expect } from 'vitest';
import { evaluateFlag, flagsSnapshotToBooleans } from './featureFlags';
import type { FeatureFlagsMap } from './featureFlagTypes';

describe('evaluateFlag', () => {
  describe('date-based flags', () => {
    it('should disable flag before enableAfter date', () => {
      const flags: FeatureFlagsMap = {
        'future-feature': {
          enabled: true,
          enableAfter: '2025-01-01T00:00:00Z',
        },
      };
      
      const result = evaluateFlag(flags, 'future-feature', {
        currentTime: '2024-12-15T00:00:00Z',
      });
      
      expect(result.enabled).toBe(false);
      expect(result.reason).toBe('not-yet-enabled');
    });
    
    it('should enable flag after enableAfter date', () => {
      const flags: FeatureFlagsMap = {
        'future-feature': {
          enabled: true,
          enableAfter: '2024-01-01T00:00:00Z',
        },
      };
      
      const result = evaluateFlag(flags, 'future-feature', {
        currentTime: '2024-12-15T00:00:00Z',
      });
      
      expect(result.enabled).toBe(true);
      expect(result.reason).toBe('explicit');
    });
    
    it('should disable flag after disableAfter date', () => {
      const flags: FeatureFlagsMap = {
        'expired-feature': {
          enabled: true,
          disableAfter: '2024-01-01T00:00:00Z',
        },
      };
      
      const result = evaluateFlag(flags, 'expired-feature', {
        currentTime: '2024-12-15T00:00:00Z',
      });
      
      expect(result.enabled).toBe(false);
      expect(result.reason).toBe('expired');
    });
    
    it('should enable flag before disableAfter date', () => {
      const flags: FeatureFlagsMap = {
        'active-feature': {
          enabled: true,
          disableAfter: '2025-01-01T00:00:00Z',
        },
      };
      
      const result = evaluateFlag(flags, 'active-feature', {
        currentTime: '2024-12-15T00:00:00Z',
      });
      
      expect(result.enabled).toBe(true);
      expect(result.reason).toBe('explicit');
    });
    
    it('should handle both enableAfter and disableAfter', () => {
      const flags: FeatureFlagsMap = {
        'time-window-feature': {
          enabled: true,
          enableAfter: '2024-06-01T00:00:00Z',
          disableAfter: '2024-12-31T23:59:59Z',
        },
      };
      
      const beforeWindow = evaluateFlag(flags, 'time-window-feature', {
        currentTime: '2024-05-01T00:00:00Z',
      });
      expect(beforeWindow.enabled).toBe(false);
      expect(beforeWindow.reason).toBe('not-yet-enabled');
      
      const duringWindow = evaluateFlag(flags, 'time-window-feature', {
        currentTime: '2024-09-01T00:00:00Z',
      });
      expect(duringWindow.enabled).toBe(true);
      expect(duringWindow.reason).toBe('explicit');
      
      const afterWindow = evaluateFlag(flags, 'time-window-feature', {
        currentTime: '2025-01-01T00:00:00Z',
      });
      expect(afterWindow.enabled).toBe(false);
      expect(afterWindow.reason).toBe('expired');
    });
    
    it('should handle invalid date strings gracefully', () => {
      const flags: FeatureFlagsMap = {
        'invalid-dates': {
          enabled: true,
          enableAfter: 'not-a-date',
          disableAfter: 'also-not-a-date',
        },
      };
      
      const result = evaluateFlag(flags, 'invalid-dates', {
        currentTime: '2024-12-15T00:00:00Z',
      });
      
      expect(result.enabled).toBe(true);
      expect(result.reason).toBe('explicit');
    });
    
    it('should check dates before other conditions', () => {
      const flags: FeatureFlagsMap = {
        'complex-flag': {
          enabled: true,
          enableAfter: '2025-01-01T00:00:00Z',
          allowedUsers: ['test@example.com'],
          rolloutPercentage: 100,
        },
      };
      
      const result = evaluateFlag(flags, 'complex-flag', {
        currentTime: '2024-12-15T00:00:00Z',
        userEmail: 'test@example.com',
      });
      
      expect(result.enabled).toBe(false);
      expect(result.reason).toBe('not-yet-enabled');
    });
  });
  
  describe('existing functionality', () => {
    it('should return missing for non-existent flag', () => {
      const flags: FeatureFlagsMap = {};
      const result = evaluateFlag(flags, 'non-existent');
      
      expect(result.enabled).toBe(false);
      expect(result.reason).toBe('missing');
    });
    
    it('should respect enabled:false', () => {
      const flags: FeatureFlagsMap = {
        'disabled-flag': { enabled: false },
      };
      const result = evaluateFlag(flags, 'disabled-flag');
      
      expect(result.enabled).toBe(false);
      expect(result.reason).toBe('disabled');
    });
    
    it('should handle allowed users', () => {
      const flags: FeatureFlagsMap = {
        'user-flag': {
          enabled: true,
          allowedUsers: ['test@example.com'],
        },
      };
      
      const allowedResult = evaluateFlag(flags, 'user-flag', {
        userEmail: 'test@example.com',
      });
      expect(allowedResult.enabled).toBe(true);
      expect(allowedResult.reason).toBe('allowed-user');
      
      const notAllowedResult = evaluateFlag(flags, 'user-flag', {
        userEmail: 'other@example.com',
      });
      expect(notAllowedResult.enabled).toBe(true);
      expect(notAllowedResult.reason).toBe('explicit');
    });
    
    it('should handle rollout percentages', () => {
      const flags: FeatureFlagsMap = {
        'rollout-flag': {
          enabled: true,
          rolloutPercentage: 50,
        },
      };
      
      const result1 = evaluateFlag(flags, 'rollout-flag', {
        userId: 'user-123',
      });
      
      const result2 = evaluateFlag(flags, 'rollout-flag', {
        userId: 'user-456',
      });
      
      expect(['rollout'].includes(result1.reason)).toBe(true);
      expect(['rollout'].includes(result2.reason)).toBe(true);
    });
  });
});

describe('flagsSnapshotToBooleans', () => {
  it('should convert flags to boolean map with date context', () => {
    const flags: FeatureFlagsMap = {
      'past-flag': {
        enabled: true,
        enableAfter: '2020-01-01T00:00:00Z',
      },
      'future-flag': {
        enabled: true,
        enableAfter: '2030-01-01T00:00:00Z',
      },
      'expired-flag': {
        enabled: true,
        disableAfter: '2020-01-01T00:00:00Z',
      },
    };
    
    const result = flagsSnapshotToBooleans(flags, {
      currentTime: '2024-12-15T00:00:00Z',
    });
    
    expect(result['past-flag']).toBe(true);
    expect(result['future-flag']).toBe(false);
    expect(result['expired-flag']).toBe(false);
  });
});
