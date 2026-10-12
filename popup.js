const SITE_ORIGIN = 'https://code.iiit.ac.in';
const STORAGE_KEY = 'apiToken';
const tokenInput = document.getElementById('apiTokenInput');
const statusMessage = document.getElementById('statusMessage');

import { getApiToken, getSiteTab } from './helpers.js';

function showStatus(text, color) {
    statusMessage.textContent = text;
    statusMessage.style.color = color;
    statusMessage.style.display = 'block';
    setTimeout(() => {
        statusMessage.style.display = 'none';
    }, 2000);
}

document.getElementById('saveButton').addEventListener('click', async () => {
    const apiToken = tokenInput.value.trim();
    if (!apiToken) return;

    try {
        const tab = await getSiteTab();
        if (!tab) {
            showStatus('Open code.iiit.ac.in first.', 'red');
            return;
        }

        // Write into the site's own localStorage by running a small function in the page
        await browser.scripting.executeScript({
            target: { tabId: tab.id },
            func: (key, value) => localStorage.setItem(key, value),
            args: [STORAGE_KEY, apiToken],
        });

        showStatus('API token saved successfully!', 'green');
    } catch (err) {
        console.error('Save failed:', err);
        showStatus('Save failed: ' + err.message, 'red');
    }
});

// Load the saved API token from the site's localStorage when the popup is opened
document.addEventListener('DOMContentLoaded', async () => {
    const result = await getApiToken();
    if (result) {
        tokenInput.value = result;
    }
});
