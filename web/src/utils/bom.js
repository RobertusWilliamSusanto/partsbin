// Kalkulator Bill of Materials (BOM) & Kesiapan Rakit (Build Readiness %)
// Rumus di bawah dibuat IDENTIK dengan arsitektur.md bagian 6 dan controller backend:
// - shortage_qty = Math.max(0, quantity_needed - stock_available)
// - is_enough = shortage_qty === 0
// - is_low_stock = stock_available <= min_stock
// - readiness_percent = total_items === 0 ? 0 : Math.round((ready_items_count / total_items) * 100)
// - total_bom_cost = sum(quantity_needed * unit_price)
// - missing_cost = sum(shortage_qty * unit_price)

export function calcBom(items = [], componentsById = {}) {
  const safeItems = Array.isArray(items) ? items : [];
  let totalBomCost = 0;
  let missingCost = 0;
  let readyItemsCount = 0;
  const shoppingList = [];

  const enrichedItems = safeItems.map((item) => {
    const compId = item.component_id;
    // Dukung lookup dari dictionary componentsById atau objek nested item.components / item.component
    const comp =
      componentsById[compId] ||
      item.components ||
      item.component ||
      {};

    const stockAvailable = Number(comp.stock ?? item.stock_available ?? 0);
    const minStock = Number(comp.min_stock ?? item.min_stock ?? 0);
    const unitPrice = Number(comp.unit_price ?? item.unit_price ?? 0);
    const qtyNeeded = Number(item.quantity_needed ?? 1);

    const shortageQty = Math.max(0, qtyNeeded - stockAvailable);
    const isEnough = shortageQty === 0;
    const isLowStock = stockAvailable <= minStock;
    const subtotal = qtyNeeded * unitPrice;

    totalBomCost += subtotal;

    if (isEnough) {
      readyItemsCount += 1;
    } else {
      const shortageCost = shortageQty * unitPrice;
      missingCost += shortageCost;
      shoppingList.push({
        component_id: compId,
        component_name: comp.name || item.component_name || 'Komponen',
        bin_location: comp.bin_location || item.bin_location || '-',
        quantity_needed: qtyNeeded,
        stock_available: stockAvailable,
        shortage_qty: shortageQty,
        unit_price: unitPrice,
        shortage_cost: shortageCost,
      });
    }

    return {
      ...item,
      component_name: comp.name || item.component_name,
      stock_available: stockAvailable,
      unit_price: unitPrice,
      shortage_qty: shortageQty,
      is_enough: isEnough,
      is_low_stock: isLowStock,
      subtotal,
    };
  });

  const totalItems = enrichedItems.length;
  const readinessPercent =
    totalItems === 0 ? 0 : Math.round((readyItemsCount / totalItems) * 100);

  return {
    total_items: totalItems,
    ready_items_count: readyItemsCount,
    readiness_percent: readinessPercent,
    is_ready: readinessPercent === 100 && totalItems > 0,
    total_bom_cost: totalBomCost,
    missing_cost: missingCost,
    shopping_list: shoppingList,
    items: enrichedItems,
  };
}
