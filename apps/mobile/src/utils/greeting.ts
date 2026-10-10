export function getFirstName(fullName?: string): string {
  if (!fullName || typeof fullName !== "string") {
    return "User";
  }
  const clean = fullName.trim();
  const first = clean.split(/\s+/)[0];
  return first || "User";
}

export function getGreeting(
  fullName?: string,
  hour = new Date().getHours()
): {
  salutation: string;
  firstName: string;
  greetingText: string;
} {
  const firstName = getFirstName(fullName);

  let salutation = "Good evening";
  if (hour >= 5 && hour < 12) {
    salutation = "Good morning";
  } else if (hour >= 12 && hour < 18) {
    salutation = "Good afternoon";
  }

  return {
    salutation,
    firstName,
    greetingText: `${salutation}, ${firstName}`,
  };
}
