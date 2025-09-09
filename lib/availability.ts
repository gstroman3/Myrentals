export interface DateRange {
  start: string;
  end: string;
  reason?: string;
}

export interface AvailabilityData {
  property_id: string;
  booked: DateRange[];
  blackouts: DateRange[];
  min_nights: number;
}
