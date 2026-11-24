import { getItem, getAll, putItem, deleteItem } from './db';
import { enqueueOp } from './outbox';
import { calcBom } from '../utils/bom';
import { isLowStock } from '../utils/stock';

// Menggabungkan data server dengan perubahan lokal tertunda (Prinsip 7: Overlay)
export async function overlayComponents(serverList) {
  const localList = await getAll('components');
  const allOps = await getAll('outbox');
  const pendingCompOps = allOps.filter((op) => op.entityType === 'component' && op.status === 'pending');
  const pendingIds = new Set(pendingCompOps.map((op) => op.entityId || op.tempId));
  const deletedIds = new Set(
    pendingCompOps.filter((op) => op.method === 'DELETE').map((op) => op.entityId)
  );

  const localMap = new Map(localList.map((c) => [c.id, c]));
  const result = [];

  // Salin entitas server jika tidak dihapus atau tidak sedang diubah offline
  for (const comp of serverList) {
    if (deletedIds.has(comp.id)) continue;
    const local = localMap.get(comp.id);
    const isPending = pendingIds.has(comp.id);
    // Cegah balapan cache Service Worker NetworkFirst (5s) menimpa data lokal yang baru saja disinkronkan
    const isRecentlySynced = local?.syncedAt && Date.now() - local.syncedAt < 15000;

    if (local && (isPending || isRecentlySynced)) {
      result.push(local);
    } else {
      result.push(comp);
      await putItem('components', comp);
    }
  }

  // Tambahkan komponen baru sementara (tmp_*) yang dibuat saat offline
  for (const comp of localList) {
    if (String(comp.id).startsWith('tmp_') && !deletedIds.has(comp.id)) {
      if (!result.some((c) => c.id === comp.id)) {
        result.push(comp);
      }
    }
  }

  return result;
}

// Menggabungkan data proyek server dengan proyek lokal tertunda (Prinsip 7: Overlay)
export async function overlayProjects(serverList) {
  const localList = await getAll('projects');
  const allOps = await getAll('outbox');
  const pendingProjOps = allOps.filter((op) => op.entityType === 'project' && op.status === 'pending');
  const pendingIds = new Set(pendingProjOps.map((op) => op.entityId || op.tempId));
  const deletedIds = new Set(
    pendingProjOps.filter((op) => op.method === 'DELETE').map((op) => op.entityId)
  );

  const localMap = new Map(localList.map((p) => [p.id, p]));
  const result = [];

  for (const proj of serverList) {
    if (deletedIds.has(proj.id)) continue;
    const local = localMap.get(proj.id);
    const isPending = pendingIds.has(proj.id);
    // Cegah balapan cache Service Worker NetworkFirst (5s) menimpa data proyek lokal yang baru saja disinkronkan
    const isRecentlySynced = local?.syncedAt && Date.now() - local.syncedAt < 15000;

    if (local && (isPending || isRecentlySynced)) {
      result.push(local);
    } else {
      // Pertahankan field detail lokal (photos, items) sambil memastikan summary metrik diperbarui dari server
      const merged = local
        ? {
            ...local,
            ...proj,
            photos: local.photos ?? proj.photos,
            items: local.items ?? proj.items,
            summary: local.summary
              ? {
                  ...local.summary,
                  total_items: proj.total_items ?? local.summary.total_items,
                  ready_items_count: proj.ready_items_count ?? local.summary.ready_items_count,
                  readiness_percent: proj.readiness_percent ?? local.summary.readiness_percent,
                  total_bom_cost: proj.total_bom_cost ?? local.summary.total_bom_cost,
                  missing_cost: proj.missing_cost ?? local.summary.missing_cost,
                }
              : proj.summary,
          }
        : proj;
      result.push(merged);
      await putItem('projects', merged);
    }
  }

  for (const proj of localList) {
    if (String(proj.id).startsWith('tmp_') && !deletedIds.has(proj.id)) {
      if (!result.some((p) => p.id === proj.id)) {
        result.push(proj);
      }
    }
  }

  return result;
}

// Penanganan pembuatan komponen baru secara offline dengan ID sementara
export async function offlineCreateComponent(payload) {
  const tempId = `tmp_${typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : ('comp_' + Date.now())}`;
  const newComp = {
    ...payload,
    id: tempId,
    stock: Number(payload.stock ?? 0),
    min_stock: Number(payload.min_stock ?? 2),
    unit_price: Number(payload.unit_price ?? 0),
    // Hitung status stok menipis memakai rumus terpusat isLowStock
    is_low_stock: isLowStock({ stock: payload.stock, min_stock: payload.min_stock }),
    created_at: new Date().toISOString(),
  };
  await putItem('components', newComp);
  await enqueueOp({
    endpoint: '/components',
    method: 'POST',
    entityType: 'component',
    entityId: tempId,
    payload,
    tempId,
  });
  return { data: newComp };
}

// Penanganan pembaruan stok komponen secara offline (optimistis + antre outbox)
export async function offlineUpdateStock(id, nextStock) {
  const comp = (await getItem('components', id)) || { id, stock: 0, min_stock: 2 };
  const updatedComp = {
    ...comp,
    stock: nextStock,
    // Hitung status stok menipis memakai rumus terpusat isLowStock
    is_low_stock: isLowStock({ stock: nextStock, min_stock: comp.min_stock }),
  };
  await putItem('components', updatedComp);
  await enqueueOp({
    endpoint: `/components/${id}/stock`,
    method: 'PATCH',
    entityType: 'component',
    entityId: id,
    payload: { stock: nextStock },
  });
  return { data: updatedComp };
}

// Penanganan pembaruan data spesifikasi komponen secara offline
export async function offlineUpdateComponent(id, payload) {
  const comp = (await getItem('components', id)) || { id };
  const updatedComp = {
    ...comp,
    ...payload,
    // Hitung status stok menipis memakai rumus terpusat isLowStock
    is_low_stock: isLowStock({ stock: payload.stock ?? comp.stock, min_stock: payload.min_stock ?? comp.min_stock }),
  };
  await putItem('components', updatedComp);
  await enqueueOp({
    endpoint: `/components/${id}`,
    method: 'PUT',
    entityType: 'component',
    entityId: id,
    payload,
  });
  return { data: updatedComp };
}

// Penanganan penghapusan komponen secara offline
export async function offlineDeleteComponent(id) {
  await deleteItem('components', id);
  await enqueueOp({
    endpoint: `/components/${id}`,
    method: 'DELETE',
    entityType: 'component',
    entityId: id,
    payload: {},
  });
  return { data: { id } };
}

// Penanganan pembuatan proyek baru beserta BOM secara offline dengan ID sementara
export async function offlineCreateProject(payload) {
  const tempId = `tmp_${typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : ('proj_' + Date.now())}`;
  const allComps = await getAll('components');
  const compMap = Object.fromEntries(allComps.map((c) => [c.id, c]));
  const items = Array.isArray(payload.items) ? payload.items : [];
  const calcResult = calcBom(items, compMap);

  const newProj = {
    id: tempId,
    name: payload.name,
    description: payload.description || '',
    status: payload.status || 'planned',
    image_url: null,
    items: calcResult.items,
    summary: calcResult,
    created_at: new Date().toISOString(),
  };

  await putItem('projects', newProj);
  await enqueueOp({
    endpoint: '/projects',
    method: 'POST',
    entityType: 'project',
    entityId: tempId,
    payload,
    tempId,
  });
  return { data: newProj };
}

// Penanganan penyimpanan berkas blob gambar sampul secara offline ke IndexedDB
export async function offlineSaveProjectImage(projectId, file) {
  // Batasi ukuran gambar maksimal 5 MB untuk mencegah pemborosan kuota penyimpanan
  if (file && file.size > 5 * 1024 * 1024) {
    throw new Error('Ukuran gambar melebihi batas maksimal 5 MB.');
  }
  const blobEntry = {
    id: `blob_${projectId}`,
    projectId,
    file,
    createdAt: new Date().toISOString(),
  };
  await putItem('blobs', blobEntry);
  return { message: 'Gambar sampul disimpan lokal di IndexedDB dan akan diunggah otomatis saat online.' };
}

// Penanganan pengubahan status pengerjaan fisik proyek secara offline
export async function offlineUpdateProjectStatus(id, status) {
  const proj = (await getItem('projects', id)) || { id };
  const updatedProj = { ...proj, status };
  await putItem('projects', updatedProj);
  await enqueueOp({
    endpoint: `/projects/${id}/status`,
    method: 'PATCH',
    entityType: 'project',
    entityId: id,
    payload: { status },
  });
  return { data: updatedProj };
}

// Penanganan pengubahan info proyek (nama/deskripsi) secara offline
export async function offlineUpdateProject(id, payload) {
  const proj = (await getItem('projects', id)) || { id };
  const updatedProj = { ...proj, ...payload };
  await putItem('projects', updatedProj);
  await enqueueOp({
    endpoint: `/projects/${id}`,
    method: 'PUT',
    entityType: 'project',
    entityId: id,
    payload,
  });
  return { data: updatedProj };
}

// Penanganan penghapusan proyek secara offline
export async function offlineDeleteProject(id) {
  await deleteItem('projects', id);
  // Bersihkan berkas blob gambar terkait agar tidak menjadi data yatim di IndexedDB
  await deleteItem('blobs', `blob_${id}`);
  await enqueueOp({
    endpoint: `/projects/${id}`,
    method: 'DELETE',
    entityType: 'project',
    entityId: id,
    payload: {},
  });
  return { data: { id } };
}

// Penanganan penambahan item BOM ke proyek secara offline dengan perhitungan ulang BOM
export async function offlineAddProjectItem(projectId, payload) {
  const proj = (await getItem('projects', projectId)) || { id: projectId, items: [] };
  const comp = await getItem('components', payload.component_id);
  const tempItemId = `tmp_item_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const newItem = {
    id: tempItemId,
    project_id: projectId,
    component_id: payload.component_id,
    quantity_needed: Number(payload.quantity_needed),
    component_name: comp?.name || 'Komponen',
    bin_location: comp?.bin_location || '-',
    stock_available: comp?.stock || 0,
    unit_price: comp?.unit_price || 0,
  };

  const updatedItems = [...(proj.items || []), newItem];
  const allComps = await getAll('components');
  const compMap = Object.fromEntries(allComps.map((c) => [c.id, c]));
  const calcResult = calcBom(updatedItems, compMap);

  const updatedProj = {
    ...proj,
    items: calcResult.items,
    summary: calcResult,
  };
  await putItem('projects', updatedProj);
  await enqueueOp({
    endpoint: `/projects/${projectId}/items`,
    method: 'POST',
    entityType: 'project_item',
    entityId: projectId,
    payload,
  });
  return { data: newItem };
}

// Penanganan penghapusan item BOM dari proyek secara offline
export async function offlineRemoveProjectItem(projectId, itemId) {
  const proj = (await getItem('projects', projectId)) || { id: projectId, items: [] };
  const updatedItems = (proj.items || []).filter((it) => it.id !== itemId);
  const allComps = await getAll('components');
  const compMap = Object.fromEntries(allComps.map((c) => [c.id, c]));
  const calcResult = calcBom(updatedItems, compMap);

  const updatedProj = {
    ...proj,
    items: calcResult.items,
    summary: calcResult,
  };
  await putItem('projects', updatedProj);
  await enqueueOp({
    endpoint: `/projects/${projectId}/items/${itemId}`,
    method: 'DELETE',
    entityType: 'project_item',
    entityId: projectId,
    payload: {},
  });
  return { data: { id: itemId } };
}
