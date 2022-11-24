import { COLOR_ACCCENT } from './data/constants';
import { GeoRegionUSType } from './data/types';
import { getFormat } from './RadarChart/WrangleRadarData';

type Props = {
  timeRangeSelected: [number, number];
  locationSelected: GeoRegionUSType | 'ALL';
  metrics: {
    deaths: number;
    eventCount: number;
    propertyDamage: number;
  };
};

const UiDataDisplay = ({
  timeRangeSelected = [1950, 2022],
  locationSelected,
  metrics = {
    deaths: 0,
    eventCount: 0,
    propertyDamage: 0,
  },
}: Props) => {
  if (!metrics) return;
  const [startTime, endTime] = timeRangeSelected;
  const displayLocation = locationSelected === 'ALL' ? 'U.S.A' : locationSelected;
  const formattedEventCount = getFormat({ value: metrics.eventCount, maxLength: 5 })(
    metrics.eventCount
  );
  const formattedDeathCount = getFormat({ value: metrics.deaths, maxLength: 5 })(metrics.deaths);
  const formattedDamages = getFormat({
    value: metrics.propertyDamage,
    maxLength: 5,
    isMoney: true,
  })(metrics.propertyDamage);
  return (
    <div className="p-2">
      <div className="d-flex justify-content-between align-items-center">
        <h3 style={{ width: '50%', color: COLOR_ACCCENT }}>{displayLocation}</h3>
        <h5>
          {Math.round(startTime)} - {Math.round(endTime)}
        </h5>
        {/* <div sty></div> */}
      </div>
      {metrics && (
        <div className="d-flex justify-content-between" style={{ marginTop: '0.5em' }}>
          <p>
            <strong>Storm Events:</strong> <br />
            {formattedEventCount}
          </p>
          <p>
            <strong>Deaths: </strong>
            <br />
            {formattedDeathCount}
          </p>
          <p>
            <strong>Property Damage: </strong>
            <br />
            {formattedDamages}
          </p>
        </div>
      )}
    </div>
  );
};

export default UiDataDisplay;
