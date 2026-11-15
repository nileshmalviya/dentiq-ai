import { useContext } from "react";
import { PatientFlowContext } from "./flowContext";
export function usePatientFlow() { const value = useContext(PatientFlowContext); if (!value) throw new Error("PatientFlowProvider is required."); return value; }
