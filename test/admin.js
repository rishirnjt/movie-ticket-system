const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    slowMo: 60
  });

  const page = await browser.newPage();

  // Handle alerts automatically
  page.on('dialog', async dialog => {
    console.log(`ALERT: ${dialog.message()}`);
    await dialog.accept();
  });

  try {
    // 1. LOGIN
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2' });
    await page.waitForSelector('#btn-sign-in');
    await page.click('#btn-sign-in');

    await page.waitForSelector('#input-email');
    await page.type('#input-email', 'admin@cinemax.com');
    await page.type('#input-password', 'admin@123');
    await page.click('#btn-go');

    await page.waitForNavigation({ waitUntil: 'networkidle0' });

    // 2. NAVIGATE TO ADD MOVIE
    await page.goto('http://localhost:5173/admin/add-movie');

    // 3. FILL DETAILS
    await page.waitForSelector('#movie-title');
    await page.type('#movie-title', 'Interstellar');
    await page.type('#movie-description', 'A masterpiece of space exploration.');
    await page.type('#movie-genre', 'Sci-Fi');

    // 4. FILE UPLOAD (POSTER)
    const filePath = path.resolve(__dirname, 'poster.jpeg'); 
    console.log("Uploading poster...");
    
    await page.waitForSelector('#movie-poster');
    const inputHandle = await page.$('#movie-poster');
    await inputHandle.uploadFile(filePath);

    // Wait for the img to appear (React renders it once movie.posterUrl is truthy)
    await page.waitForSelector('#poster-preview', { visible: true, timeout: 15000 });
    console.log('Poster upload successful!');

    // 5. FILL REMAINING FIELDS
    await page.type('#movie-release-date', '2014-11-07');
    await page.type('#movie-duration', '169 min');
    await page.type('#movie-rating', 'PG-13');
    await page.type('#movie-language', 'English');

    // 6. SHOWTIMES
console.log('Filling showtimes...');

await page.waitForSelector('#showtime-hall-0');
await page.type('#showtime-hall-0', 'Hall 1');

await page.waitForSelector('#showtime-time-0');
await page.focus('#showtime-time-0');

// Format: MMDDYYYY (then Tab) HHmm (then AM/PM if applicable)
// Example for Feb 10, 2026, 09:00 PM:
await page.keyboard.type('02102026'); // MMDDYYYY
await page.keyboard.press('Tab');
await page.keyboard.type('0900PM');   // HHmmA

console.log('Date entered via keyboard simulation.');
    // 7. SUBMIT
    console.log('Submitting form...');
    await page.click('#submit-movie-btn');
    
    console.log('Test completed successfully!');

  } catch (error) {
    console.error('Automation Error:', error.message);
    await page.screenshot({ path: 'error_screenshot.png' });
  } finally {
    // await browser.close();
  }
})();