import { Stethoscope } from "lucide-react";
import { PortalHeader } from "../common/PortalHeader";
import type { HeaderProps } from "../common/PortalFrame";
export function DoctorHeader(props: HeaderProps) { return <PortalHeader {...props} title="Doctor Portal · Your practice" icon={<Stethoscope size={17} />} searchPath="/doctor/patients" searchLabel="Search my patients" settingsPath="/doctor/settings" />; }
