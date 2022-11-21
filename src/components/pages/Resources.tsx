import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import { Link } from 'react-router-dom';
import { Routes } from '../../router/router';

import Layout from '../ui/Layout';
import { LinkInfo } from '../ui/LinkList/LinkItem';
import LinkList from '../ui/LinkList/LinkList';
import Navigation from '../ui/Navigation/Navigation';

const ResourcesPage = () => {
  const links: LinkInfo[] = [
    { url: 'https://www.ncei.noaa.gov/', label: 'National Centers for Environmental Information' },
    { url: 'https://www.noaa.gov/', label: 'National Oceanic and Atmospheric Administration' },
    {
      url: 'https://www.climate.gov/',
      label: 'Climate.gov - Science & Information for a Climate-Smart Nation',
    },
  ];

  return (
    <Layout>
      <header className="w-100 d-flex justify-content-center">
        <Link
          to={Routes.storms}
          className="btn btn-primary btn-lg border-radius-0 d-block px-4 pt-1 pb-2 custom-header"
        >
          Explore &#9651;
        </Link>
      </header>

      <main className="p-4 flex-grow-1 d-flex flex-column">
        <Row className="flex-grow-1">
          <Col md={4}>
            <Navigation />
          </Col>
          <Col md={8} className="d-flex align-items-center">
            <div className="p-4">
              <h2 className="pb-3">More Resources</h2>
              <p className="text-white">
                Explore more climate-related data and discover more information about how to help
                with climate change.
              </p>
              <LinkList links={links} />
            </div>
          </Col>
        </Row>
      </main>
    </Layout>
  );
};

export default ResourcesPage;
