import { Routes } from '../../../router/router';

import NavigationLink, { NavigationLinkProps } from './NavigationLink';

const Navigation = (): JSX.Element => {
  const links: NavigationLinkProps[] = [
    { linkTo: Routes.home, label: 'Home' },
    { linkTo: Routes.storms, label: 'Severe Weather' },
    { linkTo: Routes.resources, label: 'Resources', active: true },
  ];

  return (
    <nav className="bullet-navigation d-flex justify-content-center align-items-center h-100">
      <ul className="d-flex flex-column p-0 list-unstyled">
        {links.map((link) => (
          <NavigationLink linkTo={link.linkTo} label={link.label} active={link.active} />
        ))}
      </ul>
    </nav>
  );
};

export default Navigation;
