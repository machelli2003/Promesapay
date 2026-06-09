import { useState } from "react";
import { FiMessageCircle, FiSend } from "react-icons/fi";
import { postCampaignComment } from "../../api/campaigns";
import { formatDate } from "../../utils/formatters";
import AppButton from "../ui/AppButton";
import { useToast } from "../../hooks/useToast";
import { useAuth } from "../../context/AuthContext";

export default function CampaignComments({ slug, comments, onPosted }) {
  const { user } = useAuth();
  const { success, error } = useToast();
  const [name, setName] = useState(user?.full_name || "");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!body.trim() || !(name.trim() || user)) return;
    setLoading(true);
    try {
      await postCampaignComment(slug, {
        author_name: name.trim() || user?.full_name,
        body,
      });
      success("Comment posted!");
      setBody("");
      onPosted?.();
    } catch {
      error("Failed to post comment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card card-body space-y-4">
      <div className="flex items-center gap-2">
        <FiMessageCircle className="h-4 w-4 text-sky-500" />
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
          Comments ({comments.length})
        </h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {!user && (
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className="input"
            required
          />
        )}
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Leave an encouraging comment..."
          rows={3}
          className="input resize-none"
          required
        />
        <AppButton type="submit" size="sm" icon={FiSend} loading={loading}>
          Post comment
        </AppButton>
      </form>

      {comments.length > 0 && (
        <ul className="space-y-3 pt-2">
          {comments.map((c) => (
            <li
              key={c.id}
              className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg"
            >
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  {c.author_name}
                </span>
                <span className="text-xs text-slate-400">{formatDate(c.created_at)}</span>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300">{c.body}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
