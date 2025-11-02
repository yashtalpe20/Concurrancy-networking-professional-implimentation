// Mock data
const mockUrls = [
    { url: 'https://golang.org', title: 'The Go Programming Language' },
    { url: 'https://github.com', title: 'GitHub: Where the world builds software' },
    { url: 'https://stackoverflow.com', title: 'Stack Overflow - Where Developers Learn, Share, & Build Careers' },
    { url: 'https://medium.com', title: 'Medium – Where good ideas find you.' },
    { url: 'https://www.wikipedia.org', title: 'Wikipedia, the free encyclopedia' },
    { url: 'https://nodejs.org', title: 'Node.js — Run JavaScript Everywhere' },
    { url: 'https://rust-lang.org', title: 'Rust Programming Language' },
    { url: 'https://python.org', title: 'Welcome to Python.org' }
];

// State management
let scraperState = {
    isRunning: false,
    workers: [],
    results: [],
    totalUrls: 0,
    processedUrls: 0,
    successCount: 0,
    failedCount: 0,
    urlQueue: [],
    workerCount: 5
};

// DOM elements
const urlsTextarea = document.getElementById('urls');
const workerCountSlider = document.getElementById('workerCount');
const workerCountDisplay = document.getElementById('workerCountDisplay');
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const clearBtn = document.getElementById('clearBtn');
const progressPanel = document.getElementById('progressPanel');
const resultsPanel = document.getElementById('resultsPanel');
const workerTable = document.getElementById('workerTable');
const resultsGrid = document.getElementById('resultsGrid');
const exportBtn = document.getElementById('exportBtn');

// Initialize with example URLs
function initializeExampleUrls() {
    const exampleUrls = mockUrls.map(item => item.url).join('\n');
    urlsTextarea.value = exampleUrls;
}

// Update worker count display
workerCountSlider.addEventListener('input', (e) => {
    workerCountDisplay.textContent = e.target.value;
    scraperState.workerCount = parseInt(e.target.value);
});

// Start scraping
startBtn.addEventListener('click', () => {
    const urls = urlsTextarea.value.split('\n').filter(url => url.trim() !== '');
    
    if (urls.length === 0) {
        alert('Please enter at least one URL');
        return;
    }
    
    startScraping(urls);
});

// Stop scraping
stopBtn.addEventListener('click', () => {
    stopScraping();
});

// Clear results
clearBtn.addEventListener('click', () => {
    clearResults();
});

// Export results as JSON
exportBtn.addEventListener('click', () => {
    exportResults();
});

// Start scraping process
function startScraping(urls) {
    // Reset state
    scraperState.isRunning = true;
    scraperState.results = [];
    scraperState.totalUrls = urls.length;
    scraperState.processedUrls = 0;
    scraperState.successCount = 0;
    scraperState.failedCount = 0;
    scraperState.urlQueue = [...urls];
    
    // Update UI
    startBtn.disabled = true;
    stopBtn.disabled = false;
    urlsTextarea.disabled = true;
    workerCountSlider.disabled = true;
    
    // Show panels
    progressPanel.style.display = 'block';
    resultsPanel.style.display = 'block';
    resultsGrid.innerHTML = '';
    
    // Update stats
    updateStats();
    
    // Initialize workers
    initializeWorkers();
    
    // Start processing
    processUrls();
}

// Stop scraping
function stopScraping() {
    scraperState.isRunning = false;
    
    // Update UI
    startBtn.disabled = false;
    stopBtn.disabled = true;
    urlsTextarea.disabled = false;
    workerCountSlider.disabled = false;
    
    // Stop all workers
    scraperState.workers.forEach(worker => {
        if (worker.timeout) {
            clearTimeout(worker.timeout);
        }
        worker.status = 'Idle';
    });
    
    updateWorkerTable();
}

// Clear results
function clearResults() {
    scraperState.results = [];
    scraperState.processedUrls = 0;
    scraperState.successCount = 0;
    scraperState.failedCount = 0;
    
    resultsGrid.innerHTML = '';
    progressPanel.style.display = 'none';
    resultsPanel.style.display = 'none';
    
    startBtn.disabled = false;
    stopBtn.disabled = true;
    urlsTextarea.disabled = false;
    workerCountSlider.disabled = false;
}

// Initialize workers
function initializeWorkers() {
    scraperState.workers = [];
    workerTable.innerHTML = '';
    
    for (let i = 1; i <= scraperState.workerCount; i++) {
        const worker = {
            id: i,
            status: 'Idle',
            processed: 0,
            currentUrl: null,
            processingTime: 0,
            timeout: null
        };
        scraperState.workers.push(worker);
    }
    
    updateWorkerTable();
}

// Update worker table
function updateWorkerTable() {
    workerTable.innerHTML = '';
    
    scraperState.workers.forEach(worker => {
        const row = document.createElement('div');
        row.className = 'worker-row';
        
        const statusClass = worker.status.toLowerCase();
        const statusText = worker.currentUrl 
            ? `${worker.status}: ${truncateUrl(worker.currentUrl)}` 
            : worker.status;
        
        row.innerHTML = `
            <div class="worker-id">Worker ${worker.id}</div>
            <div class="worker-status">
                <span class="status-dot ${statusClass}"></span>
                <span>${statusText}</span>
            </div>
            <div class="worker-processed">${worker.processed} URLs</div>
            <div class="worker-time">${worker.processingTime}ms</div>
        `;
        
        workerTable.appendChild(row);
    });
}

// Process URLs with workers
function processUrls() {
    if (!scraperState.isRunning || scraperState.urlQueue.length === 0) {
        // Check if all workers are done
        const allIdle = scraperState.workers.every(w => w.status === 'Idle' || w.status === 'Completed');
        if (allIdle && scraperState.urlQueue.length === 0) {
            stopScraping();
        }
        return;
    }
    
    // Find idle workers
    const idleWorkers = scraperState.workers.filter(w => w.status === 'Idle');
    
    idleWorkers.forEach(worker => {
        if (scraperState.urlQueue.length > 0) {
            const url = scraperState.urlQueue.shift();
            assignUrlToWorker(worker, url);
        }
    });
}

// Assign URL to worker
function assignUrlToWorker(worker, url) {
    worker.status = 'Processing';
    worker.currentUrl = url;
    
    // Simulate processing time (200-1500ms)
    const processingTime = Math.floor(Math.random() * 1300) + 200;
    worker.processingTime = processingTime;
    
    updateWorkerTable();
    
    worker.timeout = setTimeout(() => {
        // Simulate scraping result
        const result = simulateScraping(url);
        
        // Update worker
        worker.status = 'Idle';
        worker.processed++;
        worker.currentUrl = null;
        
        // Update results
        scraperState.results.push(result);
        scraperState.processedUrls++;
        
        if (result.success) {
            scraperState.successCount++;
        } else {
            scraperState.failedCount++;
        }
        
        // Update UI
        updateStats();
        updateWorkerTable();
        addResultCard(result);
        
        // Continue processing
        if (scraperState.isRunning) {
            processUrls();
        }
    }, processingTime);
}

// Simulate scraping
function simulateScraping(url) {
    // Find mock data for this URL
    const mockData = mockUrls.find(item => item.url === url);
    
    // Simulate different status codes
    const statusCodes = [200, 200, 200, 200, 200, 404, 500];
    const statusCode = statusCodes[Math.floor(Math.random() * statusCodes.length)];
    const success = statusCode === 200;
    
    const responseTime = Math.floor(Math.random() * 1300) + 200;
    
    return {
        url: url,
        title: success && mockData ? mockData.title : 'Failed to fetch title',
        statusCode: statusCode,
        success: success,
        responseTime: responseTime,
        timestamp: new Date().toISOString()
    };
}

// Update stats
function updateStats() {
    document.getElementById('totalUrls').textContent = scraperState.totalUrls;
    document.getElementById('processedUrls').textContent = scraperState.processedUrls;
    document.getElementById('successCount').textContent = scraperState.successCount;
    document.getElementById('failedCount').textContent = scraperState.failedCount;
    
    // Update progress bar
    const percentage = scraperState.totalUrls > 0 
        ? Math.round((scraperState.processedUrls / scraperState.totalUrls) * 100) 
        : 0;
    
    document.getElementById('progressBar').style.width = percentage + '%';
    document.getElementById('progressPercentage').textContent = percentage + '%';
}

// Add result card
function addResultCard(result) {
    const card = document.createElement('div');
    card.className = 'result-card';
    card.style.animationDelay = `${scraperState.results.length * 0.1}s`;
    
    const statusClass = result.success ? 'success' : 'error';
    const statusIcon = result.success ? '✓' : '✗';
    const statusText = result.success ? 'Success' : `Error ${result.statusCode}`;
    
    card.innerHTML = `
        <div class="result-status ${statusClass}">
            <span>${statusIcon}</span>
            <span>${statusText}</span>
        </div>
        <div class="result-url">${truncateUrl(result.url)}</div>
        <div class="result-title">${result.title}</div>
        <div class="result-meta">
            <div class="meta-item">
                <span class="meta-label">Status Code</span>
                <span class="meta-value">${result.statusCode}</span>
            </div>
            <div class="meta-item">
                <span class="meta-label">Response Time</span>
                <span class="meta-value">${result.responseTime}ms</span>
            </div>
        </div>
        <div class="result-actions">
            <button class="copy-result-btn" onclick="copyResult(${scraperState.results.length - 1})">
                📋 Copy Result
            </button>
        </div>
    `;
    
    resultsGrid.appendChild(card);
}

// Copy result to clipboard
function copyResult(index) {
    const result = scraperState.results[index];
    const text = JSON.stringify(result, null, 2);
    
    navigator.clipboard.writeText(text).then(() => {
        alert('Result copied to clipboard!');
    }).catch(err => {
        console.error('Failed to copy:', err);
    });
}

// Export all results as JSON
function exportResults() {
    if (scraperState.results.length === 0) {
        alert('No results to export');
        return;
    }
    
    const json = JSON.stringify(scraperState.results, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `scraper-results-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Toggle code example
function toggleCode(id) {
    const content = document.getElementById(id);
    const header = content.previousElementSibling;
    const toggle = header.querySelector('.code-toggle');
    
    if (content.classList.contains('open')) {
        content.classList.remove('open');
        toggle.classList.remove('open');
    } else {
        content.classList.add('open');
        toggle.classList.add('open');
    }
}

// Copy code to clipboard
function copyCode(preId) {
    const pre = document.getElementById(preId);
    const code = pre.textContent;
    
    navigator.clipboard.writeText(code).then(() => {
        const btn = pre.previousElementSibling;
        const originalText = btn.textContent;
        btn.textContent = '✓ Copied!';
        setTimeout(() => {
            btn.textContent = originalText;
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy:', err);
    });
}

// Utility function to truncate URL
function truncateUrl(url, maxLength = 40) {
    if (url.length <= maxLength) return url;
    return url.substring(0, maxLength) + '...';
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    initializeExampleUrls();
});