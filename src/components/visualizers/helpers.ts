import { GeoRegionUSType, StateDataDimensions } from './data/types';

export const fillMissingYears = (
  yearData: StateDataDimensions[],
  minYear: number,
  maxYear: number,
  stateName: GeoRegionUSType = null
) => {
  for (let year = 1950; year < minYear; year++) {
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

  for (let year = maxYear; year < 2022; year++) {
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
