'use client';
import { useCallback, useMemo, useState } from 'react';

export interface MentionItem {
  id: string;
  title: string;
  type: 'document' | 'asset';
  source_type?: string;
}

/**
 * Shared @-mention scope state machine (Playground + Home hero input).
 *
 * The parent owns the text field state; the hook owns everything about
 * mentions: detecting an unfinished @-query, filtering the workspace
 * sources, keyboard navigation, and attaching a scope item.
 */
export function useMentionScope(
  docs: MentionItem[],
  assets: MentionItem[],
  initialScope: MentionItem | null = null
) {
  const [attachedScope, setAttachedScope] = useState<MentionItem | null>(initialScope);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const q = mentionQuery.toLowerCase();
  const filteredDocs = useMemo(
    () => docs.filter((d) => d.title.toLowerCase().includes(q)),
    [docs, q]
  );
  const filteredAssets = useMemo(
    () => assets.filter((a) => a.title.toLowerCase().includes(q)),
    [assets, q]
  );
  const allFilteredMentions = useMemo(
    () => [...filteredDocs, ...filteredAssets],
    [filteredDocs, filteredAssets]
  );

  /** Feed every text-field change through here to update mention state. */
  const processTextChange = useCallback((val: string) => {
    const lastAtIndex = val.lastIndexOf('@');
    if (lastAtIndex !== -1 && (lastAtIndex === 0 || val[lastAtIndex - 1] === ' ')) {
      const query = val.slice(lastAtIndex + 1);
      if (!query.includes(' ')) {
        setShowMentions(true);
        setMentionQuery(query);
        setSelectedIndex(0);
        return;
      }
    }
    setShowMentions(false);
  }, []);

  /**
   * Attach an item as the query scope. Returns the text with the
   * unfinished @-fragment stripped, for the parent to set.
   */
  const attachMention = useCallback(
    (item: MentionItem, currentText: string): string => {
      setAttachedScope(item);
      const lastAtIndex = currentText.lastIndexOf('@');
      const stripped =
        lastAtIndex !== -1 ? currentText.slice(0, lastAtIndex).trim() : currentText;
      setShowMentions(false);
      setMentionQuery('');
      return stripped;
    },
    []
  );

  const clearScope = useCallback(() => setAttachedScope(null), []);
  const hideMentions = useCallback(() => setShowMentions(false), []);

  /**
   * Mention keyboard navigation. Returns the item to attach on Enter,
   * 'dismiss' on Escape, or null when the key isn't a mention key.
   * Parent handles plain Enter-to-submit itself.
   */
  const navigateMentions = useCallback(
    (key: string): MentionItem | 'dismiss' | null => {
      if (!showMentions || allFilteredMentions.length === 0) return null;
      if (key === 'ArrowDown') {
        setSelectedIndex((prev) => (prev + 1) % allFilteredMentions.length);
        return null;
      }
      if (key === 'ArrowUp') {
        setSelectedIndex((prev) =>
          prev === 0 ? allFilteredMentions.length - 1 : prev - 1
        );
        return null;
      }
      if (key === 'Enter') {
        const selected = allFilteredMentions[selectedIndex];
        return selected ?? null;
      }
      if (key === 'Escape') {
        setShowMentions(false);
        return 'dismiss';
      }
      return null;
    },
    [showMentions, allFilteredMentions, selectedIndex]
  );

  return {
    attachedScope,
    setAttachedScope,
    showMentions,
    setShowMentions,
    filteredDocs,
    filteredAssets,
    allFilteredMentions,
    selectedIndex,
    processTextChange,
    attachMention,
    clearScope,
    hideMentions,
    navigateMentions,
  };
}
