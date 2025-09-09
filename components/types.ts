export type ISODate = string;           // "YYYY-MM-DD"
export type DateRange = { start: ISODate; end: ISODate }; // end is exclusive
export type AvailabilityFeed = {
  property_id: string;
  booked: DateRange[];    // external imports (ICS)
  blackouts: DateRange[]; // owner-set holds
  min_nights?: number;
};
export type ICSRawEvent = {
  dtstart: string;
  dtend: string;
  allDay: boolean;
  uid?: string;
  summary?: string;
};
