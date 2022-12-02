import { useSpring, animated } from 'react-spring';
import { getFormat } from './RadarChart/WrangleRadarData';

type Props = {
  metrics: {
    deaths: number;
    eventCount: number;
    propertyDamage: number;
  };
};

const UiDataDisplay = ({
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

  return (
    <div className="d-flex justify-content-between" style={{ marginTop: '0.5em' }}>
      <p className="mb-0">
        <strong className="me-1">Storm Events:</strong>
        <animated.span>
          {propsEvents.val.to((val) => {
            return getFormat({ value: val, maxLength: 5 })(val);
          })}
        </animated.span>
      </p>
      <p className="mb-0">
        <strong className="me-1">Deaths: </strong>
        <animated.span>
          {propsDeaths.val.to((val) => {
            return getFormat({ value: Math.floor(val), maxLength: 5 })(val);
          })}
        </animated.span>
      </p>
      <p className="mb-0">
        <strong className="me-1">Property Damage: </strong>
        <animated.span>
          {propsDamages.val.to((val) => {
            return getFormat({ value: val, maxLength: 5, isMoney: true })(val);
          })}
        </animated.span>
      </p>
    </div>
  );
};

export default UiDataDisplay;
