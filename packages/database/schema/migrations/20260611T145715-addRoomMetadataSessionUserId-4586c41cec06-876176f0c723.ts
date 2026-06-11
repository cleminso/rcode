import { schema as s } from "jazz-tools";

export default s.defineMigration({
  migrate: {
    "roomMetadata": {
      session_user_id: s.add.string({ default: "" }),
    },
  },
  fromHash: "4586c41cec06",
  toHash: "876176f0c723",
  from: {
  "roomMetadata": s.table({
    "room_id": s.ref("rooms"),
    "title": s.string(),
    "editorLanguage": s.string(),
  })
},
  to: {
  "roomMetadata": s.table({
    "room_id": s.ref("rooms"),
    "session_user_id": s.string(),
    "title": s.string(),
    "editorLanguage": s.string(),
  })
},
});
