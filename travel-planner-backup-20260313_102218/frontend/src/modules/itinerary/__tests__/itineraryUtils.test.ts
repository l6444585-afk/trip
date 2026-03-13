/**
 * 行程工具函数单元测试
 * @module modules/itinerary/__tests__/itineraryUtils.test
 */

import {
  calculateBudgetBreakdown,
  groupSchedulesByDay,
  calculateProgress,
  formatCurrency,
  formatDate,
  getStatusColor,
  getStatusText,
  getCompanionColor,
  getCompanionIcon,
  getInterestColor,
  getDestinationImage,
  isValidEmail,
  isValidPhone,
  deepClone,
  truncateText
} from '../utils/itineraryUtils';
import type { Itinerary, Schedule } from '../types';

describe('itineraryUtils', () => {
  describe('calculateBudgetBreakdown', () => {
    it('should calculate budget breakdown correctly', () => {
      const result = calculateBudgetBreakdown(10000);
      expect(result.transport).toBe(2500);
      expect(result.accommodation).toBe(3500);
      expect(result.food).toBe(2000);
      expect(result.tickets).toBe(1000);
      expect(result.shopping).toBe(500);
      expect(result.other).toBe(500);
    });

    it('should return zero for zero budget', () => {
      const result = calculateBudgetBreakdown(0);
      expect(result.transport).toBe(0);
      expect(result.accommodation).toBe(0);
      expect(result.food).toBe(0);
      expect(result.tickets).toBe(0);
      expect(result.shopping).toBe(0);
      expect(result.other).toBe(0);
    });

    it('should handle negative budget', () => {
      const result = calculateBudgetBreakdown(-1000);
      expect(result.transport).toBe(0);
      expect(result.accommodation).toBe(0);
    });
  });

  describe('groupSchedulesByDay', () => {
    it('should group schedules by day correctly', () => {
      const schedules: Schedule[] = [
        { id: 1, itinerary_id: 1, day: 1, period: 'morning', activity: 'Activity 1', location: 'Location 1' },
        { id: 2, itinerary_id: 1, day: 1, period: 'afternoon', activity: 'Activity 2', location: 'Location 2' },
        { id: 3, itinerary_id: 1, day: 2, period: 'morning', activity: 'Activity 3', location: 'Location 3' }
      ];

      const result = groupSchedulesByDay(schedules);
      expect(result[1]).toHaveLength(2);
      expect(result[2]).toHaveLength(1);
      expect(result[1][0].activity).toBe('Activity 1');
    });

    it('should return empty object for empty array', () => {
      const result = groupSchedulesByDay([]);
      expect(result).toEqual({});
    });

    it('should return empty object for null input', () => {
      const result = groupSchedulesByDay(null as any);
      expect(result).toEqual({});
    });
  });

  describe('calculateProgress', () => {
    it('should return 0 when no dates', () => {
      const itinerary: Itinerary = {
        id: 1,
        title: 'Test',
        days: 3,
        budget: 3000,
        departure: 'Shanghai',
        companion_type: '情侣',
        interests: '自然风光',
        status: 'ongoing',
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
        schedules: []
      };
      expect(calculateProgress(itinerary)).toBe(0);
    });

    it('should return 0 when trip has not started', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      const endDate = new Date(futureDate);
      endDate.setDate(endDate.getDate() + 3);

      const itinerary: Itinerary = {
        id: 1,
        title: 'Test',
        days: 3,
        budget: 3000,
        departure: 'Shanghai',
        companion_type: '情侣',
        interests: '自然风光',
        status: 'ongoing',
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
        start_date: futureDate.toISOString(),
        end_date: endDate.toISOString(),
        schedules: []
      };
      expect(calculateProgress(itinerary)).toBe(0);
    });

    it('should return 100 when trip has ended', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 7);
      const endDate = new Date(pastDate);
      endDate.setDate(endDate.getDate() + 3);

      const itinerary: Itinerary = {
        id: 1,
        title: 'Test',
        days: 3,
        budget: 3000,
        departure: 'Shanghai',
        companion_type: '情侣',
        interests: '自然风光',
        status: 'completed',
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
        start_date: pastDate.toISOString(),
        end_date: endDate.toISOString(),
        schedules: []
      };
      expect(calculateProgress(itinerary)).toBe(100);
    });
  });

  describe('formatCurrency', () => {
    it('should format currency correctly', () => {
      expect(formatCurrency(1000)).toBe('¥1,000');
      expect(formatCurrency(1000000)).toBe('¥1,000,000');
      expect(formatCurrency(0)).toBe('¥0');
    });

    it('should handle null and undefined', () => {
      expect(formatCurrency(null as any)).toBe('¥0');
      expect(formatCurrency(undefined as any)).toBe('¥0');
    });

    it('should support custom currency symbol', () => {
      expect(formatCurrency(1000, '$')).toBe('$1,000');
    });
  });

  describe('formatDate', () => {
    it('should format date correctly', () => {
      expect(formatDate('2024-01-15')).toBe('2024-01-15');
      expect(formatDate('2024-12-25', 'YYYY/MM/DD')).toBe('2024/12/25');
    });

    it('should return dash for empty date', () => {
      expect(formatDate('')).toBe('-');
      expect(formatDate(null as any)).toBe('-');
    });
  });

  describe('getStatusColor', () => {
    it('should return correct color for each status', () => {
      expect(getStatusColor('planning')).toBe('default');
      expect(getStatusColor('confirmed')).toBe('processing');
      expect(getStatusColor('ongoing')).toBe('active');
      expect(getStatusColor('completed')).toBe('success');
      expect(getStatusColor('cancelled')).toBe('error');
    });

    it('should return default for unknown status', () => {
      expect(getStatusColor('unknown' as any)).toBe('default');
    });
  });

  describe('getStatusText', () => {
    it('should return correct text for each status', () => {
      expect(getStatusText('planning')).toBe('规划中');
      expect(getStatusText('confirmed')).toBe('已确认');
      expect(getStatusText('ongoing')).toBe('进行中');
      expect(getStatusText('completed')).toBe('已完成');
      expect(getStatusText('cancelled')).toBe('已取消');
    });

    it('should return unknown for unknown status', () => {
      expect(getStatusText('unknown' as any)).toBe('未知');
    });
  });

  describe('getCompanionColor', () => {
    it('should return correct color for each companion type', () => {
      expect(getCompanionColor('情侣')).toBe('pink');
      expect(getCompanionColor('亲子')).toBe('orange');
      expect(getCompanionColor('独行')).toBe('blue');
      expect(getCompanionColor('朋友')).toBe('green');
      expect(getCompanionColor('家庭')).toBe('purple');
    });
  });

  describe('getCompanionIcon', () => {
    it('should return correct icon for each companion type', () => {
      expect(getCompanionIcon('情侣')).toBe('💑');
      expect(getCompanionIcon('亲子')).toBe('👨‍👩‍👧‍👦');
      expect(getCompanionIcon('独行')).toBe('🚶');
      expect(getCompanionIcon('朋友')).toBe('👥');
      expect(getCompanionIcon('家庭')).toBe('🏠');
    });
  });

  describe('getInterestColor', () => {
    it('should return correct color for each interest', () => {
      expect(getInterestColor('自然风光')).toBe('#52c41a');
      expect(getInterestColor('历史文化')).toBe('#722ed1');
      expect(getInterestColor('美食购物')).toBe('#fa8c16');
    });
  });

  describe('getDestinationImage', () => {
    it('should return correct image for known destinations', () => {
      const image = getDestinationImage(['杭州']);
      expect(image).toContain('unsplash');
    });

    it('should return default image for empty destinations', () => {
      const image = getDestinationImage([]);
      expect(image).toContain('unsplash');
    });

    it('should return default image for null destinations', () => {
      const image = getDestinationImage(undefined);
      expect(image).toContain('unsplash');
    });
  });

  describe('isValidEmail', () => {
    it('should validate correct emails', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name@domain.co.uk')).toBe(true);
    });

    it('should reject invalid emails', () => {
      expect(isValidEmail('invalid')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
      expect(isValidEmail('test@')).toBe(false);
      expect(isValidEmail('')).toBe(false);
    });
  });

  describe('isValidPhone', () => {
    it('should validate correct phone numbers', () => {
      expect(isValidPhone('13800138000')).toBe(true);
      expect(isValidPhone('15912345678')).toBe(true);
    });

    it('should reject invalid phone numbers', () => {
      expect(isValidPhone('12345678901')).toBe(false);
      expect(isValidPhone('1380013800')).toBe(false);
      expect(isValidPhone('138001380000')).toBe(false);
      expect(isValidPhone('')).toBe(false);
    });
  });

  describe('deepClone', () => {
    it('should deep clone objects', () => {
      const original = { a: 1, b: { c: 2 } };
      const cloned = deepClone(original);
      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);
      expect(cloned.b).not.toBe(original.b);
    });

    it('should deep clone arrays', () => {
      const original = [1, [2, 3], { a: 4 }];
      const cloned = deepClone(original);
      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);
      expect(cloned[1]).not.toBe(original[1]);
    });

    it('should handle dates', () => {
      const date = new Date('2024-01-01');
      const cloned = deepClone(date);
      expect(cloned.getTime()).toBe(date.getTime());
      expect(cloned).not.toBe(date);
    });
  });

  describe('truncateText', () => {
    it('should truncate long text', () => {
      const longText = 'a'.repeat(200);
      const result = truncateText(longText, 100);
      expect(result).toHaveLength(103); // 100 + '...'
      expect(result.endsWith('...')).toBe(true);
    });

    it('should not truncate short text', () => {
      const shortText = 'Short text';
      expect(truncateText(shortText, 100)).toBe(shortText);
    });

    it('should handle empty text', () => {
      expect(truncateText('', 100)).toBe('');
    });
  });
});
