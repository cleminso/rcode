import { schema as s } from "jazz-tools";

export default s.defineMigration({
  migrate: {
    "rooms": {
      "archivedAt": s.add.timestamp({ default: null }),
      "archivedBySessionUserId": s.add.string({ default: null }),
    },
  },
  fromHash: "876176f0c723",
  toHash: "9da15ab98cc6",
  from: {
  "rooms": s.table({
    "shareToken": s.string(),
    "staticToken": s.string(),
    "creator_session_user_id": s.string(),
  })
},
  to: {
  "rooms": s.table({
    "shareToken": s.string(),
    "staticToken": s.string(),
    "creator_session_user_id": s.string(),
    "archivedAt": s.timestamp().optional(),
    "archivedBySessionUserId": s.string().optional(),
  })
},
});
