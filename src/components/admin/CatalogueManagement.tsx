import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Product } from '../../types';
import {
  Plus,
  Edit2,
  Trash2,
  Search,
  Eye,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import { INABAL_IMAGE, TANGGO_IMAGE, BEADED_BAG_IMAGE } from '../../utils/assets';

export const CatalogueManagement: React.FC = () => {
  const {
    products,
    addProduct,
    updateProduct,
    deleteProduct,
    openProductDetail,
  } = useApp();

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [code, setCode] = useState(`INB-2026-${String(products.length + 1).padStart(2, '0')}`);
  const [category, setCategory] = useState<Product['category']>('Textiles');
  const [price, setPrice] = useState(5500);
  const [stock, setStock] = useState(10);
  const [artisan, setArtisan] = useState('Bae Salome Linganay');
  const [community, setCommunity] = useState('Binugao, Toril, Davao City');
  const [craftType, setCraftType] = useState<Product['craftType']>('Backstrap Loom Inabal');
  const [status, setStatus] = useState<Product['status']>('Published');
  const [featured, setFeatured] = useState(false);
  const [description, setDescription] = useState('');
  const [culturalStory, setCulturalStory] = useState('');
  const [materialsStr, setMaterialsStr] = useState('Natural Abaca, Plant Dyes, Cotton');
  const [pattern, setPattern] = useState('Binituwon (Stars)');
  const [imageUrl, setImageUrl] = useState(INABAL_IMAGE);

  const filtered = products.filter(p => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.code.toLowerCase().includes(search.toLowerCase()) ||
      p.artisan.toLowerCase().includes(search.toLowerCase());
    const matchesCat = categoryFilter === 'All' || p.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setName('');
    setCode(`INB-2026-${String(products.length + 1).padStart(2, '0')}`);
    setCategory('Textiles');
    setPrice(5500);
    setStock(10);
    setArtisan('Bae Salome Linganay');
    setCommunity('Binugao, Toril, Davao City');
    setCraftType('Backstrap Loom Inabal');
    setStatus('Published');
    setFeatured(false);
    setDescription('');
    setCulturalStory('');
    setMaterialsStr('Natural Abaca, Organic Plant Dyes');
    setPattern('Binituwon (Stars)');
    setImageUrl(INABAL_IMAGE);
    setFormError(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setName(p.name);
    setCode(p.code);
    setCategory(p.category);
    setPrice(p.price);
    setStock(p.stock);
    setArtisan(p.artisan);
    setCommunity(p.community);
    setCraftType(p.craftType);
    setStatus(p.status);
    setFeatured(!!p.featured);
    setDescription(p.description);
    setCulturalStory(p.culturalStory);
    setMaterialsStr(p.materials.join(', '));
    setPattern(p.pattern);
    setImageUrl(p.imageUrl);
    setFormError(null);
    setIsAddModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const materials = materialsStr.split(',').map(m => m.trim()).filter(Boolean);
    setIsSaving(true);
    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, {
          name,
          code,
          category,
          price,
          stock,
          artisan,
          community,
          craftType,
          status,
          featured,
          description,
          culturalStory,
          materials,
          pattern,
          imageUrl,
        });
      } else {
        await addProduct({
          name,
          code,
          category,
          price,
          stock,
          artisan,
          community,
          craftType,
          description,
          culturalStory,
          materials,
          pattern,
          status,
          featured,
          imageUrl,
        });
      }
      setIsAddModalOpen(false);
    } catch (err: any) {
      setFormError(err?.message || 'Unable to save product.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteProduct(id);
      setConfirmDeleteId(null);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#C9A227]/30 pb-4">
        <div>
          <span className="text-xs uppercase font-bold tracking-widest text-[#8C6B0F]">
            Data Flow Process 4.0 · Curatorial Archive
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#3B2418] mt-0.5">
            Product Catalogue Management
          </h1>
          <p className="text-xs sm:text-sm text-[#5A3825]/80">
            Publish, edit, and safeguard cultural provenance information for all Bagobo-Tagabawa creations
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-5 py-2.5 bg-[#3B2418] text-[#E5C76B] hover:bg-[#5A3825] font-semibold text-xs tracking-wider uppercase rounded-lg flex items-center gap-2 transition-colors shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 text-[#C9A227]" />
          <span>Add Product</span>
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-[#FAF6ED] p-4 rounded-xl border border-[#C9A227]/30 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder="Search code, title, weaver..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-[#C9A227]/40 bg-white text-[#24150F] placeholder-[#5A3825]/60 focus:border-[#C9A227]"
          />
          <Search className="w-4 h-4 text-[#5A3825]/60 absolute left-3 top-2.5" />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-[#5A3825] font-medium">Category:</span>
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="px-3 py-1.5 text-xs rounded border border-[#C9A227]/40 bg-white text-[#3B2418] font-medium"
          >
            <option value="All">All Categories</option>
            <option value="Textiles">Textiles</option>
            <option value="Apparel">Apparel</option>
            <option value="Accessories">Accessories</option>
            <option value="Home Decor">Home Decor</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#FAF6ED] rounded-xl border border-[#C9A227]/30 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#3B2418] text-[#E5C76B] font-serif uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Item</th>
                <th className="py-3 px-4">Product Code</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4 text-right">Price</th>
                <th className="py-3 px-4 text-center">Stock</th>
                <th className="py-3 px-4">Artisan / Weaver</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#C9A227]/15">
              {filtered.map(p => (
                <tr key={p.id} className="hover:bg-white/70 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={p.imageUrl}
                        alt={p.name}
                        className="w-11 h-11 object-cover rounded border border-[#C9A227]/30 shrink-0"
                      />
                      <div className="font-serif font-bold text-sm text-[#3B2418] max-w-xs truncate">
                        {p.name}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-mono font-semibold text-[#8C6B0F]">{p.code}</td>
                  <td className="py-3 px-4 text-[#5A3825]">{p.category}</td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-[#3B2418]">
                    ₱{p.price.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-center font-mono font-medium">
                    <span className={p.stock > 0 ? 'text-emerald-800' : 'text-amber-700'}>
                      {p.stock} units
                    </span>
                  </td>
                  <td className="py-3 px-4 text-[#5A3825] whitespace-nowrap">{p.artisan}</td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <Badge variant={p.status === 'Published' ? 'green' : p.status === 'Draft' ? 'amber' : 'neutral'}>
                      {p.status}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-center whitespace-nowrap space-x-1">
                    <button
                      onClick={() => openProductDetail(p)}
                      className="p-1.5 rounded hover:bg-white text-[#3B2418] transition-colors"
                      title="Preview Product Page"
                    >
                      <Eye className="w-4 h-4 text-[#8C6B0F]" />
                    </button>
                    <button
                      onClick={() => handleOpenEdit(p)}
                      className="p-1.5 rounded hover:bg-white text-[#3B2418] transition-colors"
                      title="Edit Product"
                    >
                      <Edit2 className="w-4 h-4 text-[#3B2418]" />
                    </button>
                    {confirmDeleteId === p.id ? (
                      <span className="inline-flex items-center gap-1 ml-1">
                        <button
                          onClick={() => handleDeleteProduct(p.id)}
                          disabled={deletingId === p.id}
                          className="px-2 py-0.5 bg-rose-700 text-white rounded text-[10px] font-bold"
                        >
                          {deletingId === p.id ? '...' : 'Confirm'}
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="px-1.5 py-0.5 border border-stone-300 rounded text-[10px]"
                        >
                          No
                        </button>
                      </span>
                    ) : (
                      <button
                        onClick={() => setConfirmDeleteId(p.id)}
                        className="p-1.5 rounded hover:bg-white text-rose-700 transition-colors"
                        title="Delete Product"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Product Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={editingProduct ? 'Edit Cultural Product' : 'Add New Cultural Creation'}
        subtitle="Cataloguing with Bagobo-Tagabawa provenance and technical loom specs"
        maxWidth="2xl"
      >
        <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-[#3B2418] mb-1">Product Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Master Inabal Abaca Cloth"
                className="w-full px-3 py-2 rounded border border-[#C9A227]/40 bg-white"
              />
            </div>
            <div>
              <label className="block font-semibold text-[#3B2418] mb-1">Product Code *</label>
              <input
                type="text"
                required
                value={code}
                onChange={e => setCode(e.target.value)}
                className="w-full px-3 py-2 rounded border border-[#C9A227]/40 bg-white font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-[#3B2418] mb-1">Category *</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as Product['category'])}
                className="w-full px-3 py-2 rounded border border-[#C9A227]/40 bg-white"
              >
                <option value="Textiles">Textiles</option>
                <option value="Apparel">Apparel</option>
                <option value="Accessories">Accessories</option>
                <option value="Home Decor">Home Decor</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-[#3B2418] mb-1">Retail Price (₱) *</label>
              <input
                type="number"
                required
                min={1}
                value={price}
                onChange={e => setPrice(Number(e.target.value))}
                className="w-full px-3 py-2 rounded border border-[#C9A227]/40 bg-white font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-[#3B2418] mb-1">Available Stock *</label>
              <input
                type="number"
                required
                min={0}
                value={stock}
                onChange={e => setStock(Number(e.target.value))}
                className="w-full px-3 py-2 rounded border border-[#C9A227]/40 bg-white font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-[#3B2418] mb-1">Artisan / Weaver *</label>
              <input
                type="text"
                required
                value={artisan}
                onChange={e => setArtisan(e.target.value)}
                className="w-full px-3 py-2 rounded border border-[#C9A227]/40 bg-white"
              />
            </div>
            <div>
              <label className="block font-semibold text-[#3B2418] mb-1">Craft Technique *</label>
              <select
                value={craftType}
                onChange={e => setCraftType(e.target.value as Product['craftType'])}
                className="w-full px-3 py-2 rounded border border-[#C9A227]/40 bg-white"
              >
                <option value="Backstrap Loom Inabal">Backstrap Loom Inabal</option>
                <option value="Beadwork & Brass">Beadwork & Brass</option>
                <option value="Hand Embroidery">Hand Embroidery</option>
                <option value="Natural Dyeing">Natural Dyeing</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-[#3B2418] mb-1">Publication Status</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as Product['status'])}
                className="w-full px-3 py-2 rounded border border-[#C9A227]/40 bg-white"
              >
                <option value="Published">Published</option>
                <option value="Draft">Draft</option>
                <option value="Archived">Archived</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-[#3B2418] mb-1">Short Description *</label>
            <textarea
              required
              rows={2}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Material qualities, finish, dimensions..."
              className="w-full px-3 py-2 rounded border border-[#C9A227]/40 bg-white"
            />
          </div>

          <div>
            <label className="block font-semibold text-[#3B2418] mb-1">Cultural Significance / Story *</label>
            <textarea
              required
              rows={3}
              value={culturalStory}
              onChange={e => setCulturalStory(e.target.value)}
              placeholder="Ancestral tradition, mountain symbolism, spiritual alignment..."
              className="w-full px-3 py-2 rounded border border-[#C9A227]/40 bg-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-[#3B2418] mb-1">Materials (comma separated)</label>
              <input
                type="text"
                value={materialsStr}
                onChange={e => setMaterialsStr(e.target.value)}
                className="w-full px-3 py-2 rounded border border-[#C9A227]/40 bg-white"
              />
            </div>
            <div>
              <label className="block font-semibold text-[#3B2418] mb-1">Pattern / Motif Name</label>
              <input
                type="text"
                value={pattern}
                onChange={e => setPattern(e.target.value)}
                className="w-full px-3 py-2 rounded border border-[#C9A227]/40 bg-white"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <label className="block font-semibold text-[#3B2418] mb-1">Visual Asset Selection</label>
              <div className="flex gap-3">
                {[
                  { label: 'Inabal Roll', url: INABAL_IMAGE },
                  { label: 'Tanggo Blouse', url: TANGGO_IMAGE },
                  { label: 'Beaded Pouch', url: BEADED_BAG_IMAGE },
                ].map(img => (
                  <div
                    key={img.label}
                    onClick={() => setImageUrl(img.url)}
                    className={`p-1.5 rounded-lg border cursor-pointer flex items-center gap-2 ${
                      imageUrl === img.url ? 'border-[#C9A227] bg-[#C9A227]/20 ring-1 ring-[#C9A227]' : 'border-stone-200 bg-white'
                    }`}
                  >
                    <img src={img.url} alt="" className="w-8 h-8 object-cover rounded" />
                    <span className="text-[11px] font-medium text-[#3B2418]">{img.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <label className="flex items-center gap-2 p-2.5 rounded border border-[#C9A227]/30 bg-[#FAF6ED] cursor-pointer">
              <input
                type="checkbox"
                checked={featured}
                onChange={e => setFeatured(e.target.checked)}
                className="accent-[#3B2418]"
              />
              <span className="font-semibold text-[#3B2418]">Feature on Landing Showcase</span>
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-[#C9A227]/30">
            <button
              type="button"
              disabled={isSaving}
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 border border-stone-300 rounded text-stone-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 bg-[#3B2418] text-[#E5C76B] hover:bg-[#5A3825] rounded font-semibold uppercase tracking-wider flex items-center gap-1.5 disabled:opacity-60"
            >
              {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{editingProduct ? 'Update Product' : 'Publish to Collection'}</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
