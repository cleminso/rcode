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
    "fileId": s.uuid().optional(),
    "createdAt": s.timestamp(),
  }, { "file": s.rel("files", "fileId") }),
  "profiles": s.table({
    "session_user_id": s.string(),
    "displayName": s.string(),
  }, {})
},
  to: {
  "profiles": s.table({
    "session_user_id": s.string(),
    "displayName": s.string(),
    "avatarFileId": s.uuid().optional(),
  }, { "avatarFile": s.rel("files", "avatarFileId") })
},
});
