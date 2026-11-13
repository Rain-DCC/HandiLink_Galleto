import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  HANDILINK_LOGO,
  HERO_IMAGE,
  BEADED_BAG_IMAGE,
  TANGGO_IMAGE,
  ARTISAN_HANDS_IMAGE,
  CULTURAL_STORIES,
} from '../../utils/assets';
import {
  ArrowRight,
  ShieldCheck,
  Heart,
  Compass,
  Scissors,
  ChevronRight,
  Server,
  ScanSearch,
  Mic,
  Truck,
  CreditCard,
  ShoppingBag,
} from 'lucide-react';
import { Badge } from '../common/Badge';
import { AppView } from '../../types';

export const LandingPage: React.FC = () => {
  const { products, openProductDetail, addToCart, setCurrentView, currentRole } = useApp();

  const featuredProducts = products.filter(p => p.featured).slice(0, 4);

  const artisanProfiles = [
    {
      name: 'Bae Salome Linganay',
      role: 'Master Backstrap Weaver & Elder',
      community: 'Sitio Binugao, Toril, Davao City',
      craft: 'Inabal Ikat (Natural Dyes)',
      image: ARTISAN_HANDS_IMAGE,
      story:
        'Over 45 years preserving the sacred Binituwon star motifs, passing ancestral tension loom techniques to the next generation.',
    },
    {
      name: 'Bae Carmelita Omba',
      role: 'BIBATAWA President & Regalia Artisan',
      community: 'Binugao Ancestral Domain',
      craft: 'Tanggo Beadwork & Tungkaling Bells',
      image: TANGGO_IMAGE,
      story:
        'Leading the 38-member women weavers collective in establishing customary IP protection and fair living wages.',
    },
    {
      name: 'Elena Mansumandig',
      role: 'Traditional Beadwork Weaver',
      community: 'Binugao Foothills',
      craft: 'Pangulambong & Adornment',
      image: BEADED_BAG_IMAGE,
      story:
        'Specializes in the intricate Minata (ancestral eye) seed beading for ceremonial headwear and chokers.',
    },
  ];

  const microservices: Array<{
    name: string;
    icon: React.ElementType;
    desc: string;
    targetView: AppView;
    publicFallback: AppView;
  }> = [
    { name: 'Proposal & NCIP Compliance', icon: ShieldCheck, desc: 'FPIC evaluation & tripartite partnership resolutions', targetView: 'proposals', publicFallback: 'cultural_stories' },
    { name: 'Catalogue & Material Inventory', icon: Compass, desc: 'Published collections & organic dye/abaca stock control', targetView: 'catalogue', publicFallback: 'shop' },
    { name: 'Order & Loom Workflow', icon: Scissors, desc: 'Custom PO orders synced to artisan backstrap batches', targetView: 'artisan_production', publicFallback: 'artisans' },
    { name: 'Payment & 82/18 Trust Fund', icon: CreditCard, desc: '82% direct weaver payout & 18% community trust ledger', targetView: 'sales', publicFallback: 'login' },
    { name: 'Pattern Verification AI', icon: ScanSearch, desc: 'Computer vision authenticity & motif IP verification', targetView: 'pattern_vision', publicFallback: 'login' },
    { name: 'Cebuano Speech AI', icon: Mic, desc: 'Bisaya artisan voice logging, translation & audio feedback', targetView: 'cebuano_speech', publicFallback: 'login' },
    { name: 'Shipping & Logistics', icon: Truck, desc: 'End-to-end heritage parcel tracking from Binugao', targetView: 'logistics', publicFallback: 'login' },
    { name: 'Analytics & Audit Gateway', icon: Server, desc: 'JWT RBAC security, CSV reporting & immutable logs', targetView: 'reports', publicFallback: 'login' },
  ];

  const handleServiceClick = (svc: (typeof microservices)[number]) => {
    setCurrentView(currentRole === 'guest' ? svc.publicFallback : svc.targetView);
  };

  return (
    <div className="space-y-16 sm:space-y-24 pb-16">
      {/* HERO SECTION */}
      <section className="relative overflow-hidden bg-[#3B2418] text-[#F8F3E7] border-b border-[#C9A227]/30 bg-woven-pattern">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 space-y-6">
              <div className="flex flex-wrap items-center gap-3">
                <div className="bg-white rounded-xl p-1.5 shadow border border-[#C9A227]/60">
                  <img src={HANDILINK_LOGO} alt="HandiLink" className="h-12 w-auto object-contain" />
                </div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-[#5A3825] border border-[#C9A227]/40 text-[#E5C76B] text-xs font-semibold uppercase tracking-wider">
                  <span className="w-2 h-2 rounded-full bg-[#C9A227]" />
                  <span>Binugao Bagobo-Tagabawa Women Weavers Association</span>
                </div>
              </div>

              <div>
                <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#F8F3E7] leading-none">
                  HANDILINK
                </h1>
                <p className="font-serif italic text-xl sm:text-2xl text-[#E5C76B] mt-2 font-medium">
                  "Preserving Heritage. Empowering Artisans."
                </p>
              </div>

              <p className="text-sm sm:text-base text-[#F8F3E7]/85 max-w-xl leading-relaxed">
                Connecting indigenous craftsmanship, cultural heritage, and sustainable livelihood through one digital platform. Handcrafted abaca textiles and authentic beadwork, directly supporting Bagobo-Tagabawa women weavers.
              </p>

              {/* Primary CTAs */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  onClick={() => setCurrentView('shop')}
                  className="px-6 py-3.5 bg-[#C9A227] text-[#24150F] hover:bg-[#E5C76B] rounded-lg font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all"
                >
                  <span>Explore Products</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                {currentRole === 'guest' ? (
                  <>
                    <button
                      onClick={() => setCurrentView('login')}
                      className="px-6 py-3.5 border-2 border-[#C9A227] text-[#E5C76B] hover:bg-[#5A3825] rounded-lg font-semibold text-xs uppercase tracking-wider transition-all"
                    >
                      Sign In
                    </button>
                    <button
                      onClick={() => setCurrentView('register')}
                      className="px-6 py-3.5 bg-[#5A3825] text-[#F8F3E7] hover:bg-[#C9A227] hover:text-[#24150F] border border-[#C9A227]/40 rounded-lg font-semibold text-xs uppercase tracking-wider transition-all"
                    >
                      Register Account
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setCurrentView('cultural_stories')}
                    className="px-6 py-3.5 border-2 border-[#C9A227] text-[#E5C76B] hover:bg-[#5A3825] rounded-lg font-semibold text-xs uppercase tracking-wider transition-all"
                  >
                    Discover Our Story
                  </button>
                )}
              </div>

              <div className="pt-6 border-t border-[#5A3825] flex flex-wrap gap-6 text-xs text-[#F8F3E7]/75">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#C9A227]" />
                  <span>100% Free & Prior Informed Consent (FPIC)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Heart className="w-4 h-4 text-[#C9A227]" />
                  <span>82% Direct Artisan Compensation</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="relative rounded-2xl overflow-hidden border-2 border-[#C9A227]/40 shadow-2xl group bg-[#24150F]">
                <img
                  src={HERO_IMAGE}
                  alt="Traditional Bagobo-Tagabawa Handloom Weaving Process"
                  className="w-full h-[400px] sm:h-[460px] object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#24150F]/90 via-[#24150F]/20 to-transparent" />
                <div className="absolute bottom-6 left-6 right-6 text-xs text-[#F8F3E7]">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-[#E5C76B] block">
                    Authentic Backstrap Loom
                  </span>
                  <p className="font-serif font-bold text-sm text-[#F8F3E7] mt-0.5">
                    Wild Mountain Abaca & Natural Organic Plant Dyes
                  </p>
                  <p className="text-[11px] text-[#F8F3E7]/80 mt-1">
                    Binugao Ancestral Weaving Sanctuary, Toril District, Davao City
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURED PRODUCTS SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
          <div>
            <span className="text-xs uppercase font-bold tracking-widest text-[#8C6B0F]">
              Handcrafted Treasures
            </span>
            <h2 className="font-serif text-3xl font-bold text-[#3B2418] mt-1">
              Featured Creations
            </h2>
            <p className="text-xs sm:text-sm text-[#5A3825]/80 mt-1">
              Each piece represents weeks of backstrap tension weaving and ancestral knowledge
            </p>
          </div>
          <button
            onClick={() => setCurrentView('shop')}
            className="text-xs font-bold text-[#3B2418] hover:text-[#C9A227] flex items-center gap-1 uppercase tracking-wider self-start sm:self-auto"
          >
            <span>View Full Catalogue</span>
            <ArrowRight className="w-4 h-4 text-[#C9A227]" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
          {featuredProducts.map(p => (
            <div
              key={p.id}
              className="h-full bg-[#FAF6ED] rounded-xl border border-[#C9A227]/30 overflow-hidden shadow-xs hover:shadow-xl hover:border-[#C9A227] transition-all duration-300 flex flex-col justify-between group"
            >
              <button
                type="button"
                onClick={() => openProductDetail(p)}
                className="relative aspect-4/3 overflow-hidden bg-[#3B2418]/5 w-full text-left focus:outline-hidden"
              >
                <img
                  src={p.imageUrl}
                  alt={p.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3">
                  <Badge variant="gold" size="sm">
                    {p.craftType}
                  </Badge>
                </div>
              </button>

              <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                <div className="space-y-1.5">
                  <h3
                    onClick={() => openProductDetail(p)}
                    className="font-serif font-bold text-base text-[#3B2418] hover:text-[#C9A227] transition-colors cursor-pointer line-clamp-1"
                  >
                    {p.name}
                  </h3>
                  <p className="text-xs text-[#5A3825]/85 line-clamp-2">{p.description}</p>
                  <p className="text-[11px] text-[#8C6B0F] font-medium pt-0.5 truncate">
                    By {p.artisan} · {p.community.split(',')[0]}
                  </p>
                </div>

                <div className="pt-3 border-t border-[#C9A227]/20 flex flex-wrap items-center justify-between gap-2">
                  <span className="font-mono font-bold text-base text-[#3B2418] tabular-nums">
                    ₱{p.price.toLocaleString()}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => openProductDetail(p)}
                      className="px-2.5 py-1.5 border border-[#C9A227]/50 text-[#3B2418] hover:bg-white rounded text-xs font-semibold transition-colors"
                    >
                      Details
                    </button>
                    <button
                      type="button"
                      onClick={() => addToCart(p, 1)}
                      className="px-2.5 py-1.5 bg-[#3B2418] text-[#E5C76B] hover:bg-[#5A3825] rounded text-xs font-semibold uppercase tracking-wider transition-colors shadow-2xs flex items-center gap-1"
                    >
                      <ShoppingBag className="w-3.5 h-3.5 text-[#C9A227]" />
                      <span>Add</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* OUR ARTISANS */}
      <section className="bg-[#FAF6ED] border-y border-[#C9A227]/25 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs uppercase font-bold tracking-widest text-[#8C6B0F]">
              Guardians of the Ancestral Loom
            </span>
            <h2 className="font-serif text-3xl font-bold text-[#3B2418]">Our Master Artisans</h2>
            <p className="text-xs sm:text-sm text-[#5A3825]/80">
              The women of BIBATAWA carry centuries of Bagobo-Tagabawa culture in their hands, preserving sacred motifs and sustaining mountain communities.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {artisanProfiles.map((artisan, idx) => (
              <div
                key={idx}
                className="bg-white rounded-xl border border-[#C9A227]/30 p-6 shadow-sm flex flex-col justify-between space-y-4 text-center hover:border-[#C9A227] transition-all"
              >
                <div>
                  <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-[#C9A227] mx-auto shadow-md mb-4 bg-[#3B2418]/5">
                    <img src={artisan.image} alt={artisan.name} className="w-full h-full object-cover" />
                  </div>
                  <h3 className="font-serif font-bold text-lg text-[#3B2418]">{artisan.name}</h3>
                  <p className="text-xs font-semibold text-[#8C6B0F]">{artisan.role}</p>
                  <p className="text-[11px] text-[#5A3825]/70 mt-0.5">{artisan.community}</p>
                  <div className="my-3 inline-block px-2.5 py-0.5 rounded bg-[#FAF6ED] text-[11px] text-[#3B2418] font-medium border border-[#C9A227]/25">
                    {artisan.craft}
                  </div>
                  <p className="text-xs text-[#5A3825] leading-relaxed">{artisan.story}</p>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => setCurrentView('artisans')}
                    className="w-full py-2 border border-[#C9A227] text-[#3B2418] hover:bg-[#FAF6ED] rounded text-xs font-semibold uppercase tracking-wider transition-colors"
                  >
                    View Story
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MICROSERVICES & DFD SYSTEM ARCHITECTURE OVERVIEW */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs uppercase font-bold tracking-widest text-[#8C6B0F]">
            Integrated Digital Ecosystem
          </span>
          <h2 className="font-serif text-3xl font-bold text-[#3B2418]">
            HandiLink Platform Architecture
          </h2>
          <p className="text-xs sm:text-sm text-[#5A3825]/80">
            Eight specialized microservices coordinated through a central RBAC API Gateway connecting weavers, designers, NCIP legal officers, and patrons.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 items-stretch">
          {microservices.map(svc => {
            const Icon = svc.icon;
            return (
              <button
                key={svc.name}
                type="button"
                onClick={() => handleServiceClick(svc)}
                className="h-full text-left bg-white p-5 rounded-xl border border-[#C9A227]/30 hover:border-[#C9A227] hover:shadow-md transition-all shadow-xs flex flex-col justify-between gap-3 group"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="w-9 h-9 rounded-lg bg-[#FAF6ED] border border-[#C9A227]/30 group-hover:bg-[#3B2418] group-hover:text-[#E5C76B] flex items-center justify-center transition-colors">
                      <Icon className="w-4 h-4 text-[#8C6B0F] group-hover:text-[#E5C76B]" />
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#C9A227] opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                  </div>
                  <h3 className="font-serif font-bold text-sm text-[#3B2418]">{svc.name}</h3>
                  <p className="text-xs text-[#5A3825]/85 leading-relaxed">{svc.desc}</p>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C6B0F] group-hover:text-[#3B2418]">
                  {currentRole === 'guest' ? 'Explore Module →' : 'Open Workspace →'}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* CULTURAL STORIES TEASER */}
      <section className="bg-[#FAF6ED] border-y border-[#C9A227]/25 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <span className="text-xs uppercase font-bold tracking-widest text-[#8C6B0F]">
                Living Heritage Chronicles
              </span>
              <h2 className="font-serif text-3xl font-bold text-[#3B2418] mt-1">
                Cultural Stories & Ancestral Knowledge
              </h2>
            </div>
            <button
              onClick={() => setCurrentView('cultural_stories')}
              className="text-xs font-bold text-[#3B2418] hover:text-[#C9A227] flex items-center gap-1 uppercase tracking-wider"
            >
              <span>Read All Stories</span>
              <ArrowRight className="w-4 h-4 text-[#C9A227]" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {CULTURAL_STORIES.map(story => (
              <div
                key={story.id}
                onClick={() => setCurrentView('cultural_stories')}
                className="bg-white p-6 rounded-xl border border-[#C9A227]/30 shadow-xs hover:border-[#C9A227] hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between text-[11px] text-[#8C6B0F] font-semibold mb-2">
                    <span>{story.category}</span>
                    <span>{story.readTime}</span>
                  </div>
                  <h3 className="font-serif font-bold text-base text-[#3B2418] leading-snug">
                    {story.title}
                  </h3>
                  <p className="text-xs text-[#5A3825] mt-2 line-clamp-3 leading-relaxed">
                    {story.excerpt}
                  </p>
                </div>
                <div className="pt-3 border-t border-[#C9A227]/20 flex items-center gap-1 text-xs font-semibold text-[#3B2418]">
                  <span>Explore narrative</span>
                  <ChevronRight className="w-3.5 h-3.5 text-[#C9A227]" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ABOUT BIBATAWA SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#3B2418] text-[#F8F3E7] rounded-2xl p-8 sm:p-12 border border-[#C9A227]/40 shadow-xl bg-woven-pattern">
          <div className="max-w-3xl space-y-4">
            <span className="text-xs uppercase font-bold tracking-widest text-[#E5C76B]">
              About the Organization
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#F8F3E7]">
              Binugao Bagobo-Tagabawa Women Weavers Association
            </h2>
            <p className="text-xs sm:text-sm text-[#F8F3E7]/85 leading-relaxed">
              BIBATAWA is an indigenous community association registered within the ancestral domain of Sitio Binugao, Barangay Binugao, Toril District, Davao City. Our mission is to restore the economic self-reliance of indigenous women through the authentic revival of backstrap loom Inabal weaving and Pangulambong beadwork.
            </p>
            <div className="pt-4 flex flex-wrap gap-4">
              <button
                onClick={() => setCurrentView('shop')}
                className="px-6 py-3 bg-[#C9A227] text-[#24150F] hover:bg-[#E5C76B] font-bold text-xs uppercase tracking-wider rounded-lg transition-colors shadow-md"
              >
                Support Indigenous Craftsmanship
              </button>
              <button
                onClick={() => setCurrentView('login')}
                className="px-5 py-3 border border-[#C9A227] text-[#E5C76B] hover:bg-[#5A3825] font-semibold text-xs rounded-lg transition-colors"
              >
                Enter Association Portal
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#2E1B12] text-[#F8F3E7] border-t border-[#5A3825] pt-12 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-3 md:col-span-1">
              <div className="flex items-center gap-2.5">
                <img
                  src={HANDILINK_LOGO}
                  alt="HandiLink"
                  className="w-9 h-9 rounded object-contain bg-white p-0.5"
                />
                <span className="font-serif font-bold text-lg tracking-wider text-[#E5C76B]">
                  HANDILINK
                </span>
              </div>
              <p className="text-xs text-[#F8F3E7]/70 leading-relaxed">
                "Preserving Heritage. Empowering Artisans."
              </p>
              <p className="text-[11px] text-[#F8F3E7]/50">
                Binugao Bagobo-Tagabawa Women Weavers Association (BIBATAWA)
              </p>
            </div>

            <div>
              <h4 className="font-serif font-bold text-sm text-[#E5C76B] mb-3 uppercase tracking-wider">
                Explore
              </h4>
              <ul className="text-xs space-y-2 text-[#F8F3E7]/80">
                <li><button onClick={() => setCurrentView('shop')} className="hover:text-[#E5C76B]">Inabal Textiles</button></li>
                <li><button onClick={() => setCurrentView('shop')} className="hover:text-[#E5C76B]">Tanggo Blouses</button></li>
                <li><button onClick={() => setCurrentView('artisans')} className="hover:text-[#E5C76B]">Master Artisans</button></li>
                <li><button onClick={() => setCurrentView('cultural_stories')} className="hover:text-[#E5C76B]">Ancestral Dyes & Motifs</button></li>
              </ul>
            </div>

            <div>
              <h4 className="font-serif font-bold text-sm text-[#E5C76B] mb-3 uppercase tracking-wider">
                Access & Governance
              </h4>
              <ul className="text-xs space-y-2 text-[#F8F3E7]/80">
                <li><button onClick={() => setCurrentView('login')} className="hover:text-[#E5C76B]">Member & Partner Sign In</button></li>
                <li><button onClick={() => setCurrentView('register')} className="hover:text-[#E5C76B]">Register Artisan / Patron</button></li>
                <li><button onClick={() => setCurrentView('cultural_stories')} className="hover:text-[#E5C76B]">IPRA RA 8371 Compliance</button></li>
              </ul>
            </div>

            <div>
              <h4 className="font-serif font-bold text-sm text-[#E5C76B] mb-3 uppercase tracking-wider">
                Weaving Center
              </h4>
              <p className="text-xs text-[#F8F3E7]/70 leading-relaxed">
                Sitio Binugao, Barangay Binugao, Toril District, Davao City, Region XI, Philippines
              </p>
              <p className="text-xs text-[#E5C76B] mt-2">contact@bibatawa.org</p>
            </div>
          </div>

          <div className="pt-8 border-t border-[#5A3825] flex flex-col sm:flex-row justify-between items-center text-[11px] text-[#F8F3E7]/60 gap-4">
            <p>© 2026 HANDILINK · BIBATAWA. All rights reserved. Registered under NCIP Region XI.</p>
            <div className="flex gap-4">
              <span>FPIC Certified</span>
              <span>82/18 Fair-Trade Charter</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
