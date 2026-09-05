'use client';

import { useEffect, useState } from 'react';
import { authClient } from '@/lib/auth-client';

type BookmarkButtonProps = {
  actionTitle: string;
  bookmarked: boolean;
  disabled: boolean;
  onClick: () => void;
};

export function BookmarkButton({ actionTitle, bookmarked, disabled, onClick }: BookmarkButtonProps) {
  return (
    <button
      className={`bookmark-button${bookmarked ? ' bookmarked' : ''}`}
      type="button"
      aria-label={`${bookmarked ? 'Remove bookmark from' : 'Bookmark'} ${actionTitle}`}
      aria-pressed={bookmarked}
      disabled={disabled}
      onClick={onClick}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M6.75 3.75h10.5v16.5L12 16.7l-5.25 3.55V3.75Z" />
      </svg>
    </button>
  );
}

export function ActionBookmarkButton({ actionId, actionTitle }: { actionId: number; actionTitle: string }) {
  const { data: session } = authClient.useSession();
  const userId = session?.user.id;
  const [bookmark, setBookmark] = useState<{ userId: string; bookmarked: boolean } | null>(null);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  const bookmarked = bookmark && bookmark.userId === userId ? bookmark.bookmarked : false;

  useEffect(() => {
    if (!userId) return;

    const controller = new AbortController();
    fetch('/api/bookmarks', { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error('Could not load bookmarks.');
        return await response.json() as { actionIds: number[] };
      })
      .then(({ actionIds }) => setBookmark({ userId, bookmarked: actionIds.includes(actionId) }))
      .catch((reason: unknown) => {
        if (reason instanceof Error && reason.name !== 'AbortError') setError(reason.message);
      });

    return () => controller.abort();
  }, [actionId, userId]);

  async function toggleBookmark() {
    if (!session || updating) return;

    const wasBookmarked = bookmarked;
    setError('');
    setBookmark({ userId: session.user.id, bookmarked: !wasBookmarked });
    setUpdating(true);

    try {
      const response = await fetch('/api/bookmarks', {
        method: wasBookmarked ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actionId }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null) as { error?: string } | null;
        throw new Error(body?.error ?? 'Could not update that bookmark.');
      }
    } catch (reason) {
      setBookmark({ userId: session.user.id, bookmarked: wasBookmarked });
      setError(reason instanceof Error ? reason.message : 'Could not update that bookmark.');
    } finally {
      setUpdating(false);
    }
  }

  if (!session) return null;

  return (
    <div className="action-detail-bookmark">
      <BookmarkButton
        actionTitle={actionTitle}
        bookmarked={bookmarked}
        disabled={updating}
        onClick={toggleBookmark}
      />
      {error && <p className="bookmark-error" role="alert">{error}</p>}
    </div>
  );
}
