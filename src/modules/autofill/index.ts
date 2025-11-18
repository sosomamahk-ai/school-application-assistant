export function isAutofillEnabled(): boolean {
  return process.env.FEATURE_AUTOFILL === "true";
}