import 'dotenv/config';
import * as fs from 'fs';
import { translateText } from '../services/groq.service';

import inputs from './inputs.json';

const MODES = ['email', 'documentation', 'formal'] as const;
const FORMALITY_LEVELS = ['low', 'medium', 'high'] as const;

const OUTPUT_FILE = './dataset.jsonl';

async function generate(): Promise<void> {
  const stream = fs.createWriteStream(OUTPUT_FILE, { flags: 'a' });

  for (const text of inputs) {
    for (const mode of MODES) {
      for (const formality of FORMALITY_LEVELS) {
        try {
          const res = await translateText(text, mode, formality);

          const record = {
            messages: [
              {
                role: 'system',
                content: `Mode: ${mode}\nFormality: ${formality}\nRewrite text formally.`,
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

          console.log(`✅ ${mode} | ${formality} | ${text}`);
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : String(err);
          console.error(`❌ Failed: ${text}`, message);
        }
      }
    }
  }

  stream.end();
}

generate();