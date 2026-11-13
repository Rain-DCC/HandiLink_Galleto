import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  ARTISAN_HANDS_IMAGE,
  TANGGO_IMAGE,
  BEADED_BAG_IMAGE,
  INABAL_IMAGE
} from '../../utils/assets';
import {
  ShoppingBag
} from 'lucide-react';
import { Badge } from '../common/Badge';

export const ArtisansShowcase: React.FC = () => {
  const { setCurrentView } = useApp();
  const [selectedFocus, setSelectedFocus] = useState<'All' | 'Inabal Weaving' | 'Beadwork & Brass' | 'Contemporary'>('All');

  const artisans = [
    {
      name: 'Bae Salome Linganay',
      title: 'Master Inabal Weaver & Living Treasure',
      community: 'Sitio Binugao, Toril District, Davao City',
      craft: 'Backstrap Tension Loom & Natural Plant Dyes',
      years: '48 Years of Weaving Practice',
      specialty: 'Binituwon (Sacred Stars) & Kinara Ikats',
      image: ARTISAN_HANDS_IMAGE,
      bio: 'Bae Salome began weaving at the age of nine under the instruction of her grandmother on the slopes of Mount Apo. Her mastery of plant root extractions and complex star motifs has made her one of the most respected cultural elders of Davao.',
      quote: 'When the tension rope binds around my waist, my breath aligns with the rhythm of Apo Sandawa. Inabal is our prayer woven into fiber.'
    },
    {
      name: 'Bae Carmelita Omba',
      title: 'BIBATAWA Association President',
      community: 'Binugao Ancestral Domain',
      craft: 'Pangulambong Beading & Ceremonial Tanggo Blouses',
      years: '35 Years of Craft Leadership',
      specialty: 'Cast Brass Tungkaling Bells & Binubaya Diamonds',
      image: TANGGO_IMAGE,
      bio: 'A visionary community organizer and artisan, Bae Carmelita founded the association to preserve Bagobo-Tagabawa weaving from commercial exploitation and provide sustainable, dignified livelihood for 38 indigenous households.',
      quote: 'Every woman weaver in our association is a sovereign guardian of ancestral knowledge. HandiLink ensures our people receive the fair honor they deserve.'
    },
    {
      name: 'Lourdes Dumigsi',
      title: 'Master Tableware & Contemporary Weaver',
      community: 'Binugao Foothills Sanctuary',
      craft: 'Multi-Weft Inabal Runners & Modern Accessorizing',
      years: '22 Years of Weaving',
      specialty: 'Tinanggi (Harvest Rows) & Sustainable Leather Inlays',
      image: INABAL_IMAGE,
      bio: 'Lourdes bridges ancestral abaca weaving with ethical contemporary fashion, creating bespoke runners, totes, and laptop accessories coveted by cultural advocates worldwide.',
      quote: 'Tradition is not static. We weave our ancestors’ memories into goods that thrive in the modern world without losing their sacred essence.'
    },
    {
      name: 'Elena Mansumandig',
      title: 'Senior Beadwork Artisan & Mentor',
      community: 'Toril Ancestral Center',
      craft: 'Bongat Headdresses, Chokers & Fringes',
      years: '28 Years of Seed Beading',
      specialty: 'Micro-Glass Seed Beading & Brass Wire Coiling',
      image: BEADED_BAG_IMAGE,
      bio: 'Elena directs the youth apprentice circles in Binugao, mentoring teenage girls in counting geometric diamond repeats and assembling genuine lost-wax brass bells.',
      quote: 'Teaching young girls to bead keeps our community together. In every seed bead, our identity shines.'
    }
  ];

  const filteredArtisans = artisans.filter(a => {
    if (selectedFocus === 'All') return true;
    if (selectedFocus === 'Inabal Weaving') return a.craft.includes('Backstrap');
    if (selectedFocus === 'Beadwork & Brass') return a.craft.includes('Bead');
    return a.craft.includes('Modern') || a.craft.includes('Multi-Weft');
  });

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-10">
      {/* Title */}
      <div className="border-b border-[#C9A227]/30 pb-6 text-center max-w-3xl mx-auto space-y-3">
        <span className="text-xs uppercase font-bold tracking-widest text-[#8C6B0F]">
          Women of Binugao
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#3B2418]">
          The BIBATAWA Master Artisans
        </h1>
        <p className="text-xs sm:text-sm text-[#5A3825]/85 leading-relaxed">
          Meet the indigenous women weavers whose hands, dreams, and devotion preserve the living heritage of the Bagobo-Tagabawa nation.
        </p>

        {/* Interactive Craft Specialty Filter */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
          {(['All', 'Inabal Weaving', 'Beadwork & Brass', 'Contemporary'] as const).map(tab => (
            <button
              key={tab}
              type="button"
              onClick={() => setSelectedFocus(tab)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                selectedFocus === tab
                  ? 'bg-[#3B2418] text-[#E5C76B] border-[#3B2418] shadow-xs'
                  : 'bg-[#FAF6ED] text-[#5A3825] border-[#C9A227]/35 hover:bg-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Artisans Showcase Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
        {filteredArtisans.map((artisan, idx) => (
          <div
            key={idx}
            className="h-full bg-[#FAF6ED] rounded-2xl border border-[#C9A227]/30 overflow-hidden shadow-sm hover:shadow-lg hover:border-[#C9A227] transition-all p-6 sm:p-8 flex flex-col justify-between gap-6"
          >
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border-2 border-[#C9A227] shrink-0 shadow-md bg-[#3B2418]/5">
                  <img
                    src={artisan.image}
                    alt={artisan.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="text-center sm:text-left min-w-0">
                  <h3 className="font-serif font-bold text-xl text-[#3B2418]">{artisan.name}</h3>
                  <p className="text-xs font-semibold text-[#8C6B0F] mt-0.5">{artisan.title}</p>
                  <p className="text-[11px] text-[#5A3825]/75 mt-0.5">{artisan.community}</p>
                  <div className="mt-2">
                    <Badge variant="gold">{artisan.craft}</Badge>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-white/80 rounded-lg border border-[#C9A227]/20 text-xs text-[#5A3825] space-y-1.5">
                <div className="flex flex-wrap justify-between gap-2">
                  <span className="font-semibold text-[#3B2418]">Practice:</span>
                  <span className="text-right">{artisan.years}</span>
                </div>
                <div className="flex flex-wrap justify-between gap-2">
                  <span className="font-semibold text-[#3B2418]">Signature Motif:</span>
                  <span className="text-[#8C6B0F] font-medium text-right">{artisan.specialty}</span>
                </div>
              </div>

              <p className="text-xs text-[#5A3825] leading-relaxed">
                {artisan.bio}
              </p>

              <blockquote className="p-3 bg-[#3B2418]/5 rounded-lg border-l-2 border-[#C9A227] italic text-xs text-[#3B2418]">
                "{artisan.quote}"
              </blockquote>
            </div>

            <div className="pt-4 border-t border-[#C9A227]/25 flex items-center justify-between">
              <span className="text-[11px] text-[#5A3825]/80 font-medium">
                Binugao Weaving Sanctuary
              </span>
              <button
                onClick={() => setCurrentView('shop')}
                className="px-4 py-2 bg-[#3B2418] text-[#E5C76B] hover:bg-[#5A3825] rounded text-xs font-semibold uppercase tracking-wider transition-colors flex items-center gap-1.5"
              >
                <ShoppingBag className="w-3.5 h-3.5 text-[#C9A227]" />
                <span>View Creations</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
