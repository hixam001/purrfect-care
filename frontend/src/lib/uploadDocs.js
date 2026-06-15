/**
 * uploadVerificationDoc
 * Uploads a verification document to the private 'verification-docs' bucket.
 * Path structure: {userId}/{slugifiedLabel}_{timestamp}.{ext}
 *
 * The Supabase client MUST have an active session (set via setSession)
 * so the Storage RLS policy can verify auth.uid().
 *
 * @param {object} supabase     — Supabase client instance (with session already set)
 * @param {string} userId       — Supabase auth.uid() of the uploading user
 * @param {string} label        — document label (e.g. 'Owner CNIC')
 * @param {File}   file         — File object from <input type="file">
 * @returns {Promise<string>}   — storage path (relative, NOT a public URL)
 */
export async function uploadVerificationDoc(supabase, userId, label, file) {
  const ext  = file.name.split('.').pop().toLowerCase()
  const slug = label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')
  const path = `${userId}/${slug}_${Date.now()}.${ext}`

  const { error } = await supabase.storage
    .from('verification-docs')
    .upload(path, file, { upsert: true, contentType: file.type })

  if (error) throw new Error(`Upload failed for "${label}": ${error.message}`)
  return path
}

/**
 * uploadAllDocs
 * Authenticates the Supabase client with the provided tokens,
 * then uploads all documents and returns a map of { label: storagePath }.
 *
 * @param {object} supabase
 * @param {string} userId        — Supabase auth UID (user_profiles.user_id)
 * @param {object} docs          — { [label]: File }
 * @param {string} accessToken   — JWT access token from registration response
 * @param {string} refreshToken  — JWT refresh token (optional)
 * @returns {Promise<object>}    — { [label]: storagePath }
 */
export async function uploadAllDocs(supabase, userId, docs, accessToken = '', refreshToken = '') {
  // Set the user session so Storage RLS (auth.uid()) works
  if (accessToken) {
    await supabase.auth.setSession({
      access_token:  accessToken,
      refresh_token: refreshToken || accessToken,  // fallback to prevent null error
    }).catch(() => {})  // non-fatal if session set fails
  }

  const results = {}
  for (const [label, file] of Object.entries(docs)) {
    if (file instanceof File) {
      results[label] = await uploadVerificationDoc(supabase, userId, label, file)
    }
  }
  return results
}
