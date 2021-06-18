import Transport from 'winston-transport';
import { format, transports } from 'winston';
import { ILoggerProvider } from './ILoggerProvider';
import _ from 'lodash';

export default class BaseLoggerProvider implements ILoggerProvider {
  getTransports(isProd: boolean): Transport[] {
    const { combine, timestamp, printf } = format;

    const consoleTransportFormatters = [
      timestamp(),
      printf((options) => {
        const time = options.timestamp;
        const msg = options.message;
        let level = options.level.toUpperCase();
        let user = options?.user?.email || '';
        let location = options.location || '';

        let formattedMsg;
        if (isProd) {
          const clusterName = options.cluster || '';
          const datastoreType = options.datastoreType || '';

          // note, these JSON fields must match what's defined in the filebeat JSON mapping file.
          formattedMsg = JSON.stringify({
            time,
            level,
            user,
            location,
            cluster: clusterName,
            datastoreType,
            message: msg,
          });
        } else {
          level = _.padStart(level, 5);
          user = this.truncateAndPad(user, 24, false);
          location = this.truncateAndPad(location, 30, true);
          formattedMsg = `${time} [${level}] [${user}] [${location}] ${msg}`;
        }
        return formattedMsg;
      }),
    ];

    return [
      new transports.Console({
        format: combine(...consoleTransportFormatters),
      }),
    ];
  }

  /**
   * Helper for truncating a string and returning the string in padded form.
   * @param msg             The string to truncate.
   * @param padding         The amount of padding required.
   * @param ellipsisAtStart True to apply truncate and apply ellipsis to the start of the string.
   *                        False to truncate and apply ellipsis to the end of the string. Defaults to
   *                        false.
   * Returns a string that has exactly "padding" number of characters. If the
   * string required truncation, the returned string will include ellipsis at
   * either the beginning or the end of the string.
   * @private
   */
  private truncateAndPad(
    msg: string,
    padding: number,
    ellipsisAtStart = false,
  ): string {
    let result = msg;
    if (msg.length >= padding) {
      if (ellipsisAtStart) {
        result = `...${msg.slice(-padding + 3)}`;
      } else {
        result = _.truncate(msg, { length: padding });
      }
    }
    result = _.padStart(result, padding);
    return result;
  }
}
