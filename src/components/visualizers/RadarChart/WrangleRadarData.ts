import * as d3 from 'd3';
import { STORM_EVENT_CATEGORIES, STORM_EVENT_REGIONS, YEAR_RANGE } from '../data/constants';
import {
  GeoRegionUSType,
  SelectedDimensionsType,
  StateDataDimensions,
  StormDataType,
  StormEventCategoryType,
} from '../data/types';
import { fillMissingYears } from '../helpers';

export type RadarDataEntry = {
  axis: string;
  value: number;
  state?: GeoRegionUSType;
  stormType?: StormEventCategoryType;
  formatFn?: (
    n:
      | number
      | {
          valueOf(): number;
        }
  ) => string;
};

export type RadarData = Array<RadarDataEntry[]>;

type RadarWrangleProps = {
  data: StormDataType[];
  numberOfStates?: number;
  stateSelected?: GeoRegionUSType | 'ALL';
  selectedDimension: SelectedDimensionsType;
  yearFilter: [number, number] | null;
  eventFilter: StormEventCategoryType | 'ALL';
};
export const wrangleDataByTopXStates = ({
  data,
  numberOfStates = 3,
  stateSelected = null,
  selectedDimension = 'TOTAL_EVENTS',
  yearFilter = null,
  eventFilter = 'ALL',
}: RadarWrangleProps) => {
  // get the top states by selected metric

  const filteredData = [...filterData({ stormData: data, yearFilter, eventFilter })];

  const dataGroupedByState = Array.from(
    d3.group(filteredData, (d) => d.STATE),
    ([key, value]) => ({ key, value })
  );

  const topStatesAggregateValues = getTopStatesByDimension({
    dataGroupedByState,
    selectedDimension,
    stateSelected,
    numberOfStates,
  });

  const radarData = formatStatesCountDataForRadarDisplay(topStatesAggregateValues);
  return radarData;
};

type FilterFnProps = {
  stormData: StormDataType[];
  yearFilter?: [number, number] | null;
  eventFilter?: StormEventCategoryType | 'ALL';
  stateSelected?: GeoRegionUSType | 'ALL';
};
export const filterData = ({
  stormData,
  yearFilter = null,
  eventFilter = 'ALL',
  stateSelected = 'ALL',
}: FilterFnProps) => {
  let filteredData: StormDataType[] = [];

  // if there is a region selected
  if (yearFilter || eventFilter || stateSelected) {
    stormData.forEach((row) => {
      if (!STORM_EVENT_REGIONS.includes(row.STATE)) return;

      const [yearMin, yearMax] = !!yearFilter ? yearFilter : [YEAR_RANGE.min, YEAR_RANGE.max];

      // if 'ALL' then the condition is true ef not then check to see if we match
      const regionConditionIsTrue =
        stateSelected === 'ALL' ? true : row.STATE.toLowerCase() === stateSelected.toLowerCase();
      const eventConditionIsTrue = eventFilter === 'ALL' ? true : row.EVENT === eventFilter;
      const yearConditionIsTrue = yearMin <= row.YEAR && row.YEAR <= yearMax;

      if (yearConditionIsTrue && eventConditionIsTrue && regionConditionIsTrue) {
        filteredData.push(row);
      }
    });
  } else {
    filteredData = stormData;
  }

  return filteredData;
};

type GetTopStatesFnProps = {
  dataGroupedByState: {
    key: GeoRegionUSType;
    value: StormDataType[];
  }[];
  selectedDimension: SelectedDimensionsType;
  numberOfStates: number;
  stateSelected?: GeoRegionUSType | 'ALL';
};

export const getTopStatesByDimension = ({
  dataGroupedByState,
  selectedDimension,
  stateSelected,
  numberOfStates,
}: GetTopStatesFnProps): StateDataDimensions[] => {
  const stateData: StateDataDimensions[] = [];

  dataGroupedByState.forEach((state) => {
    const { key: stateName } = state;

    if ((stateName as string) === 'STATE') return;

    let DAMAGE_PROPERTY_EVENT_SUM = 0;
    let DEATHS_DIRECT_COUNT = 0;
    let DEATHS_INDIRECT_COUNT = 0;
    let DEATHS_TOTAL_COUNT = 0;
    let INJURIES_DIRECT_COUNT = 0;
    let TOTAL_EVENTS = 0;
    const COUNTS_BY_EVENT: Record<StormEventCategoryType, number> = {} as Record<
      StormEventCategoryType,
      number
    >;
    const DEATHS_BY_EVENT: Record<StormEventCategoryType, number> = {} as Record<
      StormEventCategoryType,
      number
    >;
    const DAMAGES_BY_EVENT: Record<StormEventCategoryType, number> = {} as Record<
      StormEventCategoryType,
      number
    >;

    // sum up the totals per state
    state.value.forEach((entry: StormDataType) => {
      const eventType = entry.EVENT || 'misc';

      DAMAGE_PROPERTY_EVENT_SUM += entry.DAMAGE_PROPERTY_EVENT_SUM;
      DEATHS_DIRECT_COUNT += entry.DEATHS_DIRECT_COUNT;
      DEATHS_INDIRECT_COUNT += entry.DEATHS_INDIRECT_COUNT;
      DEATHS_TOTAL_COUNT += entry.DEATHS_DIRECT_COUNT + entry.DEATHS_INDIRECT_COUNT;
      INJURIES_DIRECT_COUNT += entry.INJURIES_DIRECT_COUNT;
      TOTAL_EVENTS += entry.EVENT_COUNT;

      if (eventType in COUNTS_BY_EVENT) {
        COUNTS_BY_EVENT[eventType] += entry.EVENT_COUNT;
      } else {
        COUNTS_BY_EVENT[eventType] = entry.EVENT_COUNT;
      }

      if (eventType in DEATHS_BY_EVENT) {
        DEATHS_BY_EVENT[eventType] += entry.DEATHS_DIRECT_COUNT + entry.DEATHS_INDIRECT_COUNT;
      } else {
        DEATHS_BY_EVENT[eventType] = entry.DEATHS_DIRECT_COUNT + entry.DEATHS_INDIRECT_COUNT;
      }
      if (eventType in DAMAGES_BY_EVENT) {
        DAMAGES_BY_EVENT[eventType] += entry.DAMAGE_PROPERTY_EVENT_SUM;
      } else {
        DAMAGES_BY_EVENT[eventType] = entry.DAMAGE_PROPERTY_EVENT_SUM;
      }
    });

    stateData.push({
      STATE: stateName,
      DAMAGE_PROPERTY_EVENT_SUM,
      DEATHS_DIRECT_COUNT,
      DEATHS_INDIRECT_COUNT,
      DEATHS_TOTAL_COUNT,
      INJURIES_DIRECT_COUNT,
      TOTAL_EVENTS,
      // Aggregates of each storm type
      COUNTS_BY_EVENT,
      DEATHS_BY_EVENT,
      DAMAGES_BY_EVENT,
    });
  }); // end foreach

  stateData.sort((a, b) => b[selectedDimension] - a[selectedDimension]);

  const topStates = stateData.slice(0, numberOfStates); // top states cumulative values

  // add in the selected state for comparision
  // regionSelected
  const isStateSelectedAccounted = topStates.some(
    (entry) => entry.STATE.toLowerCase() === stateSelected.toLowerCase()
  );

  if (!isStateSelectedAccounted && stateSelected !== 'ALL') {
    // if we dont have them accounted for find them and add them;
    const stateSelectedData = stateData.find(
      (entry) => entry.STATE.toLowerCase() === stateSelected.toLowerCase()
    );
    topStates.push(stateSelectedData);
  }

  return topStates;
};

export const getFormat = ({ value, isMoney = false, maxLength = 5 }) => {
  const prefix = isMoney ? '$' : '';
  return value.toString().length > maxLength
    ? d3.format(`${prefix},.2s`)
    : d3.format(`${prefix},.0f`);
};

export const formatStatesCountDataForRadarDisplay = (data: StateDataDimensions[]): RadarData => {
  const radarData = data.map((stateData) => {
    if (!stateData) return;
    return [
      {
        axis: 'Total Storms',
        value: stateData.TOTAL_EVENTS,
        state: stateData.STATE,
        formatFn: getFormat({ value: stateData.TOTAL_EVENTS }),
      },
      {
        axis: 'Deaths',
        value: stateData.DEATHS_TOTAL_COUNT,
        state: stateData.STATE,
        formatFn: getFormat({ value: stateData.DEATHS_TOTAL_COUNT }),
      },
      {
        axis: 'Property Damage',
        value: stateData.DAMAGE_PROPERTY_EVENT_SUM,
        state: stateData.STATE,
        formatFn: getFormat({ value: stateData.DAMAGE_PROPERTY_EVENT_SUM, isMoney: true }),
      },
    ];
  });
  return radarData;
};

/**
 *
 * @param param0
 * @returns
 */
export const wrangleDataByStormEvents = ({
  data,
  stateSelected = null,
  selectedDimension = 'TOTAL_EVENTS',
  yearFilter = null,
  eventFilter = 'ALL',
  numberOfStates = 3,
}: RadarWrangleProps) => {
  // get the top states for selected metric

  // Find out who has the highest ranking
  const filteredDataByStormAndYear = filterData({ stormData: data, yearFilter, eventFilter });

  const dataGroupedByState = Array.from(
    d3.group(filteredDataByStormAndYear, (d) => d.STATE),
    ([key, value]) => ({ key, value })
  );

  const topStatesAggregateValues = getTopStatesByDimension({
    dataGroupedByState,
    selectedDimension,
    stateSelected,
    numberOfStates,
  });

  // now get the same info again but without the event filters
  const displayDataStatesNameArr = topStatesAggregateValues.map((stateData) => stateData.STATE);

  const displayDataStatesFiltered = filterData({ stormData: data, yearFilter });
  const displayDataStatesGrouped = Array.from(
    d3.group(displayDataStatesFiltered, (d) => d.STATE),
    ([key, value]) => ({ key, value })
  );

  const displayDataFilteredByTopStates = displayDataStatesGrouped.filter((entry) =>
    [...displayDataStatesNameArr, stateSelected.toUpperCase()].includes(entry.key.toUpperCase())
  );

  const displayDataAggregateValues = getTopStatesByDimension({
    dataGroupedByState: displayDataFilteredByTopStates,
    selectedDimension,
    stateSelected,
    numberOfStates,
  });

  const radarData = formatStormEventsForRadar({
    data: displayDataAggregateValues,
    selectedDimension,
  });

  return radarData;
};

type AggregateEventFnProps = {
  stormDataGroupedByEvent: {
    key: StormEventCategoryType;
    value: StormDataType[];
  }[];
};
export const getAggregatedStormEventData = ({ stormDataGroupedByEvent }: AggregateEventFnProps) => {
  const aggregatedDataByStormEvent: {
    key: StormEventCategoryType;
    values: StateDataDimensions[];
  }[] = [];

  // Loop through each Event Category (tornado, hurricane, ...)
  stormDataGroupedByEvent.forEach((eventCategoryData) => {
    const { key: eventCategory } = eventCategoryData;

    if (!STORM_EVENT_CATEGORIES.includes(eventCategory)) return;

    // Group all of this event's data by year
    const eventsByYear = Array.from(
      d3.group(eventCategoryData.value, (d) => d.YEAR),
      ([year, value]) => ({ year, value })
    );

    const yearData: StateDataDimensions[] = [];

    // loop through each years data and aggregate the metrics/dimensions
    eventsByYear.forEach((entry) => {
      let DAMAGE_PROPERTY_EVENT_SUM = 0;
      let DEATHS_DIRECT_COUNT = 0;
      let DEATHS_INDIRECT_COUNT = 0;
      let DEATHS_TOTAL_COUNT = 0;
      let INJURIES_DIRECT_COUNT = 0;
      let TOTAL_EVENTS = 0;

      // entry.value is an array of all of the states that had a storm of X type and their count
      // now sum up the value of these counts from all of the state's entries
      entry.value.forEach((entry: StormDataType) => {
        DAMAGE_PROPERTY_EVENT_SUM += entry.DAMAGE_PROPERTY_EVENT_SUM;
        DEATHS_DIRECT_COUNT += entry.DEATHS_DIRECT_COUNT;
        DEATHS_INDIRECT_COUNT += entry.DEATHS_INDIRECT_COUNT;
        DEATHS_TOTAL_COUNT += entry.DEATHS_DIRECT_COUNT + entry.DEATHS_INDIRECT_COUNT;
        INJURIES_DIRECT_COUNT += entry.INJURIES_DIRECT_COUNT;
        TOTAL_EVENTS += entry.EVENT_COUNT;
      });

      yearData.push({
        EVENT_NAME: eventCategory,
        YEAR: entry.year,
        DAMAGE_PROPERTY_EVENT_SUM,
        DEATHS_DIRECT_COUNT,
        DEATHS_INDIRECT_COUNT,
        DEATHS_TOTAL_COUNT,
        INJURIES_DIRECT_COUNT,
        TOTAL_EVENTS,
      });
    }); // end event by year Loop

    // fill in missing values with 0's
    const [minYear, maxYear] = d3.extent(yearData, (d) => d.YEAR);
    const filledData = fillMissingYears(yearData, minYear, maxYear);

    const sortedData = [...filledData].sort((a, b) => b.YEAR - a.YEAR);

    aggregatedDataByStormEvent.push({
      key: eventCategory,
      values: sortedData,
    });
  }); // end events by category loop

  return aggregatedDataByStormEvent;
};

type FormatFnProps = {
  data: StateDataDimensions[];
  selectedDimension: SelectedDimensionsType;
};
const formatStormEventsForRadar = ({ data, selectedDimension }: FormatFnProps): RadarData => {
  const dimensionsPathMap: Record<SelectedDimensionsType, string> = {
    TOTAL_EVENTS: 'COUNTS_BY_EVENT',
    DEATHS_TOTAL_COUNT: 'DEATHS_BY_EVENT',
    DEATHS_DIRECT_COUNT: 'DEATHS_BY_EVENT',
    DEATHS_INDIRECT_COUNT: 'DEATHS_BY_EVENT',
    DAMAGE_PROPERTY_EVENT_SUM: 'DAMAGES_BY_EVENT',
    INJURIES_DIRECT_COUNT: 'DEATHS_BY_EVENT',
  };

  const radarData = data.map((d) => {
    const pathMap = dimensionsPathMap[selectedDimension];
    const ourMetrics = d[pathMap];

    STORM_EVENT_CATEGORIES.forEach((eventName) => {
      if (!ourMetrics[eventName]) ourMetrics[eventName] = 0;
    });

    return Object.entries(d[pathMap])
      .filter(([eventName, metric]) =>
        (STORM_EVENT_CATEGORIES as readonly string[]).includes(eventName)
      )
      .map(([eventName, metric]) => {
        return {
          axis: eventName,
          value: metric as number,
          state: d.STATE,
          formatFn: getFormat({ value: metric }),
        };
      })
      .sort((a, b) => {
        if (a.axis < b.axis) return -1;
        if (a.axis > b.axis) return 1;
        return 0;
      });
  });

  return radarData;
};

export const fillGlobalData = (stormData: StormDataType[]): StormDataType[] => {
  const filledData = [...stormData];
  // every state for every year for every storm
  for (const state of STORM_EVENT_REGIONS) {
    for (const stormName of STORM_EVENT_CATEGORIES) {
      for (let year = YEAR_RANGE.min; year < YEAR_RANGE.max; year++) {
        filledData.push(getEmptyStormMetric({ state, stormName, year }));
      }
    }
  }

  return filledData;
};

export const getEmptyStormMetric = ({ state, stormName, year }) => ({
  EVENT: stormName,
  STATE: state.toUpperCase(),
  YEAR: year,
  DAMAGE_PROPERTY_EVENT_SUM: 0,
  DEATHS_DIRECT_COUNT: 0,
  DEATHS_INDIRECT_COUNT: 0,
  EVENT_COUNT: 0,
  INJURIES_DIRECT_COUNT: 0,
});
