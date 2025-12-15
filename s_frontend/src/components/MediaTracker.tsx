import React, { useState } from 'react';
import { useStore } from '@/store/useStore';
import { MediaItem, MediaType } from '@/types';
import { MEDIA_TYPE_LABELS } from '@/config/constants';
import { Plus, CheckCircle, Clock } from 'lucide-react';
import { mintCompletionNFT } from '@/utils/contract';

export const MediaTracker: React.FC = () => {
  const { trackedMedia, addMedia, updateMedia, user, privacySettings } = useStore();
  const [isAdding, setIsAdding] = useState(false);

  const handleComplete = async (media: MediaItem) => {
    if (!user) return;

    try {
      const result = await mintCompletionNFT(
        media.mediaId,
        media.type,
        media.title,
        user.accountHash,
        null // TODO: Get signing key pair from wallet
      );

      if (result.success) {
        updateMedia(media.id, {
          status: 'completed',
          completedAt: new Date(),
          progress: 100,
          nftId: result.deployHash,
        });
      }
    } catch (error) {
      console.error('Failed to mint NFT:', error);
    }
  };

  const activeMedia = trackedMedia.filter(
    (m) => m.status === 'reading' || m.status === 'watching'
  );
  const completedMedia = trackedMedia.filter((m) => m.status === 'completed');

  return (
    <div className="space-y-6">
      {/* Add Media Button */}
      <button
        onClick={() => setIsAdding(true)}
        className="btn-primary w-full flex items-center justify-center gap-2"
      >
        <Plus className="w-5 h-5" />
        Add Media to Track
      </button>

      {/* Active Media */}
      {activeMedia.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Currently Tracking</h3>
          <div className="space-y-3">
            {activeMedia.map((media) => (
              <MediaCard
                key={media.id}
                media={media}
                onComplete={() => handleComplete(media)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Completed Media */}
      {completedMedia.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Completed</h3>
          <div className="space-y-3">
            {completedMedia.map((media) => (
              <MediaCard key={media.id} media={media} />
            ))}
          </div>
        </div>
      )}

      {trackedMedia.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>No media being tracked yet</p>
          <p className="text-sm mt-2">Add media to start earning NFTs!</p>
        </div>
      )}

      {/* Add Media Modal */}
      {isAdding && (
        <AddMediaModal onClose={() => setIsAdding(false)} />
      )}
    </div>
  );
};

const MediaCard: React.FC<{
  media: MediaItem;
  onComplete?: () => void;
}> = ({ media, onComplete }) => {
  const isCompleted = media.status === 'completed';

  return (
    <div className="card p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold text-gray-900">{media.title}</h4>
            {isCompleted && (
              <CheckCircle className="w-5 h-5 text-green-600" />
            )}
          </div>
          <p className="text-sm text-gray-600 mb-2">
            {MEDIA_TYPE_LABELS[media.type]}
          </p>
          {!isCompleted && (
            <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
              <div
                className="bg-primary h-2 rounded-full transition-all"
                style={{ width: `${media.progress}%` }}
              />
            </div>
          )}
          {media.nftId && (
            <p className="text-xs text-primary font-mono">
              NFT: {media.nftId.slice(0, 10)}...
            </p>
          )}
        </div>
        {!isCompleted && onComplete && (
          <button
            onClick={onComplete}
            className="btn-primary text-sm px-3 py-1"
          >
            Complete
          </button>
        )}
      </div>
    </div>
  );
};

const AddMediaModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { addMedia } = useStore();
  const [title, setTitle] = useState('');
  const [type, setType] = useState<MediaType>(MediaType.Movie);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const mediaId = `${title.toLowerCase().replace(/\s+/g, '-')}-${type}`;
    addMedia({
      id: Date.now().toString(),
      mediaId,
      title: title.trim(),
      type,
      status: 'reading',
      progress: 0,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-96">
        <h3 className="text-xl font-bold mb-4">Add Media</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input-field"
              placeholder="Enter media title"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">Type</label>
            <select
              value={type}
              onChange={(e) => setType(Number(e.target.value) as MediaType)}
              className="input-field"
            >
              {Object.entries(MEDIA_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-3">
            <button type="submit" className="btn-primary flex-1">
              Add
            </button>
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

