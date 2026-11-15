export type Errors = Record<string, string>;
export function focusFirstError(form: HTMLFormElement, errors: Errors) {
  const field = form.elements.namedItem(Object.keys(errors)[0]);
  if (field instanceof HTMLElement) field.focus();
}

export const emailIsValid = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
export const passwordRules = [
  { label: "At least 8 characters", test: (value: string) => value.length >= 8 },
  { label: "Uppercase and lowercase letters", test: (value: string) => /[a-z]/.test(value) && /[A-Z]/.test(value) },
  { label: "A number", test: (value: string) => /\d/.test(value) },
  { label: "A symbol", test: (value: string) => /[^\w\s]/.test(value) },
];

export function validateLogin(data: FormData): Errors {
  const errors: Errors = {};
  const email = String(data.get("email") || "").trim();
  if (!emailIsValid(email)) errors.email = "Enter a valid email address.";
  if (!data.get("password")) errors.password = "Enter your password.";
  return errors;
}

export function validateRegistration(data: FormData): Errors {
  const errors = validateLogin(data);
  const required: Record<string, string> = {
    fullName: "full name", mobile: "mobile number", registrationNumber: "doctor registration number",
    qualification: "dental qualification", specialization: "specialization", experience: "years of experience",
    clinicName: "clinic or hospital name", clinicAddress: "clinic address", city: "city", state: "state", country: "country",
  };
  for (const [name, label] of Object.entries(required)) {
    if (!String(data.get(name) || "").trim()) errors[name] = `Enter your ${label}.`;
  }
  const mobile = String(data.get("mobile") || "").trim();
  if (!/^\+?[\d\s().-]+$/.test(mobile) || !/^\d{7,15}$/.test(mobile.replace(/\D/g, ""))) errors.mobile = "Enter a valid mobile number with 7–15 digits, including country code.";
  const password = String(data.get("password") || "");
  if (!passwordRules.every(rule => rule.test(password))) errors.password = "Use 8+ characters with uppercase, lowercase, a number and a symbol.";
  if (!data.get("confirmPassword") || password !== data.get("confirmPassword")) errors.confirmPassword = "Your passwords must match.";
  const experience = String(data.get("experience") || "");
  if (!/^\d+$/.test(experience) || Number(experience) > 80) errors.experience = "Enter a whole number between 0 and 80.";
  if (!data.get("termsAccepted")) errors.termsAccepted = "Please accept the Terms & Conditions to continue.";
  for (const [name, types, max] of [
    ["profilePhoto", ["image/jpeg", "image/png", "image/webp"], 5],
    ["registrationCertificate", ["application/pdf", "image/jpeg", "image/png"], 10],
  ] as const) {
    const file = data.get(name);
    if (file instanceof File && file.name) {
      if (!(types as readonly string[]).includes(file.type)) errors[name] = "Choose a supported file type.";
      else if (file.size > max * 1024 * 1024) errors[name] = `Choose a file smaller than ${max} MB.`;
    }
  }
  return errors;
}
