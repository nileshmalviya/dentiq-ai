import type {
  DoctorApplication,
  RegistrationCatalog,
  Section,
} from '../../services/doctorRegistration.service';
export function RegistrationFields({
  section,
  values,
  onChange,
  catalog,
  readOnlyEmail = false,
  category,
}: {
  section: keyof DoctorApplication;
  values: Section;
  onChange: (values: Section) => void;
  catalog: RegistrationCatalog;
  readOnlyEmail?: boolean;
  category?: string;
}) {
  return (
    <div className="registration-fields">
      {catalog.fields[section].map((field) => {
        let options = field.options || [];
        const selected = catalog.categories.find(
          (c) => c.name === (category || values.doctorCategory),
        );
        if (field.name === 'specialization')
          options = selected?.specialties || [];
        if (field.name === 'primaryQualification')
          options = selected?.qualifications || [];
        const value =
          values[field.name] ??
          (field.type === 'checkbox'
            ? false
            : ['list', 'multi'].includes(field.type || '')
              ? []
              : '');
        const update = (next: Section[string]) => {
          const changed = { ...values, [field.name]: next };
          if (field.name === 'doctorCategory') {
            const c = catalog.categories.find((c) => c.name === next);
            changed.specialization = c?.specialties[0] || '';
            changed.primaryQualification = c?.qualifications[0] || '';
          }
          onChange(changed);
        };
        const id = section + '-' + field.name;
        return (
          <div
            key={id}
            className={
              'registration-field ' +
              (['textarea', 'multi'].includes(field.type || '')
                ? 'full-field'
                : '')
            }
          >
            <label htmlFor={id}>
              {field.label}
              {field.required && <span aria-label="required"> *</span>}
            </label>
            {field.type === 'multi' ? (
              <fieldset id={id} className="registration-choices">
                <legend className="sr-only">{field.label}</legend>
                {options.map((option) => (
                  <label key={option}>
                    <input
                      type="checkbox"
                      checked={Array.isArray(value) && value.includes(option)}
                      onChange={(e) =>
                        update(
                          e.target.checked
                            ? [...(Array.isArray(value) ? value : []), option]
                            : (Array.isArray(value) ? value : []).filter(
                                (v) => v !== option,
                              ),
                        )
                      }
                    />
                    {option}
                  </label>
                ))}
              </fieldset>
            ) : field.type === 'select' ? (
              <select
                id={id}
                value={String(value)}
                required={field.required}
                onChange={(e) => update(e.target.value)}
              >
                <option value="">Select {field.label.toLowerCase()}</option>
                {options.map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            ) : field.type === 'textarea' ? (
              <textarea
                id={id}
                rows={3}
                maxLength={4000}
                value={String(value)}
                required={field.required}
                onChange={(e) => update(e.target.value)}
              />
            ) : field.type === 'checkbox' ? (
              <input
                id={id}
                type="checkbox"
                checked={Boolean(value)}
                onChange={(e) => update(e.target.checked)}
              />
            ) : (
              <input
                id={id}
                type={
                  field.type === 'phone'
                    ? 'tel'
                    : field.type === 'list'
                      ? 'text'
                      : field.type || 'text'
                }
                value={Array.isArray(value) ? value.join(',') : String(value)}
                required={field.required}
                min={field.type === 'number' ? 0 : undefined}
                max={field.max}
                maxLength={250}
                step={
                  field.type === 'time'
                    ? 1800
                    : field.type === 'number'
                      ? 'any'
                      : undefined
                }
                readOnly={readOnlyEmail && field.name === 'email'}
                onChange={(e) =>
                  update(
                    field.type === 'list'
                      ? e.target.value.split(',')
                      : field.type === 'number'
                        ? e.target.value === ''
                          ? ''
                          : Number(e.target.value)
                        : e.target.value,
                  )
                }
              />
            )}
            {field.type === 'list' && (
              <small>Separate entries with commas.</small>
            )}
            {field.name === 'slotDuration' && (
              <small>Duration in minutes.</small>
            )}
          </div>
        );
      })}
    </div>
  );
}
export function normalizeApplication(
  data: DoctorApplication,
): DoctorApplication {
  return Object.fromEntries(
    Object.entries(data).map(([section, values]) => [
      section,
      Object.fromEntries(
        Object.entries(values).map(([key, value]) => [
          key,
          Array.isArray(value)
            ? value.map((v) => v.trim()).filter(Boolean)
            : value,
        ]),
      ),
    ]),
  ) as unknown as DoctorApplication;
}
export function initialApplication(
  catalog: RegistrationCatalog,
): DoctorApplication {
  const data = Object.fromEntries(
    Object.entries(catalog.fields).map(([section, fields]) => [
      section,
      Object.fromEntries(
        fields.map((f) => [
          f.name,
          f.type === 'checkbox'
            ? false
            : ['multi', 'list'].includes(f.type || '')
              ? []
              : '',
        ]),
      ),
    ]),
  ) as unknown as DoctorApplication;
  data.personal.country = 'India';
  data.clinic.country = 'India';
  data.professional.doctorCategory = 'Dentist';
  data.professional.specialization = 'General Dentist';
  data.professional.primaryQualification = 'BDS';
  data.professional.consultationTypes = ['In Person'];
  data.professional.languages = ['English', 'Hindi'];
  data.clinic.slotDuration = '30';
  return data;
}
