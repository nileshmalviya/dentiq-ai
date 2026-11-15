export interface RegistrationField {
  name: string;
  label: string;
  type?:
    | 'text'
    | 'email'
    | 'phone'
    | 'date'
    | 'number'
    | 'textarea'
    | 'select'
    | 'list'
    | 'multi'
    | 'checkbox'
    | 'time';
  required?: boolean;
  options?: string[];
  max?: number;
}
export const doctorCategories = [
  'Dentist',
  'General Physician',
  'General Surgeon',
  'Cardiologist',
  'Dermatologist',
  'Neurologist',
  'Orthopedic Specialist',
  'Pediatrician',
  'Gynecologist',
  'ENT Specialist',
  'Ophthalmologist',
  'Psychiatrist',
  'Endocrinologist',
  'Gastroenterologist',
  'Pulmonologist',
  'Nephrologist',
  'Urologist',
  'Oncologist',
  'Radiologist',
  'Anesthesiologist',
  'Physiotherapist',
  'Other',
];
export const dentalSpecialties = [
  'General Dentist',
  'Orthodontist',
  'Endodontist',
  'Periodontist',
  'Prosthodontist',
  'Oral and Maxillofacial Surgeon',
  'Pediatric Dentist',
  'Oral Medicine and Radiology',
  'Oral Pathology',
  'Public Health Dentistry',
  'Other',
];
export const qualifications = [
  'BDS',
  'MDS',
  'MBBS',
  'MD',
  'MS',
  'DNB',
  'DM',
  'MCh',
  'Other',
];
export const verificationOptions = [
  'PhonePe',
  'Paytm',
  'UPI',
  'Identity Verification',
] as const;
export const documentTypes = [
  'COUNCIL_CERTIFICATE',
  'DEGREE_CERTIFICATE',
  'ADDITIONAL_QUALIFICATION',
  'CLINIC_CERTIFICATE',
  'PROFILE_PHOTO',
  'CLINIC_LOGO',
] as const;
export const workingDays = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];
export const categories = doctorCategories.map((name) => ({
  name,
  specialties: name === 'Dentist' ? dentalSpecialties : [name, 'Other'],
  qualifications:
    name === 'Dentist'
      ? ['BDS', 'MDS', 'Other']
      : name === 'Physiotherapist'
        ? ['Other']
        : qualifications.filter((q) => !['BDS', 'MDS'].includes(q)),
  dentalBookingEnabled: name === 'Dentist',
}));
export const registrationFields: Record<
  'personal' | 'professional' | 'clinic',
  RegistrationField[]
> = {
  personal: [
    { name: 'firstName', label: 'First name', required: true },
    { name: 'middleName', label: 'Middle name' },
    { name: 'lastName', label: 'Last name', required: true },
    { name: 'dateOfBirth', label: 'Date of birth', type: 'date' },
    {
      name: 'gender',
      label: 'Gender',
      type: 'select',
      options: ['Female', 'Male', 'Other', 'Prefer not to say'],
    },
    { name: 'email', label: 'Email address', type: 'email', required: true },
    { name: 'phone', label: 'Mobile number', type: 'phone', required: true },
    { name: 'alternatePhone', label: 'Alternate mobile number', type: 'phone' },
    { name: 'country', label: 'Country', required: true },
    { name: 'state', label: 'State', required: true },
    { name: 'city', label: 'City', required: true },
    { name: 'postalCode', label: 'Postal code', required: true },
    {
      name: 'address',
      label: 'Full address',
      type: 'textarea',
      required: true,
    },
  ],
  professional: [
    {
      name: 'registrationNumber',
      label: 'Council registration number',
      required: true,
    },
    {
      name: 'registrationCouncil',
      label: 'Registration council',
      required: true,
    },
    { name: 'registrationState', label: 'Registration state', required: true },
    {
      name: 'registrationDate',
      label: 'Registration date',
      type: 'date',
      required: true,
    },
    {
      name: 'registrationExpiryDate',
      label: 'Registration expiry date',
      type: 'date',
    },
    {
      name: 'doctorCategory',
      label: 'Doctor category',
      type: 'select',
      options: doctorCategories,
      required: true,
    },
    {
      name: 'specialization',
      label: 'Specialization',
      type: 'select',
      required: true,
    },
    { name: 'subSpecialization', label: 'Sub-specialization' },
    {
      name: 'primaryQualification',
      label: 'Primary qualification',
      type: 'select',
      required: true,
    },
    { name: 'otherQualification', label: 'Other qualification details' },
    {
      name: 'additionalQualifications',
      label: 'Additional qualifications (comma separated)',
      type: 'list',
    },
    { name: 'institution', label: 'University / institution', required: true },
    {
      name: 'graduationYear',
      label: 'Graduation year',
      type: 'number',
      required: true,
    },
    {
      name: 'experience',
      label: 'Years of experience',
      type: 'number',
      required: true,
      max: 80,
    },
    {
      name: 'bio',
      label: 'Professional bio',
      type: 'textarea',
      required: true,
    },
    {
      name: 'languages',
      label: 'Languages spoken (comma separated)',
      type: 'list',
      required: true,
    },
    {
      name: 'consultationTypes',
      label: 'Consultation types',
      type: 'multi',
      options: ['In Person', 'Online'],
      required: true,
    },
    {
      name: 'consultationFee',
      label: 'Consultation fee',
      type: 'number',
      required: true,
    },
    {
      name: 'expertise',
      label: 'Areas of expertise (comma separated)',
      type: 'list',
    },
    {
      name: 'treatments',
      label: 'Treatments offered (comma separated)',
      type: 'list',
      required: true,
    },
  ],
  clinic: [
    { name: 'name', label: 'Clinic name', required: true },
    { name: 'registrationNumber', label: 'Clinic registration number' },
    {
      name: 'type',
      label: 'Clinic type',
      type: 'select',
      options: ['Private Clinic', 'Hospital', 'Group Practice', 'Other'],
      required: true,
    },
    { name: 'email', label: 'Clinic email', type: 'email', required: true },
    {
      name: 'phone',
      label: 'Clinic contact number',
      type: 'phone',
      required: true,
    },
    {
      name: 'alternatePhone',
      label: 'Alternate clinic contact',
      type: 'phone',
    },
    {
      name: 'address',
      label: 'Clinic address',
      type: 'textarea',
      required: true,
    },
    { name: 'landmark', label: 'Landmark' },
    { name: 'city', label: 'Clinic city', required: true },
    { name: 'state', label: 'Clinic state', required: true },
    { name: 'country', label: 'Clinic country', required: true },
    { name: 'postalCode', label: 'Clinic postal code', required: true },
    { name: 'mapsUrl', label: 'Google Maps location URL' },
    { name: 'description', label: 'Clinic description', type: 'textarea' },
    { name: 'facilities', label: 'Facilities (comma separated)', type: 'list' },
    {
      name: 'consultationFee',
      label: 'Primary clinic consultation fee',
      type: 'number',
      required: true,
    },
    {
      name: 'openingTime',
      label: 'Opening time',
      type: 'time',
      required: true,
    },
    {
      name: 'closingTime',
      label: 'Closing time',
      type: 'time',
      required: true,
    },
    {
      name: 'workingDays',
      label: 'Weekly working days',
      type: 'multi',
      options: workingDays,
      required: true,
    },
    {
      name: 'slotDuration',
      label: 'Appointment slot duration (minutes)',
      type: 'select',
      options: ['30', '60'],
      required: true,
    },
    { name: 'breakStart', label: 'Break starts', type: 'time' },
    { name: 'breakEnd', label: 'Break ends', type: 'time' },
    {
      name: 'emergencyService',
      label: 'Emergency service available',
      type: 'checkbox',
    },
  ],
};
export const registrationCatalog = {
  categories,
  qualifications,
  fields: registrationFields,
  verificationOptions,
  documentTypes,
  uploadLimitBytes: 10 * 1024 * 1024,
  slotDurations: [30, 60],
};
