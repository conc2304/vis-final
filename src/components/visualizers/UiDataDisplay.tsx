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
    <div className='mr-1'>
      <div className="d-flex justify-content-between align-items-center">
        <h3 style={{}}>{displayLocation}</h3>
        <h5>
          {Math.round(startTime)} - {Math.round(endTime)}
        </h5>
      </div>
      {metrics && (
        <div className="d-flex justify-content-between" style={{ marginTop: '0.5em' }}>
          <p className='mb-0'>
            <strong className='me-1'>Storm Events:</strong> 
            <animated.span>
              {propsEvents.val.to((val) => {
                return getFormat({ value: val, maxLength: 5 })(val);
              })}
            </animated.span>
          </p>
          <p className='mb-0'>
            <strong className='me-1'>Deaths: </strong>
            <animated.span>
              {propsDeaths.val.to((val) => {
                return getFormat({ value: Math.floor(val), maxLength: 5 })(val);
              })}
            </animated.span>
          </p>
          <p className='mb-0 mr-1'>
            <strong className='me-1'>Property Damage: </strong>
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
