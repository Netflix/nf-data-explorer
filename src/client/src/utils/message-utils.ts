import { NotificationType } from '@/typings/notifications';
import { MessageBox, Notification } from 'element-ui';
import {
  ElMessageBoxOptions,
  MessageBoxInputData,
} from 'element-ui/types/message-box';
import { ElNotificationOptions } from 'element-ui/types/notification';

/**
 * Provides a wrapper around Element's alert style Messagebox with a more convenient API.
 *
 * E.g.
 * ```
 * if (await alert(title, message, 'OK')) {
 *   // do your thing...
 * }
 * ```
 * @param title The message box title.
 * @param message The message content.
 * @param confirmButtonText The confirmation button text (defaults to 'OK').
 */
export async function alert(
  title: string,
  message: string,
  confirmButtonText = 'OK',
  options?: ElMessageBoxOptions,
): Promise<boolean> {
  try {
    await MessageBox.alert(message, title, {
      confirmButtonText,
      ...options,
    });
    return true;
  } catch (err) {
    return false;
  }
}

/**
 * Provides a wrapper around Element's MessageBox that has a more convenient API.
 *
 * E.g.
 * ```
 * if (await confirmPrompt(title, message, 'OK', 'Cancel', )) {
 *   // do your thing...
 * }
 * ```
 * @param title The message box title.
 * @param message The message content.
 * @param confirmButtonText The confirmation button text (defaults to 'OK').
 * @param cancelButtonText The cancel button text (defaults to 'Cancel').
 * @param type The type of the messagebox to present (defaults to 'info').
 */
export async function confirmPrompt(
  title: string,
  message: string,
  confirmButtonText = 'OK',
  cancelButtonText = 'Cancel',
  type: NotificationType = NotificationType.Info,
  options?: ElMessageBoxOptions,
): Promise<boolean> {
  try {
    await MessageBox.confirm(message, title, {
      confirmButtonText,
      cancelButtonText,
      type: NotificationType[
        type
      ].toLowerCase() as ElNotificationOptions['type'],
      ...options,
    });
    return true;
  } catch (err) {
    // user cancelled
    return false;
  }
}

export async function prompt(
  title: string,
  message: string,
  confirmButtonText = 'OK',
  cancelButtonText = 'Cancel',
  type: NotificationType = NotificationType.Info,
  options?: ElMessageBoxOptions,
): Promise<{
  confirm: boolean;
  value: string | undefined;
}> {
  let value = undefined as string | undefined;
  let confirm = false;
  try {
    const result = await MessageBox.prompt(message, title, {
      confirmButtonText,
      cancelButtonText,
      type: NotificationType[
        type
      ].toLowerCase() as ElNotificationOptions['type'],
      ...options,
    });
    value = (result as MessageBoxInputData).value;
    confirm = true;
  } catch (err) {
    // user cancelled
    confirm = false;
  }
  return { confirm, value };
}

/**
 * Helper method for presenting a notification.
 * @param type The type of notification to display.
 * @param title The title for the message dialog.
 * @param message The message to display.
 */
export function notify(
  type: NotificationType,
  title: string,
  message: string,
): void {
  Notification({
    title,
    message,
    type: NotificationType[type].toLowerCase() as ElNotificationOptions['type'],
    position: 'bottom-right',
  });
}
