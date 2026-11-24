// In-memory cache terpusat (pola stale-while-revalidate tanpa library tambahan)
// Kenapa dipusatkan di satu file? Agar invalidasi lintas-hook (Komponen <-> Proyek BOM)
// terjadi otomatis tanpa risiko circular import maupun angka Readiness % yang usang.

let componentsListCache = null;
const componentDetailCache = new Map();
// Set penyimpan fungsi pendengar (listener) perubahan cache data komponen
const componentListeners = new Set();

// Daftarkan listener baru dan kembalikan fungsi pembersih (unsubscribe)
export function subscribeComponents(fn) {
  componentListeners.add(fn);
  return () => componentListeners.delete(fn);
}

// Beri tahu seluruh listener yang berlangganan saat cache komponen dimutasi
function notifyComponents() {
  componentListeners.forEach((fn) => {
    try {
      fn();
    } catch (e) {
      console.warn('Komponen listener gagal:', e);
    }
  });
}

let projectsListCache = null;
const projectDetailCache = new Map();

export function getComponentsListCache() {
  return componentsListCache;
}

export function setComponentsListCache(list) {
  componentsListCache = list;
  notifyComponents();
}

export function getComponentDetailCache(id) {
  return id ? componentDetailCache.get(id) ?? null : null;
}

export function setComponentDetailCache(id, data) {
  if (id && data) componentDetailCache.set(id, data);
}

export function getProjectsListCache() {
  return projectsListCache;
}

export function setProjectsListCache(list) {
  projectsListCache = list;
}

export function getProjectDetailCache(id) {
  return id ? projectDetailCache.get(id) ?? null : null;
}

export function setProjectDetailCache(id, data) {
  if (id && data) projectDetailCache.set(id, data);
}

// Setiap mutasi komponen (tambah, edit, hapus, atau stepper stok) otomatis meng-invalidasi
// cache proyek karena readiness_percent dan shopping_list proyek bergantung pada stok/harga komponen.
export function invalidateComponentsCache(id, { cascadeProjects = true } = {}) {
  componentsListCache = null;
  if (id) {
    componentDetailCache.delete(id);
  } else {
    componentDetailCache.clear();
  }

  if (cascadeProjects) {
    projectsListCache = null;
    projectDetailCache.clear();
  }
  notifyComponents();
}

export function updateComponentInCache(updatedComp) {
  if (!updatedComp?.id) return;
  if (Array.isArray(componentsListCache)) {
    componentsListCache = componentsListCache.map((item) =>
      item.id === updatedComp.id ? { ...item, ...updatedComp } : item
    );
  }
  const existingDetail = componentDetailCache.get(updatedComp.id);
  if (existingDetail) {
    componentDetailCache.set(updatedComp.id, { ...existingDetail, ...updatedComp });
  }

  // Wajib invalidasi seluruh cache proyek agar Build Readiness % & Daftar Belanja langsung segar
  projectsListCache = null;
  projectDetailCache.clear();
  notifyComponents();
}

// Setiap mutasi proyek atau item BOM otomatis meng-invalidasi cache detail komponen
// karena properti `used_in_projects` pada detail komponen ikut berubah.
export function invalidateProjectsCache(id, { cascadeComponents = true } = {}) {
  projectsListCache = null;
  if (id) {
    projectDetailCache.delete(id);
  } else {
    projectDetailCache.clear();
  }

  if (cascadeComponents) {
    componentDetailCache.clear();
  }
}
