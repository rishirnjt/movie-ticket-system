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

  // Handle alerts automatically (e.g., "🎬 Movie Added!")
  page.on('dialog', async dialog => {
    console.log(`ALERT: ${dialog.message()}`);
    await dialog.accept();
  });

  try {
    // 1. NAVIGATE TO THE NEW ADMIN LOGIN PAGE
    console.log("🚀 Navigating to Admin Login page...");
    await page.goto('http://localhost:5173/admin/login', { waitUntil: 'networkidle2' });

    // 2. FILL ADMIN CREDENTIALS USING NEW IDs
    console.log("Filling admin credentials...");
    await page.waitForSelector('#admin-email');
    await page.type('#admin-email', 'admin@cinemax.com');
    await page.type('#admin-password', 'admin@123');
    
    // Optional: Test the show/hide password toggle
    await page.click('#toggle-password-btn');
    await new Promise(r => setTimeout(r, 500));
    await page.click('#toggle-password-btn');

    console.log("Clicking Admin Sign In...");
    
    // 3. ROBUST LOGIN REDIRECT
    // Wait for the URL to change to the dashboard
    await Promise.all([
      page.click('#admin-login-btn'),
      page.waitForNavigation({ waitUntil: 'networkidle0' }) 
    ]);

    // Verify authentication via localStorage
    const hasToken = await page.evaluate(() => !!localStorage.getItem("token"));
    if (!hasToken) {
      throw new Error("Admin Login failed: Token not found.");
    }
    console.log("✅ Admin Login confirmed.");

    // 4. NAVIGATE TO ADD MOVIE
    console.log("Navigating to Add Movie form...");
    await page.goto('http://localhost:5173/admin/add-movie', { waitUntil: 'domcontentloaded' });

    // 5. FILL FORM
    await page.waitForSelector('#movie-title');
    await page.type('#movie-title', 'Interstellar');
    await page.type('#movie-description', 'A masterpiece of space exploration.');
    await page.type('#movie-genre', 'Sci-Fi');

    // 6. UPLOAD POSTER
    // Make sure 'poster.jpeg' is in the same folder as this script
    const filePath = path.resolve(__dirname, 'poster.jpeg'); 
    console.log("Uploading poster...");
    const inputHandle = await page.$('#movie-poster');
    await inputHandle.uploadFile(filePath);

    // Wait for the preview image to render in the UI
    await page.waitForSelector('#poster-preview', { visible: true, timeout: 15000 });
    console.log("Poster preview visible.");

    // 7. TRAILER & METADATA
    await page.type('#movie-trailer', 'https://www.youtube.com/watch?v=zSWdZVtXT7E');
    await page.type('#movie-release-date', '11072014'); // MMDDYYYY for Chrome date inputs
    await page.type('#movie-duration', '169 min');
    await page.type('#movie-rating', 'PG-13');
    await page.type('#movie-language', 'English');

    // 8. SHOWTIMES
    console.log('Filling showtimes...');
    await page.waitForSelector('#showtime-hall-0');
    await page.type('#showtime-hall-0', 'Hall 1');

    await page.focus('#showtime-time-0');
    await page.keyboard.type('19032026'); // MMDDYYYY
    await page.keyboard.press('Tab');
    await page.keyboard.type('0900PM');   // HHmmA

    // 9. SUBMIT MOVIE
    console.log('Submitting form...');
    await page.click('#submit-movie-btn');
    
    // Allow time for the success dialog to be handled
    await new Promise(r => setTimeout(r, 4000));
    console.log('🏁 Admin Movie Addition Test passed!');

  } catch (error) {
    console.error('❌ Automation Error:', error.message);
    if (browser.connected) {
      await page.screenshot({ path: 'admin_login_debug.png' });
      console.log('Saved admin_login_debug.png');
    }
  } finally {
    // Uncomment the line below to close the browser automatically when done
    // await browser.close();
  }
})();