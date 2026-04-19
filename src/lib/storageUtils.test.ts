import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ALLOWED_IMAGE_TYPES,
  ALL_ALLOWED_TYPES,
  BUCKET_NAME,
  buildFilePath,
  deleteFile,
  deleteFileByUrl,
  formatFileSize,
  generateUniqueFileName,
  getFileExtension,
  getFileUrl,
  getSignedUrl,
  isAudioFile,
  isFullUrl,
  isImageFile,
  isPdfFile,
  listPatientFiles,
  uploadDoctorAvatar,
  uploadFile,
  validateFileSize,
  validateFileType,
} from './storageUtils';

const storageMocks = vi.hoisted(() => {
  const upload = vi.fn();
  const createSignedUrl = vi.fn();
  const remove = vi.fn();
  const list = vi.fn();
  const download = vi.fn();
  const from = vi.fn();

  return {
    upload,
    createSignedUrl,
    remove,
    list,
    download,
    from,
  };
});

vi.mock('./supabaseClient', () => ({
  supabase: {
    storage: {
      from: storageMocks.from,
    },
  },
}));

function buildBucket() {
  return {
    upload: storageMocks.upload,
    createSignedUrl: storageMocks.createSignedUrl,
    remove: storageMocks.remove,
    list: storageMocks.list,
    download: storageMocks.download,
  };
}

describe('storageUtils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    storageMocks.from.mockReturnValue(buildBucket());
  });

  it('validates file metadata and path helpers', () => {
    const file = new File(['img'], 'foto.png', { type: 'image/png' });
    expect(validateFileType(file, ALLOWED_IMAGE_TYPES)).toBe(true);
    expect(validateFileType(file, ['application/pdf'])).toBe(false);
    expect(validateFileSize(file, 10)).toBe(true);
    expect(buildFilePath('patient-1', 'avatar', 'file.png')).toBe('patient-1/avatar/file.png');
    expect(generateUniqueFileName('meu exame.pdf')).toMatch(/^meu_exame_\d+_.+\.pdf$/);
  });

  it('uploads a valid file and returns the signed URL', async () => {
    storageMocks.upload.mockResolvedValue({ error: null });
    storageMocks.createSignedUrl.mockResolvedValue({
      data: { signedUrl: 'https://signed/url' },
      error: null,
    });

    const file = new File(['pdf'], 'laudo.pdf', { type: 'application/pdf' });
    const result = await uploadFile(file, 'patient-1', 'attachments');

    expect(storageMocks.from).toHaveBeenCalledWith(BUCKET_NAME);
    expect(result.error).toBeUndefined();
    expect(result.url).toBe('https://signed/url');
    expect(result.path).toMatch(/^patient-1\/attachments\/laudo_/);
  });

  it('rejects invalid doctor avatar uploads before storage calls', async () => {
    const file = new File(['doc'], 'arquivo.pdf', { type: 'application/pdf' });
    const result = await uploadDoctorAvatar(file, 'doctor-1');

    expect(result).toEqual({
      path: '',
      url: '',
      error: 'Por favor, selecione uma imagem válida (JPEG, PNG, WebP ou GIF)',
    });
    expect(storageMocks.upload).not.toHaveBeenCalled();
  });

  it('handles signed URL and direct external URLs', async () => {
    storageMocks.createSignedUrl.mockResolvedValue({
      data: { signedUrl: 'https://signed/local-file' },
      error: null,
    });

    expect(isFullUrl('https://example.com/file.pdf')).toBe(true);
    expect(isFullUrl('patient-1/attachments/file.pdf')).toBe(false);
    await expect(getSignedUrl('patient-1/attachments/file.pdf')).resolves.toBe('https://signed/local-file');
    await expect(getFileUrl('https://example.com/file.pdf')).resolves.toBe('https://example.com/file.pdf');
    await expect(getFileUrl('patient-1/attachments/file.pdf')).resolves.toBe('https://signed/local-file');
  });

  it('deletes internal storage files and ignores external URLs', async () => {
    storageMocks.remove.mockResolvedValue({ error: null });

    await expect(deleteFile('patient-1/attachments/file.pdf')).resolves.toEqual({ success: true });
    await expect(deleteFile('https://example.com/file.pdf')).resolves.toEqual({ success: true });
    expect(storageMocks.remove).toHaveBeenCalledWith(['patient-1/attachments/file.pdf']);
  });

  it('extracts the storage path from signed URLs before deleting', async () => {
    storageMocks.remove.mockResolvedValue({ error: null });

    const result = await deleteFileByUrl(
      'https://project.supabase.co/storage/v1/object/sign/medical-files/patient-1%2Fattachments%2Ffile.pdf?token=abc'
    );

    expect(result).toEqual({ success: true });
    expect(storageMocks.remove).toHaveBeenCalledWith(['patient-1/attachments/file.pdf']);
  });

  it('lists files and classifies helper types correctly', async () => {
    storageMocks.list.mockResolvedValue({
      data: [{ name: 'laudo.pdf' }],
      error: null,
    });

    const listResult = await listPatientFiles('patient-1', 'attachments');

    expect(listResult.files).toEqual([{ name: 'laudo.pdf' }]);
    expect(getFileExtension('foto.final.PNG')).toBe('png');
    expect(isImageFile('foto.png')).toBe(true);
    expect(isPdfFile('arquivo', 'https://cdn/report.pdf')).toBe(true);
    expect(isAudioFile('audio.ogg')).toBe(true);
    expect(formatFileSize(1024)).toBe('1 KB');
    expect(ALL_ALLOWED_TYPES).toContain('application/pdf');
  });
});
