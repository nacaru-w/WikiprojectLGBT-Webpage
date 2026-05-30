// Application version shown in the UI (e.g. the footer). Keep in sync with the
// "version" field in package.json. Defined as a small constant rather than
// importing package.json so the client bundle doesn't ship the full manifest
// (dependency list, scripts, …).
export const APP_VERSION = '2.1.0';
