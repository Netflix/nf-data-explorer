import { Response } from 'express';

export function sendFile(
  res: Response,
  mime: string,
  filename = '',
  buffer: Buffer | string,
  bufferLength?: number,
): void {
  res.writeHead(200, {
    'Content-Type': mime,
    'Content-disposition': `attachment; filename="${filename}"`,
    'Content-Length': bufferLength || buffer.length,
  });
  res.end(buffer);
}
