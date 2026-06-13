function isByteValue(value: unknown) {
  return typeof value === "number" && Number.isInteger(value) === true && value >= 0 && value <= 255;
}

// Jazz bytes normally hydrate as Uint8Array. The extra shapes keep Y.applyUpdate
// safe across storage/devtool serialization boundaries without guessing strings.
export function toYjsUpdate(value: unknown) {
  if (value instanceof Uint8Array) {
    return value;
  }

  if (value instanceof ArrayBuffer) {
    return new Uint8Array(value);
  }

  if (ArrayBuffer.isView(value) === true) {
    return new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
  }

  if (Array.isArray(value) === true) {
    if (value.every(isByteValue) === false) {
      throw new Error("Expected Yjs update array values to be bytes.");
    }

    return Uint8Array.from(value);
  }

  if (typeof value === "object" && value !== null) {
    const entries = Object.entries(value).sort(([left], [right]) => Number(left) - Number(right));

    if (entries.length === 0) {
      throw new Error("Expected Yjs update object to contain bytes.");
    }

    if (entries.every(([key, byte], index) => Number(key) === index && isByteValue(byte) === true) === false) {
      throw new Error("Expected Yjs update object values to be contiguous bytes.");
    }

    return Uint8Array.from(entries.map(([, byte]) => Number(byte)));
  }

  throw new Error("Expected a Yjs update byte array.");
}
