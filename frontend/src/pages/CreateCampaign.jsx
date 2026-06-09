import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FiArrowLeft, FiZap } from "react-icons/fi";
import { createCampaign, getCategories } from "../api/campaigns";
import InputField from "../components/ui/InputField";
import AppButton from "../components/ui/AppButton";
import { useResponsive } from "../utils/responsiveUtils";
import { useToast } from "../hooks/useToast";

export default function CreateCampaign() {
  const navigate = useNavigate();
  const { success, error } = useToast();
  const { isMobile } = useResponsive();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    title: "",
    category: "Other",
    goal_amount: "",
    story: "",
    cover_image: "",
    payment_type: "donation",
  });

  useEffect(() => {
    getCategories()
      .then((res) => setCategories(res.data.categories))
      .catch(() =>
        setCategories([
          "Medical",
          "Emergency",
          "Education",
          "Community",
          "Creative",
          "Business",
          "Other",
        ])
      );
  }, []);

  const set = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      error("Please add a campaign title");
      return;
    }
    setLoading(true);
    try {
      const res = await createCampaign({
        title: form.title,
        category: form.category,
        goal_amount: parseFloat(form.goal_amount) || 0,
        story: form.story,
        cover_image: form.cover_image,
        payment_type: form.payment_type,
      });
      success("Campaign created!");
      navigate(`/c/${res.data.campaign.slug}`);
    } catch (err) {
      error(err.message || "Failed to create campaign");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`page-wrapper ${isMobile ? 'px-4 py-6' : 'max-w-2xl px-6 py-8'} animate-fade-in`}>
      <Link
        to="/campaigns"
        className={`inline-flex items-center gap-2 ${isMobile ? 'text-xs' : 'text-sm'} text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 mb-4 sm:mb-6`}
      >
        <FiArrowLeft className="h-4 w-4" />
        Back to browse
      </Link>

      <h1 className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-bold text-slate-900 dark:text-slate-50 mb-2`}>
        Start your fundraiser
      </h1>
      <p className={`${isMobile ? 'text-sm' : 'text-base'} text-slate-600 dark:text-slate-400 mb-6 sm:mb-8`}>
        Tell your story, set a goal, and share with your community — just like GoFundMe.
      </p>

      <div className="flex gap-2 mb-6 sm:mb-8">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              step >= s ? "bg-sky-500" : "bg-slate-200 dark:bg-slate-700"
            }`}
          />
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {step === 1 && (
          <div className="card card-body space-y-4">
            <h2 className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold text-slate-900 dark:text-slate-50`}>
              Step 1 — Basics
            </h2>
            <InputField
              label="Campaign title"
              name="title"
              value={form.title}
              onChange={set}
              placeholder="Help fund my education"
              required
            />
            <div className="space-y-1.5">
              <label className="field-label">Category</label>
              <select
                name="category"
                value={form.category}
                onChange={set}
                className="input w-full"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="field-label">Payment method</label>
              <select
                name="payment_type"
                value={form.payment_type}
                onChange={set}
                className="input w-full"
              >
                <option value="donation">💝 Donations</option>
                <option value="coffee">☕ Buy Me A Coffee</option>
              </select>
              <p className="field-hint">
                {form.payment_type === "donation"
                  ? "Supporters can contribute any amount toward your goal"
                  : "Supporters can send coffee tiers ($3/$6/$9) or custom amounts"}
              </p>
            </div>
            <InputField
              label="Funding goal (GH₵)"
              name="goal_amount"
              type="number"
              min="0"
              value={form.goal_amount}
              onChange={set}
              placeholder="5000"
              hint="Leave 0 for no specific goal"
            />
            <AppButton type="button" onClick={() => setStep(2)} className="w-full">
              Continue
            </AppButton>
          </div>
        )}

        {step === 2 && (
          <div className="card card-body space-y-4">
            <h2 className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold text-slate-900 dark:text-slate-50`}>
              Step 2 — Your story
            </h2>
            <div className="space-y-1.5">
              <label className="field-label">Why are you fundraising?</label>
              <textarea
                name="story"
                value={form.story}
                onChange={set}
                rows={isMobile ? 6 : 8}
                placeholder="Share your story. Be honest and specific — people give to people they trust."
                className="input resize-none w-full"
              />
            </div>
            <InputField
              label="Cover image URL (optional)"
              name="cover_image"
              value={form.cover_image}
              onChange={set}
              placeholder="https://..."
            />
            <div className={`flex gap-2 ${isMobile ? 'flex-col' : ''}`}>
              <AppButton type="button" variant="secondary" onClick={() => setStep(1)} className={isMobile ? 'w-full' : ''}>
                Back
              </AppButton>
              <AppButton type="button" onClick={() => setStep(3)} className={isMobile ? 'w-full' : ''}>
                Continue
              </AppButton>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="card card-body space-y-4">
            <h2 className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold text-slate-900 dark:text-slate-50`}>
              Step 3 — Review & launch
            </h2>
            <div className={`${isMobile ? 'p-3 text-xs' : 'p-4 text-sm'} bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-2`}>
              <p>
                <span className="text-slate-500">Title:</span>{" "}
                <strong>{form.title}</strong>
              </p>
              <p>
                <span className="text-slate-500">Category:</span> {form.category}
              </p>
              <p>
                <span className="text-slate-500">Goal:</span> GH₵
                {form.goal_amount || "0"}
              </p>
              <p>
                <span className="text-slate-500">Payment method:</span>{" "}
                {form.payment_type === "donation" ? "💝 Donations" : "☕ Coffee"}
              </p>
              <p className="text-slate-600 dark:text-slate-300 line-clamp-4">
                {form.story || "—"}
              </p>
            </div>
            <div className={`flex gap-2 ${isMobile ? 'flex-col' : ''}`}>
              <AppButton type="button" variant="secondary" onClick={() => setStep(2)} className={isMobile ? 'w-full' : ''}>
                Back
              </AppButton>
              <AppButton type="submit" loading={loading} icon={FiZap} className={`${isMobile ? 'w-full' : 'flex-1'}`}>
                Launch fundraiser
              </AppButton>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
