import { schema as s } from "jazz-tools";

export default s.defineMigration({
  createTables: {
    "file_parts": true,
    "files": true,
  },
  migrate: {
    "profiles": {
      "avatarFileId": s.add.ref("files", { default: null }),
    },
  },
  fromHash: "34741539d8dc",
  toHash: "2af230f349d5",
  from: {
  "profiles": s.table({
    "session_user_id": s.string(),
    "displayName": s.string(),
    "avatar": s.string().optional(),
  })
},
  to: {
  "file_parts": s.table({
    "data": s.bytes(),
  }),
  "files": s.table({
    "name": s.string().optional(),
    "mimeType": s.string(),
    "partIds": s.array(s.ref("file_parts")),
    "partSizes": s.array(s.int()),
  }),
  "profiles": s.table({
    "session_user_id": s.string(),
    "displayName": s.string(),
    "avatar": s.string().optional(),
    "avatarFileId": s.ref("files").optional(),
  })
},
});
