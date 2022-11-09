// STATE,YEAR,EVENT_COUNT,INJURIES_DIRECT_COUNT,DEATHS_DIRECT_COUNT,DEATHS_INDIRECT_COUNT,DAMAGE_PROPERTY_EVENT_SUM,EVENT

import { StormEventCategory } from "./constants";

export type StormDataColumns = {
  STATE: string;
  YEAR: number;
  EVENT_COUNT: number;
  INJURIES_DIRECT_COUNT: boolean;
  DEATHS_DIRECT_COUNT: number;
  DEATHS_INDIRECT_COUNT: boolean;
  DAMAGE_PROPERTY_EVENT_SUM: number;
  EVENT: string;
};

export type NumericStormMetrics =
  | 'EVENT_COUNT'
  | 'INJURIES_DIRECT_COUNT'
  | 'DEATHS_DIRECT_COUNT'
  | 'DEATHS_INDIRECT_COUNT'
  | 'DAMAGE_PROPERTY_EVENT_SUM';

export type StormEventCategoryType = typeof StormEventCategory[number];

export type GlobalTempDataType = {
  year: number;
  no_smooth:number;
  smoothed: number;
}

export type GlobalTempJson = GlobalTempDataType[];