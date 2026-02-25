import axios from 'axios';
import fs from 'fs';
import path from 'path';
import https from 'https';
import ffmpeg from 'fluent-ffmpeg';
import dotenv from 'dotenv';

dotenv.config();

// @ts-ignore - ffprobe-static doesn't have proper types
import * as ffprobeStatic from 'ffprobe-static';
const ffprobePath = (ffprobeStatic as any).path || ffprobeStatic;

ffmpeg.setFfprobePath(ffprobePath);

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';

export const downloadFile = async (fileUrl: string, subfolder: string, filename: string): Promise<string> => {
  const dir = path.join(UPLOAD_DIR, subfolder);
  
  // Ensure directory exists
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  const filePath = path.join(dir, filename);
  
  const response = await axios({
    method: 'GET',
    url: fileUrl,
    responseType: 'stream',
    httpsAgent: new https.Agent({ family: 4 })
  });
  
  const writer = fs.createWriteStream(filePath);
  
  return new Promise((resolve, reject) => {
    response.data.pipe(writer);
    
    writer.on('finish', () => {
      resolve(`/uploads/${subfolder}/${filename}`);
    });
    
    writer.on('error', reject);
  });
};

export const validateAudio = async (filePath: string): Promise<{ valid: boolean; duration?: number }> => {
  return new Promise((resolve) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) {
        resolve({ valid: false });
        return;
      }
      
      const duration = metadata.format.duration;
      
      // Check if duration is less than 60 seconds
      if (duration && duration <= 60) {
        resolve({ valid: true, duration: Math.round(duration) });
      } else {
        resolve({ valid: false });
      }
    });
  });
};

export const getFileSize = (filePath: string): number => {
  try {
    const stats = fs.statSync(filePath);
    return stats.size;
  } catch {
    return 0;
  }
};

export const deleteFile = (relativePath: string): void => {
  try {
    const fullPath = path.join(process.cwd(), relativePath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
  } catch (error) {
    console.error('Error deleting file:', error);
  }
};