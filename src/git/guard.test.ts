import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('node:child_process', () => ({
    execSync: vi.fn(),
}));

import { execSync } from 'node:child_process';
import { getGitStatus } from './guard.js';

const mockedExecSync = vi.mocked(execSync);

describe('getGitStatus', () => {
    beforeEach(() => {
        mockedExecSync.mockReset();
    });

    it('returns clean when there are no changes', () => {
        mockedExecSync.mockReturnValue('' as never);
        expect(getGitStatus('/some/dir')).toEqual({ isClean: true, uncommittedFiles: [] });
    });

    it('returns files when porcelain output is non-empty', () => {
        mockedExecSync.mockReturnValue(' M src/a.ts\n?? file.txt' as never);
        const info = getGitStatus('/some/dir');
        expect(info.isClean).toBe(false);
        expect(info.uncommittedFiles).toEqual(['M src/a.ts', '?? file.txt']);
    });

    it('treats non-git directories as clean', () => {
        mockedExecSync.mockImplementation(() => {
            throw new Error('not a git repository');
        });
        expect(getGitStatus('/some/dir')).toEqual({ isClean: true, uncommittedFiles: [] });
    });
});