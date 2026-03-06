// ===== AUTHENTICATION MODULE — Supabase =====
import { supabase } from './supabase.js';

let _currentUser = null;   // { id, name, email, role, department, initials, office, ... }
let _authUser = null;       // Supabase auth.user object

// ===== INITIALIZE — check for existing session =====
export async function initAuth() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
        _authUser = session.user;
        _currentUser = await _fetchProfile(session.user.id);
    }
    return _currentUser;
}

// ===== REGISTER with email + password =====
export async function registerWithEmail(email, password, profile) {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return { error: error.message };
    if (!data.user) return { error: 'Registration failed. Please try again.' };

    // Create profile in database
    const profileData = {
        id: data.user.id,
        name: profile.name,
        email: email.toLowerCase(),
        mobile: profile.mobile || '',
        role: profile.role || 'employee',
        department: profile.department || 'IT',
        office: profile.office || 'off1',
        initials: _makeInitials(profile.name),
    };

    const { error: profileError } = await supabase.from('profiles').insert(profileData);
    if (profileError) return { error: profileError.message };

    _authUser = data.user;
    _currentUser = profileData;
    return { user: _currentUser };
}

// ===== LOGIN with email + password =====
export async function loginWithEmail(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };

    _authUser = data.user;
    _currentUser = await _fetchProfile(data.user.id);
    if (!_currentUser) return { error: 'Profile not found. Please register first.' };
    return { user: _currentUser };
}

// ===== LOGIN with Google =====
export async function loginWithGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: window.location.origin,
        }
    });
    if (error) return { error: error.message };
    // After redirect, onAuthStateChange will handle the rest
    return { success: true };
}

// ===== Create profile for Google user (after OAuth redirect) =====
export async function createGoogleProfile(user, role) {
    const profileData = {
        id: user.id,
        name: user.user_metadata?.full_name || user.email.split('@')[0],
        email: user.email,
        mobile: '',
        role: role,
        department: 'IT',
        office: 'off1',
        initials: _makeInitials(user.user_metadata?.full_name || user.email.split('@')[0]),
    };

    const { error } = await supabase.from('profiles').upsert(profileData);
    if (error) return { error: error.message };

    _currentUser = profileData;
    return { user: _currentUser };
}

// ===== LOGOUT =====
export async function logout() {
    await supabase.auth.signOut();
    _currentUser = null;
    _authUser = null;
}

// ===== AUTH STATE CHANGE LISTENER =====
export function onAuthChange(callback) {
    return supabase.auth.onAuthStateChange(async (event, session) => {
        if (session?.user) {
            _authUser = session.user;
            _currentUser = await _fetchProfile(session.user.id);
            callback(event, _currentUser, session.user);
        } else {
            _authUser = null;
            _currentUser = null;
            callback(event, null, null);
        }
    });
}

// ===== GETTERS =====
export function getCurrentUser() { return _currentUser; }
export function getAuthUser() { return _authUser; }

export function isAdmin() {
    return _currentUser?.role === 'admin';
}

export function isManager() {
    return _currentUser?.role === 'manager' || _currentUser?.role === 'admin';
}

export function hasPermission(permission) {
    if (!_currentUser) return false;
    const permissions = {
        admin: ['manage_rooms', 'manage_users', 'manage_settings', 'view_analytics', 'book_rooms', 'manage_bookings', 'view_signage', 'checkin'],
        manager: ['view_analytics', 'book_rooms', 'manage_bookings', 'view_signage', 'checkin'],
        employee: ['book_rooms', 'view_signage', 'checkin'],
    };
    return (permissions[_currentUser.role] || []).includes(permission);
}

// ===== FETCH all profiles (for attendee lists, admin panel, etc.) =====
export async function fetchAllProfiles() {
    const { data, error } = await supabase.from('profiles').select('*');
    if (error) return [];
    return data;
}

// ===== PRIVATE HELPERS =====
async function _fetchProfile(userId) {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (error || !data) return null;
    return data;
}

function _makeInitials(name) {
    const parts = (name || '').trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return (name || 'U').substring(0, 2).toUpperCase();
}
