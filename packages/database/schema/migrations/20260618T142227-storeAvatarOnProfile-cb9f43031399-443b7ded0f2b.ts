import { schema as s } from "jazz-tools";

export default s.defineMigration({
  dropTables: {
    "profileAvatars": true,
  },
  migrate: {
    "profiles": {
      "avatarFileId": s.add.ref("files", { default: null }),
    },
  },
  fromHash: "cb9f43031399",
  toHash: "443b7ded0f2b",
  from: {
  "profileAvatars": s.table({
    "session_user_id": s.string(),
    "fileId": s.ref("files").optional(),
    "createdAt": s.timestamp(),
  }),
  "profiles": s.table({
    "session_user_id": s.string(),
    "displayName": s.string(),
  })
},
  to: {
  "profiles": s.table({
    "session_user_id": s.string(),
    "displayName": s.string(),
    "avatarFileId": s.ref("files").optional(),
  })
},
});
