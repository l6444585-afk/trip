/**
 * 行程表单管理Hook
 * @module modules/itinerary/hooks/useItineraryForm
 */

import { useState, useCallback, useMemo } from 'react';
import type {
  CreateItineraryRequest,
  BudgetBreakdown,
  InterestType,
  CompanionType,
  TravelStyle,
  ApiError
} from '../types';
import { itineraryService } from '../services/itineraryService';
import { calculateBudgetBreakdown } from '../utils/itineraryUtils';

interface FormState {
  title: string;
  days: number;
  totalBudget: number;
  departure: string;
  destinations: string[];
  companionType: CompanionType;
  interests: InterestType[];
  travelStyle: TravelStyle;
  budgetBreakdown: BudgetBreakdown;
  dateRange: [string, string] | null;
}

interface UseItineraryFormReturn {
  formState: FormState;
  loading: boolean;
  error: ApiError | null;
  currentStep: number;
  setCurrentStep: (step: number) => void;
  updateFormField: <K extends keyof FormState>(field: K, value: FormState[K]) => void;
  toggleDestination: (destination: string) => void;
  toggleInterest: (interest: InterestType) => void;
  updateBudgetBreakdown: (category: keyof BudgetBreakdown, value: number) => void;
  handleTotalBudgetChange: (value: number) => void;
  submitForm: () => Promise<{ itinerary_id: number }>;
  validateStep: (step: number) => boolean;
  isStepValid: boolean[];
  resetForm: () => void;
}

const initialFormState: FormState = {
  title: '',
  days: 3,
  totalBudget: 3000,
  departure: '',
  destinations: [],
  companionType: '情侣',
  interests: [],
  travelStyle: '精品深度',
  budgetBreakdown: calculateBudgetBreakdown(3000),
  dateRange: null
};

/**
 * 行程表单管理Hook
 * 提供表单状态管理、验证和提交功能
 */
export const useItineraryForm = (): UseItineraryFormReturn => {
  const [formState, setFormState] = useState<FormState>(initialFormState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [currentStep, setCurrentStep] = useState(0);

  // 更新表单字段
  const updateFormField = useCallback(<K extends keyof FormState>(
    field: K,
    value: FormState[K]
  ) => {
    setFormState(prev => ({ ...prev, [field]: value }));
  }, []);

  // 切换目的地选择
  const toggleDestination = useCallback((destination: string) => {
    setFormState(prev => {
      const destinations = prev.destinations.includes(destination)
        ? prev.destinations.filter(d => d !== destination)
        : prev.destinations.length < 3
          ? [...prev.destinations, destination]
          : prev.destinations;
      return { ...prev, destinations };
    });
  }, []);

  // 切换兴趣选择
  const toggleInterest = useCallback((interest: InterestType) => {
    setFormState(prev => {
      const interests = prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest];
      return { ...prev, interests };
    });
  }, []);

  // 更新预算分配
  const updateBudgetBreakdown = useCallback((category: keyof BudgetBreakdown, value: number) => {
    setFormState(prev => ({
      ...prev,
      budgetBreakdown: { ...prev.budgetBreakdown, [category]: value }
    }));
  }, []);

  // 处理总预算变化
  const handleTotalBudgetChange = useCallback((value: number) => {
    setFormState(prev => ({
      ...prev,
      totalBudget: value,
      budgetBreakdown: calculateBudgetBreakdown(value)
    }));
  }, []);

  // 验证步骤
  const validateStep = useCallback((step: number): boolean => {
    switch (step) {
      case 0: // 基本信息
        return !!(
          formState.title?.trim() &&
          formState.departure?.trim() &&
          formState.dateRange
        );
      case 1: // 目的地选择
        return formState.destinations.length > 0;
      case 2: // 兴趣偏好
        return formState.interests.length > 0 && !!formState.companionType;
      case 3: // 预算规划
        const total = Object.values(formState.budgetBreakdown).reduce((a, b) => a + b, 0);
        return total === formState.totalBudget;
      default:
        return true;
    }
  }, [formState]);

  // 各步骤验证状态
  const isStepValid = useMemo(() => {
    return [0, 1, 2, 3].map(step => validateStep(step));
  }, [validateStep]);

  // 提交表单
  const submitForm = useCallback(async (): Promise<{ itinerary_id: number }> => {
    setLoading(true);
    setError(null);

    try {
      const requestData: CreateItineraryRequest = {
        title: formState.title,
        days: formState.days,
        budget: formState.totalBudget,
        departure: formState.departure,
        destinations: formState.destinations,
        companion_type: formState.companionType,
        interests: formState.interests,
        travel_style: formState.travelStyle,
        budget_breakdown: formState.budgetBreakdown,
        date_range: formState.dateRange || undefined
      };

      const response = await itineraryService.createItinerary(requestData);
      return { itinerary_id: response.itinerary_id };
    } catch (err) {
      setError(err as ApiError);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [formState]);

  // 重置表单
  const resetForm = useCallback(() => {
    setFormState(initialFormState);
    setCurrentStep(0);
    setError(null);
  }, []);

  return {
    formState,
    loading,
    error,
    currentStep,
    setCurrentStep,
    updateFormField,
    toggleDestination,
    toggleInterest,
    updateBudgetBreakdown,
    handleTotalBudgetChange,
    submitForm,
    validateStep,
    isStepValid,
    resetForm
  };
};

export default useItineraryForm;
