// supabase-auth.js (table-based auth using public.users_plain)
const supabaseClient = window.supabase.createClient(
    window.config.SUPABASE_URL,
    window.config.SUPABASE_ANON_KEY
);

// Local session helpers
const SESSION_KEY = 'ayurtrace_user';
function saveSession(user) {
    try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(user)); } catch {}
}
function clearSession() {
    try { sessionStorage.removeItem(SESSION_KEY); } catch {}
}
function readSession() {
    try {
        const raw = sessionStorage.getItem(SESSION_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch { return null; }
}

/**
 * Sign up a new user by inserting into public.users_plain
 * Columns: actorId, password, fullName, phone, address, role
 * Unique: (actorId, role)
 */
async function signUp(actorId, password, role, fullName, phone, address) {
    try {
        const payload = {
            actorId,
            password,
            fullName,
            phone,
            address,
            role
        };

        const { data, error } = await supabaseClient
            .from('users_plain')
            .insert([payload])
            .select()
            .single();

        if (error) {
            // 23505 = unique_violation
            if (error.code === '23505') {
                error.message = 'This Actor ID with the selected role already exists.';
            }
            return { user: null, error };
        }

        return { user: data, error: null };
    } catch (error) {
        console.error('Sign-up error:', error);
        return { user: null, error };
    }
}

/**
 * Sign in by matching credentials in public.users_plain
 */
async function signIn(actorId, password, role) {
    try {
        const { data: user, error } = await supabaseClient
            .from('users_plain')
            .select('*')
            .eq('actorId', actorId)
            .eq('role', role)
            .single();

        if (error || !user) {
            return null;
        }

        if (user.password !== password) {
            return null;
        }

        const sessionUser = {
            id: user.id,
            actorId: user.actorId,
            role: user.role,
            name: user.fullName || user.actorId
        };
        saveSession(sessionUser);
        return sessionUser;
    } catch (error) {
        console.error('Sign-in error:', error);
        return null;
    }
}

/** Sign out: clear local session only */
async function signOut() {
    clearSession();
    window.location.href = 'login.html';
}

/** Get current user from local session */
async function getCurrentUser() {
    return readSession();
}

/** Is user authenticated? */
async function isAuthenticated() {
    return !!readSession();
}

// Expose globals
window.signUp = signUp;
window.signIn = signIn;
window.signOut = signOut;
window.getCurrentUser = getCurrentUser;
window.isAuthenticated = isAuthenticated;
window.supabaseClient = supabaseClient;