export interface Appointment { id: string; time: string; patient: string; purpose: string; status: string; doctor: string; date: string; fee: number; }
export const appointments: Appointment[] = [
  { id: "APT-1001", time: "10:00 AM", patient: "Rohan Kapoor", purpose: "Consultation", status: "Checked In", doctor: "Dr. Arjun Mehta", date: "23 Apr", fee: 800 },
  { id: "APT-1002", time: "11:00 AM", patient: "Aditi Verma", purpose: "Teeth Cleaning", status: "In Progress", doctor: "Dr. Arjun Mehta", date: "23 Apr", fee: 1500 },
  { id: "APT-1003", time: "2:00 PM", patient: "Neha Shah", purpose: "Filling", status: "Scheduled", doctor: "Dr. Arjun Mehta", date: "23 Apr", fee: 2000 },
  { id: "APT-1004", time: "4:30 PM", patient: "Rahul Mehta", purpose: "Root Canal", status: "Scheduled", doctor: "Dr. Arjun Mehta", date: "23 Apr", fee: 5000 },
];
export const bookingDates = [{ day: "Tue", date: "Apr 22" }, { day: "Wed", date: "Apr 23" }, { day: "Thu", date: "Apr 24" }, { day: "Fri", date: "Apr 25" }];
export const bookingTimes = ["10:00 AM", "11:00 AM", "12:00 PM", "2:00 PM", "4:30 PM", "5:00 PM"];
export const invoices = [
  { id: "INV-1001", patient: "Rohan Kapoor", treatment: "Consultation", date: "23 Apr", amount: 800, status: "Paid" },
  { id: "INV-1002", patient: "Aditi Verma", treatment: "Teeth Cleaning", date: "23 Apr", amount: 1500, status: "Paid" },
  { id: "INV-1003", patient: "Neha Shah", treatment: "Filling", date: "23 Apr", amount: 2000, status: "Pending" },
  { id: "INV-1004", patient: "Rahul Mehta", treatment: "Root Canal", date: "23 Apr", amount: 5000, status: "Pending" },
];
