import { describe, it, expect } from 'vitest';
import { VFile } from '../types';

describe('Workspace File Grouping Performance', () => {
  it('groups project files into a folder map with O(1) lookups and faster execution', () => {
    // Generate 1000 files across 50 folders for a realistic large project benchmark
    const projectId = 'proj-1';
    const files: VFile[] = [];
    const numFolders = 50;
    const filesPerFolder = 20;

    for (let f = 0; f < numFolders; f++) {
      const folderId = `folder-${f}`;
      for (let i = 0; i < filesPerFolder; i++) {
        files.push({
          id: `file-${f}-${i}`,
          name: `file-${f}-${i}.js`,
          content: 'console.log("test");',
          language: 'javascript',
          projectId,
          folderId,
          updatedAt: Date.now(),
        });
      }
    }
    // Add 100 root files (folderId = null)
    for (let r = 0; r < 100; r++) {
      files.push({
        id: `root-file-${r}`,
        name: `root-${r}.js`,
        content: 'console.log("root");',
        language: 'javascript',
        projectId,
        folderId: null,
        updatedAt: Date.now(),
      });
    }

    const iterations = 50;

    // Benchmark O(N_folders * N_files) unoptimized linear approach
    const startLinear = performance.now();
    let totalLinearCount = 0;
    for (let iter = 0; iter < iterations; iter++) {
      for (let f = 0; f < numFolders; f++) {
        const folderId = `folder-${f}`;
        const folderFiles = files.filter((file) => file.folderId === folderId);
        totalLinearCount += folderFiles.length;
      }
      const rootFiles = files.filter((file) => file.folderId === null);
      totalLinearCount += rootFiles.length;
    }
    const durationLinear = performance.now() - startLinear;

    // Benchmark O(N_files) map approach
    const startMap = performance.now();
    let totalMapCount = 0;
    for (let iter = 0; iter < iterations; iter++) {
      const map = new Map<string | null, VFile[]>();
      for (const file of files) {
        const key = file.folderId;
        const list = map.get(key);
        if (list) {
          list.push(file);
        } else {
          map.set(key, [file]);
        }
      }

      for (let f = 0; f < numFolders; f++) {
        const folderFiles = map.get(`folder-${f}`) || [];
        totalMapCount += folderFiles.length;
      }
      const rootFiles = map.get(null) || [];
      totalMapCount += rootFiles.length;
    }
    const durationMap = performance.now() - startMap;

    expect(totalMapCount).toBe(totalLinearCount);
    expect(durationMap).toBeLessThan(durationLinear);
  });
});
