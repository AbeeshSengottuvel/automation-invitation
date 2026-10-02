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
                    return;
                }

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

            // Name Parsing
            const params = new URLSearchParams(window.location.search);
            const nameEl = document.getElementById('guest-name');
            if (nameEl && params.has('name')) {
                const cleanName = utils.sanitizeName(params.get('name'));
                if (cleanName) {
                    nameEl.textContent = `${cleanName}, you're invited`;
                }
            }

            // Accept Button
            const acceptBtn = document.getElementById('accept-btn');
            if (acceptBtn) {
                acceptBtn.addEventListener('click', () => {
                    if (typeof confetti !== 'undefined' && !utils.prefersReducedMotion()) {
                        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
                    }
                    document.querySelector('#steps').scrollIntoView({ behavior: 'smooth' });
                    setTimeout(() => {
                        const firstStep = document.querySelector('.step-cards .card');
                        if(firstStep) {
                            firstStep.style.transform = 'scale(1.05)';
                            firstStep.style.boxShadow = 'var(--shadow-3)';
                            setTimeout(() => {
                                firstStep.style.transform = '';
                                firstStep.style.boxShadow = '';
                            }, 500);
                        }
                    }, 800);
                });
            }
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
            if (utils.prefersReducedMotion()) return;

            // Nav Highlighting (Apple-style ScrollSpy)
            const navLinks = document.querySelectorAll('.nav-links a');
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

            // Mobile Menu
            const mobileBtn = document.querySelector('.mobile-menu-btn');
            const navLinksContainer = document.querySelector('.nav-links');
            if (mobileBtn) {
                mobileBtn.addEventListener('click', () => {
                    const expanded = mobileBtn.getAttribute('aria-expanded') === 'true';
                    mobileBtn.setAttribute('aria-expanded', !expanded);
                    navLinksContainer.classList.toggle('open');
                });
                navLinksContainer.addEventListener('click', (e) => {
                    if (e.target.tagName === 'A') {
                        mobileBtn.setAttribute('aria-expanded', 'false');
                        navLinksContainer.classList.remove('open');
                    }
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
                        <a href="${t.url}" target="_blank" rel="noopener noreferrer" class="text-link">Learn</a>
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
                { id: 'ci', name: 'CI/CD Pipeline', desc: 'Automated workflow runs', icon: '⚙️' },
                { id: 'docker', name: 'Docker', desc: 'Containerized execution', icon: '🐳' },
                { id: 'report', name: 'Reporting', desc: 'Allure or Extent integration', icon: '📊' },
                { id: 'pom', name: 'Design Patterns', desc: 'POM / Screenplay', icon: '🧩' },
                { id: 'hybrid', name: 'Hybrid Testing', desc: 'API setup + UI checks', icon: '⚡' },
                { id: 'data', name: 'Data-driven', desc: 'Externalized test data', icon: '📁' },
                { id: 'parallel', name: 'Parallel', desc: 'Multi-threaded execution', icon: '🚀' },
                { id: 'a11y', name: 'Accessibility', desc: 'Axe core integration', icon: '👁️' },
                { id: 'perf', name: 'Performance', desc: 'Lighthouse or k6', icon: '⏱️' },
                { id: 'bdd', name: 'BDD', desc: 'Gherkin / Cucumber', icon: '🥒' }
            ];

            grid.innerHTML = pups.map(p => `
                <div class="bento-tile card glass cursor-glow">
                    <div class="bento-icon">${p.icon}</div>
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

