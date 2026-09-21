import { schema as s } from "jazz-tools";

export default s.defineMigration({
  migrate: {
    "profiles": {
      "avatar": s.drop.string({ backwardsDefault: null }),
      "avatarFileId": s.drop.ref("files", { backwardsDefault: null }),
    },
  },
  fromHash: "27bcb86a0633",
  toHash: "cb9f43031399",
  from: {
  "profiles": s.table({
    "session_user_id": s.string(),
    "displayName": s.string(),
    "avatar": s.string().optional(),
    "avatarFileId": s.uuid().optional(),
  }, { "avatarFile": s.rel("files", "avatarFileId") })
},
  to: {
  "profiles": s.table({
    "session_user_id": s.string(),
    "displayName": s.string(),
  }, {})
},
});
