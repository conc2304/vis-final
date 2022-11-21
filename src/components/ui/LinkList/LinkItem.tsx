export interface LinkInfo {
  url: string;
  label: string;
}

interface Props {
  linkInfo: LinkInfo;
}

const LinkItem = ({ linkInfo }: Props) => (
  <li>
    <a className="btn btn-outline-light mb-2 w-100 text-start" href={linkInfo.url} target="_blank">
      {linkInfo.label}
    </a>
  </li>
);

export default LinkItem;
