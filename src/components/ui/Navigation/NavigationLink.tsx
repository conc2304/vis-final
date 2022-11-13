import { Link } from 'react-router-dom';
import { Routes } from '../../../router/router';

import './NavigationLink.scss';

interface Props {
  linkTo: Routes;
  label: string;
  active?: boolean;
}
const NavigationLink = ({ linkTo, label, active }: Props): JSX.Element => {
  const linkClasses = [
    'navigation-link',
    'p-4',
    'd-flex',
    'align-items-center',
    'text-white',
    'text-decoration-none',
    'text-lg',
  ];
  if (active) {
    linkClasses.push('active');
  }

  return (
    <li>
      <Link to={linkTo} className={linkClasses.join(' ')}>
        {label}
      </Link>
    </li>
  );
};

export type { Props as NavigationLinkProps };
export default NavigationLink;
