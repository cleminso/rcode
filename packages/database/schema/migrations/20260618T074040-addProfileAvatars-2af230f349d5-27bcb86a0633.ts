import { schema as s } from "jazz-tools";

export default s.defineMigration({
  createTables: {
    "profileAvatars": true,
  },
  fromHash: "2af230f349d5",
  toHash: "27bcb86a0633",
  from: {},
  to: {
  "profileAvatars": s.table({
    "session_user_id": s.string(),
    "fileId": s.ref("files"),
    "createdAt": s.timestamp(),
  })
},
});
