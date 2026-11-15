export const doctorStats = [
  { label: "Today's Appointments", value: "12", icon: "calendar", tone: "green" },
  { label: "Pending Consultations", value: "08", icon: "users", tone: "green" },
  { label: "Treatment Plans", value: "2 / 3", icon: "clipboard", tone: "green" },
  { label: "Follow-ups Due", value: "3", icon: "followup", tone: "amber" },
];
export const adminStats = [
  { label: "Total Patients", value: "1,248", icon: "users", tone: "green" },
  { label: "Active Doctors", value: "86", icon: "doctor", tone: "blue" },
  { label: "Partner Clinics", value: "42", icon: "clinic", tone: "green" },
  { label: "Avg. Rating", value: "4.8", icon: "star", tone: "amber" },
];
export const appointmentTrend = [
  { month: "Jul", appointments: 700, revenue: 72000 }, { month: "Aug", appointments: 850, revenue: 85000 },
  { month: "Sep", appointments: 850, revenue: 81000 }, { month: "Oct", appointments: 1050, revenue: 102000 },
  { month: "Nov", appointments: 1200, revenue: 116000 }, { month: "Dec", appointments: 1300, revenue: 128000 },
];
export const previousTrend = appointmentTrend.map((point, i) => ({ ...point, appointments: [620, 740, 810, 900, 980, 1100][i] }));
export const topTreatments = [{ name: "Teeth Cleaning", percent: 28 }, { name: "Filling", percent: 20 }, { name: "Root Canal", percent: 15 }, { name: "Extraction", percent: 12 }, { name: "Braces", percent: 10 }, { name: "Implant", percent: 8 }, { name: "Whitening", percent: 7 }];
export const clinics = [
  { id: "CL-001", name: "SmileCare Dental Clinic", city: "Mumbai", doctors: 8, patients: 328, status: "Active" },
  { id: "CL-002", name: "Pearl Dental Studio", city: "Pune", doctors: 5, patients: 196, status: "Active" },
  { id: "CL-003", name: "Bright Smiles Clinic", city: "Bengaluru", doctors: 6, patients: 254, status: "Active" },
  { id: "CL-004", name: "City Dental Centre", city: "Delhi", doctors: 4, patients: 180, status: "Under Review" },
];
export const clinicalNotes = [
  { id: "NOTE-01", patient: "Rohan Kapoor", date: "23 Apr", title: "Initial consultation", content: "Sample consultation note. Patient concerns and a follow-up visit were recorded for this demonstration." },
  { id: "NOTE-02", patient: "Aditi Verma", date: "23 Apr", title: "Routine cleaning visit", content: "Sample visit note. Cleaning appointment completed and the next routine visit discussed." },
  { id: "NOTE-03", patient: "Neha Shah", date: "22 Apr", title: "Restorative care review", content: "Sample review note. Existing care plan reviewed with the patient." },
];
export const treatmentPlans = [
  { id: "TP-001", patient: "Rahul Mehta", title: "Restorative care plan", completed: 2, total: 3, steps: ["Consultation", "Root Canal", "Crown fitting"], status: "In Progress" },
  { id: "TP-002", patient: "Ananya Singh", title: "Orthodontic care plan", completed: 1, total: 4, steps: ["Assessment", "Braces fitting", "Review", "Retention"], status: "In Progress" },
  { id: "TP-003", patient: "Aditi Verma", title: "Preventive care plan", completed: 2, total: 2, steps: ["Examination", "Teeth Cleaning"], status: "Completed" },
];
export const consultations = [
  { id: "AI-001", patient: "Rohan Kapoor", concern: "Toothache", symptoms: "Chewing or biting", time: "10 min ago", status: "Pending" },
  { id: "AI-002", patient: "Neha Shah", concern: "Sensitivity", symptoms: "Hot or cold sensitivity", time: "25 min ago", status: "Pending" },
  { id: "AI-003", patient: "Ananya Singh", concern: "Routine checkup", symptoms: "General dental questions", time: "1 hour ago", status: "Reviewed" },
];
