import React, { useState } from "react";
import { useStore } from "@/store/useStore";
import { MediaItem } from "@/types";
import { MEDIA_TYPE_LABELS, MediaType } from "@/config/constants";
import { Plus, CheckCircle, Clock, Film } from "lucide-react";
import { mintCompletionNFT } from "@/utils/contract";

export const MediaTracker: React.FC = () => {
  const { trackedMedia, updateMedia, user } = useStore();
  const [isAdding, setIsAdding] = useState(false);

  const handleComplete = async (media: MediaItem) => {
    if (!user) return;

    try {
      const result = await mintCompletionNFT(
        media.mediaId,
        media.type,
        media.title,
        user.publicKey,
        null,
        (status, data) => {
          if (status === "sent") {
            updateMedia(media.id, {
              deployStatus: "Transaction sent",
              nftId: data?.deployHash || data?.transactionHash || undefined,
            });
          }
          if (status === "processed") {
            updateMedia(media.id, {
              status: "completed",
              completedAt: new Date(),
              progress: 100,
              deployStatus: "Processed",
              nftId: data?.deployHash || data?.transactionHash || undefined,
            });
          }
          if (status === "timeout") {
            updateMedia(media.id, { deployStatus: "Timeout while processing" });
          }
          if (status === "error") {
            updateMedia(media.id, { deployStatus: "Error signing or sending" });
          }
        }
      );

      if (result.success) {
        updateMedia(media.id, {
          nftId: result.deployHash,
          deployStatus: result.deployHash ? "Submitted" : "Pending",
        });
      }
    } catch (error) {
      console.error("Failed to mint NFT:", error);
    }
  };

  const activeMedia = trackedMedia.filter(
    (m) => m.status === "reading" || m.status === "watching"
  );
  const completedMedia = trackedMedia.filter((m) => m.status === "completed");

  return (
    <div className="space-y-8">
      {/* Add Media Button */}
      <button
        onClick={() => setIsAdding(true)}
        className="btn-primary w-full flex items-center justify-center gap-3 py-4 text-lg"
      >
        <Plus className="w-6 h-6" />
        Add Media to Track
      </button>

      {/* Active Media */}
      {activeMedia.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <Clock className="w-6 h-6 text-primary-400" />
            <h3 className="text-2xl font-bold text-white">
              Currently Tracking
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle className="w-6 h-6 text-green-400" />
            <h3 className="text-2xl font-bold text-white">Completed</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {completedMedia.map((media) => (
              <MediaCard key={media.id} media={media} />
            ))}
          </div>
        </div>
      )}

      {trackedMedia.length === 0 && (
        <div className="card-glass text-center py-16">
          <Clock className="w-20 h-20 mx-auto mb-6 text-primary-400 animate-pulse" />
          <h3 className="text-2xl font-bold text-white mb-2">
            No media being tracked yet
          </h3>
          <p className="text-white/60 text-lg">
            Add media to start earning NFTs!
          </p>
        </div>
      )}

      {/* Add Media Modal */}
      {isAdding && <AddMediaModal onClose={() => setIsAdding(false)} />}
    </div>
  );
};

const MediaCard: React.FC<{
  media: MediaItem;
  onComplete?: () => void;
}> = ({ media, onComplete }) => {
  const isCompleted = media.status === "completed";

  return (
    <div className="card-glass p-6 group">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-3">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg ${
                isCompleted
                  ? "bg-gradient-to-br from-green-500 to-emerald-600"
                  : "bg-gradient-to-br from-primary-500 to-secondary"
              }`}
            >
              <Film className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-white text-lg truncate">
                {media.title}
              </h4>
              <p className="text-sm text-white/60 flex items-center gap-2">
                {MEDIA_TYPE_LABELS[media.type]}
                {isCompleted && (
                  <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                )}
              </p>
            </div>
          </div>

          {!isCompleted && (
            <div className="mb-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-white/60 font-medium">
                  Progress
                </span>
                <span className="text-xs text-primary-400 font-bold">
                  {media.progress}%
                </span>
              </div>
              <div className="w-full bg-dark/50 rounded-full h-2.5 overflow-hidden shadow-inner">
                <div
                  className="h-2.5 rounded-full bg-gradient-to-r from-primary-500 to-secondary transition-all duration-500 shadow-glow"
                  style={{ width: `${media.progress}%` }}
                />
              </div>
            </div>
          )}

          {media.nftId && (
            <div className="bg-dark/50 backdrop-blur-sm rounded-lg px-3 py-2 mb-2">
              <p className="text-xs text-primary-400 font-mono truncate">
                NFT: {media.nftId.slice(0, 10)}...
              </p>
            </div>
          )}

          {media.deployStatus && (
            <p className="text-xs text-white/50 mt-2 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary-400 animate-pulse" />
              {media.deployStatus}
            </p>
          )}
        </div>

        {!isCompleted && onComplete && (
          <button
            onClick={onComplete}
            className="btn-primary text-sm px-4 py-2 whitespace-nowrap"
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
  const [title, setTitle] = useState("");
  const [type, setType] = useState<MediaType>(MediaType.Movie);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const mediaId = `${title.toLowerCase().replace(/\s+/g, "-")}-${type}`;
    addMedia({
      id: Date.now().toString(),
      mediaId,
      title: title.trim(),
      type,
      status: "reading",
      progress: 0,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in">
      <div className="card-glass max-w-md w-full animate-in zoom-in duration-300">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-secondary rounded-xl flex items-center justify-center shadow-glow">
              <Plus className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white">Add Media</h3>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-white mb-2">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input-field"
              placeholder="Enter media title"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-white mb-2">
              Type
            </label>
            <select
              value={type}
              onChange={(e) => setType(Number(e.target.value) as MediaType)}
              className="input-field"
            >
              {Object.entries(MEDIA_TYPE_LABELS).map(([value, label]) => (
                <option
                  key={value}
                  value={value}
                  className="bg-dark text-white"
                >
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <button type="submit" className="btn-primary flex-1">
              Add Media
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
