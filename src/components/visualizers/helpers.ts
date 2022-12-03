import { YEAR_RANGE } from './data/constants';
import { GeoRegionUSType, StateDataDimensions } from './data/types';

export const fillMissingYears = (
  yearData: StateDataDimensions[],
  minYear: number,
  maxYear: number,
  stateName: GeoRegionUSType = null
) => {
  for (let year = YEAR_RANGE.min; year < minYear; year++) {
    yearData.push({
      YEAR: year,
      STATE: stateName || null,
      DAMAGE_PROPERTY_EVENT_SUM: 0,
      DEATHS_DIRECT_COUNT: 0,
      DEATHS_INDIRECT_COUNT: 0,
      DEATHS_TOTAL_COUNT: 0,
      INJURIES_DIRECT_COUNT: 0,
      TOTAL_EVENTS: 0,
    });
  }

  for (let year = maxYear; year < YEAR_RANGE.max; year++) {
    yearData.push({
      YEAR: year,
      STATE: stateName || null,
      DAMAGE_PROPERTY_EVENT_SUM: 0,
      DEATHS_DIRECT_COUNT: 0,
      DEATHS_INDIRECT_COUNT: 0,
      DEATHS_TOTAL_COUNT: 0,
      INJURIES_DIRECT_COUNT: 0,
      TOTAL_EVENTS: 0,
    });
  }
  return yearData;
};

export const ucFirst = (string: string) => {
  if (!string) return '';
  return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase()};