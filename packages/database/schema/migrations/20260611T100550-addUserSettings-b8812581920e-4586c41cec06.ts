import { schema as s } from "jazz-tools";

export default s.defineMigration({
  createTables: {
    "userSettings": true,
  },
  fromHash: "b8812581920e",
  toHash: "4586c41cec06",
  from: {},
  to: {
  "userSettings": s.table({
    "session_user_id": s.string(),
    "editor": s.json().optional(),
  })
},
});
