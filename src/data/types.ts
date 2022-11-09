import { StormEventCategory, StormEventRegions, NumericStormMetrics } from './constants';

// Storm Data Types
export type StormData = {
  // STATE: string,
  STATE: GeoRegionUS,
  YEAR: number;
  EVENT_COUNT: number;
  INJURIES_DIRECT_COUNT: number;
  DEATHS_DIRECT_COUNT: number;
  DEATHS_INDIRECT_COUNT: number;
  DAMAGE_PROPERTY_EVENT_SUM: number;
  EVENT: StormEventCategoryType;
  // EVENT: StormEventCategoryType;
};

export type NumericStormMetricType = typeof NumericStormMetrics[number];

export type StormEventCategoryType = typeof StormEventCategory[number];

export type GeoRegionUS = typeof StormEventRegions[number];

export type StormDataHash = Record<GeoRegionUS, StormData>; // 

// Temperature Anomaly Data Types
export type GlobalTempDataType = {
  year: number;
  no_smooth: number;
  smoothed: number;
};

export type GlobalTempJson = GlobalTempDataType[];
