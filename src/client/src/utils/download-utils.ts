export function getFilenameFromContentDisposition(
  contentDisposition: string,
  defaultFilename = 'download',
): string {
  const re = /^attachment;\s*filename="(.*)"/;
  const matches = re.exec(contentDisposition);
  let filename = defaultFilename;
  if (matches) {
    const [, name] = matches;
    if (name) {
      filename = name;
    }
  }
  return filename;
}

export function triggerDownload(objectUrl: string, filename: string): void {
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = escape(filename);
  const parent = document.body;
  parent.appendChild(link);
  link.click();
  parent.removeChild(link);
}
