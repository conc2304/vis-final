import { useSpring, animated } from 'react-spring';
import { YEAR_RANGE } from './data/constants';
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
  timeRangeSelected = [YEAR_RANGE.min, YEAR_RANGE.max],
  locationSelected,
  metrics = {
    deaths: 0,
    eventCount: 0,
    propertyDamage: 0,
  },
}: Props) => {
  if (!metrics) return;

  const propsEvents = useSpring({ val: metrics.eventCount, from: { val: 0 }, duration: 200 });
  const propsDeaths = useSpring({ val: metrics.deaths, from: { val: 0 }, duration: 200 });
  const propsDamages = useSpring({ val: metrics.propertyDamage, from: { val: 0 }, duration: 200 });

  const [startTime, endTime] = timeRangeSelected;
  const displayLocation = locationSelected === 'ALL' ? 'U.S.A' : locationSelected;

  return (
    <div className="p-2">
      <div className="d-flex justify-content-between align-items-center">
        <h3 style={{}}>{displayLocation}</h3>
        <h5>
          {Math.round(startTime)} - {Math.round(endTime)}
        </h5>
      </div>
      {metrics && (
        <div className="d-flex justify-content-between" style={{ marginTop: '0.5em' }}>
          <p>
            <strong>Storm Events:</strong> <br />
            <animated.span>
              {propsEvents.val.to((val) => {
                return getFormat({ value: val, maxLength: 5 })(val);
              })}
            </animated.span>
          </p>
          <p>
            <strong>Deaths: </strong>
            <br />
            <animated.span>
              {propsDeaths.val.to((val) => {
                return getFormat({ value: Math.floor(val), maxLength: 5 })(val);
              })}
            </animated.span>
          </p>
          <p>
            <strong>Property Damage: </strong>
            <br />
            <animated.span>
              {propsDamages.val.to((val) => {
                return getFormat({ value: val, maxLength: 5, isMoney: true })(val);
              })}
            </animated.span>
          </p>
        </div>
      )}
    </div>
  );
};

export default UiDataDisplay;
