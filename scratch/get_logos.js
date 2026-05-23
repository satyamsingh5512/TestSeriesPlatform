const puppeteer = require('puppeteer');

async function run() {
  const browser = await puppeteer.launch({ headless: "new", args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  const targets = [
    { name: 'SSC', url: 'https://en.wikipedia.org/wiki/Staff_Selection_Commission' },
    { name: 'UPSC', url: 'https://en.wikipedia.org/wiki/Union_Public_Service_Commission' },
    { name: 'NTA', url: 'https://en.wikipedia.org/wiki/National_Testing_Agency' },
    { name: 'IBPS', url: 'https://en.wikipedia.org/wiki/Institute_of_Banking_Personnel_Selection' },
    { name: 'CBSE', url: 'https://en.wikipedia.org/wiki/Central_Board_of_Secondary_Education' }
  ];

  for (let t of targets) {
    await page.goto(t.url, { waitUntil: 'networkidle2' });
    const imgUrl = await page.evaluate(() => {
      const img = document.querySelector('.infobox img');
      return img ? img.src : null;
    });
    console.log(`${t.name}: ${imgUrl}`);
  }
  
  await browser.close();
}

run();
