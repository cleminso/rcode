const textEncoder = new TextEncoder();

function toHex(buffer: ArrayBuffer) {
  return Array.from(new Uint8Array(buffer), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function hashString(text: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", textEncoder.encode(text));
  return toHex(digest);
}
