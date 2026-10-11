let clipboardValue = "";

export async function setStringAsync(value: string): Promise<boolean> {
  clipboardValue = value;
  return true;
}

export async function getStringAsync(): Promise<string> {
  return clipboardValue;
}
