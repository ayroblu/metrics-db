export function parseJson(input: unknown): object {
  if (typeof input !== "string") {
    throw new Error("did not receive a string input");
  }
  try {
    return JSON.parse(input);
  } catch (err) {
    throw new Error("Received invalid json");
  }
}
