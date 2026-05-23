const axios = require('axios');
const fs = require('fs');
const path = require('path');

const dir = 'frontend/public/logos';
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

async function downloadWikiImage(filename, saveAs) {
  try {
    const res = await axios.get(`https://commons.wikimedia.org/w/api.php?action=query&titles=File:${filename}&prop=imageinfo&iiprop=url&format=json`);
    const pages = res.data.query.pages;
    const page = Object.values(pages)[0];
    if (!page.imageinfo) {
        console.error('No imageinfo found for', filename);
        return;
    }
    const url = page.imageinfo[0].url;
    console.log(`Downloading ${url} to ${saveAs}`);
    
    const response = await axios({
      url,
      method: 'GET',
      responseType: 'stream',
      headers: { 'User-Agent': 'ExamForge/1.0' }
    });
    
    const writer = fs.createWriteStream(path.join(dir, saveAs));
    response.data.pipe(writer);
    
    return new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });
  } catch (e) {
    console.error('Failed to download', filename, e.message);
  }
}

async function run() {
  const files = [
    { file: 'Staff_Selection_Commission_Logo.png', name: 'ssc.png' },
    { file: 'State_Bank_of_India_logo.svg', name: 'sbi.svg' },
    { file: 'Central_Board_of_Secondary_Education_logo.png', name: 'cbse.png' },
    { file: 'National_Testing_Agency_logo.png', name: 'nta.png' },
    { file: 'Union_Public_Service_Commission_Logo.svg', name: 'upsc.svg' },
    { file: 'Emblem_of_India.svg', name: 'emblem.svg' },
    { file: 'Emblem_of_the_Ministry_of_Defence_of_India.svg', name: 'defence.svg' },
    { file: 'IBPS_logo.png', name: 'ibps.png' }
  ];

  for (const f of files) {
    await downloadWikiImage(f.file, f.name);
  }
}

run();
