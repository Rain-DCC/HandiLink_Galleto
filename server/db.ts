import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

const DEFAULT_DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_PATH = process.env.HANDILINK_DB_PATH
  ? path.resolve(process.env.HANDILINK_DB_PATH)
  : path.join(DEFAULT_DATA_DIR, 'handilink.db');

const DB_DIR = path.dirname(DB_PATH);
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

function openDatabaseConnection(dbPath: string): Database.Database {
  const conn = new Database(dbPath);
  conn.pragma('busy_timeout = 5000');
  conn.pragma('journal_mode = DELETE');
  conn.pragma('synchronous = NORMAL');
  conn.pragma('foreign_keys = ON');
  return conn;
}

let dbInstance: Database.Database | undefined;
try {
  dbInstance = openDatabaseConnection(DB_PATH);
  dbInstance.pragma('quick_check');
} catch {
  try {
    dbInstance?.close();
  } catch {
    // ignore close failure on corrupt handle
  }
  for (const suffix of ['', '-wal', '-shm', '-journal']) {
    const target = `${DB_PATH}${suffix}`;
    if (fs.existsSync(target)) {
      fs.rmSync(target, { force: true });
    }
  }
  dbInstance = openDatabaseConnection(DB_PATH);
}

export const db: Database.Database = dbInstance;

export function initializeDatabase(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT,
      google_id TEXT UNIQUE,
      auth_provider TEXT NOT NULL DEFAULT 'local',
      phone TEXT NOT NULL DEFAULT '',
      role TEXT NOT NULL DEFAULT 'customer',
      role_title TEXT NOT NULL DEFAULT 'Cultural Patron',
      community TEXT NOT NULL DEFAULT 'Davao City',
      address TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'Active',
      verified INTEGER NOT NULL DEFAULT 1,
      avatar_url TEXT DEFAULT '',
      last_login TEXT DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      token_jti TEXT NOT NULL UNIQUE,
      user_agent TEXT DEFAULT '',
      ip_address TEXT DEFAULT '',
      expires_at TEXT NOT NULL,
      revoked INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS proposals (
      id TEXT PRIMARY KEY,
      proposal_number TEXT NOT NULL UNIQUE,
      date TEXT NOT NULL,
      person_involved TEXT NOT NULL,
      organization TEXT NOT NULL,
      address TEXT NOT NULL DEFAULT '',
      subject TEXT NOT NULL,
      letter_content TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Draft',
      submitted_by_id TEXT,
      submitted_by TEXT NOT NULL,
      submitted_date TEXT NOT NULL,
      target_community TEXT NOT NULL,
      signature TEXT NOT NULL,
      supporting_documents TEXT NOT NULL DEFAULT '[]',
      evaluation_remarks TEXT DEFAULT '',
      evaluated_by_id TEXT,
      evaluated_by TEXT DEFAULT '',
      evaluation_date TEXT DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS partnership_resolutions (
      id TEXT PRIMARY KEY,
      resolution_number TEXT NOT NULL UNIQUE,
      proposal_id TEXT,
      proposal_number TEXT NOT NULL,
      resolution_date TEXT NOT NULL,
      parties_involved TEXT NOT NULL DEFAULT '[]',
      resolution_content TEXT NOT NULL,
      approval_status TEXT NOT NULL DEFAULT 'Approved',
      signed_by_ncip INTEGER NOT NULL DEFAULT 1,
      signed_by_bibatawa INTEGER NOT NULL DEFAULT 1,
      signed_by_partner INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (proposal_id) REFERENCES proposals(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS patterns (
      id TEXT PRIMARY KEY,
      code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      cultural_origin TEXT NOT NULL,
      description TEXT NOT NULL,
      associated_product TEXT NOT NULL,
      image_url TEXT NOT NULL,
      symbolism TEXT NOT NULL,
      complexity TEXT NOT NULL DEFAULT 'High',
      fpic_verified INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      price REAL NOT NULL,
      stock INTEGER NOT NULL DEFAULT 0,
      artisan_id TEXT,
      artisan TEXT NOT NULL,
      community TEXT NOT NULL,
      description TEXT NOT NULL,
      cultural_story TEXT NOT NULL,
      materials TEXT NOT NULL DEFAULT '[]',
      pattern_id TEXT,
      pattern TEXT NOT NULL,
      craft_type TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Published',
      image_url TEXT NOT NULL,
      featured INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS materials (
      id TEXT PRIMARY KEY,
      code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      unit TEXT NOT NULL,
      current_stock REAL NOT NULL DEFAULT 0,
      minimum_stock REAL NOT NULL DEFAULT 10,
      status TEXT NOT NULL DEFAULT 'Available',
      category TEXT NOT NULL,
      unit_cost REAL NOT NULL DEFAULT 0,
      last_updated TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS material_logs (
      id TEXT PRIMARY KEY,
      material_id TEXT NOT NULL,
      action_type TEXT NOT NULL,
      delta REAL NOT NULL,
      previous_stock REAL NOT NULL,
      new_stock REAL NOT NULL,
      notes TEXT DEFAULT '',
      performed_by TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (material_id) REFERENCES materials(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      order_number TEXT NOT NULL UNIQUE,
      date TEXT NOT NULL,
      customer_id TEXT,
      customer_name TEXT NOT NULL,
      customer_email TEXT NOT NULL,
      customer_phone TEXT NOT NULL DEFAULT '',
      shipping_address TEXT NOT NULL,
      subtotal REAL NOT NULL,
      shipping_fee REAL NOT NULL DEFAULT 0,
      total REAL NOT NULL,
      payment_method TEXT NOT NULL,
      payment_status TEXT NOT NULL DEFAULT 'Pending',
      order_status TEXT NOT NULL DEFAULT 'Pending',
      production_status TEXT NOT NULL DEFAULT 'Not Started',
      target_completion_date TEXT NOT NULL,
      assigned_artisan TEXT DEFAULT '',
      notes TEXT DEFAULT '',
      po_number TEXT DEFAULT '',
      terms TEXT DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      product_id TEXT,
      product_code TEXT NOT NULL,
      product_name TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      unit TEXT NOT NULL DEFAULT 'Piece',
      unit_price REAL NOT NULL,
      amount REAL NOT NULL,
      pattern TEXT DEFAULT '',
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS production_batches (
      id TEXT PRIMARY KEY,
      order_id TEXT,
      order_number TEXT NOT NULL,
      product_name TEXT NOT NULL,
      product_code TEXT NOT NULL,
      design_pattern TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      start_date TEXT NOT NULL,
      target_completion TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Pending',
      progress_percentage INTEGER NOT NULL DEFAULT 0,
      assigned_artisan TEXT NOT NULL,
      community_cluster TEXT NOT NULL DEFAULT 'Binugao Weaving Center',
      notes TEXT DEFAULT '',
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      order_number TEXT NOT NULL,
      reference_code TEXT NOT NULL UNIQUE,
      amount REAL NOT NULL,
      artisan_share REAL NOT NULL,
      trust_fund_share REAL NOT NULL,
      payment_method TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Pending',
      verified_by TEXT DEFAULT '',
      verified_at TEXT DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS shipments (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      order_number TEXT NOT NULL,
      tracking_number TEXT NOT NULL UNIQUE,
      courier TEXT NOT NULL,
      origin TEXT NOT NULL DEFAULT 'Binugao Weaving Hub, Toril, Davao City',
      destination TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Preparing',
      estimated_delivery TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS pattern_verifications (
      id TEXT PRIMARY KEY,
      submitted_by TEXT NOT NULL,
      image_name TEXT NOT NULL,
      detected_motif TEXT NOT NULL,
      authenticity_score REAL NOT NULL,
      cultural_match_status TEXT NOT NULL,
      analysis_summary TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS speech_transcripts (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      source_language TEXT NOT NULL DEFAULT 'Cebuano / Bagobo-Tagabawa',
      cebuano_transcript TEXT NOT NULL,
      english_translation TEXT NOT NULL,
      detected_intent TEXT NOT NULL DEFAULT 'General Log',
      audio_duration_label TEXT DEFAULT 'Voice Clip',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS cart_items (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      selected_pattern TEXT DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(user_id, product_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS favorites (
      user_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      PRIMARY KEY (user_id, product_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      target_role TEXT NOT NULL DEFAULT 'all',
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT NOT NULL,
      is_read INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT DEFAULT '',
      user_name TEXT NOT NULL,
      user_role TEXT NOT NULL,
      service_name TEXT NOT NULL,
      action TEXT NOT NULL,
      resource_type TEXT NOT NULL,
      resource_id TEXT DEFAULT '',
      details TEXT DEFAULT '',
      ip_address TEXT DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS designer_selections (
      id TEXT PRIMARY KEY,
      designer_id TEXT NOT NULL,
      designer_name TEXT NOT NULL,
      pattern_id TEXT NOT NULL,
      pattern_name TEXT NOT NULL,
      product_code TEXT NOT NULL,
      product_name TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      notes TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  seedInitialData();
}

function seedInitialData(): void {
  const userCount = (db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number }).count;
  if (userCount > 0) return;

  const defaultPassHash = bcrypt.hashSync('HandiLink2026!', 10);

  const insertUser = db.prepare(`
    INSERT INTO users (id, first_name, last_name, name, email, password_hash, auth_provider, phone, role, role_title, community, address, status, verified, avatar_url, last_login)
    VALUES (@id, @first_name, @last_name, @name, @email, @password_hash, @auth_provider, @phone, @role, @role_title, @community, @address, @status, @verified, @avatar_url, @last_login)
  `);

  const seedUsers = [
    {
      id: 'usr-001',
      first_name: 'Carmelita',
      last_name: 'Omba',
      name: 'Bae Carmelita Omba',
      email: 'carmelita.omba@bibatawa.org',
      password_hash: defaultPassHash,
      auth_provider: 'local',
      phone: '+63 920 123 4567',
      role: 'artisan_weaver',
      role_title: 'BIBATAWA President & Master Weaver',
      community: 'Binugao, Toril, Davao City',
      address: 'Purok 4, Brgy. Binugao, Toril District, Davao City',
      status: 'Active',
      verified: 1,
      avatar_url: '/src/assets/images/artisan_weaving_hands_1793698252571.jpg',
      last_login: '2026-11-13 08:30 AM'
    },
    {
      id: 'usr-002',
      first_name: 'Samantha',
      last_name: 'Reyes',
      name: 'Samantha Reyes',
      email: 'samantha.reyes@handilink.org',
      password_hash: defaultPassHash,
      auth_provider: 'local',
      phone: '+63 917 890 1234',
      role: 'creative_director',
      role_title: 'Creative Director & Project Lead',
      community: 'Davao City Hub',
      address: 'Juna Subdivision, Matina, Davao City',
      status: 'Active',
      verified: 1,
      avatar_url: '',
      last_login: '2026-11-13 09:15 AM'
    },
    {
      id: 'usr-003',
      first_name: 'Danica',
      last_name: 'Flores',
      name: 'Engr. Danica Flores',
      email: 'admin@handilink.org',
      password_hash: defaultPassHash,
      auth_provider: 'local',
      phone: '+63 919 456 7890',
      role: 'admin',
      role_title: 'Systems & Association Administrator',
      community: 'Davao City',
      address: 'Toril District Center, Davao City',
      status: 'Active',
      verified: 1,
      avatar_url: '',
      last_login: '2026-11-13 09:28 AM'
    },
    {
      id: 'usr-004',
      first_name: 'Joshua',
      last_name: 'Benitez',
      name: 'Atty. Joshua Benitez',
      email: 'joshua.benitez@ncip.gov.ph',
      password_hash: defaultPassHash,
      auth_provider: 'local',
      phone: '+63 82 297 3412',
      role: 'ncip_secretary',
      role_title: 'NCIP Legal Officer & Evaluation Secretary',
      community: 'NCIP Region XI',
      address: 'MacArthur Highway, Matina, Davao City',
      status: 'Active',
      verified: 1,
      avatar_url: '',
      last_login: '2026-11-12 04:45 PM'
    },
    {
      id: 'usr-005',
      first_name: 'Marc Christopher',
      last_name: 'Tan',
      name: 'Marc Christopher Tan',
      email: 'mctan@atelier-mindanao.ph',
      password_hash: defaultPassHash,
      auth_provider: 'local',
      phone: '+63 918 234 5678',
      role: 'fashion_designer',
      role_title: 'Collaborating Fashion Designer',
      community: 'Atelier Mindanao',
      address: 'Lanang Premier Complex, Davao City',
      status: 'Active',
      verified: 1,
      avatar_url: '',
      last_login: '2026-11-12 02:10 PM'
    },
    {
      id: 'usr-006',
      first_name: 'Maria Teresa',
      last_name: 'Santos',
      name: 'Atty. Maria Teresa Santos',
      email: 'm.santos@mindanaolegal.org',
      password_hash: defaultPassHash,
      auth_provider: 'local',
      phone: '+63 917 554 2390',
      role: 'customer',
      role_title: 'Cultural Advocate & Customer',
      community: 'Davao City',
      address: 'Unit 14B, Pryce Tower, Bajada, Davao City',
      status: 'Active',
      verified: 1,
      avatar_url: '',
      last_login: '2026-11-13 07:45 AM'
    },
    {
      id: 'usr-007',
      first_name: 'Marisol',
      last_name: 'Tuling',
      name: 'Marisol Tuling',
      email: 'marisol.tuling@bibatawa.org',
      password_hash: defaultPassHash,
      auth_provider: 'local',
      phone: '+63 935 812 9901',
      role: 'artisan_weaver',
      role_title: 'Apprentice Weaver (Awaiting Verification)',
      community: 'Binugao, Toril, Davao City',
      address: 'Purok 2, Brgy. Binugao, Toril District, Davao City',
      status: 'Pending',
      verified: 0,
      avatar_url: '',
      last_login: 'Never'
    }
  ];

  const insertPatterns = db.prepare(`
    INSERT INTO patterns (id, code, name, cultural_origin, description, associated_product, image_url, symbolism, complexity, fpic_verified)
    VALUES (@id, @code, @name, @cultural_origin, @description, @associated_product, @image_url, @symbolism, @complexity, @fpic_verified)
  `);

  const seedPatterns = [
    {
      id: 'pat-001',
      code: 'PAT-BNT-01',
      name: 'Binituwon (Constellation of Stars)',
      cultural_origin: 'Binugao Sacred Tradition',
      description: 'Diamond grid motifs with radiating crossed star points, signifying nocturnal navigation, ancestral wisdom, and hope.',
      associated_product: 'Master Inabal Cloth & Modern Vest',
      image_url: '/src/assets/images/product_inabal_textile_1793698251207.jpg',
      symbolism: 'Starlight guiding the weavers through spiritual balance and clarity.',
      complexity: 'Master Weaver',
      fpic_verified: 1
    },
    {
      id: 'pat-002',
      code: 'PAT-BBY-02',
      name: 'Binubaya (Crocodile Diamond)',
      cultural_origin: 'Bagobo Foothill Lineage',
      description: 'Interlocking zigzag lozenges representing the strength, sacred guardian spirit, and ferocity of the river crocodile.',
      associated_product: 'Tanggo Ceremony Blouse',
      image_url: '/src/assets/images/product_tanggo_blouse_1793698252532.jpg',
      symbolism: 'Protection, warding off malevolence during journeys.',
      complexity: 'High',
      fpic_verified: 1
    },
    {
      id: 'pat-003',
      code: 'PAT-KNR-03',
      name: 'Kinara (Mountain Ridges)',
      cultural_origin: 'Mount Apo Sanctuary',
      description: 'Continuous chevron peaks mirroring the majestic ridgelines of Mount Apo (Sandawa), sacred home of the ancestors.',
      associated_product: 'Shoulder Bags & Runners',
      image_url: '/src/assets/images/product_beaded_bag_1793698252560.jpg',
      symbolism: 'Perseverance, altitude, and grounded heritage.',
      complexity: 'Medium',
      fpic_verified: 1
    },
    {
      id: 'pat-004',
      code: 'PAT-MNT-04',
      name: 'Minata (Ancestral Eye)',
      cultural_origin: 'Toril Weaving Sanctuary',
      description: 'Concentric rhomboid beadwork clusters centered with golden glass accents that mimic vigilant ancestral eyes.',
      associated_product: 'Bongat Headdress & Chokers',
      image_url: '/src/assets/images/product_beaded_bag_1793698252560.jpg',
      symbolism: 'Vigilance, discernment, and cultural pride.',
      complexity: 'High',
      fpic_verified: 1
    }
  ];

  const insertProducts = db.prepare(`
    INSERT INTO products (id, code, name, category, price, stock, artisan_id, artisan, community, description, cultural_story, materials, pattern_id, pattern, craft_type, status, image_url, featured)
    VALUES (@id, @code, @name, @category, @price, @stock, @artisan_id, @artisan, @community, @description, @cultural_story, @materials, @pattern_id, @pattern, @craft_type, @status, @image_url, @featured)
  `);

  const seedProducts = [
    {
      id: 'prod-001',
      code: 'INB-2026-01',
      name: 'Master Inabal Abaca Cloth (Binituwon Motif)',
      category: 'Textiles',
      price: 8500,
      stock: 14,
      artisan_id: 'usr-001',
      artisan: 'Bae Salome Linganay',
      community: 'Binugao, Toril, Davao City',
      description: 'An heirloom-grade Inabal textile handwoven on a traditional backstrap loom utilizing hand-stripped abaca fiber and dyed with natural plant extracts.',
      cultural_story: 'Inabal is the sacred cloth of the Bagobo-Tagabawa people. Woven only when an artisan feels spiritual alignment, the Binituwon (star) pattern represents ancestral guidance, high honor, and interconnectedness with Mount Apo.',
      materials: JSON.stringify(['Natural Abaca (Musa textilis)', 'Kagon root dye (red)', 'Morinda root dye', 'Charcoal earth pigments']),
      pattern_id: 'pat-001',
      pattern: 'Binituwon (Constellation of Stars)',
      craft_type: 'Backstrap Loom Inabal',
      status: 'Published',
      image_url: '/src/assets/images/product_inabal_textile_1793698251207.jpg',
      featured: 1
    },
    {
      id: 'prod-002',
      code: 'BDG-2026-04',
      name: 'Traditional Tanggo Beaded Ceremony Blouse',
      category: 'Apparel',
      price: 12800,
      stock: 6,
      artisan_id: 'usr-001',
      artisan: 'Bae Carmelita Omba',
      community: 'Binugao, Toril, Davao City',
      description: 'Bespoke hand-embroidered and beaded garment featuring solid seed beading (Pangulambong), tiny cast brass bells (Tungkaling), and tailored indigenous geometry.',
      cultural_story: 'Worn during ancestral gatherings and peace pacts, each beaded motif symbolizes protection against negative spirits. The gentle ring of the brass bells announces the arrival of a respected community leader.',
      materials: JSON.stringify(['Cotton-linen blend foundation', 'Glass seed beads', 'Tungkaling cast brass bells', 'Waxed cotton threading']),
      pattern_id: 'pat-002',
      pattern: 'Binubaya (Sacred Crocodile Diamond)',
      craft_type: 'Beadwork & Brass',
      status: 'Published',
      image_url: '/src/assets/images/product_tanggo_blouse_1793698252532.jpg',
      featured: 1
    },
    {
      id: 'prod-003',
      code: 'BAG-2026-09',
      name: 'Inabal & Brass Tassel Artisan Shoulder Bag',
      category: 'Accessories',
      price: 3650,
      stock: 22,
      artisan_id: 'usr-001',
      artisan: 'Lourdes Dumigsi',
      community: 'Binugao, Toril, Davao City',
      description: 'Compact contemporary sling bag lined with vegetable-tanned leather edges, handwoven Inabal fabric flap, and genuine brass seed beads.',
      cultural_story: 'Crafted as a versatile companion piece that brings indigenous artistry into everyday sustainable urban life, bridging rural indigenous cooperatives with cultural advocates.',
      materials: JSON.stringify(['Handwoven Inabal fabric', 'Vegetable-tanned full leather', 'Cast brass toggle', 'Cotton canvas lining']),
      pattern_id: 'pat-003',
      pattern: 'Kinara (Chevron Mountain Ranges)',
      craft_type: 'Backstrap Loom Inabal',
      status: 'Published',
      image_url: '/src/assets/images/product_beaded_bag_1793698252560.jpg',
      featured: 1
    },
    {
      id: 'prod-004',
      code: 'ACC-2026-12',
      name: 'Bongat Beaded Headdress & Choker Set',
      category: 'Accessories',
      price: 2400,
      stock: 18,
      artisan_id: 'usr-001',
      artisan: 'Elena Mansumandig',
      community: 'Binugao, Toril, Davao City',
      description: 'Traditional Bagobo-Tagabawa ceremonial headband and neck adornment hand-strung using micro-seed beads in ancestral crimson, gold, and obsidian hues.',
      cultural_story: 'The beaded neckwear represents grace and familial pride. Younger women learn this delicate beading from elder aunties during communal afternoon weaving circles in the Binugao center.',
      materials: JSON.stringify(['Grade-A Seed Beads', 'Reinforced synthetic filament', 'Hand-hammered brass clasps']),
      pattern_id: 'pat-004',
      pattern: 'Minata (All-Seeing Ancestral Eye)',
      craft_type: 'Beadwork & Brass',
      status: 'Published',
      image_url: '/src/assets/images/product_beaded_bag_1793698252560.jpg',
      featured: 1
    },
    {
      id: 'prod-005',
      code: 'TXT-2026-05',
      name: 'Living Heritage Table Runner (1.8m Inabal)',
      category: 'Home Decor',
      price: 4900,
      stock: 15,
      artisan_id: 'usr-001',
      artisan: 'Bae Salome Linganay',
      community: 'Binugao, Toril, Davao City',
      description: 'Long table runner woven on backstrap loom with natural dyed brown-red tones and fringe ends, adding warmth and heritage to dining and office spaces.',
      cultural_story: 'The horizontal stripes alternating with diamond ikat blocks mark the four seasonal agricultural cycles of the Bagobo foothills.',
      materials: JSON.stringify(['Sun-bleached Abaca', 'Morinda plant extract', 'Bark tannin dye']),
      pattern_id: 'pat-001',
      pattern: 'Tinanggi (Rice Harvest Rows)',
      craft_type: 'Backstrap Loom Inabal',
      status: 'Published',
      image_url: '/src/assets/images/product_inabal_textile_1793698251207.jpg',
      featured: 0
    },
    {
      id: 'prod-006',
      code: 'APP-2026-08',
      name: 'Modern Inabal Tailored Vest (Unisex)',
      category: 'Apparel',
      price: 7200,
      stock: 8,
      artisan_id: 'usr-001',
      artisan: 'Bae Carmelita Omba & Partner Tailors',
      community: 'Binugao, Toril, Davao City',
      description: 'Contemporary structured vest featuring authentic backstrap Inabal center panels and breathable premium cotton twill backing.',
      cultural_story: 'A pioneering collaboration between BIBATAWA master weavers and ethical fashion designers to create formal business wear that carries indigenous identity with honor.',
      materials: JSON.stringify(['Bagobo Inabal Abaca Panel', 'Heavy Cotton Twill', 'Coconut Shell Buttons']),
      pattern_id: 'pat-001',
      pattern: 'Binituwon & Kinara Hybrid',
      craft_type: 'Hand Embroidery',
      status: 'Published',
      image_url: '/src/assets/images/product_tanggo_blouse_1793698252532.jpg',
      featured: 1
    }
  ];

  const insertMaterials = db.prepare(`
    INSERT INTO materials (id, code, name, unit, current_stock, minimum_stock, status, category, unit_cost, last_updated)
    VALUES (@id, @code, @name, @unit, @current_stock, @minimum_stock, @status, @category, @unit_cost, @last_updated)
  `);

  const seedMaterials = [
    { id: 'mat-001', code: 'MAT-FBR-01', name: 'First-Class Stripped Abaca (Musa textilis)', unit: 'Kilograms', current_stock: 145, minimum_stock: 40, status: 'Available', category: 'Natural Fiber', unit_cost: 380, last_updated: '2026-11-12' },
    { id: 'mat-002', code: 'MAT-DYE-02', name: 'Kagon Root Extract (Sacred Red Dye)', unit: 'Liters', current_stock: 12, minimum_stock: 25, status: 'Low Stock', category: 'Organic Dye', unit_cost: 850, last_updated: '2026-11-11' },
    { id: 'mat-003', code: 'MAT-DYE-03', name: 'Morinda Citrifolia Bark Extract (Deep Maroon)', unit: 'Liters', current_stock: 34, minimum_stock: 20, status: 'Available', category: 'Organic Dye', unit_cost: 650, last_updated: '2026-11-08' },
    { id: 'mat-004', code: 'MAT-BED-04', name: 'Japanese Micro Seed Beads (Crimson 11/0)', unit: 'Grams', current_stock: 8200, minimum_stock: 2500, status: 'Available', category: 'Seed Beads', unit_cost: 1.8, last_updated: '2026-11-13' },
    { id: 'mat-005', code: 'MAT-BRS-05', name: 'Tungkaling Cast Brass Bells (Traditional)', unit: 'Pieces', current_stock: 85, minimum_stock: 150, status: 'Low Stock', category: 'Brass Elements', unit_cost: 45, last_updated: '2026-11-10' },
    { id: 'mat-006', code: 'MAT-LOM-06', name: 'Tension Backstrap Loom Hardwood Battens', unit: 'Sets', current_stock: 0, minimum_stock: 5, status: 'Out of Stock', category: 'Loom Hardware', unit_cost: 1800, last_updated: '2026-11-02' }
  ];

  const insertProposals = db.prepare(`
    INSERT INTO proposals (id, proposal_number, date, person_involved, organization, address, subject, letter_content, status, submitted_by_id, submitted_by, submitted_date, target_community, signature, supporting_documents, evaluation_remarks, evaluated_by_id, evaluated_by, evaluation_date)
    VALUES (@id, @proposal_number, @date, @person_involved, @organization, @address, @subject, @letter_content, @status, @submitted_by_id, @submitted_by, @submitted_date, @target_community, @signature, @supporting_documents, @evaluation_remarks, @evaluated_by_id, @evaluated_by, @evaluation_date)
  `);

  const seedProposals = [
    {
      id: 'prop-001',
      proposal_number: 'BIB-PROP-2026-003',
      date: '2026-10-24',
      person_involved: 'Regional Director Cristito M. Dagadas',
      organization: 'National Commission on Indigenous Peoples (NCIP Region XI)',
      address: 'NCIP Regional Office XI, MacArthur Highway, Matina, Davao City',
      subject: 'Endorsement & Partnership Resolution for BIBATAWA Handwoven Inabal Export Line',
      letter_content: 'Dear Regional Director Dagadas,\n\nThe Binugao Bagobo-Tagabawa Women Weavers Association (BIBATAWA) respectfully submits this formal proposal for institutional endorsement and Free and Prior Informed Consent (FPIC) certification for our Handwoven Inabal Ethical Cultural Export line.\n\nOur objective is to expand livelihood opportunities for 38 master women weavers and apprentices while establishing strict FPIC safeguards preventing cultural misappropriation.',
      status: 'Approved',
      submitted_by_id: 'usr-002',
      submitted_by: 'Samantha Reyes',
      submitted_date: '2026-10-24',
      target_community: 'Binugao Ancestral Domain, Toril District',
      signature: 'Bae Carmelita Omba & Samantha Reyes',
      supporting_documents: JSON.stringify(['BIBATAWA_Community_Charter_2026.pdf', 'Ancestral_Domain_Council_Resolution_No12.pdf']),
      evaluation_remarks: 'Unanimously approved under NCIP Administrative Order No. 3. Fair-trade pricing and copyright integrity fully vetted and compliant.',
      evaluated_by_id: 'usr-004',
      evaluated_by: 'Atty. Joshua Benitez',
      evaluation_date: '2026-10-29'
    },
    {
      id: 'prop-002',
      proposal_number: 'BIB-PROP-2026-004',
      date: '2026-11-05',
      person_involved: 'Director Rosalinda Tan',
      organization: 'Department of Trade and Industry (DTI Region XI)',
      address: 'Mintrade Building, Monteverde Ave, Davao City',
      subject: 'Shared Service Facility (SSF) Upgrade for Natural Dye Extraction & Fiber Processing',
      letter_content: 'Dear Director Tan,\n\nBIBATAWA respectfully requests consideration under the DTI Shared Service Facility (SSF) grant program for natural dye processing vat equipment and ergonomic backstrap loom tension frames.',
      status: 'Under Review',
      submitted_by_id: 'usr-002',
      submitted_by: 'Samantha Reyes',
      submitted_date: '2026-11-05',
      target_community: 'Binugao, Toril Weaving Hub',
      signature: 'Samantha Reyes',
      supporting_documents: JSON.stringify(['Facility_Feasibility_Report.pdf', 'Equipment_Quotation_DTI_Spec.pdf']),
      evaluation_remarks: 'Under preliminary technical inspection with DTI Davao Field Office.',
      evaluated_by_id: '',
      evaluated_by: 'Pending Assignment',
      evaluation_date: ''
    },
    {
      id: 'prop-003',
      proposal_number: 'BIB-PROP-2026-005',
      date: '2026-11-11',
      person_involved: 'Dean Arlene Fernandez',
      organization: 'Philippine Textile Research Institute (DOST-PTRI)',
      address: 'DOST Complex, General Santos Ave, Bicutan, Taguig City',
      subject: 'Standardization and Tensile Testing for Bagobo Abaca Yarn Commercial Grade',
      letter_content: 'Dear Dean Fernandez,\n\nBIBATAWA seeks institutional technical collaboration with DOST-PTRI to conduct laboratory tensile strength testing and colorfastness validation for our naturally dyed abaca yarns.',
      status: 'Submitted',
      submitted_by_id: 'usr-002',
      submitted_by: 'Samantha Reyes',
      submitted_date: '2026-11-11',
      target_community: 'Binugao, Toril, Davao City',
      signature: 'Samantha Reyes',
      supporting_documents: JSON.stringify(['Yarn_Specimen_Batch_A.pdf']),
      evaluation_remarks: '',
      evaluated_by_id: '',
      evaluated_by: '',
      evaluation_date: ''
    }
  ];

  const insertResolution = db.prepare(`
    INSERT INTO partnership_resolutions (id, resolution_number, proposal_id, proposal_number, resolution_date, parties_involved, resolution_content, approval_status, signed_by_ncip, signed_by_bibatawa, signed_by_partner)
    VALUES (@id, @resolution_number, @proposal_id, @proposal_number, @resolution_date, @parties_involved, @resolution_content, @approval_status, @signed_by_ncip, @signed_by_bibatawa, @signed_by_partner)
  `);

  const insertOrder = db.prepare(`
    INSERT INTO orders (id, order_number, date, customer_id, customer_name, customer_email, customer_phone, shipping_address, subtotal, shipping_fee, total, payment_method, payment_status, order_status, production_status, target_completion_date, assigned_artisan, notes, po_number, terms)
    VALUES (@id, @order_number, @date, @customer_id, @customer_name, @customer_email, @customer_phone, @shipping_address, @subtotal, @shipping_fee, @total, @payment_method, @payment_status, @order_status, @production_status, @target_completion_date, @assigned_artisan, @notes, @po_number, @terms)
  `);

  const insertOrderItem = db.prepare(`
    INSERT INTO order_items (id, order_id, product_id, product_code, product_name, quantity, unit, unit_price, amount, pattern)
    VALUES (@id, @order_id, @product_id, @product_code, @product_name, @quantity, @unit, @unit_price, @amount, @pattern)
  `);

  const insertBatch = db.prepare(`
    INSERT INTO production_batches (id, order_id, order_number, product_name, product_code, design_pattern, quantity, start_date, target_completion, status, progress_percentage, assigned_artisan, community_cluster, notes)
    VALUES (@id, @order_id, @order_number, @product_name, @product_code, @design_pattern, @quantity, @start_date, @target_completion, @status, @progress_percentage, @assigned_artisan, @community_cluster, @notes)
  `);

  const insertPayment = db.prepare(`
    INSERT INTO payments (id, order_id, order_number, reference_code, amount, artisan_share, trust_fund_share, payment_method, status, verified_by, verified_at)
    VALUES (@id, @order_id, @order_number, @reference_code, @amount, @artisan_share, @trust_fund_share, @payment_method, @status, @verified_by, @verified_at)
  `);

  const insertShipment = db.prepare(`
    INSERT INTO shipments (id, order_id, order_number, tracking_number, courier, destination, status, estimated_delivery)
    VALUES (@id, @order_id, @order_number, @tracking_number, @courier, @destination, @status, @estimated_delivery)
  `);

  const insertNotification = db.prepare(`
    INSERT INTO notifications (id, target_role, title, message, type, is_read)
    VALUES (@id, @target_role, @title, @message, @type, @is_read)
  `);

  const insertAudit = db.prepare(`
    INSERT INTO audit_logs (id, user_id, user_name, user_role, service_name, action, resource_type, resource_id, details)
    VALUES (@id, @user_id, @user_name, @user_role, @service_name, @action, @resource_type, @resource_id, @details)
  `);

  const runSeed = db.transaction(() => {
    for (const u of seedUsers) insertUser.run(u);
    for (const p of seedPatterns) insertPatterns.run(p);
    for (const prod of seedProducts) insertProducts.run(prod);
    for (const mat of seedMaterials) insertMaterials.run(mat);
    for (const prop of seedProposals) insertProposals.run(prop);

    insertResolution.run({
      id: 'res-001',
      resolution_number: 'NCIP-XI-BIB-RES-2026-018',
      proposal_id: 'prop-001',
      proposal_number: 'BIB-PROP-2026-003',
      resolution_date: '2026-10-30',
      parties_involved: JSON.stringify([
        'National Commission on Indigenous Peoples (NCIP Region XI)',
        'Binugao Bagobo-Tagabawa Women Weavers Association (BIBATAWA)',
        'HandiLink Digital Cultural Commerce Platform'
      ]),
      resolution_content: 'RESOLUTION ADOPTING AND APPROVING THE FORMAL PARTNERSHIP BETWEEN NCIP REGION XI AND BIBATAWA FOR THE DIGITAL PRESERVATION AND COMMERCIAL ETHICS SAFEGUARD OF TRADITIONAL BAGOBO-TAGABAWA TEXTILES.\n\nWHEREAS, the Indigenous Peoples Rights Act (Republic Act 8371) mandates the protection of Community Intellectual Rights and cultural property of Indigenous Cultural Communities;\n\nNOW THEREFORE, BE IT RESOLVED that NCIP Region XI grants full institutional recognition and endorsement to HandiLink as an authorized ethical digital bridge for BIBATAWA cultural goods.',
      approval_status: 'Approved',
      signed_by_ncip: 1,
      signed_by_bibatawa: 1,
      signed_by_partner: 1
    });

    const seedOrders = [
      {
        id: 'ord-1001',
        order_number: 'HL-ORD-2026-0891',
        date: '2026-11-08',
        customer_id: 'usr-006',
        customer_name: 'Atty. Maria Teresa Santos',
        customer_email: 'm.santos@mindanaolegal.org',
        customer_phone: '+63 917 554 2390',
        shipping_address: 'Unit 14B, Pryce Tower, Bajada, Davao City, 8000',
        subtotal: 12150,
        shipping_fee: 250,
        total: 12400,
        payment_method: 'GCash',
        payment_status: 'Paid',
        order_status: 'In Production',
        production_status: 'In Progress',
        target_completion_date: '2026-11-22',
        assigned_artisan: 'Bae Salome Linganay',
        notes: 'Diplomatic gift for ASEAN cultural delegation. Requires authentic certification tag.',
        po_number: 'PO-2026-MLF-04',
        terms: 'Full Prepaid'
      },
      {
        id: 'ord-1002',
        order_number: 'HL-ORD-2026-0892',
        date: '2026-11-10',
        customer_id: 'usr-005',
        customer_name: 'Atelier Mindanao / Marc Christopher Tan',
        customer_email: 'mctan@atelier-mindanao.ph',
        customer_phone: '+63 918 234 5678',
        shipping_address: 'Lanang Premier Complex, Davao City, 8000',
        subtotal: 25600,
        shipping_fee: 400,
        total: 26000,
        payment_method: 'Landbank',
        payment_status: 'Paid',
        order_status: 'Confirmed',
        production_status: 'In Progress',
        target_completion_date: '2026-11-25',
        assigned_artisan: 'Bae Carmelita Omba',
        notes: 'Sizes Medium and Large for gala runway exhibition.',
        po_number: 'PO-2026-ATM-12',
        terms: '50% DP / 50% Delivery'
      },
      {
        id: 'ord-1003',
        order_number: 'HL-ORD-2026-0893',
        date: '2026-11-11',
        customer_id: 'usr-006',
        customer_name: 'Carlos Miguel Alcantara',
        customer_email: 'cm.alcantara@lifestyle.ph',
        customer_phone: '+63 918 349 7721',
        shipping_address: '23 Tamarind Road, Forbes Park, Makati City, Metro Manila',
        subtotal: 9800,
        shipping_fee: 450,
        total: 10250,
        payment_method: 'Maya',
        payment_status: 'Pending',
        order_status: 'Ready',
        production_status: 'Completed',
        target_completion_date: '2026-11-14',
        assigned_artisan: 'Lourdes Dumigsi',
        notes: 'Fragile parcel handling requested.',
        po_number: '',
        terms: 'Prepaid Verification'
      },
      {
        id: 'ord-1004',
        order_number: 'HL-ORD-2026-0894',
        date: '2026-10-28',
        customer_id: 'usr-006',
        customer_name: 'Davao City Tourism Office',
        customer_email: 'tourism@davaocity.gov.ph',
        customer_phone: '+63 82 222 1956',
        shipping_address: 'City Hall Annex Building, Pichon St, Davao City',
        subtotal: 12000,
        shipping_fee: 0,
        total: 12000,
        payment_method: 'Landbank',
        payment_status: 'Paid',
        order_status: 'Completed',
        production_status: 'Completed',
        target_completion_date: '2026-10-31',
        assigned_artisan: 'Elena Mansumandig',
        notes: 'Kadayawan heritage exhibit inventory.',
        po_number: 'PO-GOV-DVO-09',
        terms: 'LGU Net 15'
      }
    ];

    for (const o of seedOrders) insertOrder.run(o);

    insertOrderItem.run({ id: 'oi-1', order_id: 'ord-1001', product_id: 'prod-001', product_code: 'INB-2026-01', product_name: 'Master Inabal Abaca Cloth (Binituwon Motif)', quantity: 1, unit: 'Roll', unit_price: 8500, amount: 8500, pattern: 'Binituwon' });
    insertOrderItem.run({ id: 'oi-2', order_id: 'ord-1001', product_id: 'prod-003', product_code: 'BAG-2026-09', product_name: 'Inabal & Brass Tassel Artisan Shoulder Bag', quantity: 1, unit: 'Piece', unit_price: 3650, amount: 3650, pattern: 'Kinara' });
    insertOrderItem.run({ id: 'oi-3', order_id: 'ord-1002', product_id: 'prod-002', product_code: 'BDG-2026-04', product_name: 'Traditional Tanggo Beaded Ceremony Blouse', quantity: 2, unit: 'Piece', unit_price: 12800, amount: 25600, pattern: 'Binubaya' });
    insertOrderItem.run({ id: 'oi-4', order_id: 'ord-1003', product_id: 'prod-005', product_code: 'TXT-2026-05', product_name: 'Living Heritage Table Runner (1.8m Inabal)', quantity: 2, unit: 'Piece', unit_price: 4900, amount: 9800, pattern: 'Tinanggi' });
    insertOrderItem.run({ id: 'oi-5', order_id: 'ord-1004', product_id: 'prod-004', product_code: 'ACC-2026-12', product_name: 'Bongat Beaded Headdress & Choker Set', quantity: 5, unit: 'Set', unit_price: 2400, amount: 12000, pattern: 'Minata' });

    insertBatch.run({ id: 'bat-001', order_id: 'ord-1001', order_number: 'HL-ORD-2026-0891', product_name: 'Master Inabal Abaca Cloth (Binituwon Motif)', product_code: 'INB-2026-01', design_pattern: 'Binituwon (Star Motif)', quantity: 1, start_date: '2026-11-08', target_completion: '2026-11-22', status: 'In Production', progress_percentage: 50, assigned_artisan: 'Bae Salome Linganay', community_cluster: 'Binugao Center Loom #3', notes: 'Natural red dye bath completed. Weft insertion in progress with star lozenge repeats.' });
    insertBatch.run({ id: 'bat-002', order_id: 'ord-1002', order_number: 'HL-ORD-2026-0892', product_name: 'Traditional Tanggo Beaded Ceremony Blouse', product_code: 'BDG-2026-04', design_pattern: 'Binubaya (Crocodile Diamond)', quantity: 2, start_date: '2026-11-10', target_completion: '2026-11-25', status: 'In Production', progress_percentage: 25, assigned_artisan: 'Bae Carmelita Omba', community_cluster: 'Pangulambong Beading Studio', notes: 'Beading sleeve hemline and sewing brass bell fringes.' });
    insertBatch.run({ id: 'bat-003', order_id: 'ord-1003', order_number: 'HL-ORD-2026-0893', product_name: 'Living Heritage Table Runner (1.8m Inabal)', product_code: 'TXT-2026-05', design_pattern: 'Tinanggi (Harvest Rows)', quantity: 2, start_date: '2026-11-01', target_completion: '2026-11-14', status: 'Completed', progress_percentage: 100, assigned_artisan: 'Lourdes Dumigsi', community_cluster: 'Binugao Center Loom #7', notes: 'Final quality inspection passed. Steam pressed with natural bamboo roller.' });
    insertBatch.run({ id: 'bat-004', order_id: 'ord-1004', order_number: 'HL-ORD-2026-0894', product_name: 'Bongat Beaded Headdress & Choker Set', product_code: 'ACC-2026-12', design_pattern: 'Minata (Ancestral Eye)', quantity: 5, start_date: '2026-10-20', target_completion: '2026-10-31', status: 'Completed', progress_percentage: 100, assigned_artisan: 'Elena Mansumandig', community_cluster: 'Toril Beadwork Circle', notes: 'Completed and delivered to Davao City Tourism Office.' });

    insertPayment.run({ id: 'pay-001', order_id: 'ord-1001', order_number: 'HL-ORD-2026-0891', reference_code: 'GC-9824101', amount: 12400, artisan_share: 10168, trust_fund_share: 2232, payment_method: 'GCash', status: 'Paid', verified_by: 'Engr. Danica Flores', verified_at: '2026-11-08 14:20' });
    insertPayment.run({ id: 'pay-002', order_id: 'ord-1002', order_number: 'HL-ORD-2026-0892', reference_code: 'LBP-442910', amount: 26000, artisan_share: 21320, trust_fund_share: 4680, payment_method: 'Landbank', status: 'Paid', verified_by: 'Engr. Danica Flores', verified_at: '2026-11-10 10:15' });
    insertPayment.run({ id: 'pay-003', order_id: 'ord-1003', order_number: 'HL-ORD-2026-0893', reference_code: 'MY-772189', amount: 10250, artisan_share: 8405, trust_fund_share: 1845, payment_method: 'Maya', status: 'Pending', verified_by: '', verified_at: '' });
    insertPayment.run({ id: 'pay-004', order_id: 'ord-1004', order_number: 'HL-ORD-2026-0894', reference_code: 'LBP-310022', amount: 12000, artisan_share: 9840, trust_fund_share: 2160, payment_method: 'Landbank', status: 'Paid', verified_by: 'Engr. Danica Flores', verified_at: '2026-10-29 11:00' });

    insertShipment.run({ id: 'shp-001', order_id: 'ord-1001', order_number: 'HL-ORD-2026-0891', tracking_number: 'HL-TRK-2026-7712', courier: 'ABest Cultural Parcel', destination: 'Unit 14B, Pryce Tower, Bajada, Davao City', status: 'Preparing', estimated_delivery: '2026-11-24' });
    insertShipment.run({ id: 'shp-002', order_id: 'ord-1002', order_number: 'HL-ORD-2026-0892', tracking_number: 'HL-TRK-2026-7715', courier: 'BIBATAWA Hub Courier', destination: 'Lanang Premier Complex, Davao City', status: 'Preparing', estimated_delivery: '2026-11-26' });
    insertShipment.run({ id: 'shp-003', order_id: 'ord-1003', order_number: 'HL-ORD-2026-0893', tracking_number: 'HL-TRK-2026-7709', courier: 'LBC Express Insured', destination: 'Forbes Park, Makati City, Metro Manila', status: 'In Transit', estimated_delivery: '2026-11-16' });
    insertShipment.run({ id: 'shp-004', order_id: 'ord-1004', order_number: 'HL-ORD-2026-0894', tracking_number: 'HL-TRK-2026-7680', courier: 'BIBATAWA Hub Courier', destination: 'City Hall Annex Building, Davao City', status: 'Delivered', estimated_delivery: '2026-10-31' });

    insertNotification.run({ id: 'notif-001', target_role: 'all', title: 'Partnership Resolution Signed', message: 'NCIP Region XI approved and ratified Partnership Resolution No. 018 for BIBATAWA export operations.', type: 'proposal', is_read: 0 });
    insertNotification.run({ id: 'notif-002', target_role: 'all', title: 'New High-Value Order Received', message: 'Order #HL-ORD-2026-0891 (₱12,400.00) confirmed with full GCash settlement.', type: 'order', is_read: 0 });
    insertNotification.run({ id: 'notif-003', target_role: 'all', title: 'Low Stock Alert: Kagon Red Dye', message: 'Natural plant extract stock is at 12 Liters (below 25 Liters threshold). Harvest scheduled.', type: 'inventory', is_read: 0 });
    insertNotification.run({ id: 'notif-004', target_role: 'admin', title: 'Artisan Registration Pending Verification', message: 'Marisol Tuling submitted artisan weaver registration for Binugao Hub.', type: 'proposal', is_read: 0 });

    insertAudit.run({ id: 'aud-001', user_id: 'usr-004', user_name: 'Atty. Joshua Benitez', user_role: 'ncip_secretary', service_name: 'ProposalComplianceService', action: 'APPROVE_PROPOSAL', resource_type: 'proposal', resource_id: 'prop-001', details: 'Ratified BIB-PROP-2026-003 and issued NCIP-XI-BIB-RES-2026-018' });
    insertAudit.run({ id: 'aud-002', user_id: 'usr-003', user_name: 'Engr. Danica Flores', user_role: 'admin', service_name: 'PaymentTrustService', action: 'VERIFY_PAYMENT', resource_type: 'payment', resource_id: 'pay-002', details: 'Verified ₱26,000.00 Landbank remittance (82% artisan / 18% trust split)' });
  });

  runSeed();
}
