// ===== APP ENTRY POINT =====
document.addEventListener('DOMContentLoaded', () => {
    initStore();
    const user = initAuth();

    if (user) { showApp(); }
    else { showLogin(); }

    // ===== AUTH TABS (Login / Register toggle) =====
    document.querySelectorAll('#auth-tabs .tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('#auth-tabs .tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            if (tab.dataset.tab === 'login') {
                document.getElementById('login-form').classList.remove('hidden');
                document.getElementById('register-form').classList.add('hidden');
            } else {
                document.getElementById('login-form').classList.add('hidden');
                document.getElementById('register-form').classList.remove('hidden');
                // Populate offices dropdown in register form
                const offSel = document.getElementById('reg-office');
                if (offSel && offSel.options.length === 0) {
                    getOffices().forEach(o => {
                        const opt = document.createElement('option');
                        opt.value = o.id;
                        opt.textContent = o.name.split('—')[0].trim();
                        offSel.appendChild(opt);
                    });
                }
            }
        });
    });

    // ===== LOGIN FORM =====
    document.getElementById('login-form')?.addEventListener('submit', e => {
        e.preventDefault();
        const emailOrMobile = document.getElementById('login-email').value.trim();
        const pw = document.getElementById('login-password').value;

        if (!emailOrMobile) { showToast('Enter your email or mobile number', 'warning'); return; }
        if (!pw) { showToast('Enter your password', 'warning'); return; }

        const u = findUserByEmailOrMobile(emailOrMobile);
        if (!u) {
            showToast('Account not found. Please register first.', 'error');
            return;
        }
        if (u.password !== pw) {
            showToast('Incorrect password. Please try again.', 'error');
            return;
        }

        doLogin(u);
        showApp();
        showToast(`Welcome back, ${u.name}!`, 'success');
    });

    // ===== REGISTER FORM =====
    document.getElementById('register-form')?.addEventListener('submit', e => {
        e.preventDefault();
        const name = document.getElementById('reg-name').value.trim();
        const email = document.getElementById('reg-email').value.trim();
        const mobile = document.getElementById('reg-mobile').value.trim();
        const dept = document.getElementById('reg-dept').value;
        const office = document.getElementById('reg-office').value;
        const pw = document.getElementById('reg-password').value;
        const confirm = document.getElementById('reg-confirm').value;

        if (!name || name.length < 2) { showToast('Enter your full name', 'warning'); return; }
        if (!email || !email.includes('@')) { showToast('Enter a valid email address', 'warning'); return; }
        if (mobile && (mobile.length < 10 || !/^\d+$/.test(mobile))) { showToast('Enter a valid mobile number (10+ digits)', 'warning'); return; }
        if (pw.length < 4) { showToast('Password must be at least 4 characters', 'warning'); return; }
        if (pw !== confirm) { showToast('Passwords do not match', 'error'); return; }

        const result = registerUser({ name, email, mobile, department: dept, office, password: pw, role: document.getElementById('reg-role')?.value || 'employee' });
        if (result.error) {
            showToast(result.error, 'error');
            return;
        }

        // Auto-login after registration
        doLogin(result.user);
        showApp();
        showToast(`Welcome, ${result.user.name}! Account created successfully.`, 'success');
    });

    // ===== LOGOUT =====
    document.getElementById('logout-btn')?.addEventListener('click', () => {
        doLogout();
        if (sigInt) clearInterval(sigInt);
        showLogin();
        window.location.hash = '';
        showToast('Logged out', 'info');
    });

    // ===== MOBILE MENU =====
    document.getElementById('mobile-menu-btn')?.addEventListener('click', () => {
        document.getElementById('sidebar').classList.toggle('open');
    });
    document.addEventListener('click', e => {
        const sb = document.getElementById('sidebar');
        const mb = document.getElementById('mobile-menu-btn');
        if (sb?.classList.contains('open') && !sb.contains(e.target) && e.target !== mb && !mb?.contains(e.target)) {
            sb.classList.remove('open');
        }
    });

    // ===== NOTIFICATIONS =====
    document.getElementById('notif-btn')?.addEventListener('click', () => {
        const p = document.getElementById('notif-panel');
        p.classList.toggle('hidden');
        if (!p.classList.contains('hidden')) renderNotifs();
    });
    document.getElementById('notif-close')?.addEventListener('click', () => {
        document.getElementById('notif-panel').classList.add('hidden');
    });

    // Modal overlay click
    document.getElementById('modal-overlay')?.addEventListener('click', e => {
        if (e.target.id === 'modal-overlay') closeModal();
    });

    on('notif', updateBadge);

    // Auto-release check every minute
    setInterval(() => autoRelease(), 60000);
});

function showLogin() {
    document.getElementById('login-screen').classList.remove('hidden');
    document.getElementById('app-shell').classList.add('hidden');
    // Reset forms
    document.getElementById('login-form')?.reset();
    document.getElementById('register-form')?.reset();
    // Show login tab by default
    document.getElementById('login-form')?.classList.remove('hidden');
    document.getElementById('register-form')?.classList.add('hidden');
    document.querySelectorAll('#auth-tabs .tab').forEach((t, i) => {
        t.classList.toggle('active', i === 0);
    });
    // Populate offices for register form
    const offSel = document.getElementById('reg-office');
    if (offSel) {
        offSel.innerHTML = '';
        getOffices().forEach(o => {
            const opt = document.createElement('option');
            opt.value = o.id;
            opt.textContent = o.name.split('—')[0].trim();
            offSel.appendChild(opt);
        });
    }
}

function showApp() {
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('app-shell').classList.remove('hidden');
    _routes = {
        '/dashboard': viewDashboard,
        '/booking': viewBooking,
        '/rooms': viewRooms,
        '/calendar': viewCalendar,
        '/signage': viewSignage,
        '/checkin': viewCheckin,
        '/analytics': viewAnalytics,
        '/admin': viewAdmin,
        '/profile': viewProfile,
        '/floorplan': viewFloorPlan,
    };
    window.addEventListener('hashchange', handleRoute);
    handleRoute();
    updateBadge();

    // Start reminder service and auto-release
    startReminderService();
    setInterval(() => autoRelease(), 60000);
}

function updateBadge() {
    const u = curUser(); if (!u) return;
    const c = getUnreadCount(u.id);
    const b = document.getElementById('notif-badge');
    if (b) { b.textContent = c; b.style.display = c > 0 ? 'flex' : 'none'; }
}

function renderNotifs() {
    const u = curUser(); if (!u) return;
    const ns = getNotifs(u.id), list = document.getElementById('notif-list');
    const ti = { booking: { i: 'fa-calendar-check', bg: 'rgba(232,101,45,.15)', c: 'var(--brand-orange)' }, reminder: { i: 'fa-bell', bg: 'rgba(251,191,36,.15)', c: 'var(--color-warning)' }, checkin: { i: 'fa-user-check', bg: 'rgba(34,197,94,.15)', c: 'var(--color-success)' }, release: { i: 'fa-door-open', bg: 'rgba(239,68,68,.15)', c: 'var(--color-error)' } };
    if (!list) return;
    list.innerHTML = ns.length === 0
        ? '<div style="text-align:center;padding:var(--space-xl);color:var(--text-muted)"><i class="fas fa-bell-slash" style="font-size:2rem;margin-bottom:8px;display:block;opacity:.3"></i>No notifications</div>'
        : `<div style="padding:4px var(--space-md)"><button class="btn btn-ghost btn-sm" style="width:100%" onclick="markAllRead('${u.id}');renderNotifs();updateBadge();"><i class="fas fa-check-double"></i> Mark all read</button></div>`
        + ns.map(n => {
            const t = ti[n.type] || ti.booking;
            const d = (Date.now() - new Date(n.time)) / 1000;
            const ago = d < 60 ? 'Just now' : d < 3600 ? `${Math.floor(d / 60)}m` : d < 86400 ? `${Math.floor(d / 3600)}h` : `${Math.floor(d / 86400)}d`;
            return `<div class="notif-item ${n.read ? '' : 'unread'}" onclick="markNotifRead('${n.id}');this.classList.remove('unread');updateBadge();"><div class="notif-icon" style="background:${t.bg};color:${t.c}"><i class="fas ${t.i}"></i></div><div class="notif-body"><div class="notif-title">${n.title}</div><div class="notif-desc">${n.message}</div><div class="notif-time">${ago} ago</div></div></div>`;
        }).join('');
}
