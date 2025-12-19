import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Default client for browser usage (no request-scoped header)
export const supabase = createClient(supabaseUrl, supabaseKey)

// Create a server-side client that forwards a user's access token
export function createSupabaseClientWithToken(token?: string) {
	return createClient(supabaseUrl, supabaseKey, {
		global: {
			headers: token ? {
				Authorization: `Bearer ${token}`
			} : {}
		}
	})
}

// Convenience helper to build a client from a Next.js Request (reads Authorization header)
export function createSupabaseClientFromRequest(req: Request) {
	const authHeader = req.headers.get('authorization') || req.headers.get('Authorization') || ''
	const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : authHeader || undefined
	return createSupabaseClientWithToken(token)
}
