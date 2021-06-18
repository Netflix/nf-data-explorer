import { NotificationType } from '@/typings/notifications';
import { notify as notifyUser } from './message-utils';

export function copyToClipboard(
  value: string,
  container: HTMLElement,
  notify: boolean,
  message = 'Copied to Clipboard',
  detailMessage = '',
): void {
  const textArea = document.createElement('textarea');
  textArea.value = value;

  container.appendChild(textArea);
  textArea.select();

  try {
    document.execCommand('copy');
  } catch (err) {
    // no-op
  }

  container.removeChild(textArea);

  if (notify) {
    notifyUser(NotificationType.Success, message, detailMessage);
  }
}
