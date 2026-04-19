import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useFileUpload } from './useFileUpload';

const storageMocks = vi.hoisted(() => ({
  uploadFile: vi.fn(),
  uploadPatientAvatar: vi.fn(),
  uploadDoctorAvatar: vi.fn(),
  deleteFile: vi.fn(),
}));

vi.mock('@/lib/storageUtils', () => ({
  uploadFile: storageMocks.uploadFile,
  uploadPatientAvatar: storageMocks.uploadPatientAvatar,
  uploadDoctorAvatar: storageMocks.uploadDoctorAvatar,
  deleteFile: storageMocks.deleteFile,
}));

describe('useFileUpload', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('updates progress and stores upload output on success', async () => {
    const file = new File(['content'], 'laudo.pdf', { type: 'application/pdf' });

    storageMocks.uploadFile.mockImplementation(
      async (
        _file: File,
        _patientId: string,
        _folder: string,
        onProgress: (value: number) => void
      ) => {
        onProgress(45);
        return { url: 'https://cdn/laudo.pdf', path: 'patients/1/laudo.pdf', error: null };
      }
    );

    const { result } = renderHook(() => useFileUpload());

    await act(async () => {
      const response = await result.current.upload(file, 'patient-1', 'attachments');
      expect(response).toEqual({
        success: true,
        url: 'https://cdn/laudo.pdf',
        path: 'patients/1/laudo.pdf',
      });
    });

    expect(result.current.uploading).toBe(false);
    expect(result.current.progress).toBe(100);
    expect(result.current.fileUrl).toBe('https://cdn/laudo.pdf');
    expect(result.current.filePath).toBe('patients/1/laudo.pdf');
    expect(result.current.error).toBeNull();
  });

  it('returns a safe error when avatar upload throws', async () => {
    const file = new File(['avatar'], 'avatar.png', { type: 'image/png' });
    storageMocks.uploadPatientAvatar.mockRejectedValue(new Error('avatar failed'));

    const { result } = renderHook(() => useFileUpload());

    await act(async () => {
      const response = await result.current.uploadAvatar(file, 'patient-1');
      expect(response).toEqual({
        success: false,
        error: 'avatar failed',
      });
    });

    expect(result.current.uploading).toBe(false);
    expect(result.current.progress).toBe(0);
    expect(result.current.error).toBe('avatar failed');
  });

  it('propagates delete result for file removal', async () => {
    storageMocks.deleteFile.mockResolvedValue({ success: true });

    const { result } = renderHook(() => useFileUpload());

    await act(async () => {
      const response = await result.current.removeFile('patients/1/laudo.pdf');
      expect(response).toEqual({ success: true });
    });

    expect(storageMocks.deleteFile).toHaveBeenCalledWith('patients/1/laudo.pdf');
  });
});
