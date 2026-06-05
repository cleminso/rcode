import { customAlphabet } from "nanoid";

const alphabet = "abcdefghijklmnopqrstuvwxyz0123456789";
const createToken = customAlphabet(alphabet, 8);

export function newRoomToken() {
  return createToken();
}
