const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    slowMo: 80, 
    defaultViewport: null,
    args: ['--start-maximized']
  });

  const page = await browser.newPage();
  page.setDefaultTimeout(30000); 

  page.on('dialog', async dialog => {
    console.log(`ALERT: ${dialog.message()}`);
    await dialog.accept();
  });

  try {
    // 1. NAVIGATE TO LOGIN
    console.log("🚀 Navigating to Login page...");
    await page.goto('http://localhost:5173/auth?tab=signin', { waitUntil: 'networkidle2' });

    // 2. FILL CREDENTIALS
    await page.waitForSelector('#input-email');
    await page.type('#input-email', 'admin@cinemax.com');
    await page.type('#input-password', 'admin@123');
    
    console.log("Clicking Sign In...");
    
    // 3. ROBUST LOGIN REDIRECT
    // We wait for the URL to change and for a dashboard element to appear
    await Promise.all([
      page.click('#btn-go'),
      page.waitForNavigation({ waitUntil: 'networkidle0' }) 
    ]);

    // Double-check: verify if token exists in localStorage
    const hasToken = await page.evaluate(() => !!localStorage.getItem("token"));
    if (!hasToken) {
      throw new Error("Login failed: Token not found in localStorage.");
    }
    console.log("✅ Login confirmed via Token.");

    // 4. NAVIGATE TO ADD MOVIE
    console.log("Navigating to Add Movie form...");
    await page.goto('http://localhost:5173/admin/add-movie', { waitUntil: 'domcontentloaded' });

    // 5. FILL FORM
    await page.waitForSelector('#movie-title');
    await page.type('#movie-title', 'Interstellar');
    await page.type('#movie-description', 'A masterpiece of space exploration.');
    await page.type('#movie-genre', 'Sci-Fi');

    // 6. UPLOAD POSTER
    const filePath = path.resolve(__dirname, 'poster.jpeg'); 
    console.log("Uploading poster...");
    const inputHandle = await page.$('#movie-poster');
    await inputHandle.uploadFile(filePath);

    // Wait for the preview image to render
    await page.waitForSelector('#poster-preview', { visible: true, timeout: 15000 });
    console.log("Poster preview visible.");

    // 7. TRAILER & METADATA
    await page.type('#movie-trailer', 'https://www.youtube.com/watch?v=zSWdZVtXT7E');
    await page.type('#movie-release-date', '11072014'); 
    await page.type('#movie-duration', '169 min');
    await page.type('#movie-rating', 'PG-13');
    await page.type('#movie-language', 'English');

    // 8. SHOWTIMES
    console.log('Filling showtimes...');
    await page.waitForSelector('#showtime-hall-0');
    await page.type('#showtime-hall-0', 'Hall 1');

    await page.focus('#showtime-time-0');
    await page.keyboard.type('02102026'); 
    await page.keyboard.press('Tab');
    await page.keyboard.type('0900PM');   

    // 9. SUBMIT
    console.log('Submitting form...');
    await page.click('#submit-movie-btn');
    
    await new Promise(r => setTimeout(r, 4000));
    console.log('🏁 Test completed successfully!');

  } catch (error) {
    console.error('❌ Automation Error:', error.message);
    if (browser.connected) {
      await page.screenshot({ path: 'login_error_debug.png' });
      console.log('Saved login_error_debug.png');
    }
  } finally {
    // Keep browser open to see the error/result
    // await browser.close();
  }
})();