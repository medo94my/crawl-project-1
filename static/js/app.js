
let sectionTemplate, suggestionsOnlyTemplate, otherSuggestionsTemplate, errorTemplate
let seoData = null
let analysisRoot=null
// --- Global variable to hold the error timer interval ---
let errorTimerInterval = null;
const FADE_DURATION = 500; // Match CSS transition duration in ms
const mainContentElement = document.getElementById('main-content')
const loadingElement = document.getElementById('loading-state');
const urlForm = document.getElementById('urlForm');
const dataContainer = document.getElementById('data');
const errorContainer = document.getElementById('error-container')
const seoContentContainer = document.getElementById('seo-content')
document.addEventListener('DOMContentLoaded', () => {
    // Compile the Handlebars templates
    const sectionTemplateSource = document.getElementById('section-template').innerHTML;
    sectionTemplate = Handlebars.compile(sectionTemplateSource);

    const suggestionsOnlyTemplateSource = document.getElementById('suggestions-only-template').innerHTML;
    suggestionsOnlyTemplate = Handlebars.compile(suggestionsOnlyTemplateSource);

    const otherSuggestionsTemplateSource = document.getElementById('other-suggestions-template').innerHTML;
    otherSuggestionsTemplate = Handlebars.compile(otherSuggestionsTemplateSource);
    errorTemplate = Handlebars.compile(document.getElementById('error-template').innerHTML);
})
async function analyzeUrl() {
    const url = document.getElementById('url').value;
    const response = await fetch('/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ url })
    });
    const data = await response.json();
    if (!data.success) {
        renderError("Fetching Error", data.message, data.status || 500);
        return new Error(data.message);
    }
    return data;
}
showLoading = (state = true) => {
    return !state ? (loadingElement.style.display = 'none') : (loadingElement.style.display = 'flex');
}

showLoading(false)
urlForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const url = document.getElementById('url').value;
    try {
        showLoading(true);
        if (url.trim() === '') {
            throw new Error("Please enter a valid URL.");
        }
        const   { data, ai_analysis,success,message } = await analyzeUrl();
        if (!success) {
            throw new Error(message);
        }
        seoData = ai_analysis
        renderAnalysis()
        fetchCrawlData(data)
    } catch (e) {
        console.error(e);
        renderError("Error", e);
        showLoading(false)
    } finally {
        showLoading(false)
    }
});
// Function to render a standard section (Analysis + Suggestions)
function renderStandardSection(targetId, title, dataKey) {
    const sectionData = getNested(analysisRoot, dataKey);
    const context = {
        title: title,
        Analysis: getNested(sectionData, 'Analysis'),
        Suggestions: getNested(sectionData, 'Suggestions')
    };
    const html = sectionTemplate(context);
    const targetElement = document.getElementById(targetId);
    if (targetElement) {
        targetElement.innerHTML = html;
    } else {
        console.error(`Target element not found: ${targetId}`);
    }
}
// --- Function to Render Error State ---
function renderError(title = "Error", message = "An unexpected error occurred.", code = null) {
    console.error("Rendering Error:", title, message, code);
    const errorContext = {
        errorTitle: title,
        errorMessage: message,
        errorCode: code
    };
    errorContainer.innerHTML = errorTemplate(errorContext);
    // Make sure container is visible and opacity is reset before starting timer/fade
    errorContainer.classList.remove('fade-out'); // Remove fade-out class if already present
    errorContainer.style.display = 'block'; // Show error container

    if (mainContentElement) mainContentElement.style.display = 'none'; // Hide main content
    if (loadingElement) loadingElement.style.display = 'none'; // Hide loader
    errorContainer.style.display = 'block'; // Show error container
    // --- Progress Bar Logic ---
    const progressBar = document.getElementById('error-progress');
    if (progressBar) {
        const errorDuration = 2000; // 2 seconds in milliseconds
        const updateInterval = 50; // Update every 50ms
        let elapsedTime = 0;

        // Clear any previous interval if it exists
        if (errorTimerInterval) {
            clearInterval(errorTimerInterval);
        }

        // Start a new interval
        errorTimerInterval = setInterval(() => {
            elapsedTime += updateInterval;
            const remainingTime = Math.max(0, errorDuration - elapsedTime);
            const progressValue = (remainingTime / errorDuration) * 100;

            progressBar.value = progressValue;

            if (remainingTime <= 0) {
                clearInterval(errorTimerInterval);
                errorTimerInterval = null; // Reset interval variable
                 // --- Start Fade Out ---
                 errorContainer.classList.add('fade-out');

                 // Set display to none *after* the fade animation completes
                 setTimeout(() => {
                     errorContainer.style.display = 'none';
                    //  mainContentElement.style.display = 'block'; // Show main content again
                     // Optionally remove the content as well if needed
                     // errorContainer.innerHTML = '';
                     console.log("Fade out complete.");
                 }, FADE_DURATION); // Wait for fade duration
                console.log("Error timer finished.");
            }
        }, updateInterval);
    } else {
        console.warn("Error progress bar element not found after rendering error template.");
    }
}
// Helper function to safely get nested properties
function getNested(obj, ...args) {
    return args.reduce((obj, level) => obj && obj[level], obj);
}

// Register a Handlebars helper to check for equality
// Useful for checking if a value is "N/A"
Handlebars.registerHelper('eq', function (a, b) {
    return a === b;
});


// Wait for the DOM to be fully loaded
const renderAnalysis = () => {
    // debugger
    // Get the root of the SEO data
     analysisRoot = getNested(seoData, 'SEO_Analysis_and_Enhancement_Suggestions');

    if (!analysisRoot) {
        renderError("Error", "Could not find SEO analysis data.");
        // document.body.innerHTML = '<p class="text-red-500 text-center mt-10">Error: Could not find SEO analysis data.</p>';
        return;
    }
    // Render standard sections
    renderStandardSection('title-analysis-section', 'Title Analysis', 'Title_Analysis_and_Suggestions');
    renderStandardSection('meta-description-analysis-section', 'Meta Description Analysis', 'Meta_Description_Analysis_and_Suggestions');
    renderStandardSection('h1-tag-analysis-section', 'H1 Tag Analysis', 'H1_Tag_Analysis_and_Suggestions');
    renderStandardSection('content-analysis-section', 'Content Analysis', 'Content_Analysis_and_Suggestions');
    renderStandardSection('link-analysis-section', 'Link Analysis', 'Link_Analysis_and_Suggestions');
    seoContentContainer.style.display = 'block';


    // Render Keyword Optimization (Suggestions Only)
    const keywordContext = {
        title: 'Keyword Optimization Suggestions',
        Suggestions: getNested(analysisRoot, 'Keyword_Optimization_Suggestions')
    };
    const keywordHtml = suggestionsOnlyTemplate(keywordContext);
    const keywordTarget = document.getElementById('keyword-optimization-section');
    if (keywordTarget) {
        keywordTarget.innerHTML = keywordHtml;
    } else {
        console.error('Target element not found: keyword-optimization-section');
    }

    // Render Other Suggestions
    const otherContext = {
        title: 'Overall & Other Suggestions',
        OverallAssessment: getNested(analysisRoot, 'Overall_SEO_Assessment'),
        SchemaMarkup: getNested(analysisRoot, 'Schema_Markup_Suggestion'),
        MobileOptimization: getNested(analysisRoot, 'Mobile_Optimization_Suggestion'),
        PageSpeed: getNested(analysisRoot, 'Page_Speed_Suggestion')
    };
    const otherHtml = otherSuggestionsTemplate(otherContext);
    const otherTarget = document.getElementById('other-suggestions-section');
    if (otherTarget) {
        otherTarget.innerHTML = otherHtml;
    } else {
        console.error('Target element not found: other-suggestions-section');
    }
};
