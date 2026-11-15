import type { DoctorApplication, RegistrationCatalog } from '../../services/doctorRegistration.service';
import { initialApplication } from './RegistrationFields';

// Temporary sample values: use initialApplication(catalog) in Register.tsx to remove.
export const sampleRegistrationPassword = 'Neeleshmalviya1998@gmail.com';

export function sampleApplication(catalog: RegistrationCatalog): DoctorApplication {
  const data = initialApplication(catalog);
  return {
    personal: {
      ...data.personal,
      firstName: 'Aarav',
      middleName: 'Kumar',
      lastName: 'Sharma',
      dateOfBirth: '1990-05-15',
      gender: 'Male',
      email: 'neeleshmalviya1998@gmail.com',
      phone: '9009255076',
      alternatePhone: '9000000002',
      state: 'Maharashtra',
      city: 'Pune',
      postalCode: '411001',
      address: '12 Sample Residency, MG Road, Pune',
    },
    professional: {
      ...data.professional,
      registrationNumber: 'SAMPLE-DENT-12345',
      registrationCouncil: 'Maharashtra State Dental Council',
      registrationState: 'Maharashtra',
      registrationDate: '2015-07-01',
      registrationExpiryDate: '2030-06-30',
      institution: 'Sample Dental College',
      graduationYear: 2014,
      experience: 10,
      bio: 'Sample dentist profile focused on preventive dental care and patient comfort.',
      consultationFee: 500,
      expertise: ['Preventive dentistry', 'Restorative dentistry'],
      treatments: ['Dental checkup', 'Teeth cleaning', 'Dental fillings'],
    },
    clinic: {
      ...data.clinic,
      name: 'Sample Smile Dental Clinic',
      type: 'Private Clinic',
      email: 'sample.clinic@example.com',
      phone: '9000000003',
      alternatePhone: '9000000004',
      address: '24 Sample Plaza, MG Road',
      landmark: 'Near Sample Shopping Centre',
      city: 'Pune',
      state: 'Maharashtra',
      postalCode: '411001',
      mapsUrl: 'https://www.google.com/maps?q=Pune',
      description: 'Sample dental clinic offering routine consultations and family dental care.',
      facilities: ['Waiting area', 'Parking', 'Digital X-ray'],
      consultationFee: 500,
      openingTime: '09:00',
      closingTime: '18:00',
      workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      breakStart: '13:00',
      breakEnd: '14:00',
    },
  };
}
