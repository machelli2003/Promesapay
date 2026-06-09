import { useState } from "react";
import { FiVolume2, FiPlus } from "react-icons/fi";
import { postCampaignUpdate } from "../../api/campaigns";
import { formatDate } from "../../utils/formatters";
import AppButton from "../ui/AppButton";
import { useToast } from "../../hooks/useToast";

export default function CampaignUpdates({
  slug,
  updates,
  isOwner,
  onPosted,
}) {
  const { success, error } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!body.trim()) return;
    setLoading(true);
    try {
      await postCampaignUpdate(slug, { title, body });
      success("Update posted!");
      setTitle("");
      setBody("");
      setShowForm(false);
      onPosted?.();
    } catch {
      error("Failed to post update");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card card-body space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FiVolume2 className="h-4 w-4 text-sky-500" />
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
            Campaign updates
          </h3>
        </div>
        {isOwner && (
          <AppButton
            variant="secondary"
            size="sm"
            icon={FiPlus}
            onClick={() => setShowForm((s) => !s)}
          >
            Post update
          </AppButton>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="space-y-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Update title (optional)"
            className="input"
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Share progress with your supporters..."
            rows={4}
            className="input resize-none"
            required
          />
          <AppButton type="submit" size="sm" loading={loading}>
            Publish update
          </AppButton>
        </form>
      )}

      {updates.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-6">
          No updates yet. Check back soon!
        </p>
      ) : (
        <ul className="space-y-4">
          {updates.map((u) => (
            <li
              key={u.id}
              className="border-b border-slate-100 dark:border-slate-800 pb-4 last:border-0 last:pb-0"
            >
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {u.title}
                </p>
                <span className="text-xs text-slate-400">{formatDate(u.created_at)}</span>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap">
                {u.body}
              </p>
              {u.author?.full_name && (
                <p className="text-xs text-slate-400 mt-2">— {u.author.full_name}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
