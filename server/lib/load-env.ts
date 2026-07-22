import path from 'path';
import fs from 'fs';

const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  const envFile = fs.readFileSync(envPath, 'utf8');
  envFile.split(/\r?\n/).forEach((line) => {
    if (!line || line.startsWith('#') || !line.includes('=')) return;
    const [key, ...valueParts] = line.split('=');
    const cleanKey = key.trim();
    let cleanVal = valueParts.join('=').trim();
    if ((cleanVal.startsWith('"') && cleanVal.endsWith('"')) ||
        (cleanVal.startsWith("'") && cleanVal.endsWith("'"))) {
      cleanVal = cleanVal.slice(1, -1);
    }
    process.env[cleanKey] = cleanVal;
  });
}
