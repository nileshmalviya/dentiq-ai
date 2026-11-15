import { Link } from "react-router-dom";
import { ToothMark } from "../platform/ToothMark";

export function Brand({ to = "/" }: { to?: string }) {
  return <Link to={to} className="brand" aria-label="Dentiq AI home"><span className="brand-mark" aria-hidden="true"><ToothMark /></span><span>Dentiq <b>AI</b></span></Link>;
}
