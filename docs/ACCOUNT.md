# Authenticated Account Foundation

`/account` consumes the authenticated `GET /home` response, while `/account/profile` is limited to the supported profile fields and continues to save through the existing `PUT /profile` flow.

`UserAvatar` renders the backend-provided `avatar_url` when it is available and falls back to initials if it is absent, loading, or fails. The current backend does not expose a confirmed profile-image upload endpoint, so this frontend intentionally has no upload control or client-side image storage.
