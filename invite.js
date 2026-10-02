/**
 * invite.js - Private Builder Script
 */

document.addEventListener('DOMContentLoaded', () => {
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
                span.style.whiteSpace = 'nowrap';
                span.style.marginRight = '12px';
                span.textContent = `${clean}: ${url}`;
                
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
