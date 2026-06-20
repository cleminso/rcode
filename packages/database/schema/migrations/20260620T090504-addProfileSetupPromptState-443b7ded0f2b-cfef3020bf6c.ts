import { schema as s } from "jazz-tools";

export default s.defineMigration({
  migrate: {
    "profiles": {
      "origin": s.add.string({ default: "user-created" }),
      "setupPromptDismissed": s.add.boolean({ default: true }),
    },
  },
  fromHash: "443b7ded0f2b",
  toHash: "cfef3020bf6c",
  from: {
  "profiles": s.table({
    "session_user_id": s.string(),
    "displayName": s.string(),
    "avatarFileId": s.ref("files").optional(),
  })
},
  to: {
  "profiles": s.table({
    "session_user_id": s.string(),
    "displayName": s.string(),
    "avatarFileId": s.ref("files").optional(),
    "origin": s.string(),
    "setupPromptDismissed": s.boolean(),
  })
},
});
