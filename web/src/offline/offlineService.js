import { getItem, getAll, putItem, deleteItem } from './db';
import { enqueueOp } from './outbox';
import { calcBom } from '../utils/bom';

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
    if (pendingIds.has(comp.id) && localMap.has(comp.id)) {
      result.push(localMap.get(comp.id));
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
    if (pendingIds.has(proj.id) && localMap.has(proj.id)) {
      result.push(localMap.get(proj.id));
    } else {
      result.push(proj);
      await putItem('projects', proj);
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
    is_low_stock: Number(payload.stock ?? 0) <= Number(payload.min_stock ?? 2),
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
    is_low_stock: nextStock <= Number(comp.min_stock ?? 2),
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
    is_low_stock: Number(payload.stock ?? comp.stock) <= Number(payload.min_stock ?? comp.min_stock),
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
