# Email when a find is added

The map can email you each time someone logs a new find. It uses a small Google Apps Script that runs under your Google account and sends from your own Gmail. It's free and needs no Firebase upgrade.

1. Go to <https://script.google.com>, click **New project**, and replace everything in the editor with the contents of `Code.gs` in this folder. Name the project "Mill Valley Finds email".
2. Optional: choose `testEmail` in the function menu at the top and click **Run**. Google asks you to authorize sending email as you, then sends you a sample.
3. Click **Deploy → New deployment**. Under "Select type", choose **Web app**. Set **Execute as: Me** and **Who has access: Anyone**, then click **Deploy**.
4. Copy the **Web app URL**. It ends in `/exec`.
5. In `config.js`, paste it between the quotes of `window.NOTIFY_URL = "";` and commit.

Finds you add while signed in as the owner don't send an email; finds added with the passcode do. To stop the emails, empty `NOTIFY_URL` in `config.js`. If you change `Code.gs` later, use **Deploy → Manage deployments → Edit → New version** so the URL stays the same.
