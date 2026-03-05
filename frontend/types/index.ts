/** User roles in the system */
export type Role = "admin" | "sales" | "planner" | "finance" | "operation";

/** User entity */
export interface User {
  id: number;
  email: string;
  phone: string;
  name: string;
  avatar: string | null;
  role: Role;
  team_id: number | null;
  created_at?: string;
  updated_at?: string;
}

/** Team entity */
export interface Team {
  id: number;
  name: string;
  description: string | null;
  created_at?: string;
  updated_at?: string;
}

/** Standard API response wrapper */
export interface ApiResponse<T = unknown> {
  code: number;
  message: string;
  data: T;
}

/** Paginated API response */
export interface PaginatedResponse<T = unknown> {
  code: number;
  message: string;
  data: {
    items: T[];
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
  };
}

/** Login request payload */
export interface LoginRequest {
  email?: string;
  phone?: string;
  password: string;
}

/** Login response payload */
export interface LoginResponse {
  user: User;
  access_token: string;
  token_type: string;
}

/** Common error response */
export interface ApiError {
  code: number;
  message: string;
  detail?: string;
}

/** POI types */
export type PoiType = "hotel" | "restaurant" | "attraction" | "transport";

/** POI entity */
export interface Poi {
  id: number;
  name: string;
  type: PoiType;
  location: string;
  description: string | null;
  rating: number | null;
  price_range: string | null;
  contact: string | null;
  created_at?: string;
  updated_at?: string;
}

/** Order / Itinerary status */
export type OrderStatus = "draft" | "confirmed" | "in_progress" | "completed" | "cancelled";

/** Itinerary entity */
export interface Itinerary {
  id: number;
  order_id: number | null;
  title: string;
  start_date: string;
  end_date: string;
  status: OrderStatus;
  adults: number | null;
  children: number | null;
  departure_city: string | null;
  return_city: string | null;
  destination: string | null;
  highlights: string | null;
  notes: string | null;
  cover_images: string[] | null;
  pace: string | null;
  is_shared: boolean;
  is_featured: boolean;
  is_closed: boolean;
  created_by: number | null;
  days: ItineraryDay[];
  created_at?: string;
  updated_at?: string;
}

/** Itinerary day */
export interface ItineraryDay {
  id: number;
  itinerary_id: number;
  day_number: number;
  date: string;
  title: string | null;
  city_route: string | null;
  location_desc: string | null;
  attractions: string | null;
  transport_info: string | null;
  accommodation: string | null;
  accommodation_rating: number | null;
  daily_notes: string | null;
  images: DayImages | null;
  items: ItineraryItem[];
}

/** Day images structure */
export interface DayImages {
  location: string[];
  attractions: string[];
  transport: string[];
  accommodation: string[];
}

/** Itinerary item */
export interface ItineraryItem {
  id: number;
  day_id: number;
  poi_id: number | null;
  time_start: string | null;
  time_end: string | null;
  description: string | null;
  transport: string | null;
  sort_order: number;
}

/** Order entity */
export interface Order {
  id: number;
  order_no: string;
  customer_name: string;
  customer_phone: string | null;
  customer_email: string | null;
  destination: string;
  travel_start: string;
  travel_end: string;
  pax_count: number;
  total_amount: number;
  status: OrderStatus;
  notes: string | null;
  created_at?: string;
  updated_at?: string;
}

/** Paginated list (backend returns directly, not wrapped) */
export interface PaginatedList<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}
