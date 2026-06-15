import { schema as s } from "jazz-tools";

export default s.defineMigration({
  migrate: {
    "profiles": {
      isGuest: s.drop.boolean({ backwardsDefault: false }),
    },
  },
  fromHash: "9da15ab98cc6",
  toHash: "34741539d8dc",
  from: {
  "profiles": s.table({
    "session_user_id": s.string(),
    "displayName": s.string(),
    "avatar": s.string().optional(),
    "isGuest": s.boolean(),
  })
},
  to: {
  "profiles": s.table({
    "session_user_id": s.string(),
    "displayName": s.string(),
    "avatar": s.string().optional(),
  })
},
});
