import LinkItem, { LinkInfo } from './LinkItem';

interface Props {
  links: LinkInfo[];
}

const LinkList = ({ links }: Props) => (
  <ul className="list-unstyled">
    {links.map((linkInfo) => (
      <LinkItem linkInfo={linkInfo} />
    ))}
  </ul>
);

export default LinkList;
