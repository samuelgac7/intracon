import EnDesarrollo from "@/components/EnDesarrollo"

export default function AdquisicionesPage() {
  return (
    <EnDesarrollo
      modulo="Adquisiciones"
      descripcion="Gestión completa de compras, proveedores y control de inventario para obras."
      caracteristicas={[
        "Gestión de proveedores y catálogos",
        "Órdenes de compra y cotizaciones",
        "Control de stock y materiales",
        "Seguimiento de entregas",
        "Análisis de costos por proveedor",
        "Historial de compras por obra"
      ]}
    />
  )
}
