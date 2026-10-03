export const REQUIRED_SECTIONS: string[];
export const MIN_SCREENSHOTS: number;
export const NO_VISUAL_CHANGE_LABEL: string;
export function isVisualFile(path: string): boolean;
export function sections(body: string): Map<string, string>;
export function checkPullRequest(pr: { body: string; files: string[]; labels: string[] }): string[];
