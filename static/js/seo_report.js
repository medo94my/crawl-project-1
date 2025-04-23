
// --- Handlebars Helpers ---
Handlebars.registerHelper('eq', (a, b) => a === b);
Handlebars.registerHelper('inc', (value) => parseInt(value) + 1); // For 1-based indexing

// Helper to display link text or a placeholder
Handlebars.registerHelper('linkText', (text) => {
    return text ? escapeHTML(text) : '<span class="empty-text">No Text</span>';
});

// Helper to display domain or a placeholder badge
Handlebars.registerHelper('domainText', (domain) => {
    return domain ? escapeHTML(domain) : '<span class="badge badge-ghost">N/A</span>';
});

// Helper to add external link icon (conditionally)
Handlebars.registerHelper('externalIcon', (href) => {
    if (href && href !== 'javascript:;') {
        return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="external-link-icon"><path fill-rule="evenodd" d="M4.25 5.5a.75.75 0 00-.75.75v8.5c0 .414.336.75.75.75h8.5a.75.75 0 00.75-.75v-4a.75.75 0 011.5 0v4A2.25 2.25 0 0112.75 17h-8.5A2.25 2.25 0 012 14.75v-8.5A2.25 2.25 0 014.25 4h5a.75.75 0 010 1.5h-5z" clip-rule="evenodd" /><path fill-rule="evenodd" d="M6.194 12.753a.75.75 0 001.06.053L17.5 2.56a.75.75 0 00-1.1-1.022L6.247 11.694a.75.75 0 00-.053 1.06z" clip-rule="evenodd" /></svg>';
    }
    return '';
});

const templates = {
    stats: Handlebars.compile(document.getElementById('stats-template').innerHTML),
    metadata: Handlebars.compile(document.getElementById('metadata-template').innerHTML),
    internalLinks: Handlebars.compile(document.getElementById('internal-links-template').innerHTML),
    externalLinks: Handlebars.compile(document.getElementById('external-links-template').innerHTML)
};

// Get target elements
const targets = {
    stats: document.getElementById('stats-section'),
    metadata: document.getElementById('metadata-list'),
    internalLinks: document.getElementById('internal-links-tbody'),
    externalLinks: document.getElementById('external-links-tbody'),
    internalCount: document.getElementById('internal-link-count-display'),
    externalCount: document.getElementById('external-link-count-display')
};
// --- Utility Functions ---
function escapeHTML(str) {
    if (str === null || str === undefined) return '';
    return String(str).replace(/[&<>"']/g, match => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[match]);
}

// function showError(message = "Could not load the crawl report. Please try again later.") {
//     const errorDetails = document.getElementById('error-details');
//     const errorMessageContainer = document.getElementById('error-message');
//     const mainContent = document.getElementById('main-content');
//     const loadingIndicator = document.getElementById('loading-indicator');
//     if (errorDetails) errorDetails.textContent = message;
//     if (errorMessageContainer) errorMessageContainer.style.display = 'flex';
//     if (mainContent) mainContent.style.display = 'none';
//     if (loadingIndicator) loadingIndicator.style.display = 'none';
// }

// function showLoading() {
//     const loadingIndicator = document.getElementById('loading-indicator');
//     const errorMessageContainer = document.getElementById('error-message');
//     const mainContent = document.getElementById('main-content');
//     if (loadingIndicator) loadingIndicator.style.display = 'flex';
//     if (errorMessageContainer) errorMessageContainer.style.display = 'none';
//     if (mainContent) mainContent.style.display = 'none';
// }

// --- Simulate API Fetch ---
function fetchCrawlData(data) {
    // showLoading();
    try {
        // --- Prepare Context and Render ---
        renderReport(data, templates, targets);
        showContent();
    } catch (error) {
        console.error("Error fetching or processing crawl data:", error);
        throw new Error(`Failed to load report. ${error.message}`);
    }
}

// Function to render the report using compiled templates
function renderReport(data, templates, targets) {
    // Prepare Stats Context
    const internalLinkCount = data.links?.internal?.length || 0;
    const externalLinkCount = data.links?.external?.length || 0;
    const metadataCount = data.metadata ? Object.keys(data.metadata).filter(k => data.metadata[k] !== null && data.metadata[k] !== '').length : 0;
    const statsContext = {
        stats: [
            { title: "URL Crawled", value: escapeHTML(data.url) || 'N/A', valueClass: 'text-base w-fit-content', iconClass: 'text-info', iconSvg: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.175l-4.5-4.5a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 106.364 6.364l1.757-1.757" /></svg>' },
            { title: "Status Code", value: escapeHTML(data.status_code) || 'N/A', iconClass: data.status_code === 200 ? 'text-success' : 'text-warning', iconSvg: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>' },
            { title: "Success", value: data.success ? '<span class="badge badge-success badge-lg">Yes</span>' : '<span class="badge badge-error badge-lg">No</span>', description: escapeHTML(data.error_message), descClass: 'text-error', iconClass: data.success ? 'text-success' : 'text-error', iconSvg: data.success ? '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>' : '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m0-10.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.249-8.25-3.286zm0 13.036h.008v.008H12v-.008z" /></svg>' },
            { title: "Internal Links", value: internalLinkCount, iconClass: 'text-secondary', iconSvg: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.175l-4.5-4.5a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 106.364 6.364l1.757-1.757" /></svg>' },
            { title: "External Links", value: externalLinkCount, iconClass: 'text-accent', iconSvg: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" /></svg>' },
            { title: "Metadata Tags", value: metadataCount, iconClass: 'text-neutral', iconSvg: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" /></svg>' }
        ]
    };
    if (targets.stats) targets.stats.innerHTML = templates.stats(statsContext);

    // Prepare Metadata Context
    const metadataItems = [];
    if (data.metadata) {
        for (const key in data.metadata) {
            if (Object.hasOwnProperty.call(data.metadata, key)) {
                const value = data.metadata[key];
                if (value !== null && value !== '') {
                    metadataItems.push({ key: escapeHTML(key), value: escapeHTML(value) });
                }
            }
        }
    }
    if (targets.metadata) targets.metadata.innerHTML = templates.metadata({ metadataItems: metadataItems });
    // Prepare Links Context and Render
    if (targets.internalLinks) targets.internalLinks.innerHTML = templates.internalLinks({ links: data.links?.internal || [] });
    if (targets.externalLinks) targets.externalLinks.innerHTML = templates.externalLinks({ links: data.links?.external || [] });

    // Update link counts in titles
    if (targets.internalCount) targets.internalCount.textContent = internalLinkCount;
    if (targets.externalCount) targets.externalCount.textContent = externalLinkCount;
}
function showContent() {
    const loadingIndicator = document.getElementById('loading-indicator');
    const errorMessageContainer = document.getElementById('error-message');
    const mainContent = document.getElementById('main-content');
    if (loadingIndicator) loadingIndicator.style.display = 'none';
    if (errorMessageContainer) errorMessageContainer.style.display = 'none';
    if (mainContent) mainContent.style.display = 'block';
}

// --- Main Application Logic ---
// document.addEventListener('DOMContentLoaded', () => {
    // Compile Handlebars templates

// });
