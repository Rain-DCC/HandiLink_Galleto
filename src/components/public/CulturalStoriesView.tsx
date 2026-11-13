import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  CULTURAL_STORIES,
  HERO_IMAGE,
  TANGGO_IMAGE,
  ARTISAN_HANDS_IMAGE
} from '../../utils/assets';
import {
  ChevronRight,
} from 'lucide-react';
import { Badge } from '../common/Badge';

export const CulturalStoriesView: React.FC = () => {
  const { setCurrentView } = useApp();
  const [activeStoryIndex, setActiveStoryIndex] = useState(0);

  const activeStory = CULTURAL_STORIES[activeStoryIndex];

  const visualMatches = [
    HERO_IMAGE,
    TANGGO_IMAGE,
    ARTISAN_HANDS_IMAGE
  ];

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-12">
      {/* Title */}
      <div className="border-b border-[#C9A227]/30 pb-6 text-center max-w-3xl mx-auto space-y-2">
        <span className="text-xs uppercase font-bold tracking-widest text-[#8C6B0F]">
          Ancestral Knowledge & Oral Tradition
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#3B2418]">
          Bagobo-Tagabawa Cultural Chronicles
        </h1>
        <p className="text-xs sm:text-sm text-[#5A3825]/85 leading-relaxed">
          The stories, spiritual geography, and sacred motifs passed through generations of master women weavers in Binugao, Toril, Davao City.
        </p>
      </div>

      {/* Featured Narrative Hero Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-[#FAF6ED] rounded-2xl border border-[#C9A227]/30 p-6 sm:p-10 shadow-lg">
        <div className="lg:col-span-5 rounded-xl overflow-hidden border border-[#C9A227]/40 shadow-md aspect-4/3 lg:aspect-auto lg:h-96">
          <img
            src={visualMatches[activeStoryIndex]}
            alt={activeStory.title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
        </div>

        <div className="lg:col-span-7 space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="gold">{activeStory.category}</Badge>
            <span className="text-xs text-[#5A3825] font-medium">{activeStory.readTime}</span>
          </div>

          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#3B2418] leading-tight">
            {activeStory.title}
          </h2>

          <div className="text-xs sm:text-sm text-[#5A3825] whitespace-pre-line leading-relaxed space-y-3 font-sans">
            {activeStory.content}
          </div>

          <div className="pt-4 border-t border-[#C9A227]/25 flex flex-wrap items-center justify-between gap-3">
            <span className="text-[11px] text-[#8C6B0F] font-semibold">
              Documented with the Free, Prior and Informed Consent of BIBATAWA Elders
            </span>
            <button
              onClick={() => setCurrentView('shop')}
              className="px-4 py-2 bg-[#3B2418] text-[#E5C76B] hover:bg-[#5A3825] rounded font-semibold text-xs tracking-wider uppercase transition-colors shrink-0"
            >
              Explore Related Weaves
            </button>
          </div>
        </div>
      </div>

      {/* Story Cards Grid */}
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-serif font-bold text-xl text-[#3B2418]">
            Explore All Heritage Chronicles
          </h3>
          <span className="text-xs text-[#5A3825]/80">
            Select a chronicle below to read
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {CULTURAL_STORIES.map((story, idx) => (
            <button
              key={story.id}
              type="button"
              onClick={() => {
                setActiveStoryIndex(idx);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`h-full text-left p-6 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-4 ${
                activeStoryIndex === idx
                  ? 'bg-white border-[#C9A227] ring-2 ring-[#C9A227]/30 shadow-md'
                  : 'bg-[#FAF6ED] border-[#C9A227]/25 hover:border-[#C9A227] hover:bg-white/80'
              }`}
            >
              <div>
                <div className="flex items-center justify-between text-xs text-[#8C6B0F] font-semibold mb-2">
                  <span>{story.category}</span>
                  <span>{story.readTime}</span>
                </div>
                <h4 className="font-serif font-bold text-base text-[#3B2418] leading-snug">
                  {story.title}
                </h4>
                <p className="text-xs text-[#5A3825] mt-2 line-clamp-3 leading-relaxed">
                  {story.excerpt}
                </p>
              </div>

              <div className="pt-3 border-t border-[#C9A227]/20 flex items-center justify-between text-xs font-semibold text-[#3B2418]">
                <span>{activeStoryIndex === idx ? 'Currently Reading' : 'Read Narrative'}</span>
                <ChevronRight className="w-4 h-4 text-[#C9A227]" />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
