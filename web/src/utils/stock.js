// Rumus status stok menipis sesuai logika server componentController.js:27
export function isLowStock(component) {
  if (!component) return false;
  const stock = Number(component.stock ?? 0);
  const minStock = Number(component.min_stock ?? 2);
  return stock <= minStock;
}
