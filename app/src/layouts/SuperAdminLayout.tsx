import { PortalFrame } from "../components/common/PortalFrame";
import { SuperAdminSidebar } from "../components/super-admin/SuperAdminSidebar";
import { SuperAdminHeader } from "../components/super-admin/SuperAdminHeader";
export function SuperAdminLayout() { return <PortalFrame Sidebar={SuperAdminSidebar} Header={SuperAdminHeader} className="super-admin-shell" name="Super Admin Portal" />; }
