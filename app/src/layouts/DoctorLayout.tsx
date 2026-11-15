import { PortalFrame } from "../components/common/PortalFrame";
import { DoctorSidebar } from "../components/doctor/DoctorSidebar";
import { DoctorHeader } from "../components/doctor/DoctorHeader";
export function DoctorLayout() { return <PortalFrame Sidebar={DoctorSidebar} Header={DoctorHeader} className="doctor-shell" name="Doctor Portal" />; }
