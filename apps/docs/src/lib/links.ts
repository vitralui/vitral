/** Where the project lives. */
export const REPO_URL = 'https://github.com/vitralui/vitral';

/** A folder or file in the repository, on the main branch. */
export function repoPath(path: string): string {
    return `${REPO_URL}/tree/main/${path.replace(/^\//, '')}`;
}
