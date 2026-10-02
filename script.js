/**
 * script.js - Automation Arena Main Script
 * Handles UI interactions, data fetching, animations, and state.
 */

const App = (() => {
    // ======================================================================
    // 1. CONFIGURATION
    // ======================================================================
    const CONFIG = {
        startDate: new Date("2026-10-09T15:00:00+05:30"),
        dataUrls: {
            tech: 'data/tech.json',
            results: 'data/results.json'
        },
        fetchTimeoutMs: 10000,
        refreshIntervalMs: 60000,
        konamiCode: ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'],
        tests: [
            "Login", "Dashboard", "PIM", "Admin", "Leave", "Time", "Recruitment", 
            "My Info", "Performance", "Directory", "Claim", "Buzz", "Maintenance", "Logout"
        ]
    };

    // ======================================================================
    // 2. UTILS
    // ======================================================================
    const utils = {
        debounce: (fn, delay) => {
            let timeoutId;
            return (...args) => {
                clearTimeout(timeoutId);
                timeoutId = setTimeout(() => fn(...args), delay);
            };
        },
        clamp: (num, min, max) => Math.min(Math.max(num, min), max),
        sanitizeName: (str) => {
            if (!str) return null;
            // Trim, max 40 chars, allow letters, spaces, apostrophes, hyphens, dots
            const clean = str.trim().substring(0, 40).replace(/[^a-zA-Z\s'\-\.]/g, '');
            return clean.length > 0 ? clean : null;
        },
        fetchJson: async (url) => {
            const controller = new AbortController();
            const id = setTimeout(() => controller.abort(), CONFIG.fetchTimeoutMs);
            try {
                // cache busting
                const res = await fetch(`${url}?t=${Date.now()}`, { signal: controller.signal });
                clearTimeout(id);
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                return await res.json();
            } catch (error) {
                clearTimeout(id);
                console.error(`Fetch failed for ${url}:`, error);
                throw error;
            }
        },
        prefersReducedMotion: () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
    };

    // ======================================================================
    // 3. THEME MANAGER
    // ======================================================================
    const ThemeManager = {
        init: () => {
            const toggles = document.querySelectorAll('.theme-toggle');
            const themePills = document.querySelectorAll('[data-set-theme]');
            
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
                    if(sun && moon) {
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
            if (current !== 'dark') {
                current = 'light';
            }
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
        }
    };

    // Unified Accept Challenge / Invitation Handler
    const triggerAcceptChallenge = (e) => {
        if (e && e.preventDefault) {
            e.preventDefault();
        }

        // Celebratory Apple-style Confetti
        if (typeof confetti !== 'undefined' && !utils.prefersReducedMotion()) {
            confetti({
                particleCount: 120,
                spread: 80,
                origin: { y: 0.6 },
                colors: ['#0071e3', '#34c759', '#ff9500', '#af52de', '#ff2d55']
            });
        }

        const stepsSection = document.getElementById('steps');
        if (stepsSection) {
            const stepsHeading = stepsSection.querySelector('h2') || stepsSection;
            stepsHeading.scrollIntoView({ behavior: 'smooth' });

            try {
                history.pushState(null, '', '#steps');
            } catch (err) {}

            setTimeout(() => {
                const firstStep = document.querySelector('.step-cards .card');
                if (firstStep) {
                    firstStep.style.transition = 'transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.4s ease, border-color 0.4s ease';
                    firstStep.style.transform = 'scale(1.04)';
                    firstStep.style.boxShadow = '0 12px 32px rgba(0, 113, 227, 0.2)';
                    firstStep.style.borderColor = 'var(--apple-blue, #0071e3)';
                    setTimeout(() => {
                        firstStep.style.transform = '';
                        firstStep.style.boxShadow = '';
                        firstStep.style.borderColor = '';
                    }, 700);
                }
            }, 650);
        }
    };

    // ======================================================================
    // 4. INVITATION & INTRO
    // ======================================================================
    const Invitation = {
        init: () => {
            // Intro Draw
            const overlay = document.getElementById('intro-overlay');
            if (overlay) {
                // If opening directly to a section (e.g. from tests.html to #rules, #scoring), bypass overlay
                if (window.location.hash && window.location.hash !== '#hero') {
                    overlay.style.display = 'none';
                } else {
                    const hasSeen = (() => {
                        try { return sessionStorage.getItem('seenIntro'); } catch(e) { return false; }
                    })();
                    
                    if (hasSeen || utils.prefersReducedMotion()) {
                        overlay.style.display = 'none';
                    } else {
                        setTimeout(() => {
                            overlay.style.opacity = '0';
                            setTimeout(() => overlay.style.display = 'none', 600);
                            try { sessionStorage.setItem('seenIntro', 'true'); } catch(e){}
                        }, 1200);

                        // Skip on interaction
                        const skip = () => { overlay.style.display = 'none'; try { sessionStorage.setItem('seenIntro', 'true'); } catch(e){} };
                        overlay.addEventListener('click', skip);
                        document.addEventListener('keydown', skip, { once: true });
                    }
                }
            }

            // Name Parsing
            const params = new URLSearchParams(window.location.search);
            const nameEl = document.getElementById('guest-name');
            if (nameEl && params.has('name')) {
                const cleanName = utils.sanitizeName(params.get('name'));
                if (cleanName) {
                    nameEl.textContent = `${cleanName}, you're invited`;
                }
            }

            // Accept Button in Hero
            const acceptBtn = document.getElementById('accept-btn');
            if (acceptBtn) {
                acceptBtn.addEventListener('click', triggerAcceptChallenge);
            }

            // Accept Link in Header Nav
            const navAcceptBtns = document.querySelectorAll('.nav-accept');
            navAcceptBtns.forEach(btn => {
                btn.addEventListener('click', triggerAcceptChallenge);
            });
        }
    };



    // ======================================================================
    // 6. TERMINAL SIMULATOR
    // ======================================================================
    const Terminal = {
        init: () => {
            const logsEl = document.getElementById('runner-logs');
            const countEl = document.querySelector('.pass-count');
            const timerEl = document.querySelector('.timer');
            if (!logsEl || utils.prefersReducedMotion()) return;

            let testCount = 0;
            let time = 0;
            let intervalId;
            let isPaused = false;

            const baseTests = CONFIG.tests;
            // Generate 40 tests
            const allTests = Array.from({length: 40}, (_, i) => `${baseTests[i % baseTests.length]} [${i+1}]`);
            
            // Intersection Observer to pause when off-screen
            const observer = new IntersectionObserver((entries) => {
                isPaused = !entries[0].isIntersecting;
            });
            observer.observe(document.querySelector('.test-runner'));

            // Document visibility
            document.addEventListener('visibilitychange', () => {
                isPaused = document.hidden;
            });

            const runLoop = async () => {
                logsEl.innerHTML = '';
                testCount = 0;
                time = 0;
                if(countEl) countEl.textContent = `0/40`;
                
                let t = setInterval(() => { if(!isPaused) { time++; if(timerEl) timerEl.textContent = `00:${time.toString().padStart(2,'0')}`; } }, 1000);

                for (let i = 0; i < 40; i++) {
                    while(isPaused) await new Promise(r => setTimeout(r, 100));

                    const row = document.createElement('li');
                    row.className = 'test-row running';
                    row.innerHTML = `<span>${allTests[i]}</span><span class="icon">↻</span>`;
                    logsEl.appendChild(row);
                    logsEl.scrollTop = logsEl.scrollHeight;

                    await new Promise(r => setTimeout(r, 80 + Math.random() * 150));

                    // Fake 2 retries
                    if (i === 12 || i === 25) {
                        row.className = 'test-row failed';
                        row.innerHTML = `<span>${allTests[i]} (retry 1/2)</span><span class="icon">✗</span>`;
                        await new Promise(r => setTimeout(r, 300));
                        row.className = 'test-row running';
                        row.innerHTML = `<span>${allTests[i]} (retry 2/2)</span><span class="icon">↻</span>`;
                        await new Promise(r => setTimeout(r, 200));
                    }

                    row.className = 'test-row passed';
                    row.innerHTML = `<span>${allTests[i]}</span><span class="icon">✓</span>`;
                    testCount++;
                    if(countEl) countEl.textContent = `${testCount}/40`;
                }

                clearInterval(t);
                await new Promise(r => setTimeout(r, 4000));
                runLoop(); // loop
            };

            runLoop();
        }
    };

    // ======================================================================
    // 7. SCROLL REVEALS & STORY (GSAP)
    // ======================================================================
    const ScrollLogic = {
        init: () => {
            // Nav Highlighting (Apple-style ScrollSpy)
            const navLinks = document.querySelectorAll('.nav-links a');
            const mobileLinks = document.querySelectorAll('.apple-list-row, .mobile-nav-link');
            const sections = Array.from(document.querySelectorAll('section[id]'));

            const updateActiveNav = () => {
                const scrollPos = window.scrollY + 140;
                let currentSection = '';

                for (let i = sections.length - 1; i >= 0; i--) {
                    const sec = sections[i];
                    if (sec.offsetTop <= scrollPos) {
                        currentSection = sec.id;
                        break;
                    }
                }

                if (!currentSection && sections.length > 0) {
                    currentSection = sections[0].id;
                }

                navLinks.forEach(link => {
                    const href = link.getAttribute('href');
                    if (href && (href === `#${currentSection}` || href.endsWith(`#${currentSection}`))) {
                        link.classList.add('active');
                    } else if (href && !href.includes('tests.html')) {
                        link.classList.remove('active');
                    }
                });

                mobileLinks.forEach(link => {
                    const dataNav = link.getAttribute('data-nav');
                    const href = link.getAttribute('href');
                    if (dataNav === currentSection || (href && href.endsWith(`#${currentSection}`))) {
                        link.classList.add('active');
                    } else if (dataNav !== 'tests' && dataNav !== 'invite') {
                        link.classList.remove('active');
                    }
                });
            };

            window.addEventListener('scroll', utils.debounce(updateActiveNav, 20), { passive: true });
            updateActiveNav();

            // Smooth click scroll with immediate active styling
            navLinks.forEach(link => {
                const href = link.getAttribute('href');
                if (href && href.startsWith('#')) {
                    link.addEventListener('click', (e) => {
                        const target = document.querySelector(href);
                        if (target) {
                            e.preventDefault();
                            navLinks.forEach(l => l.classList.remove('active'));
                            link.classList.add('active');
                            target.scrollIntoView({ behavior: 'smooth' });
                            history.pushState(null, '', href);
                        }
                    });
                }
            });

            // Handle cross-page hash navigation on load (e.g. from tests.html)
            const handleHashOnLoad = () => {
                const hash = window.location.hash;
                if (hash && hash !== '#hero') {
                    const target = document.querySelector(hash);
                    if (target) {
                        setTimeout(() => {
                            target.scrollIntoView({ behavior: 'smooth' });
                            updateActiveNav();
                        }, 100);
                    }
                }
            };
            window.addEventListener('load', handleHashOnLoad);

            // Super Senior Mobile Menu Controller
            const mobileBtn = document.querySelector('.mobile-menu-btn');
            const drawer = document.getElementById('mobile-menu-drawer');
            const closeBtn = document.getElementById('mobile-drawer-close');
            const backdrop = document.getElementById('mobile-drawer-backdrop');
            const drawerAcceptBtn = document.getElementById('mobile-drawer-accept-btn');

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
                    mobileBtn.innerHTML = '<svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none"><path d="M4 6h16M4 12h16M4 18h16" /></svg>';
                }
            };

            if (mobileBtn && drawer) {
                mobileBtn.addEventListener('click', () => {
                    const isOpen = drawer.classList.contains('is-open');
                    if (isOpen) {
                        closeDrawer();
                    } else {
                        openDrawer();
                    }
                });

                if (window.location.search.includes('drawer=open') || window.location.hash === '#menu') {
                    setTimeout(openDrawer, 150);
                }
            }

            closeBtn?.addEventListener('click', closeDrawer);
            backdrop?.addEventListener('click', closeDrawer);

            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && drawer?.classList.contains('is-open')) {
                    closeDrawer();
                }
            });

            // Handle mobile navigation link taps
            mobileLinks.forEach(link => {
                link.addEventListener('click', (e) => {
                    const href = link.getAttribute('href');
                    if (href && (href.startsWith('#') || href.startsWith('index.html#'))) {
                        const targetId = href.split('#')[1];
                        const target = document.getElementById(targetId);
                        if (target) {
                            e.preventDefault();
                            closeDrawer();
                            setTimeout(() => {
                                target.scrollIntoView({ behavior: 'smooth' });
                                history.pushState(null, '', `#${targetId}`);
                                updateActiveNav();
                            }, 120);
                        } else {
                            closeDrawer();
                        }
                    } else {
                        closeDrawer();
                    }
                });
            });

            if (drawerAcceptBtn) {
                drawerAcceptBtn.addEventListener('click', (e) => {
                    if (e && e.preventDefault) e.preventDefault();
                    closeDrawer();
                    setTimeout(() => {
                        triggerAcceptChallenge();
                    }, 220);
                });
            }

            // Floating Scroll to Top button
            const scrollTopBtn = document.getElementById('scroll-top-btn');
            if (scrollTopBtn) {
                window.addEventListener('scroll', utils.debounce(() => {
                    if (window.scrollY > 350) {
                        scrollTopBtn.classList.add('is-visible');
                    } else {
                        scrollTopBtn.classList.remove('is-visible');
                    }
                }, 30), { passive: true });

                scrollTopBtn.addEventListener('click', () => {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                });
            }

            // Simple reveals for elements not using GSAP
            const revealElements = document.querySelectorAll('.reveal');
            const revealObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.style.opacity = '1';
                        entry.target.style.transform = 'translateY(0)';
                        revealObserver.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.1 });
            revealElements.forEach(el => {
                el.style.opacity = '0';
                el.style.transform = 'translateY(24px)';
                el.style.transition = 'opacity 0.6s var(--ease-out), transform 0.6s var(--ease-out)';
                revealObserver.observe(el);
            });

            // GSAP ScrollTrigger implementations
            if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
                gsap.registerPlugin(ScrollTrigger);

                // Story pinned scroll
                const steps = gsap.utils.toArray('.story-step');
                if (steps.length) {
                    gsap.to(steps, {
                        opacity: 1,
                        stagger: 1,
                        scrollTrigger: {
                            trigger: "#story",
                            start: "top center",
                            end: "bottom center",
                            scrub: true
                        }
                    });
                }

                // Timeline rules fill
                const lineFill = document.querySelector('.line-fill');
                const tItems = gsap.utils.toArray('.t-item');
                if (lineFill) {
                    gsap.to(lineFill, {
                        height: "100%",
                        scrollTrigger: {
                            trigger: ".timeline",
                            start: "top center",
                            end: "bottom center",
                            scrub: true,
                            onUpdate: (self) => {
                                const prog = self.progress;
                                tItems.forEach((item, i) => {
                                    if (prog > (i / (tItems.length - 1)) - 0.1) {
                                        item.classList.add('active');
                                    } else {
                                        item.classList.remove('active');
                                    }
                                });
                            }
                        }
                    });
                }
            }
        }
    };

    // ======================================================================
    // 8. DATA DRIVEN COMPONENTS (Carousel, Compare, Leaderboard)
    // ======================================================================
    const DataUI = {
        techData: [],
        
        init: async () => {
            try {
                DataUI.techData = await utils.fetchJson(CONFIG.dataUrls.tech);
            } catch (e) {
                console.warn('Fetch failed for tech data, falling back to embedded data', e);
                if (window.TECH_DATA && Array.isArray(window.TECH_DATA)) {
                    DataUI.techData = window.TECH_DATA;
                }
            }
            if ((!DataUI.techData || DataUI.techData.length === 0) && window.TECH_DATA) {
                DataUI.techData = window.TECH_DATA;
            }
            DataUI.renderWeapons();
            DataUI.renderPowerups();
        },

        renderWeapons: () => {
            const container = document.getElementById('tech-carousel');
            if (!container) return;
            
            container.innerHTML = DataUI.techData.map(t => `
                <div class="tool-card card glass">
                    <div class="tool-icon">${t.icon}</div>
                    <h3>${t.name}</h3>
                    <p class="caption text-muted">${t.pitch}</p>
                    <div class="chips">
                        ${t.languages.slice(0,3).map(l => `<span class="chip">${l}</span>`).join('')}
                    </div>
                    <ul class="tool-pros">
                        ${t.pros.map(p => `<li>${p}</li>`).join('')}
                    </ul>
                    <p class="tool-con">${t.con}</p>
                    <div class="tool-actions">
                        <label class="compare-label">
                            <input type="checkbox" value="${t.id}" class="compare-cb"> Compare
                        </label>
                        <a href="${t.url}" target="_blank" rel="noopener noreferrer" class="text-link">Learn &rarr;</a>
                    </div>
                </div>
            `).join('');

            // Carousel controls
            const next = document.getElementById('car-next');
            const prev = document.getElementById('car-prev');
            if(next && prev) {
                const scrollAmt = 344; // width + gap
                next.addEventListener('click', () => container.scrollBy({ left: scrollAmt, behavior: 'smooth' }));
                prev.addEventListener('click', () => container.scrollBy({ left: -scrollAmt, behavior: 'smooth' }));
            }

            // Compare Logic
            const cbs = document.querySelectorAll('.compare-cb');
            const drawer = document.getElementById('compare-drawer');
            const closeBtn = document.getElementById('compare-close');
            const clearBtn = document.getElementById('compare-clear');
            const table = document.getElementById('compare-table');

            const updateCompare = () => {
                const selected = Array.from(cbs).filter(cb => cb.checked).map(cb => cb.value);
                if (selected.length > 0) {
                    drawer.classList.add('open');
                    drawer.setAttribute('aria-hidden', 'false');
                    
                    const tools = selected.map(id => DataUI.techData.find(t => t.id === id));
                    
                    let html = `<tr><th>Feature</th>${tools.map(t => `<th>${t.name}</th>`).join('')}</tr>`;
                    const attrs = [
                        { key: 'languages', label: 'Languages', fmt: v => v.join(', ') },
                        { key: 'browserSupport', label: 'Browsers', fmt: v => v.join(', ') },
                        { key: 'parallel', label: 'Parallel', fmt: v => v ? 'Yes' : 'No' },
                        { key: 'learningCurve', label: 'Learning Curve', fmt: v => v }
                    ];

                    attrs.forEach(attr => {
                        html += `<tr><td>${attr.label}</td>${tools.map(t => `<td>${attr.fmt(t[attr.key])}</td>`).join('')}</tr>`;
                    });
                    table.innerHTML = html;
                } else {
                    drawer.classList.remove('open');
                    drawer.setAttribute('aria-hidden', 'true');
                }
            };

            cbs.forEach(cb => {
                cb.addEventListener('change', (e) => {
                    const checkedCount = document.querySelectorAll('.compare-cb:checked').length;
                    if (checkedCount > 3) {
                        e.target.checked = false;
                        alert('You can compare up to 3 tools.');
                    }
                    updateCompare();
                });
            });

            closeBtn?.addEventListener('click', () => { drawer.classList.remove('open'); drawer.setAttribute('aria-hidden', 'true'); });
            clearBtn?.addEventListener('click', () => { cbs.forEach(cb => cb.checked = false); updateCompare(); });
        },

        renderPowerups: () => {
            const grid = document.getElementById('powerup-grid');
            if(!grid) return;
            const pups = [
                { 
                    id: 'ci', 
                    name: 'CI/CD Pipeline', 
                    desc: 'Automated workflow runs', 
                    tileClass: 'tile-blue',
                    svg: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>' 
                },
                { 
                    id: 'docker', 
                    name: 'Docker', 
                    desc: 'Containerized execution', 
                    tileClass: 'tile-teal',
                    svg: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>' 
                },
                { 
                    id: 'report', 
                    name: 'Reporting', 
                    desc: 'Allure or Extent integration', 
                    tileClass: 'tile-purple',
                    svg: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>' 
                },
                { 
                    id: 'pom', 
                    name: 'Design Patterns', 
                    desc: 'POM / Screenplay', 
                    tileClass: 'tile-indigo',
                    svg: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>' 
                },
                { 
                    id: 'hybrid', 
                    name: 'Hybrid Testing', 
                    desc: 'API setup + UI checks', 
                    tileClass: 'tile-orange',
                    svg: '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>' 
                },
                { 
                    id: 'data', 
                    name: 'Data-driven', 
                    desc: 'Externalized test data', 
                    tileClass: 'tile-green',
                    svg: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>' 
                },
                { 
                    id: 'parallel', 
                    name: 'Parallel', 
                    desc: 'Multi-threaded execution', 
                    tileClass: 'tile-pink',
                    svg: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="15" x2="23" y2="15"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="15" x2="4" y2="15"/></svg>' 
                },
                { 
                    id: 'a11y', 
                    name: 'Accessibility', 
                    desc: 'Axe core integration', 
                    tileClass: 'tile-teal',
                    svg: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"/><path d="M7 13h10"/><path d="M12 13v8"/><path d="M9 21l3-4 3 4"/></svg>' 
                },
                { 
                    id: 'perf', 
                    name: 'Performance', 
                    desc: 'Lighthouse or k6', 
                    tileClass: 'tile-yellow',
                    svg: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>' 
                },
                { 
                    id: 'bdd', 
                    name: 'BDD', 
                    desc: 'Gherkin / Cucumber', 
                    tileClass: 'tile-green',
                    svg: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>' 
                }
            ];

            grid.innerHTML = pups.map(p => `
                <div class="bento-tile card glass cursor-glow">
                    <div class="apple-icon-tile ${p.tileClass}" style="width: 34px; height: 34px; border-radius: 9px; margin-bottom: 12px;">
                        ${p.svg}
                    </div>
                    <h3>${p.name}</h3>
                    <p class="caption text-muted">${p.desc}</p>
                    <div class="bento-pts">+4 pts</div>
                </div>
            `).join('');
        }
    };

    // ======================================================================
    // 10. EASTER EGGS & UX EXTRAS
    // ======================================================================
    const Extras = {
        init: () => {
            // Cursor Glow
            document.addEventListener('mousemove', (e) => {
                if (utils.prefersReducedMotion()) return;
                document.querySelectorAll('.cursor-glow').forEach(el => {
                    const rect = el.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;
                    el.style.setProperty('--x', `${x}px`);
                    el.style.setProperty('--y', `${y}px`);
                });
            });

            // Konami
            let kPos = 0;
            document.addEventListener('keydown', (e) => {
                if (e.key === CONFIG.konamiCode[kPos]) {
                    kPos++;
                    if (kPos === CONFIG.konamiCode.length) {
                        alert("GOD MODE UNLOCKED. You are a true automation master.");
                        document.documentElement.style.setProperty('--bg', '#1a0033');
                        document.documentElement.style.setProperty('--accent-gradient', 'linear-gradient(135deg, #ff0055 0%, #ffcc00 100%)');
                        kPos = 0;
                    }
                } else {
                    kPos = 0;
                }
            });
        }
    };

    // ======================================================================
    // INIT
    // ======================================================================
    return {
        init: () => {
            ThemeManager.init();
            Invitation.init();
            Terminal.init();
            ScrollLogic.init();
            DataUI.init();
            Extras.init();
        }
    };
})();

// Bootstrap
document.addEventListener('DOMContentLoaded', App.init);

function initTimelineAndRules() {
    // 1. Accordion Logic
    const headers = document.querySelectorAll('.rules-header');
    const expandAllBtn = document.getElementById('rules-expand-all');
    const collapseAllBtn = document.getElementById('rules-collapse-all');
    let multiOpen = false;

    const setItemState = (header, isOpen) => {
        const panel = document.getElementById(header.getAttribute('aria-controls'));
        if (!panel) return;
        header.setAttribute('aria-expanded', isOpen);
        panel.setAttribute('aria-hidden', !isOpen);
    };

    headers.forEach((header, index) => {
        header.addEventListener('click', () => {
            const isOpen = header.getAttribute('aria-expanded') === 'true';
            if (!multiOpen && !isOpen) {
                headers.forEach(h => setItemState(h, false));
            }
            setItemState(header, !isOpen);
            multiOpen = false;
        });

        header.addEventListener('keydown', (e) => {
            let nextIndex = null;
            if (e.key === 'ArrowDown') nextIndex = (index + 1) % headers.length;
            if (e.key === 'ArrowUp') nextIndex = (index - 1 + headers.length) % headers.length;
            if (e.key === 'Home') nextIndex = 0;
            if (e.key === 'End') nextIndex = headers.length - 1;
            if (nextIndex !== null) {
                e.preventDefault();
                headers[nextIndex].focus();
            }
        });
    });

    if (expandAllBtn) expandAllBtn.addEventListener('click', () => {
        multiOpen = true;
        headers.forEach(h => setItemState(h, true));
    });
    
    if (collapseAllBtn) collapseAllBtn.addEventListener('click', () => {
        multiOpen = false;
        headers.forEach(h => setItemState(h, false));
    });

    // 2. Timeline Scroll Logic
    const items = Array.from(document.querySelectorAll('.tl-item'));
    const track = document.getElementById('tl-track');
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!track || items.length === 0 || prefersReducedMotion) return;

    const appearObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                const i = items.indexOf(entry.target);
                setTimeout(() => entry.target.classList.add('is-visible'), (i % items.length) * 60);
                appearObserver.unobserve(entry.target);
            }
        });
    }, { rootMargin: '0px 0px -10% 0px' });

    const centerObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                items.forEach(el => el.classList.remove('is-active'));
                entry.target.classList.add('is-active');
                
                const idx = items.indexOf(entry.target);
                const progress = (idx / (items.length - 1)) * 100;
                track.style.setProperty('--tl-progress', `${progress}%`);
            }
        });
    }, { rootMargin: '-50% 0px -50% 0px', threshold: 0 });

    items.forEach(item => {
        appearObserver.observe(item);
        centerObserver.observe(item);
    });
}
document.addEventListener('DOMContentLoaded', initTimelineAndRules);

