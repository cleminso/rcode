export interface ProfileRowLike {
  avatarFileId?: string | null;
  displayName: string;
  id: string;
  session_user_id: string;
}

export function selectProfileRow<TProfile extends ProfileRowLike>(profileRows: readonly TProfile[] | undefined, sessionUserId: string | null) {
  if (profileRows === undefined || sessionUserId === null) {
    return null;
  }

  return profileRows.find((profile) => profile.session_user_id === sessionUserId) ?? null;
}
