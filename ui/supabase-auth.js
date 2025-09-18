const supabase = supabase.createClient(window.config.SUPABASE_URL, window.config.SUPABASE_ANON_KEY);

/**
 * Signs up a new user using Supabase Auth and creates a profile in the public.users_plain table.
 * @param {string} email - The user's email, used as the actorId.
 * @param {string} password - The user's password.
 * @param {number} role - The user's role.
 * @returns {Promise<{user: any, error: any}>}
 */
async function signUp(email, password, role) {
    // Step 1: Create the user in Supabase's built-in auth system
    const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
    });

    if (authError) {
        return { user: null, error: authError };
    }

    if (authData.user) {
        // Step 2: Create a corresponding profile in the public.users_plain table
        const { error: profileError } = await supabase
            .from('users_plain')
            .insert([
                { 
                    id: authData.user.id, 
                    actorId: email, 
                    role: role, 
                    // Add other fields like fullName if available from signup form
                }
            ]);

        if (profileError) {
            // If profile creation fails, you might want to delete the created auth user
            // This is a more advanced cleanup step
            return { user: null, error: profileError };
        }

        return { user: authData.user, error: null };
    }

    return { user: null, error: new Error('An unknown error occurred during sign up.') };
}

/**
 * Signs in a user using Supabase Auth and verifies their role from the public.users_plain table.
 * @param {string} email - The user's email (actorId).
 * @param {string} password - The user's password.
 * @param {number} role - The role the user is trying to log in with.
 * @returns {Promise<any|null>}
 */
async function signIn(email, password, role) {
    // Step 1: Authenticate the user with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (authError) {
        console.error('Sign-in error:', authError.message);
        return null;
    }

    if (authData.user) {
        // Step 2: Verify the user's role from the public.users_plain table
        const { data: userProfile, error: profileError } = await supabase
            .from('users_plain')
            .select('role, actorId')
            .eq('id', authData.user.id)
            .eq('role', role)
            .single();

        if (profileError || !userProfile) {
            console.error('Profile error or role mismatch:', profileError?.message);
            await supabase.auth.signOut(); // Sign out if role doesn't match
            return null;
        }

        // If authentication and role verification are successful
        return {
            actorId: userProfile.actorId,
            role: userProfile.role,
            name: userProfile.actorId // Or a fullName from the profile if you add it
        };
    }

    return null;
}

/**
 * Signs out the current user.
 */
async function signOut() {
    await supabase.auth.signOut();
    sessionStorage.removeItem('ayurtrace_currentUserKey');
    localStorage.clear(); // Consider a more targeted clear
    window.location.href = 'login.html';
}

// Make functions available globally
window.signUp = signUp;
window.signIn = signIn;
window.signOut = signOut;