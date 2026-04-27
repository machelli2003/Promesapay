import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User, Target, Share2, Save } from "lucide-react";
import { updateProfile } from "../api/profile";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../hooks/useToast";
import AppButton from "../components/ui/AppButton";
import InputField from "../components/ui/InputField";
import { AppCard, CardHeader, CardBody } from "../components/ui/AppCard";
import SectionContainer from "../components/ui/SectionContainer";

function Section({ icon: Icon, title, subtitle, children }) {
  return (
    <AppCard>
      <CardHeader
        title={
          <span className="flex items-center gap-2 text-sm">
            <Icon className="h-4 w-4 text-slate-400 dark:text-slate-500" strokeWidth={1.75} />
            {title}
          </span>
        }
        subtitle={subtitle}
      />
      <CardBody className="space-y-4">
        {children}
      </CardBody>
    </AppCard>
  );
}

export default function EditProfile() {
  const { user, updateUser } = useAuth();
  const { success, error }   = useToast();
  const navigate             = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    full_name: "", bio: "", profile_picture: "",
    goal_amount: "", goal_title: "",
    social_links: { twitter: "", instagram: "", website: "" },
  });

  useEffect(() => {
    if (user) {
      setForm({
        full_name:       user.full_name || "",
        bio:             user.bio || "",
        profile_picture: user.profile_picture || "",
        goal_amount:     user.goal_amount || "",
        goal_title:      user.goal_title || "",
        social_links:    user.social_links || { twitter: "", instagram: "", website: "" },
      });
    }
  }, [user]);

  const set       = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  const setSocial = (e) => setForm(f => ({ ...f, social_links: { ...f.social_links, [e.target.name]: e.target.value } }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await updateProfile(form);
      updateUser(res.data.user);
      success("Profile updated!");
      navigate(`/u/${user.username}`);
    } catch (err) {
      error(err.response?.data?.error || "Update failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-wrapper animate-fade-in">
      <div className="max-w-xl mx-auto space-y-6">

        {/* Page header */}
        <div className="section-header">
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-50">Edit profile</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Customize your public support page
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Basic info */}
          <Section icon={User} title="Basic info" subtitle="Your public name and bio">
            <InputField
              label="Full name"
              name="full_name"
              value={form.full_name}
              onChange={set}
              placeholder="Your full name"
            />
            <div className="space-y-1.5">
              <label className="field-label">
                Bio
                <span className="text-slate-400 dark:text-slate-500 font-normal ml-1">(optional)</span>
              </label>
              <textarea
                name="bio"
                value={form.bio}
                onChange={set}
                rows={3}
                placeholder="Tell your supporters about yourself..."
                className="input resize-none"
                maxLength={200}
              />
              <p className="field-hint text-right">{form.bio.length}/200</p>
            </div>
            <InputField
              label="Profile picture URL"
              name="profile_picture"
              value={form.profile_picture}
              onChange={set}
              placeholder="https://..."
              hint="Paste a direct image URL"
            />
            {form.profile_picture && (
              <img
                src={form.profile_picture}
                alt="Preview"
                className="w-16 h-16 rounded-xl object-cover border border-slate-200 dark:border-slate-700"
              />
            )}
          </Section>

          {/* Funding goal */}
          <Section icon={Target} title="Funding goal" subtitle="Set a target for supporters to work toward">
            <InputField
              label="Goal title"
              name="goal_title"
              value={form.goal_title}
              onChange={set}
              placeholder="e.g. Fund my debut album"
            />
            <InputField
              label="Goal amount (GH₵)"
              name="goal_amount"
              type="number"
              min="0"
              value={form.goal_amount}
              onChange={set}
              placeholder="0.00"
              prefix="GH₵"
            />
          </Section>

          {/* Social links */}
          <Section icon={Share2} title="Social links" subtitle="Help supporters find you elsewhere">
            {[
              { name: "twitter",   label: "Twitter",   placeholder: "username (without @)" },
              { name: "instagram", label: "Instagram", placeholder: "username (without @)" },
              { name: "website",   label: "Website",   placeholder: "https://yoursite.com" },
            ].map((s) => (
              <InputField
                key={s.name}
                label={s.label}
                name={s.name}
                value={form.social_links[s.name]}
                onChange={setSocial}
                placeholder={s.placeholder}
              />
            ))}
          </Section>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2 pb-6">
            <AppButton
              type="button"
              variant="secondary"
              size="lg"
              className="flex-1"
              onClick={() => navigate(-1)}
            >
              Cancel
            </AppButton>
            <AppButton
              type="submit"
              size="lg"
              loading={loading}
              icon={Save}
              className="flex-1"
            >
              Save changes
            </AppButton>
          </div>
        </form>
      </div>
    </div>
  );
}