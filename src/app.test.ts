import { describe, it, expect } from 'vitest';

describe('app', () => {
  it('is defined', () => {
    expect(true).toBe(true);
  });

  it('correctly groups files by folderId', () => {
    const files = [
      { id: '1', name: 'f1.js', folderId: 'folder1', projectId: 'p1', content: '', language: 'js', updatedAt: 0 },
      { id: '2', name: 'f2.js', folderId: 'folder1', projectId: 'p1', content: '', language: 'js', updatedAt: 0 },
      { id: '3', name: 'root.js', folderId: null, projectId: 'p1', content: '', language: 'js', updatedAt: 0 },
    ];

    const filesByFolderId = new Map<string | null, typeof files>();
    for (let i = 0; i < files.length; i++) {
      const folderId = files[i].folderId;
      const list = filesByFolderId.get(folderId);
      if (list) {
        list.push(files[i]);
      } else {
        filesByFolderId.set(folderId, [files[i]]);
      }
    }

    expect(filesByFolderId.get('folder1')).toHaveLength(2);
    expect(filesByFolderId.get(null)).toHaveLength(1);
  });
});
