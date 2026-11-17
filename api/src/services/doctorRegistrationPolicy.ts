import { DateTime } from 'luxon';
import { AppError } from '../errors/AppError.js';
import { categories, workingDays } from '../constants/doctorRegistration.js';
import { applicationSchema } from '../validations/doctorRegistration.validation.js';
export function validateDoctorApplication(value: unknown) {
  const data = applicationSchema.parse(value) as Record<string, any>,
    p = data.personal,
    m = data.professional,
    c = data.clinic;
  const category = categories.find((row) => row.name === m.doctorCategory);
  if (
    !category ||
    !category.specialties.includes(m.specialization) ||
    !category.qualifications.includes(m.primaryQualification)
  )
    throw new AppError(
      422,
      'Choose qualifications and a specialization appropriate to your doctor category',
    );
  if (m.primaryQualification === 'Other' && !m.otherQualification)
    throw new AppError(422, 'Describe your qualification');
  const today = DateTime.utc().startOf('day');
  for (const [label, date] of [
    ['Birth date', p.dateOfBirth],
    ['Registration date', m.registrationDate],
    ['Registration expiry', m.registrationExpiryDate],
  ])
    if (date && !DateTime.fromISO(date).isValid)
      throw new AppError(422, `${label} is invalid`);
  if (p.dateOfBirth && DateTime.fromISO(p.dateOfBirth) >= today)
    throw new AppError(422, 'Date of birth must be in the past');
  if (DateTime.fromISO(m.registrationDate) > today)
    throw new AppError(422, 'Registration date cannot be in the future');
  if (
    m.registrationExpiryDate &&
    DateTime.fromISO(m.registrationExpiryDate) < today
  )
    throw new AppError(422, 'Your professional registration has expired');
  if (
    !Number.isInteger(m.graduationYear) ||
    m.graduationYear < 1900 ||
    m.graduationYear > today.year
  )
    throw new AppError(422, 'Enter a valid graduation year');
  if (!Number.isInteger(m.experience) || m.experience > 80)
    throw new AppError(422, 'Enter valid years of experience');
  if (!/^[A-Za-z0-9/ ._-]{3,100}$/.test(m.registrationNumber))
    throw new AppError(422, 'Enter a valid council registration number');
  if (c.mapsUrl) {
    let url: URL;
    try {
      url = new URL(c.mapsUrl);
    } catch {
      throw new AppError(422, 'Enter a valid Maps URL');
    }
    if (
      url.protocol !== 'https:' ||
      ![
        'maps.app.goo.gl',
        'maps.google.com',
        'www.google.com',
        'google.com',
      ].includes(url.hostname)
    )
      throw new AppError(422, 'Use an HTTPS Google Maps URL');
  }
  const time = (value: string) => {
    if (!/^([01]\d|2[0-3]):(00|30)$/.test(value))
      throw new AppError(422, 'Clinic times must use half-hour intervals');
    const [h, m] = value.split(':').map(Number);
    return h * 60 + m;
  };
  const opening = time(c.openingTime),
    closing = time(c.closingTime);
  if (opening >= closing)
    throw new AppError(422, 'Clinic closing time must be after opening time');
  const duration = Number(c.slotDuration);
  if (![30, 60].includes(duration))
    throw new AppError(422, 'Choose a supported appointment duration');
  if (
    !c.workingDays.length ||
    c.workingDays.some((day: string) => !workingDays.includes(day)) ||
    new Set(c.workingDays).size !== c.workingDays.length
  )
    throw new AppError(422, 'Choose valid weekly working days');
  if (c.breakStart || c.breakEnd) {
    const start = time(c.breakStart),
      end = time(c.breakEnd);
    if (start >= end || start < opening || end > closing)
      throw new AppError(
        422,
        'Break times must fall within clinic opening hours',
      );
  }
  if (
    m.consultationTypes.some(
      (type: string) => !['In Person', 'Online'].includes(type),
    )
  )
    throw new AppError(422, 'Unsupported consultation type');
  return data;
}
export function doctorApplicationRecords(data: Record<string, any>) {
  const p = data.personal,
    m = data.professional,
    c = data.clinic;
  const minutes = (v: string) => {
    const [h, m] = v.split(':').map(Number);
    return h * 60 + m;
  };
  const duration = Number(c.slotDuration),
    times: string[] = [];
  for (
    let start = minutes(c.openingTime);
    start + duration <= minutes(c.closingTime);
    start += duration
  ) {
    if (
      c.breakStart &&
      start < minutes(c.breakEnd) &&
      start + duration > minutes(c.breakStart)
    )
      continue;
    times.push(
      `${String(Math.floor(start / 60)).padStart(2, '0')}:${String(start % 60).padStart(2, '0')}`,
    );
  }
  const booking =
    m.doctorCategory === 'Dentist' && m.consultationTypes.includes('In Person');
  return {
    name: [p.firstName, p.middleName, p.lastName].filter(Boolean).join(' '),
    doctor: {
      email: p.email,
      phone: p.phone,
      specialty: m.specialization,
      subSpecialization: m.subSpecialization,
      qualification:
        m.primaryQualification === 'Other'
          ? m.otherQualification
          : m.primaryQualification,
      qualifications: [m.primaryQualification, ...m.additionalQualifications],
      experience: m.experience,
      fee: c.consultationFee,
      clinic: c.name,
      doctorCategory: m.doctorCategory,
      registrationNumber: m.registrationNumber.toUpperCase().replace(/\s/g, ''),
      registrationCouncil: m.registrationCouncil.toUpperCase(),
      registrationState: m.registrationState.toUpperCase(),
      about: m.bio,
      languages: m.languages.join(', '),
      treatments: m.treatments,
      clinicalServicesEnabled: booking,
      slotDuration: duration,
      availability: booking
        ? c.workingDays.map((day: string) => ({
            day: workingDays.indexOf(day) + 1,
            times,
          }))
        : [],
    },
    clinic: {
      name: c.name,
      city: c.city,
      address: c.address,
      state: c.state,
      postalCode: c.postalCode,
      timezone: 'Asia/Kolkata',
    },
  };
}
export function missingRegistrationDocuments(
  application: Record<string, any>,
  documents: Record<string, any>[],
) {
  const types = new Set(
    documents.filter((d) => d.active).map((d) => d.documentType),
  );
  const required = [
    'COUNCIL_CERTIFICATE',
    'DEGREE_CERTIFICATE',
    'PROFILE_PHOTO',
  ];
  if (application.clinic.registrationNumber)
    required.push('CLINIC_CERTIFICATE');
  if (application.professional.additionalQualifications.length)
    required.push('ADDITIONAL_QUALIFICATION');
  return required.filter((type) => !types.has(type));
}
export function publicDocument(row: Record<string, any>) {
  return {
    id: row.id,
    documentType: row.documentType,
    originalName: row.originalName,
    mimeType: row.mimeType,
    size: row.size,
    verificationStatus: row.verificationStatus,
    uploadedAt: row.createdAt,
  };
}
