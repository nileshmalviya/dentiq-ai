import type { ReactNode } from "react";
export function DetailList({ rows }: { rows: [string, ReactNode][] }) { return <dl className="detail-list">{rows.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>; }
