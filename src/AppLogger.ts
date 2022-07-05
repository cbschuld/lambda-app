import { AppLoggerInterface } from './'

export default class AppLogger implements AppLoggerInterface {
  info(message: string) {
    console.info(message)
  }
  error(message: string) {
    console.error(message)
  }
  debug(message: string) {
    console.debug(message)
  }
  warn(message: string) {
    console.warn(message)
  }
}
