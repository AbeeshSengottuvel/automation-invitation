/**
 * invite.js - Private Builder Script
 */

document.addEventListener('DOMContentLoaded', () => {
    const input = document.getElementById('names-input');
    const genBtn = document.getElementById('generate-btn');
    const copyAllBtn = document.getElementById('copy-all-btn');
    const container = document.getElementById('links-container');
    const previewName = document.getElementById('preview-name');

    // Shared sanitize logic (same as script.js)
    const sanitizeName = (str) => {
        if (!str) return null;
        const clean = str.trim().substring(0, 40).replace(/[^a-zA-Z\s'\-\.]/g, '');
        return clean.length > 0 ? clean : null;
    };

    const baseUrl = "https://AbeeshSengottuvel.github.io/automation-invitation/";

    const generateLinks = () => {
        const text = input.value;
        const lines = text.split('\n');
        container.innerHTML = '';
        let validLinks = [];

        lines.forEach(line => {
            const clean = sanitizeName(line);
            if (clean) {
                const url = `${baseUrl}?name=${encodeURIComponent(clean)}`;
                validLinks.push({ name: clean, url });
                
                const div = document.createElement('div');
                div.className = 'link-item';
                
                const span = document.createElement('span');
                span.textContent = `${clean}: ${url}`;
                
                const btn = document.createElement('button');
                btn.className = 'btn secondary small';
                btn.textContent = 'Copy';
                btn.onclick = () => {
                    navigator.clipboard.writeText(url);
                    btn.textContent = 'Copied!';
                    setTimeout(() => btn.textContent = 'Copy', 2000);
                };

                div.appendChild(span);
                div.appendChild(btn);
                container.appendChild(div);
            }
        });

        // Store for copy all
        copyAllBtn.onclick = () => {
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
});
