export interface Patient { id: string; name: string; age: number; gender: string; phone: string; email: string; lastVisit: string; treatment: string; status: string; }
export const patients: Patient[] = [
  { id: "PT-1001", name: "Rohan Kapoor", age: 32, gender: "Male", phone: "+91 98765 43210", email: "rohan@example.com", lastVisit: "23 Apr", treatment: "Consultation", status: "Active" },
  { id: "PT-1002", name: "Aditi Verma", age: 28, gender: "Female", phone: "+91 98765 43211", email: "aditi@example.com", lastVisit: "23 Apr", treatment: "Teeth Cleaning", status: "Active" },
  { id: "PT-1003", name: "Neha Shah", age: 35, gender: "Female", phone: "+91 98765 43212", email: "neha@example.com", lastVisit: "22 Apr", treatment: "Filling", status: "Follow-up" },
  { id: "PT-1004", name: "Rahul Mehta", age: 41, gender: "Male", phone: "+91 98765 43213", email: "rahul@example.com", lastVisit: "21 Apr", treatment: "Root Canal", status: "Active" },
  { id: "PT-1005", name: "Ananya Singh", age: 24, gender: "Female", phone: "+91 98765 43214", email: "ananya@example.com", lastVisit: "19 Apr", treatment: "Braces", status: "Follow-up" },
  { id: "PT-1006", name: "Vikram Rao", age: 46, gender: "Male", phone: "+91 98765 43215", email: "vikram@example.com", lastVisit: "17 Apr", treatment: "Implant", status: "Inactive" },
];
export const dentalRecords = [
  { id: "REC-01", title: "Dental examination", doctor: "Dr. Arjun Mehta", date: "18 Apr", type: "Visit summary", description: "Routine dental visit and recorded care plan. This is a sample record." },
  { id: "REC-02", title: "Dental X-ray", doctor: "Dr. Arjun Mehta", date: "18 Apr", type: "Imaging", description: "Sample imaging record. No real medical image is stored in this demo." },
  { id: "REC-03", title: "Teeth cleaning", doctor: "Dr. Neha Sharma", date: "02 Apr", type: "Treatment", description: "Sample completed cleaning appointment and follow-up notes." },
];
