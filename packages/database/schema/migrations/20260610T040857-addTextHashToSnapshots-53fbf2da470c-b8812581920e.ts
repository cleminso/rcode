import { schema as s } from "jazz-tools";

export default s.defineMigration({
  migrate: {
    roomYjsSnapshots: {
      textHash: s.add.string({ default: null }),
    },
  },
  fromHash: "53fbf2da470c",
  toHash: "b8812581920e",
  from: {
    roomYjsSnapshots: s.table({
      room_id: s.ref("rooms"),
      state: s.bytes(),
      stateVector: s.bytes().optional(),
      session_user_id: s.string().optional(),
      createdAt: s.timestamp(),
    }),
  },
  to: {
    roomYjsSnapshots: s.table({
      room_id: s.ref("rooms"),
      state: s.bytes(),
      stateVector: s.bytes().optional(),
      textHash: s.string().optional(),
      session_user_id: s.string().optional(),
      createdAt: s.timestamp(),
    }),
  },
});
