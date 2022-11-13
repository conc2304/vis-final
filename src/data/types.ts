import { Feature, Geometry } from 'geojson';
import {
  NUMERIC_STORM_DATA_FIELDS,
  STORM_DISPLAY_DATA_DIMENSIONS,
  STORM_EVENT_CATEGORIES,
  STORM_EVENT_REGIONS,
} from './constants';

// Storm Data Types
export type StormDataType = {
  STATE: GeoRegionUSType;
  YEAR: number;
  EVENT_COUNT: number;
  INJURIES_DIRECT_COUNT: number;
  DEATHS_DIRECT_COUNT: number;
  DEATHS_INDIRECT_COUNT: number;
  DAMAGE_PROPERTY_EVENT_SUM: number;
  EVENT: StormEventCategoryType;
};

export type NumericStormMetricType = typeof NUMERIC_STORM_DATA_FIELDS[number];

export type SelectedDimensionsType = typeof STORM_DISPLAY_DATA_DIMENSIONS[number];

export type StormEventCategoryType = typeof STORM_EVENT_CATEGORIES[number];

export type GeoRegionUSType = typeof STORM_EVENT_REGIONS[number];

export type StormDataHashType = Record<GeoRegionUSType, StormDataType>; //

// Temperature Anomaly Data Types
export type GlobalTempDataType = {
  year: number;
  no_smooth: number;
  smoothed: number;
};

export type GlobalTempJsonType = GlobalTempDataType[];

export type GeoJsonFeatureType = Feature<
  Geometry,
  {
    [name: string]: unknown;
  }
>;