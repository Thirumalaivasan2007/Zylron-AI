const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
  page.on('pageerror', err => console.error('BROWSER ERROR:', err.message));
  page.on('requestfailed', request => {
    console.error('BROWSER REQUEST FAILED:', request.url(), request.failure().errorText);
  });

  console.log('Navigating to http://localhost:5173/features');
  await page.goto('http://localhost:5173/features', { waitUntil: 'networkidle2' });
  
  await browser.close();
})();
