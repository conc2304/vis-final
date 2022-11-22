export const stormEventToTypeMap = {
  'Astronomical Low Tide': null,
  'Coastal Flood': 'Flood',
  'Cold/Wind Chill': 'Winter Storm',
  'Debris Flow': 'Landslide',
  'Dense Fog': null,
  'Dense Smoke': 'Wildfire',
  'Dust Devil': null,
  'Dust Storm': 'Dust Storm',
  'Excessive Heat': 'Extreme Temperature',
  'Extreme Cold/Wind Chill': 'Extreme Temperature',
  'Flash Flood': 'Flood',
  'Freezing Fog': 'Winter Storm',
  'Frost/Freeze': 'Extreme Temperature',
  'Funnel Cloud': 'Thunderstorm',
  'HAIL FLOODING': 'Flood',
  'HAIL/ICY ROADS': 'Winter Storm',
  'Heavy Rain': 'Thunderstorm',
  'Heavy Snow': 'Winter Storm',
  'High Surf': 'Marine Storm',
  'High Wind': 'Thunderstorm',
  'Hurricane (Typhoon)': 'Hurricane',
  'Ice Storm': 'Winter Storm',
  'Lake-Effect Snow': 'Winter Storm',
  'Lakeshore Flood': 'Flood',
  'Marine Dense Fog': 'Marine Storm',
  'Marine Hail': 'Marine Storm',
  'Marine High Wind': 'Marine Storm',
  'Marine Hurricane/Typhoon': 'Hurricane',
  'Marine Lightning': 'Marine Storm',
  'Marine Strong Wind': 'Hurricane',
  'Marine Thunderstorm Wind': 'Hurricane',
  'Marine Tropical Depression': 'Marine Storm',
  'Marine Tropical Storm': 'Marine Storm',
  'Northern Lights': null,
  'Rip Current': 'Marine Storm',
  'Storm Surge/Tide': 'Marine Storm',
  'Strong Wind': 'Thunderstorm',
  'Thunderstorm Wind': 'Thunderstorm',
  'THUNDERSTORM WIND/ TREE': 'Thunderstorm',
  'THUNDERSTORM WIND/ TREES': 'Thunderstorm',
  'THUNDERSTORM WINDS FUNNEL CLOU': 'Thunderstorm',
  'THUNDERSTORM WINDS HEAVY RAIN': 'Thunderstorm',
  'THUNDERSTORM WINDS LIGHTNING': 'Thunderstorm',
  'THUNDERSTORM WINDS/ FLOOD': 'Thunderstorm',
  'THUNDERSTORM WINDS/FLASH FLOOD': 'Flood',
  'THUNDERSTORM WINDS/FLOODING': 'Thunderstorm',
  'THUNDERSTORM WINDS/HEAVY RAIN': 'Thunderstorm',
  'TORNADO/WATERSPOUT': 'Tornado',
  'TORNADOES, TSTM WIND, HAIL': 'Thunderstorm',
  'Tropical Depression': 'Marine Storm',
  'Tropical Storm': 'Marine Storm',
  'Volcanic Ash': 'Volcanic Event',
  'Volcanic Ashfall': 'Volcanic Event',
  'Winter Storm': 'Winter Storm',
  'Winter Weather': 'Winter Storm',
  Avalanche: 'Avalanche',
  Blizzard: 'Winter Storm',
  Drought: 'Draught',
  Flood: 'Flood',
  Hail: 'Thunderstorm',
  Heat: 'Extreme Temperature',
  Hurricane: 'Hurricane',
  Lightning: 'Thunderstorm',
  Seiche: 'Marine Storm',
  Sleet: 'Winter Storm',
  Sneakerwave: 'Marine Storm',
  Tornado: 'Tornado',
  Tsunami: 'Hurricane',
  Waterspout: 'Hurricane',
  Wildfire: 'Wildfire',
};

const getUniqueValues = (value: string | null, index: number, self: Array<string | null>) => {
  if (value === null) return;
  return self.indexOf(value as string) === index;
};

export const NUMERIC_STORM_DATA_FIELDS = [
  'EVENT_COUNT',
  'INJURIES_DIRECT_COUNT',
  'DEATHS_DIRECT_COUNT',
  'DEATHS_INDIRECT_COUNT',
  'DAMAGE_PROPERTY_EVENT_SUM',
] as const;

export const STORM_DISPLAY_DATA_DIMENSIONS = [
  'DAMAGE_PROPERTY_EVENT_SUM',
  'DEATHS_DIRECT_COUNT',
  'DEATHS_INDIRECT_COUNT',
  'DEATHS_TOTAL_COUNT',
  'INJURIES_DIRECT_COUNT',
  'TOTAL_EVENTS',
] as const;

export const STORM_UI_SELECT_VALUES = [
  {
    label: 'Number of Events Total',
    value: 'TOTAL_EVENTS',
  },
  {
    label: 'Total Property Damage',
    value: 'DAMAGE_PROPERTY_EVENT_SUM',
  },
  {
    label: 'Direct Deaths Total',
    value: 'DEATHS_DIRECT_COUNT',
  },
  {
    label: 'Indirect Deaths Total',
    value: 'DEATHS_INDIRECT_COUNT',
  },
  {
    label: 'All Deaths Total',
    value: 'DEATHS_TOTAL_COUNT',
  },
  {
    label: 'Injuries Total',
    value: 'INJURIES_DIRECT_COUNT',
  },
] as const;

export const EVENT_CATEGORIES = Object.values(stormEventToTypeMap).filter(getUniqueValues).sort();

export const STORM_EVENT_CATEGORIES = [
  // 'Avalanche', // no data on map ?
  // 'Draught', // should have data but not?
  // 'Dust Storm',
  'Extreme Temperature',
  'Flood',
  'Hurricane',
  'Landslide',
  'Thunderstorm',
  'Tornado',
  // 'Tropical Storm', // no data on map ??
  // 'Volcanic Event', // no data on  map
  'Wildfire',
  'Winter Storm',
] as const;

export const STORM_EVENT_REGIONS = [
  'ALABAMA',
  'ALASKA',
  // 'AMERICAN SAMOA',
  'ARIZONA',
  'ARKANSAS',
  'CALIFORNIA',
  'COLORADO',
  'CONNECTICUT',
  'DELAWARE',
  'DISTRICT OF COLUMBIA',
  'FLORIDA',
  'GEORGIA',
  // 'GUAM',
  'HAWAII',
  'IDAHO',
  'ILLINOIS',
  'INDIANA',
  'IOWA',
  'KANSAS',
  'KENTUCKY',
  'LOUISIANA',
  'MAINE',
  'MARYLAND',
  'MASSACHUSETTS',
  'MICHIGAN',
  'MINNESOTA',
  'MISSISSIPPI',
  'MISSOURI',
  'MONTANA',
  'NEBRASKA',
  'NEW HAMPSHIRE',
  'NEW JERSEY',
  'NEW MEXICO',
  'NEW YORK',
  'NORTH CAROLINA',
  'NORTH DAKOTA',
  'OHIO',
  'OKLAHOMA',
  'OREGON',
  'PENNSYLVANIA',
  // 'PUERTO RICO',
  'RHODE ISLAND',
  'SOUTH CAROLINA',
  'SOUTH DAKOTA',
  'TENNESSEE',
  'TEXAS',
  'UTAH',
  'VERMONT',
  // 'VIRGIN ISLANDS',
  'VIRGINIA',
  'WASHINGTON',
  'WEST VIRGINIA',
  'WISCONSIN',
  'WYOMING',
  'NEVADA',
  // 'ATLANTIC NORTH',
  // 'ATLANTIC SOUTH',
  // 'E PACIFIC',
  // 'GULF OF ALASKA',
  // 'GULF OF MEXICO',
  // 'HAWAII WATERS',
  // 'LAKE ERIE',
  // 'LAKE HURON',
  // 'LAKE MICHIGAN',
  // 'LAKE ONTARIO',
  // 'LAKE ST CLAIR',
  // 'LAKE SUPERIOR',
  // 'ST LAWRENCE R',
  // 'Kentucky',
] as const;

// HEAT MAP
// export const COLOR_RANGE = [
//   '#010002', // blackish
//   '#7C30FC', // purple
//   '#1233E4', // blue
//   '#22FCE1', // aqua
//   '#17CE26', // green
//   '#EAFF06', // yellow
//   '#FFB508', // orange
//   '#FE2222', // red
// ];

export const COLOR_ACCCENT = '#ffb703'; // yello
export const COLOR_UI_PRIMARY = '#61efff';
export const COLOR_UI_ERROR ="#E34D94"; // magenta 
export const COLOR_RANGE = [
  // "#0E1625",
  '#091C3A',
  '#0B3069',
  '#066EA8',
  '#029FBF',
  '#02C4DA',
];

export const COLOR_GREY = '#495153';
export const YEAR_RANGE = {
  min: 1950,
  max: 2021,
};
