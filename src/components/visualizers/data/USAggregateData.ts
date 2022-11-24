import { STORM_EVENT_CATEGORIES, STORM_EVENT_REGIONS } from './constants';
import { StormDataType } from './types';

const getUSAggregateData = (
  stormData: StormDataType[]
): {
  deaths: number;
  eventCount: number;
  propertyDamage: number;
} => {
  let deaths = 0;
  let eventCount = 0;
  let propertyDamage = 0;

  for (const stormEntry of stormData) {
    if (
      !STORM_EVENT_CATEGORIES.includes(stormEntry.EVENT) ||
      !STORM_EVENT_REGIONS.includes(stormEntry.STATE)
    )
      continue;

    deaths += stormEntry.DEATHS_INDIRECT_COUNT + stormEntry.DEATHS_DIRECT_COUNT;
    eventCount += stormEntry.EVENT_COUNT;
    propertyDamage += stormEntry.DAMAGE_PROPERTY_EVENT_SUM;
  }

  return {
    deaths,
    eventCount,
    propertyDamage,
  };
};

export default getUSAggregateData;
