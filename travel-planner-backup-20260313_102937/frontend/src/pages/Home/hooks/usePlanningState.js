import { useState, useCallback } from 'react';
import dayjs from 'dayjs';

const usePlanningState = () => {
  const [tripDays, setTripDays] = useState(3);
  const [dateRange, setDateRange] = useState(null);
  const [dailyTimeSlots, setDailyTimeSlots] = useState({
    morning: true,
    afternoon: true,
    evening: true
  });
  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedStyle, setSelectedStyle] = useState('休闲型');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedItinerary, setGeneratedItinerary] = useState(null);

  const handleTagChange = useCallback((tag) => {
    setSelectedTags(prev => 
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  }, []);

  const handleStyleChange = useCallback((style) => {
    setSelectedStyle(style);
  }, []);

  const handleTimeSlotChange = useCallback((slot) => {
    setDailyTimeSlots(prev => ({
      ...prev,
      [slot]: !prev[slot]
    }));
  }, []);

  const resetPlanning = useCallback(() => {
    setTripDays(3);
    setDateRange(null);
    setDailyTimeSlots({ morning: true, afternoon: true, evening: true });
    setSelectedTags([]);
    setSelectedStyle('休闲型');
    setIsGenerating(false);
    setGeneratedItinerary(null);
  }, []);

  return {
    tripDays,
    setTripDays,
    dateRange,
    setDateRange,
    dailyTimeSlots,
    setDailyTimeSlots,
    selectedTags,
    setSelectedTags,
    selectedStyle,
    setSelectedStyle,
    isGenerating,
    setIsGenerating,
    generatedItinerary,
    setGeneratedItinerary,
    handleTagChange,
    handleStyleChange,
    handleTimeSlotChange,
    resetPlanning
  };
};

export default usePlanningState;
