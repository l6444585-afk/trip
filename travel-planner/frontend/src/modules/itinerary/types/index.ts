/**
 * 行程模块类型定义
 * @module modules/itinerary/types
 */

/** 行程状态 */
export type ItineraryStatus = 'planning' | 'confirmed' | 'ongoing' | 'completed' | 'cancelled';

/** 同行人员类型 */
export type CompanionType = '情侣' | '亲子' | '独行' | '朋友' | '家庭';

/** 旅游风格 */
export type TravelStyle = '精品深度' | '高效紧凑' | '休闲放松' | '丰富多样';

/** 兴趣标签 */
export type InterestType = '自然风光' | '历史文化' | '美食购物' | '城市漫步' | '摄影打卡' | '休闲度假' | '亲子游玩' | '户外探险';

/** 时间段 */
export type Period = 'morning' | 'afternoon' | 'evening';

/** 预算分类 */
export type BudgetCategory = 'transport' | 'accommodation' | 'food' | 'tickets' | 'shopping' | 'other';

/** 行程基础信息 */
export interface ItineraryBase {
  id: number;
  title: string;
  days: number;
  budget: number;
  departure: string;
  companion_type: CompanionType;
  interests: string;
  status: ItineraryStatus;
  created_at: string;
  updated_at: string;
}

/** 日程安排 */
export interface Schedule {
  id: number;
  itinerary_id: number;
  day: number;
  period: Period;
  activity: string;
  location: string;
  latitude?: number;
  longitude?: number;
  notes?: string;
}

/** 完整行程信息 */
export interface Itinerary extends ItineraryBase {
  schedules: Schedule[];
  destinations?: string[];
  start_date?: string;
  end_date?: string;
}

/** 预算明细 */
export interface BudgetBreakdown {
  transport: number;
  accommodation: number;
  food: number;
  tickets: number;
  shopping: number;
  other: number;
}

/** 创建行程请求 */
export interface CreateItineraryRequest {
  title: string;
  days: number;
  budget: number;
  departure: string;
  destinations: string[];
  companion_type: CompanionType;
  interests: InterestType[];
  travel_style: TravelStyle;
  budget_breakdown: BudgetBreakdown;
  date_range?: [string, string];
}

/** 更新行程请求 */
export interface UpdateItineraryRequest {
  title?: string;
  days?: number;
  budget?: number;
  departure?: string;
  companion_type?: CompanionType;
  interests?: InterestType[];
  status?: ItineraryStatus;
}

/** 生成行程响应 */
export interface GenerateItineraryResponse {
  itinerary_id: number;
  generated_itinerary: {
    title: string;
    daily_plans: DailyPlan[];
  };
  message: string;
}

/** 每日计划 */
export interface DailyPlan {
  day: number;
  morning?: PeriodActivity;
  afternoon?: PeriodActivity;
  evening?: PeriodActivity;
}

/** 时段活动 */
export interface PeriodActivity {
  activity: string;
  location: string;
  latitude?: number;
  longitude?: number;
  tips?: string;
}

/** 兴趣选项 */
export interface InterestOption {
  label: string;
  value: InterestType;
  icon: string;
  color: string;
  description: string;
}

/** 目的地选项 */
export interface DestinationOption {
  value: string;
  label: string;
  image: string;
  tags: string[];
  rating: number;
  highlights?: string[];
}

/** 同行人员选项 */
export interface CompanionOption {
  label: string;
  value: CompanionType;
  description: string;
}

/** 旅游风格选项 */
export interface TravelStyleOption {
  label: string;
  value: TravelStyle;
  description: string;
  color: string;
}

/** 筛选条件 */
export interface ItineraryFilter {
  status?: ItineraryStatus | 'all';
  searchText?: string;
  sortBy?: 'created_at' | 'budget' | 'days' | 'start_date';
  sortOrder?: 'asc' | 'desc';
}

/** 分页参数 */
export interface PaginationParams {
  page: number;
  pageSize: number;
}

/** 分页结果 */
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/** 聊天消息 */
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

/** 聊天请求 */
export interface ChatRequest {
  question: string;
  itinerary_id?: number;
  chat_history: ChatMessage[];
}

/** 聊天响应 */
export interface ChatResponse {
  answer: string;
}

/** 分享配置 */
export interface ShareConfig {
  share_type: 'link' | 'pdf' | 'image';
  permission: 'public' | 'private' | 'password';
  custom_message?: string;
}

/** 分享结果 */
export interface ShareResult {
  share_id: string;
  share_link: string;
  share_type: string;
  permission: string;
  itinerary_title: string;
}

/** 表单步骤 */
export interface FormStep {
  title: string;
  icon: string;
  description?: string;
}

/** API错误 */
export interface ApiError {
  message: string;
  code?: string;
  details?: Record<string, string[]>;
}

/** 加载状态 */
export interface LoadingState {
  isLoading: boolean;
  error: ApiError | null;
}

/** 意图解析结果 */
export interface ParsedIntent {
  departure: string;
  destinations: string[];
  days: number;
  budget: number;
  budget_level: 'low' | 'medium' | 'high';
  pace: 'relaxed' | 'normal' | 'tight';
  companions: 'solo' | 'couple' | 'family_with_kids' | 'friends' | 'elderly';
  interests: string[];
  constraints: string[];
  special_needs: string[];
  age_group?: string;
  travel_mode?: string;
}

/** 意图解析响应 */
export interface IntentParseResponse {
  intent: ParsedIntent;
  detected_intent_type: 'create_itinerary' | 'modify_itinerary' | 'query_info' | 'get_recommendations';
  entities: {
    cities: string[];
    attractions: string[];
    dates: string[];
    numbers: number[];
  };
  message: string;
}

/** 混合AI行程生成请求 */
export interface GenerateHybridItineraryRequest {
  user_input: string;
  start_date?: string;
}

/** 混合AI行程生成响应 */
export interface GenerateHybridItineraryResponse {
  success: boolean;
  data: {
    intent: ParsedIntent;
    days: HybridDailyPlan[];
    summary: {
      total_attractions: number;
      cities: string[];
      total_cost: number;
    };
  };
  message: string;
}

/** 混合AI每日计划 */
export interface HybridDailyPlan {
  day: number;
  date: string;
  schedule: ScheduleEvent[];
  cost: {
    ticket: number;
    transport: number;
    meal: number;
    total: number;
  };
  warnings: Array<{
    type: string;
    attraction: string;
    message: string;
  }>;
}

/** 日程事件 */
export interface ScheduleEvent {
  type: 'attraction' | 'meal' | 'inter_city_travel' | 'wait';
  start_time: string;
  end_time: string;
  duration_minutes: number;
  name?: string;
  attraction_id?: number;
  city?: string;
  category?: string;
  description?: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  ticket_price?: number;
  booking_required?: boolean;
  tips?: string;
  warnings?: string;
  meal_type?: string;
  restaurant_name?: string;
  cuisine_type?: string;
  avg_cost?: number;
  from_city?: string;
  to_city?: string;
  cost?: number;
}

/** 行程修改请求 */
export interface ModifyItineraryRequest {
  itinerary_id: number;
  modification_request: string;
}

/** 行程修改响应 */
export interface ModifyItineraryResponse {
  success: boolean;
  original: Record<string, unknown>;
  modified: Record<string, unknown>;
  message: string;
}

/** 用户画像 */
export interface UserProfile {
  user_id: number;
  favorite_destinations: string[];
  disliked_destinations: string[];
  dietary_restrictions: string[];
  mobility_constraints: string[];
  preferred_pace: 'relaxed' | 'normal' | 'tight';
  budget_preference: 'low' | 'medium' | 'high';
  interests: string[];
  companion_history: string[];
  created_at: string | null;
  updated_at: string | null;
}

/** 用户画像更新请求 */
export interface UpdateUserProfileRequest {
  favorite_destinations?: string[];
  disliked_destinations?: string[];
  dietary_restrictions?: string[];
  mobility_constraints?: string[];
  preferred_pace?: 'relaxed' | 'normal' | 'tight';
  budget_preference?: 'low' | 'medium' | 'high';
  interests?: string[];
}

/** 个性化景点推荐 */
export interface PersonalizedAttraction {
  id: number;
  name: string;
  city: string;
  category: string;
  rating: number;
  description: string;
  ticket_price: number;
}

/** 个性化推荐响应 */
export interface PersonalizedAttractionsResponse {
  success: boolean;
  attractions: PersonalizedAttraction[];
}

/** 景点详情 */
export interface AttractionDetail {
  id: number;
  name: string;
  city: string;
  city_id: number | null;
  category: string;
  description: string | null;
  latitude: number;
  longitude: number;
  address: string | null;
  rating: number;
  popularity: number;
  avg_visit_duration: number;
  recommended_duration: number;
  open_time: string;
  close_time: string;
  closed_days: string | null;
  ticket_price: number;
  ticket_price_peak: number;
  booking_required: boolean;
  booking_advance_days: number;
  booking_url: string | null;
  tags: string | null;
  suitable_for: string | null;
  best_time_to_visit: string | null;
  peak_hours: string | null;
  image_url: string | null;
  phone: string | null;
  website: string | null;
  tips: string | null;
  warnings: string | null;
}

/** 城市详情 */
export interface CityDetail {
  id: number;
  name: string;
  province: string;
  latitude: number;
  longitude: number;
  description: string | null;
  best_season: string | null;
  avg_daily_cost: number | null;
  highlights: string | null;
}
