// DOM Elements
const urlInput = document.getElementById('urlInput');
const downloadBtn = document.getElementById('downloadBtn');
const progressContainer = document.getElementById('progressContainer');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');
const progressPercent = document.getElementById('progressPercent');
const resultSection = document.getElementById('result');
const resultContent = resultSection.querySelector('.result-content');
const themeToggle = document.getElementById('themeToggle');

// ********************************************************
async function showDocumentation() {
    // Prevent multiple popups
    if (document.getElementById('ytmp3-doc-modal')) return;

    // Create backdrop (dark semi-transparent overlay)
    const backdrop = document.createElement('div');
    backdrop.id = 'ytmp3-doc-backdrop';
    Object.assign(backdrop.style, {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9998,
        padding: '1rem',
        animation: 'fadeIn 0.3s ease-out',
        backdropFilter: 'blur(5px)', // nice frosted effect
    });

    // Create modal container
    const modal = document.createElement('div');
    modal.id = 'ytmp3-doc-modal';
    Object.assign(modal.style, {
        background: '#ffffff',
        borderRadius: '16px',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.25)',
        maxWidth: '560px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        position: 'relative',
        animation: 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        lineHeight: '1.6',
        color: '#1a1a1a',
    });

    modal.innerHTML = `
        <div style="padding: 2.5rem 2rem 2rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                <h2 style="margin: 0; font-size: 1.75rem; font-weight: 700; color: #d32f2f;">
                    How to Use YouTube to MP3 Converter
                </h2>
                <button id="close-doc-btn" aria-label="Close documentation" style="
                    background: none;
                    border: none;
                    font-size: 1.8rem;
                    cursor: pointer;
                    color: #888;
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s;
                " onmouseover="this.style.backgroundColor='#f0f0f0'; this.style.color='#555'"
                    onmouseout="this.style.backgroundColor='transparent'; this.style.color='#888'">
                    ×
                </button>
            </div>

            <div style="font-size: 1.05rem; color: #444; margin-bottom: 1.5rem;">
                Convert any YouTube video to high-quality MP3 audio in just a few simple steps.
            </div>

            <ol style="padding-left: 1.4rem; margin: 1.5rem 0;">
                <li style="margin-bottom: 1rem; padding-left: 0.5rem;">
                    <strong>Open YouTube</strong> in your browser or app and find the video or song you want to download.
                </li>
                <li style="margin-bottom: 1rem; padding-left: 0.5rem;">
                    <strong>Copy the video URL</strong> from the address bar or tap Share button Copy link. (e.g., https://youtu.be/d_HlPboLRL8)
                </li>
                <li style="margin-bottom: 1rem; padding-left: 0.5rem;">
                    Return to this page and <strong>paste the URL</strong> into the input field above.
                </li>
                <li style="margin-bottom: 1rem; padding-left: 0.5rem;">
                    Click the <strong>"Download MP3"</strong> button and wait a few seconds for processing.
                </li>
                <li style="margin-bottom: 1rem; padding-left: 0.5rem;">
                    Once ready, it will automatically start downloading in your downloads folder on your device.
                </li>
            </ol>

        </div>
    `;

    // Add animations (inline keyframes)
    const style = document.createElement('style');
    style.textContent = `
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        @keyframes slideUp {
            from { transform: translateY(50px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }
    `;
    document.head.appendChild(style);

    // Append to body
    backdrop.appendChild(modal);
    document.body.appendChild(backdrop);

    // Close functionality
    const closeModal = () => {
        backdrop.style.animation = 'fadeIn 0.3s reverse';
        modal.style.animation = 'slideUp 0.3s reverse';
        setTimeout(() => {
            document.body.removeChild(backdrop);
            style.remove();
        }, 300);
    };

    // Event listeners
    backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) closeModal();
    });
    modal.querySelector('#close-doc-btn').addEventListener('click', closeModal);

    // ESC key support
    const escHandler = (e) => {
        if (e.key === 'Escape') {
            closeModal();
            document.removeEventListener('keydown', escHandler);
        }
    };
    document.addEventListener('keydown', escHandler);
}

// Initialize Theme
function initializeTheme() {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = savedTheme || (prefersDark ? 'dark' : 'light');

    if (theme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
    } else {
        document.documentElement.setAttribute('data-theme', 'light');
    }
}

initializeTheme();

// Theme Toggle
themeToggle.addEventListener('click', () => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const newTheme = isDark ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
});

// Event Listeners
downloadBtn.addEventListener('click', main);
urlInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !downloadBtn.disabled) {
        main(e);
    }
});

// Prevent focus on disabled button
urlInput.addEventListener('paste', () => {
    setTimeout(() => {
        urlInput.focus();
    }, 0);
});

async function main(e) {
    e.preventDefault();

    const url = urlInput.value.trim();
    if (!url) {
        showResult(
            '<i class="fas fa-exclamation-circle"></i> Please enter a YouTube URL',
            'error'
        );
        return;
    }

    downloadBtn.disabled = true;
    downloadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <span>Processing...</span>';
    hideResult();
    urlInput.disabled = true;

    try {
        const response = await fetch('/download', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url })
        });

        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n\n');

            // Keep the last incomplete line in the buffer
            buffer = lines.pop() || '';

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    try {
                        const data = JSON.parse(line.slice(6));
                        handleServerEvent(data);
                    } catch (parseErr) {
                        console.error('JSON Parse Error:', parseErr);
                    }
                }
            }
        }
    } catch (err) {
        console.error('Download Error:', err);
        showResult(
            '<i class="fas fa-wifi"></i> Network error. Is the server running?',
            'error'
        );
    } finally {
        downloadBtn.disabled = false;
        downloadBtn.innerHTML = '<i class="fas fa-download"></i> <span>Download MP3</span>';
        urlInput.disabled = false;
    }
}




function handleServerEvent(data) {
    if (data.status === 'fetching') {
        showProgress(`<i class="fas fa-hourglass-half"></i> ${data.message}`);
    } else if (data.status === 'downloading') {
        updateProgress(data.progress);
    } else if (data.status === 'success') {
        hideProgress();
        const successHtml = `
            <div style="display: flex; flex-direction: column; gap: 0.75rem; align-items: center;">
                <i class="fas fa-check-circle" style="font-size: 2rem;"></i>
                <h3>Download Complete!</h3>
                <p style="font-size: 0.95rem; margin: 0.5rem 0 0;">${escapeHtml(data.result)}</p>
            </div>
        `;
        showResult(successHtml, 'success');
    } else if (data.status === 'error') {
        hideProgress();
        const errorHtml = `
            <div style="display: flex; flex-direction: column; gap: 0.75rem; align-items: center;">
                <i class="fas fa-exclamation-triangle" style="font-size: 2rem;"></i>
                <h3>Download Failed</h3>
                <p style="font-size: 0.95rem; margin: 0.5rem 0 0;">${escapeHtml(data.message)}</p>
            </div>
        `;
        showResult(errorHtml, 'error');
    }
}

function showProgress(html) {
    progressContainer.classList.remove('hidden');
    progressText.innerHTML = html;
    progressFill.style.width = '0%';
    progressPercent.textContent = '0';
}

function updateProgress(percent) {
    const clampedPercent = Math.min(Math.max(percent, 0), 100);
    progressFill.style.width = `${clampedPercent}%`;
    progressPercent.textContent = Math.round(clampedPercent);
    progressText.innerHTML = `<i class="fas fa-download"></i> Downloading... ${Math.round(clampedPercent)}%`;
}

function hideProgress() {
    progressContainer.classList.add('hidden');
}

function showResult(html, type) {
    resultContent.innerHTML = html;
    resultSection.className = `result-section ${type}`;
    resultSection.classList.remove('hidden');

    // Scroll to result
    setTimeout(() => {
        resultSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);
}

function hideResult() {
    resultSection.classList.add('hidden');
}

// Utility function to escape HTML
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}