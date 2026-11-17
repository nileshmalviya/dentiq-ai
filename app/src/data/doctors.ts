export interface Doctor {
  id: string; name: string; specialty: string; rating: number; reviews: number; distance: string;
  clinicId?: string; clinicAddress?: string; distanceKm?: number; nextAvailable: string; nextAvailableAt?: string; timezone?: string; experience: number; fee: number; photo: string; clinic: string;
  qualification: string; languages: string; about: string; treatments: string[];
}

export const doctors: Doctor[] = [
  { id: "arjun-mehta", name: "Dr. Arjun Mehta", specialty: "General & Restorative Dentistry", rating: 4.9, reviews: 328, distance: "2.4 km", nextAvailable: "Today, 4:30 PM", experience: 12, fee: 800, photo: "/assets/doctor-arjun.png", clinic: "SmileCare Dental Clinic", qualification: "BDS, MDS (Conservative Dentistry)", languages: "English, Hindi", about: "Experienced dentist with a focus on preventive and restorative dental care.", treatments: ["Consultation", "Teeth Cleaning", "Filling", "Root Canal", "Whitening"] },
  { id: "neha-sharma", name: "Dr. Neha Sharma", specialty: "Endodontics (Root Canal)", rating: 4.7, reviews: 196, distance: "3.1 km", nextAvailable: "Tomorrow, 10:00 AM", experience: 9, fee: 800, photo: "/assets/doctor-neha.png", clinic: "Pearl Dental Studio", qualification: "BDS, MDS (Endodontics)", languages: "English, Hindi", about: "A patient-focused endodontist with an interest in comfortable, personalized dental visits.", treatments: ["Consultation", "Root Canal", "Filling", "Dental Crowns"] },
  { id: "priya-patel", name: "Dr. Priya Patel", specialty: "Orthodontics & Smile Design", rating: 4.8, reviews: 152, distance: "4.0 km", nextAvailable: "Tomorrow, 11:00 AM", experience: 8, fee: 900, photo: "/assets/doctor-neha.png", clinic: "Bright Smiles Clinic", qualification: "BDS, MDS (Orthodontics)", languages: "English, Hindi, Gujarati", about: "Dedicated to personalized orthodontic care and helping patients feel confident about their smiles.", treatments: ["Consultation", "Braces", "Aligners", "Whitening", "Implant", "Extraction"] },
];
export const findDoctor = (id?: string | null) => doctors.find(doctor => doctor.id === id);
export const doctorReviews = [
  { name: "Rohan K.", rating: 5, date: "18 Apr", text: "A very comfortable visit. The doctor explained every step and answered all my questions." },
  { name: "Aditi V.", rating: 5, date: "15 Apr", text: "Friendly team, a clean clinic, and a smooth appointment experience." },
  { name: "Rahul M.", rating: 4, date: "10 Apr", text: "Helpful consultation and clear follow-up instructions. Happy with the experience." },
];
