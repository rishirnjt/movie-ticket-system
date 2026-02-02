const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({ 
    headless: false,
    slowMo: 50 
  });
  const page = await browser.newPage();

  page.on('dialog', async dialog => {
    console.log(`Alert detected: ${dialog.message()}`);
    await dialog.accept();
  });

  try {
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2' });

    // --- LOGIN PHASE ---
    await page.waitForSelector('#btn-sign-in');
    await page.click('#btn-sign-in');
    await page.waitForSelector('#input-email', { visible: true });
    await page.type('#input-email', 'admin@cinemax.com');
    await page.type('#input-password', 'admin@123');
    await page.click('#btn-go');

    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    await page.goto('http://localhost:5173/admin/add-movie'); 

    // --- ADD MOVIE PHASE ---
    await page.waitForSelector('#add-title');

    await page.type('#add-title', 'Interstellar');
    await page.type('#add-description', 'Space exploration movie.');
    await page.type('#add-genre', 'Sci-Fi');

    // --- FILE UPLOAD ---
    const filePath = path.resolve(__dirname, 'poster.jpeg'); 
    const inputUploadHandle = await page.$('#add-poster');
    await inputUploadHandle.uploadFile(filePath);

    // Wait for the preview image to appear before moving on
    await page.waitForSelector('img[alt="Poster Preview"]', { visible: true });
    console.log('Upload complete!');

    // --- REMAINING FIELDS ---
    await page.type('#add-release-date', '2014-11-07');
    await page.type('#add-duration', '169 min');
    await page.type('#add-rating', '8.7');
    await page.type('#add-language', 'English');

    // --- SHOWTIME & HALL (The missing part) ---
    console.log('Filling showtimes...');
    
    // Using placeholder selectors because these don't have IDs in your React code
    await page.waitForSelector('input[placeholder="Hall"]');
    await page.type('input[placeholder="Hall"]', 'Hall 1');
    
    await page.waitForSelector('input[placeholder="Time (e.g. 12:00 PM)"]');
    await page.type('input[placeholder="Time (e.g. 12:00 PM)"]', '09:00 PM');

    // --- SUBMIT ---
    await new Promise(r => setTimeout(r, 1000)); 
    
    await page.click('button[type="submit"]');
    console.log('Form submitted successfully!');

  } catch (error) {
    console.error('Error:', error);
  }
})();