const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  // 1. Handle the "Movies added successfully!" alert automatically
  page.on('dialog', async dialog => {
    console.log(`Alert detected: ${dialog.message()}`);
    await dialog.accept();
  });

  try {
    // --- LOGIN PHASE ---
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2' });

    await page.waitForSelector('#btn-sign-in');
    await page.click('#btn-sign-in');

    await page.waitForSelector('#input-email', { visible: true });
    await page.type('#input-email', 'admin@cinemax.com');
    await page.type('#input-password', 'admin@123');
    await page.click('#btn-go');

    // Wait for login to complete and navigate to the Add Movies page
    // Note: Adjust the URL if your route is different
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    await page.goto('http://localhost:5173/admin/add-movie'); 

    // --- ADD MOVIE PHASE (Using your new IDs) ---
    console.log('Filling out movie form...');
    await page.waitForSelector('#add-title');

    // Text inputs
    await page.type('#add-title', 'Interstellar');
    await page.type('#add-description', 'A team of explorers travel through a wormhole in space.');
    await page.type('#add-genre', 'Sci-Fi');

   // --- FILE UPLOAD LOGIC ---
    console.log('Selecting file...');
    
    // 1. Define the absolute path to the image on YOUR laptop
    // This replaces the manual "selecting from the system" step
    const filePath = path.resolve(__dirname, 'poster.jpg'); 

    // 2. Find the hidden file input by its ID
    const inputUploadHandle = await page.$('#add-poster');
    
    // 3. Upload the file directly to the element
    await inputUploadHandle.uploadFile(filePath);

    // 4. WAIT: Your React code does 'axios.post' immediately after selection.
    // We must wait for the "Poster Preview" image to appear in the UI.
    console.log('Waiting for backend upload to finish...');
    await page.waitForSelector('img[alt="Poster Preview"]', { visible: true });
    console.log('Upload complete!');

    // --- FILL REMAINING FIELDS ---
    await page.type('#add-title', 'Interstellar');
    await page.type('#add-description', 'Space exploration movie.');
    await page.type('#add-genre', 'Sci-Fi');
    await page.type('#add-release-date', '2014-11-07');
    await page.type('#add-duration', '169 min');
    await page.type('#add-rating', '8.7');
    await page.type('#add-language', 'English');

    // --- SUBMIT ---
    await page.click('button[type="submit"]');
    console.log('Form submitted successfully!');

  } catch (error) {
    console.error('Error:', error);
  }
})();

   