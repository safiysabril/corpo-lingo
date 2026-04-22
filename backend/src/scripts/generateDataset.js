require('dotenv').config();
const fs = require('fs');
const { translateText } = require('../services/groq.service');

const inputs = require('./inputs.json');

const MODES = ['email', 'documentation', 'formal'];
const DEGREES = ['few', 'moderate', 'high'];

const OUTPUT_FILE = './dataset.jsonl';

async function generate() {
  const stream = fs.createWriteStream(OUTPUT_FILE, { flags: 'a' });

  for (const text of inputs) {
    for (const mode of MODES) {
      for (const degree of DEGREES) {
        try {
          const res = await translateText(text, mode, degree);

          const record = {
            messages: [
              {
                role: 'system',
                content: `Mode: ${mode}\nDegree: ${degree}\nRewrite text formally.`,
              },
              {
                role: 'user',
                content: text,
              },
              {
                role: 'assistant',
                content: res.translatedText,
              },
            ],
          };

          stream.write(JSON.stringify(record) + '\n');

          console.log(`✅ ${mode} | ${degree} | ${text}`);
        } catch (err) {
          console.error(`❌ Failed: ${text}`, err.message);
        }
      }
    }
  }

  stream.end();
}

generate();