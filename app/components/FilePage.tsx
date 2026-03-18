'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../../lib/supabase';

interface Folder {
  id: string;
  name: string;
  password: string | null;
  created_at: string;
}

interface StorageFile {
  name: string;
  id: string | null;
  created_at: string | null;
  updated_at: string | null;
  metadata: { size: number; mimetype: string } | null;
}

const BUCKET = 'files';
const SESSION_KEY = (fid: string) => `folder_unlocked_${fid}`;

function sessionUnlocked(fid: string): boolean {
  if (typeof window === 'undefined') return false;
  return sessionStorage.getItem(SESSION_KEY(fid)) === '1';
}

function fileIcon(mime: string): string {
  if (!mime) return '📄';
  if (mime.startsWith('image/')) return '🖼️';
  if (mime === 'application/pdf') return '📕';
  if (mime.includes('spreadsheet') || mime.includes('excel')) return '📊';
  if (mime.startsWith('video/')) return '🎬';
  if (mime.startsWith('audio/')) return '🎵';
  if (mime.includes('word') || mime.includes('document')) return '📝';
  return '📄';
}

function formatSize(bytes: number | undefined): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
}

export default function FilePage() {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<Folder | null>(null);
  const [files, setFiles] = useState<StorageFile[]>([]);
  const [unlockedMap, setUnlockedMap] = useState<Record<string, boolean>>({});

  const [loadingFolders, setLoadingFolders] = useState(true);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [uploading, setUploading] = useState(false);

  // New folder modal
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderUsePw, setNewFolderUsePw] = useState(false);
  const [newFolderPw, setNewFolderPw] = useState('');

  // Password modal
  const [pwFolder, setPwFolder] = useState<Folder | null>(null);
  const [pwInput, setPwInput] = useState('');
  const [pwError, setPwError] = useState(false);

  // Preview modal
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewMime, setPreviewMime] = useState('');
  const [previewName, setPreviewName] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { loadFolders(); }, []);

  async function loadFolders() {
    setLoadingFolders(true);
    const { data } = await supabase
      .from('file_folders')
      .select('*')
      .order('created_at');
    setFolders(data ?? []);
    setLoadingFolders(false);
  }

  const loadFiles = useCallback(async (folder: Folder) => {
    setLoadingFiles(true);
    setFiles([]);
    const { data } = await supabase.storage
      .from(BUCKET)
      .list(folder.id, { sortBy: { column: 'created_at', order: 'desc' } });
    setFiles((data ?? []).filter(f => f.name !== '.keep'));
    setLoadingFiles(false);
  }, []);

  function openFolder(folder: Folder) {
    if (folder.password) {
      const already = unlockedMap[folder.id] ?? sessionUnlocked(folder.id);
      if (!already) {
        setPwFolder(folder);
        setPwInput('');
        setPwError(false);
        return;
      }
    }
    setSelectedFolder(folder);
    loadFiles(folder);
  }

  function submitPassword() {
    if (!pwFolder) return;
    if (pwInput === pwFolder.password) {
      sessionStorage.setItem(SESSION_KEY(pwFolder.id), '1');
      setUnlockedMap(prev => ({ ...prev, [pwFolder.id]: true }));
      setSelectedFolder(pwFolder);
      loadFiles(pwFolder);
      setPwFolder(null);
    } else {
      setPwError(true);
      setPwInput('');
    }
  }

  async function createFolder() {
    const name = newFolderName.trim();
    if (!name) return;
    const { data, error } = await supabase
      .from('file_folders')
      .insert({ name, password: newFolderUsePw && newFolderPw ? newFolderPw : null })
      .select()
      .single();
    if (!error && data) setFolders(prev => [...prev, data]);
    setShowNewFolder(false);
    setNewFolderName('');
    setNewFolderPw('');
    setNewFolderUsePw(false);
  }

  async function deleteFolder(folder: Folder) {
    if (!confirm(`"${folder.name}" 폴더와 모든 파일을 삭제할까요?`)) return;
    const { data: fileList } = await supabase.storage.from(BUCKET).list(folder.id);
    if (fileList && fileList.length > 0) {
      await supabase.storage.from(BUCKET).remove(fileList.map(f => `${folder.id}/${f.name}`));
    }
    await supabase.from('file_folders').delete().eq('id', folder.id);
    setFolders(prev => prev.filter(f => f.id !== folder.id));
    if (selectedFolder?.id === folder.id) { setSelectedFolder(null); setFiles([]); }
  }

  async function uploadFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !selectedFolder) return;
    setUploading(true);
    await supabase.storage
      .from(BUCKET)
      .upload(`${selectedFolder.id}/${file.name}`, file, { upsert: true });
    await loadFiles(selectedFolder);
    setUploading(false);
    e.target.value = '';
  }

  async function deleteFile(file: StorageFile) {
    if (!selectedFolder || !confirm(`"${file.name}"을 삭제할까요?`)) return;
    await supabase.storage.from(BUCKET).remove([`${selectedFolder.id}/${file.name}`]);
    setFiles(prev => prev.filter(f => f.name !== file.name));
  }

  async function downloadFile(file: StorageFile) {
    if (!selectedFolder) return;
    const { data } = await supabase.storage
      .from(BUCKET)
      .download(`${selectedFolder.id}/${file.name}`);
    if (!data) return;
    const url = URL.createObjectURL(data);
    const a = document.createElement('a');
    a.href = url; a.download = file.name; a.click();
    URL.revokeObjectURL(url);
  }

  async function openPreview(file: StorageFile) {
    if (!selectedFolder) return;
    const { data } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(`${selectedFolder.id}/${file.name}`, 3600);
    if (!data?.signedUrl) return;
    setPreviewUrl(data.signedUrl);
    setPreviewMime(file.metadata?.mimetype ?? '');
    setPreviewName(file.name);
  }

  const canPreview = (mime: string) =>
    mime.startsWith('image/') || mime === 'application/pdf';

  return (
    <div className="files-layout">

      {/* ── Left: Folder list ── */}
      <div className="files-sidebar">
        <div className="files-sidebar-head">
          <span>폴더</span>
          <button className="btn btn-sm btn-rose" onClick={() => setShowNewFolder(true)}>
            + 새 폴더
          </button>
        </div>

        {loadingFolders ? (
          <div className="files-empty">불러오는 중...</div>
        ) : folders.length === 0 ? (
          <div className="files-empty">폴더가 없습니다</div>
        ) : (
          folders.map(folder => (
            <div
              key={folder.id}
              className={`files-folder-item${selectedFolder?.id === folder.id ? ' active' : ''}`}
              onClick={() => openFolder(folder)}
            >
              <span className="files-folder-icon">
                {folder.password ? '🔒' : '📁'}
              </span>
              <span className="files-folder-name">{folder.name}</span>
              <button
                className="files-folder-del"
                onClick={e => { e.stopPropagation(); deleteFolder(folder); }}
                title="폴더 삭제"
              >✕</button>
            </div>
          ))
        )}
      </div>

      {/* ── Right: File list ── */}
      <div className="files-main">
        {!selectedFolder ? (
          <div className="files-placeholder">
            <div style={{ fontSize: 52, marginBottom: 12 }}>🗂️</div>
            <div style={{ color: 'var(--text3)', fontSize: 14 }}>왼쪽에서 폴더를 선택하세요</div>
          </div>
        ) : (
          <>
            <div className="files-main-head">
              <div className="files-main-title">
                {selectedFolder.password ? '🔒 ' : '📁 '}{selectedFolder.name}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  className="btn btn-sm btn-rose"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? '업로드 중...' : '+ 파일 업로드'}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  style={{ display: 'none' }}
                  onChange={uploadFile}
                />
              </div>
            </div>

            {loadingFiles ? (
              <div className="files-empty">불러오는 중...</div>
            ) : files.length === 0 ? (
              <div className="files-empty">파일이 없습니다. 파일을 업로드해주세요.</div>
            ) : (
              <div className="files-grid">
                {files.map(file => {
                  const mime = file.metadata?.mimetype ?? '';
                  return (
                    <div key={file.name} className="files-file-card">
                      <div className="files-file-icon">{fileIcon(mime)}</div>
                      <div className="files-file-name" title={file.name}>{file.name}</div>
                      <div className="files-file-size">{formatSize(file.metadata?.size)}</div>
                      <div className="files-file-actions">
                        {canPreview(mime) && (
                          <button className="btn btn-sm" onClick={() => openPreview(file)}>
                            미리보기
                          </button>
                        )}
                        <button className="btn btn-sm" onClick={() => downloadFile(file)}>
                          다운로드
                        </button>
                        <button
                          className="btn btn-sm"
                          style={{ color: 'var(--danger)' }}
                          onClick={() => deleteFile(file)}
                        >
                          삭제
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Modal: Create folder ── */}
      {showNewFolder && (
        <div className="modal-overlay" onClick={() => setShowNewFolder(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <div className="modal-title">새 폴더 만들기</div>
              <button className="modal-close" onClick={() => setShowNewFolder(false)}>✕</button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <div className="field-label">폴더 이름</div>
                <input
                  className="input"
                  placeholder="폴더 이름"
                  value={newFolderName}
                  autoFocus
                  onChange={e => setNewFolderName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') createFolder(); }}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="checkbox"
                  id="use-pw"
                  checked={newFolderUsePw}
                  onChange={e => setNewFolderUsePw(e.target.checked)}
                />
                <label htmlFor="use-pw" style={{ fontSize: 13, color: 'var(--text2)', cursor: 'pointer' }}>
                  비밀번호 잠금 사용
                </label>
              </div>
              {newFolderUsePw && (
                <input
                  className="input"
                  type="password"
                  placeholder="비밀번호 설정"
                  value={newFolderPw}
                  onChange={e => setNewFolderPw(e.target.value)}
                />
              )}
            </div>
            <div className="modal-foot">
              <button className="btn" onClick={() => setShowNewFolder(false)}>취소</button>
              <button
                className="btn btn-rose"
                onClick={createFolder}
                disabled={!newFolderName.trim()}
              >
                만들기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Folder password ── */}
      {pwFolder && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-head">
              <div className="modal-title">🔒 {pwFolder.name}</div>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ fontSize: 13, color: 'var(--text3)' }}>
                이 폴더는 비밀번호로 잠겨 있습니다
              </div>
              <input
                className="input"
                type="password"
                placeholder="비밀번호"
                value={pwInput}
                autoFocus
                onChange={e => { setPwInput(e.target.value); setPwError(false); }}
                onKeyDown={e => { if (e.key === 'Enter') submitPassword(); }}
              />
              {pwError && (
                <div style={{ color: 'var(--danger)', fontSize: 12 }}>비밀번호가 틀렸습니다</div>
              )}
            </div>
            <div className="modal-foot">
              <button className="btn" onClick={() => setPwFolder(null)}>취소</button>
              <button className="btn btn-rose" onClick={submitPassword}>확인</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Preview ── */}
      {previewUrl && (
        <div className="modal-overlay" onClick={() => setPreviewUrl(null)}>
          <div className="files-preview-modal" onClick={e => e.stopPropagation()}>
            <div className="files-preview-head">
              <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)' }}>{previewName}</span>
              <button className="modal-close" onClick={() => setPreviewUrl(null)}>✕</button>
            </div>
            <div className="files-preview-body">
              {previewMime.startsWith('image/') ? (
                <img
                  src={previewUrl}
                  alt={previewName}
                  style={{ maxWidth: '100%', maxHeight: '72vh', objectFit: 'contain', borderRadius: 8 }}
                />
              ) : previewMime === 'application/pdf' ? (
                <iframe
                  src={previewUrl}
                  style={{ width: '100%', height: '72vh', border: 'none', borderRadius: 8 }}
                  title={previewName}
                />
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
