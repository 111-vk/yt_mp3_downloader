// script.js
const urlInput = document.getElementById('urlInput');
const downloadBtn = document.getElementById('downloadBtn');
const progressContainer = document.getElementById('progressContainer');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');
const result = document.getElementById('result');
const themeToggle = document.getElementById('themeToggle');

// Theme toggle
const currentTheme = localStorage.getItem('theme') || 'light  ';
if (currentTheme === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
themeToggle.textContent = currentTheme === 'dark' ? 'Light Mode' : 'Dark Mode';

themeToggle.addEventListener('click', () => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const newTheme = isDark ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    themeToggle.textContent = newTheme === 'dark' ? 'Light Mode' : 'Dark Mode';
    localStorage.setItem('theme', newTheme);
});

// Download
downloadBtn.addEventListener('click', main);
urlInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        // alert("testing ")
        main(e);
    }
})

async function main(e) {
    e.preventDefault();

    const url = urlInput.value.trim();
    if (!url) return showResult('Please enter a URL', 'error');

    downloadBtn.disabled = true;
    downloadBtn.textContent = 'Processing...';
    hideResult();
    // showProgress('Fetching video info...');

    try {
        const response = await fetch('/download', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url })
        });
        console.log("response", response);

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n\n');
            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const data = JSON.parse(line.slice(6));

                    handleServerEvent(data);
                }
            }
        }
    } catch (err) {
        showResult('Network error. Is the server running?', 'error');
    } finally {
        downloadBtn.disabled = false;
        downloadBtn.textContent = 'Download MP3';
    }
}




function handleServerEvent(data) {
    console.log("data", data);

    if (data.status === 'fetching') {
        showProgress(data.message);
    } else if (data.status === 'downloading') {
        updateProgress(data.progress);
    } else if (data.status === 'success') {
        hideProgress();
        let success_html = `
        <h3>success</h3>
        <p>${data.result}</p>   
        `
        showResult(success_html, 'success');
    } else if (data.status === 'error') {
        hideProgress();
        showResult(data.message, 'error');
    }
}

function showProgress(text) {
    progressContainer.classList.remove('hidden');
    progressText.textContent = text;
    progressFill.style.width = '0%';
}

function updateProgress(percent) {
    progressFill.style.width = `${percent}%`;
    progressText.textContent = `Downloading... ${percent.toFixed(1)}%`;
}

function hideProgress() {
    progressContainer.classList.add('hidden');
}

function showResult(html, type) {
    result.innerHTML = html;
    result.className = type;
    result.classList.remove('hidden');
    downloadBtn.disabled = false;
    downloadBtn.textContent = 'Download MP3';

}

function hideResult() {
    result.classList.add('hidden');
}