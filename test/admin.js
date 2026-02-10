const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    slowMo: 60
  });

  const page = await browser.newPage();

  page.on('dialog', async dialog => {
    console.log(`ALERT: ${dialog.message()}`);
    await dialog.accept();
  });

  try {
    //LOGIN
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2' });
    await page.waitForSelector('#btn-sign-in');
    await page.click('#btn-sign-in');

    await page.waitForSelector('#input-email');
    await page.type('#input-email', 'admin@cinemax.com');
    await page.type('#input-password', 'admin@123');
    await page.click('#btn-go');

    await page.waitForNavigation({ waitUntil: 'networkidle0' });

    //NAVIGATE TO ADD MOVIE
    await page.goto('http://localhost:5173/admin/add-movie');

    //  FILL DETAILS
    await page.waitForSelector('#movie-title');
    await page.type('#movie-title', 'Interstellar');
    await page.type('#movie-description', 'A masterpiece of space exploration.');
    await page.type('#movie-genre', 'Sci-Fi');

    // FILE UPLOAD (POSTER)
    const filePath = path.resolve(__dirname, 'poster.jpeg'); 
    console.log("Uploading poster...");
    
    await page.waitForSelector('#movie-poster');
    const inputHandle = await page.$('#movie-poster');
    await inputHandle.uploadFile(filePath);

    await page.waitForSelector('#poster-preview', { visible: true, timeout: 15000 });
    console.log('Poster upload successful!');

    // TRAILER URL 
    console.log('Entering Trailer URL...');
    await page.waitForSelector('#movie-trailer');
    await page.type('#movie-trailer', 'https://www.youtube.com/watch?v=zSWdZVtXT7E');

    // FILL REMAINING FIELDS
    await page.type('#movie-release-date', '11072014'); 
    await page.type('#movie-duration', '169 min');
    await page.type('#movie-rating', 'PG-13');
    await page.type('#movie-language', 'English');

    // 7. SHOWTIMES
    console.log('Filling showtimes...');
    await page.waitForSelector('#showtime-hall-0');
    await page.type('#showtime-hall-0', 'Hall 1');

    await page.waitForSelector('#showtime-time-0');
    await page.focus('#showtime-time-0');

    // Keyboard simulation for datetime-local
    await page.keyboard.type('02102026'); // MMDDYYYY
    await page.keyboard.press('Tab');
    await page.keyboard.type('0900PM');   // HHmmA

    // 8. SUBMIT
    console.log('Submitting form...');
    await page.waitForSelector('#submit-movie-btn');
    await page.click('#submit-movie-btn');
    
    console.log('Test completed successfully!');
    await new Promise(r => setTimeout(r, 3000));

  } catch (error) {
    console.error('Automation Error:', error.message);
    await page.screenshot({ path: 'error_screenshot.png' });
  } finally {
    // await browser.close();
  }
})();