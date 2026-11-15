import { useDashboard } from "../../hooks/useDashboard";
export function TopTreatments({days=30}:{days?:number}) {
  const {data}=useDashboard(days); const distribution=data.topTreatments;
  return <div className="top-treatments">{distribution.map(treatment => <div key={treatment.name}><div><span>{treatment.name}</span><strong>{treatment.percent}%</strong></div><span className="treatment-track"><i style={{ width: `${treatment.percent}%` }} /></span></div>)}</div>;
}
