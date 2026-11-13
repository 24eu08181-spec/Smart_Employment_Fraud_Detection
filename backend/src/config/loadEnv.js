import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const configDirectory = path.dirname(fileURLToPath(import.meta.url));
const rootDirectory = path.resolve(configDirectory, '../../..');

dotenv.config({ path: path.join(rootDirectory, '.env') });
