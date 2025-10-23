import 'axios';
declare module 'axios' {
  export interface AxiosRequestConfig {
    /** mark that we've already retried this request once */
    _retry?: boolean;
    /** opt-out of refresh logic for specific calls */
    skipAuthRefresh?: boolean;
  }
}
