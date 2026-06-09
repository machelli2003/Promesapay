import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FiSearch, FiPlus, FiSliders } from "react-icons/fi";
import { listCampaigns } from "../api/campaigns";
import CampaignCard from "../components/campaigns/CampaignCard";
import AppButton from "../components/ui/AppButton";
import { useAuth } from "../context/AuthContext";
import { SkeletonLoader } from "../components/common/SkeletonLoader";
import { useLoadingState } from "../hooks/useLoadingState";
import { useResponsive } from "../utils/responsiveUtils";

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "raised", label: "Most raised" },
  { value: "almost_funded", label: "Almost funded" },
];

export default function BrowseCampaigns() {
  const { user } = useAuth();
  const { isMobile } = useResponsive();
  const [categories, setCategories] = useState([]);
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);

  const { isLoading, error, data, retry } = useLoadingState(
    async () => {
      const res = await listCampaigns({
        q: q || undefined,
        category: category || undefined,
        sort: sort,
        page: page,
        per_page: 12,
      });
      setCategories(res.data.categories || []);
      return {
        campaigns: res.data.campaigns,
        total: res.data.total,
      };
    },
    [page, q, category, sort]
  );

  const campaigns = data?.campaigns || [];
  const total = data?.total || 0;

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
  };

  return (
    <div className={`page-wrapper ${isMobile ? 'px-4 py-6' : 'px-6 py-8'} animate-fade-in`}>
      <div className={`mb-6 sm:mb-8 flex flex-col gap-4 ${isMobile ? '' : 'sm:flex-row sm:items-end sm:justify-between'}`}>
        <div>
          <h1 className={`${isMobile ? 'text-2xl' : 'text-3xl md:text-4xl'} font-bold text-slate-900 dark:text-slate-50`}>
            Discover fundraisers
          </h1>
          <p className="mt-1 text-sm sm:text-base text-slate-600 dark:text-slate-400">
            Browse campaigns and support causes you care about
          </p>
        </div>
        {user ? (
          <Link to="/campaigns/new" className={isMobile ? 'w-full' : ''}>
            <AppButton icon={FiPlus} className={isMobile ? 'w-full' : ''}>
              Start a fundraiser
            </AppButton>
          </Link>
        ) : (
          <Link to="/register" className={isMobile ? 'w-full' : ''}>
            <AppButton icon={FiPlus} className={isMobile ? 'w-full' : ''}>
              Start a fundraiser
            </AppButton>
          </Link>
        )}
      </div>

      <form onSubmit={handleSearch} className="card card-body mb-6 space-y-4">
        <div className={`flex flex-col gap-3 ${isMobile ? '' : 'md:flex-row'}`}>
          <div className="relative flex-1">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search campaigns..."
              className="input pl-10 w-full"
            />
          </div>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className={`input ${isMobile ? 'w-full' : 'md:w-44'}`}
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className={`input ${isMobile ? 'w-full' : 'md:w-44'}`}
          >
            <option value="newest">Newest</option>
            <option value="raised">Most raised</option>
            <option value="almost_funded">Almost funded</option>
          </select>
          <AppButton type="submit" icon={FiSearch} className={isMobile ? 'w-full' : ''}>
            Search
          </AppButton>
        </div>
      </form>

      {isLoading ? (
        <div className={`flex justify-center ${isMobile ? 'py-12' : 'py-20'}`}>
          <SkeletonLoader variant="list" />
        </div>
      ) : error ? (
        <div className="text-center py-20 text-slate-500 dark:text-slate-400">
          <p className="text-lg font-medium mb-2">Failed to load campaigns</p>
          <p className="text-sm mb-6">{error.message || "An error occurred while loading campaigns"}</p>
          <AppButton onClick={retry}>Try again</AppButton>
        </div>
      ) : campaigns.length === 0 ? (
        <div className="text-center py-20 text-slate-500 dark:text-slate-400">
          <p className="text-lg font-medium mb-2">No campaigns found</p>
          <p className="text-sm mb-6">Try a different search or be the first to start one!</p>
          <Link to={user ? "/campaigns/new" : "/register"}>
            <AppButton>Start a fundraiser</AppButton>
          </Link>
        </div>
      ) : (
        <>
          <div className={`grid gap-4 sm:gap-6 ${isMobile ? 'grid-cols-1' : 'sm:grid-cols-2 lg:grid-cols-3'}`}>
            {campaigns.map((c) => (
              <CampaignCard key={c.id} campaign={c} />
            ))}
          </div>
          {total > 12 && (
            <div className={`flex justify-center gap-2 mt-6 sm:mt-8 ${isMobile ? 'flex-col' : ''}`}>
              <AppButton
                variant="secondary"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className={isMobile ? 'w-full' : ''}
              >
                Previous
              </AppButton>
              <span className="text-sm text-slate-500 self-center px-2 whitespace-nowrap">
                Page {page}
              </span>
              <AppButton
                variant="secondary"
                size="sm"
                disabled={page * 12 >= total}
                onClick={() => setPage((p) => p + 1)}
                className={isMobile ? 'w-full' : ''}
              >
                Next
              </AppButton>
            </div>
          )}
        </>
      )}
    </div>
  );
}
