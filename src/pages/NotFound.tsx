import { Link } from 'react-router-dom';
import { Empty } from '../components/ui';

export function NotFound() {
  return (
    <div className="container narrow">
      <Empty title="That page does not exist" action={<Link to="/" className="btn">Back to the dashboard</Link>}>
        The link may be out of date. Your progress is safe — nothing was changed.
      </Empty>
    </div>
  );
}
