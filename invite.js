/**
 * invite.js - Private Builder Script
 * Handles link generation, preview updates, theme toggling, and mobile navigation.
 */

document.addEventListener('DOMContentLoaded', () => {
    // ======================================================================
    // 1. THEME MANAGER & MOBILE DRAWER
    // ======================================================================
    const toggles = document.querySelectorAll('.theme-toggle');
    const themePills = document.querySelectorAll('[data-set-theme]');
    const mobileBtn = document.getElementById('mobile-menu-toggle');
    const drawer = document.getElementById('mobile-menu-drawer');
    const closeBtn = document.getElementById('mobile-drawer-close');
    const backdrop = document.getElementById('mobile-drawer-backdrop');

    const getStored = () => {
        try { return localStorage.getItem('theme'); } catch (e) { return null; }
    };
    const setStored = (theme) => {
        try { localStorage.setItem('theme', theme); } catch (e) {}
    };
    const applyTheme = (theme) => {
        document.documentElement.setAttribute('data-theme', theme);
        toggles.forEach(btn => {
            btn.setAttribute('aria-pressed', theme === 'dark');
            const sun = btn.querySelector('.sun');
            const moon = btn.querySelector('.moon');
            if (sun && moon) {
                sun.style.display = theme === 'dark' ? 'none' : 'block';
                moon.style.display = theme === 'dark' ? 'block' : 'none';
            }
        });
        themePills.forEach(p => {
            if (p.getAttribute('data-set-theme') === theme) {
                p.classList.add('active');
            } else {
                p.classList.remove('active');
            }
        });
    };

    let current = getStored();
    if (current !== 'dark') current = 'light';
    applyTheme(current);

    toggles.forEach(btn => {
        btn.addEventListener('click', () => {
            current = current === 'dark' ? 'light' : 'dark';
            applyTheme(current);
            setStored(current);
        });
    });

    themePills.forEach(pill => {
        pill.addEventListener('click', () => {
            const theme = pill.getAttribute('data-set-theme');
            if (theme) {
                current = theme;
                applyTheme(current);
                setStored(current);
            }
        });
    });

    // Mobile menu drawer
    const openDrawer = () => {
        if (!drawer) return;
        drawer.classList.add('is-open');
        drawer.setAttribute('aria-hidden', 'false');
        document.body.classList.add('menu-open');
        if (mobileBtn) {
            mobileBtn.setAttribute('aria-expanded', 'true');
            mobileBtn.innerHTML = '<svg viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" stroke-width="2.2" fill="none"><path d="M18 6L6 18M6 6l12 12" /></svg>';
        }
    };
    const closeDrawer = () => {
        if (!drawer) return;
        drawer.classList.remove('is-open');
        drawer.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('menu-open');
        if (mobileBtn) {
            mobileBtn.setAttribute('aria-expanded', 'false');
            mobileBtn.innerHTML = '<svg viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" stroke-width="2.2" fill="none"><path d="M4 6h16M4 12h16M4 18h16" /></svg>';
        }
    };

    if (mobileBtn && drawer) {
        mobileBtn.addEventListener('click', () => {
            if (drawer.classList.contains('is-open')) {
                closeDrawer();
            } else {
                openDrawer();
            }
        });
    }
    closeBtn?.addEventListener('click', closeDrawer);
    backdrop?.addEventListener('click', closeDrawer);
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && drawer?.classList.contains('is-open')) closeDrawer();
    });

    // Scroll to Top button
    const scrollTopBtn = document.getElementById('scroll-top-btn');
    if (scrollTopBtn) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 350) {
                scrollTopBtn.classList.add('is-visible');
            } else {
                scrollTopBtn.classList.remove('is-visible');
            }
        }, { passive: true });
        scrollTopBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // ======================================================================
    // 2. BUILDER CONTROLS & LINK GENERATOR
    // ======================================================================
    const input = document.getElementById('names-input');
    const genBtn = document.getElementById('generate-btn');
    const copyAllBtn = document.getElementById('copy-all-btn');
    const container = document.getElementById('links-container');
    const previewName = document.getElementById('preview-name');
    const baseUrlInput = document.getElementById('base-url-input');
    const envLocalBtn = document.getElementById('env-local');
    const envProdBtn = document.getElementById('env-prod');

    // Default URLs
    const prodUrl = "https://AbeeshSengottuvel.github.io/automation-invitation/";
    const localUrl = window.location.origin.startsWith('http') 
        ? `${window.location.origin}/` 
        : "http://localhost:3000/";

    // Set initial input
    let isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:';
    baseUrlInput.value = isLocal ? localUrl : prodUrl;
    if (isLocal) {
        envLocalBtn.classList.add('active');
        envProdBtn.classList.remove('active');
    } else {
        envProdBtn.classList.add('active');
        envLocalBtn.classList.remove('active');
    }

    envLocalBtn.addEventListener('click', () => {
        envLocalBtn.classList.add('active');
        envProdBtn.classList.remove('active');
        baseUrlInput.value = localUrl;
        generateLinks();
    });

    envProdBtn.addEventListener('click', () => {
        envProdBtn.classList.add('active');
        envLocalBtn.classList.remove('active');
        baseUrlInput.value = prodUrl;
        generateLinks();
    });

    // Shared sanitize logic (same as script.js)
    const sanitizeName = (str) => {
        if (!str) return null;
        const clean = str.trim().substring(0, 40).replace(/[^a-zA-Z\s'\-\.]/g, '');
        return clean.length > 0 ? clean : null;
    };

    const generateLinks = () => {
        const text = input.value;
        const lines = text.split('\n');
        container.innerHTML = '';
        let validLinks = [];
        let base = baseUrlInput.value.trim();
        if (!base.endsWith('/') && !base.endsWith('.html')) {
            base += '/';
        }

        lines.forEach(line => {
            const clean = sanitizeName(line);
            if (clean) {
                const url = `${base}?name=${encodeURIComponent(clean)}`;
                validLinks.push({ name: clean, url });
                
                const div = document.createElement('div');
                div.className = 'link-item';
                
                const span = document.createElement('span');
                span.style.overflow = 'hidden';
                span.style.textOverflow = 'ellipsis';
                span.style.wordBreak = 'break-all';
                span.style.flex = '1';
                span.innerHTML = `<strong>${clean}</strong><br><small style="color:var(--text-muted);font-size:11.5px;">${url}</small>`;
                
                const actions = document.createElement('div');
                actions.className = 'link-actions';

                const copyBtn = document.createElement('button');
                copyBtn.className = 'btn secondary small';
                copyBtn.textContent = 'Copy';
                copyBtn.onclick = () => {
                    navigator.clipboard.writeText(url);
                    copyBtn.textContent = 'Copied!';
                    setTimeout(() => copyBtn.textContent = 'Copy', 2000);
                };

                const openBtn = document.createElement('a');
                openBtn.className = 'btn primary small';
                openBtn.textContent = 'Open';
                openBtn.href = url;
                openBtn.target = '_blank';
                openBtn.rel = 'noopener noreferrer';

                actions.appendChild(copyBtn);
                actions.appendChild(openBtn);

                div.appendChild(span);
                div.appendChild(actions);
                container.appendChild(div);
            }
        });

        // Store for copy all
        copyAllBtn.onclick = () => {
            if (validLinks.length === 0) return;
            const txt = validLinks.map(l => `${l.name}:\n${l.url}`).join('\n\n');
            navigator.clipboard.writeText(txt);
            copyAllBtn.textContent = 'Copied All!';
            setTimeout(() => copyAllBtn.textContent = 'Copy All', 2000);
        };
    };

    input.addEventListener('input', () => {
        const lines = input.value.split('\n');
        const first = sanitizeName(lines[0]);
        if (first) {
            previewName.textContent = `${first}, you're invited`;
        } else {
            previewName.textContent = `You're invited`;
        }
    });

    genBtn.addEventListener('click', generateLinks);

    // Initial placeholder names
    if (!input.value) {
        input.value = "John Doe\nSarah Connor\nNeo";
        previewName.textContent = "John Doe, you're invited";
        generateLinks();
    }
});
