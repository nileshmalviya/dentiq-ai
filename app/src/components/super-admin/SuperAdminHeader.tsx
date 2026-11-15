import { ShieldCheck } from "lucide-react";
import { PortalHeader } from "../common/PortalHeader";
import type { HeaderProps } from "../common/PortalFrame";
export function SuperAdminHeader(props: HeaderProps) { return <PortalHeader {...props} title="Super Admin · Platform management" icon={<ShieldCheck size={17} />} searchPath="/super-admin/doctors" searchLabel="Search all doctors" settingsPath="/super-admin/settings" />; }
