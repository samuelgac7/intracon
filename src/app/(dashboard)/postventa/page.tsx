import EnDesarrollo from "@/components/EnDesarrollo"

export default function PostVentaPage() {
  return (
    <EnDesarrollo
      modulo="Post-Venta"
      descripcion="Gestión de garantías, reclamos y mantención post-entrega de obras."
      caracteristicas={[
        "Registro de garantías por obra",
        "Tickets de reclamos y solicitudes",
        "Seguimiento de mantenciones",
        "Calendario de inspecciones",
        "Histórico de intervenciones",
        "Satisfacción del cliente",
        "Gestión de requerimientos"
      ]}
    />
  )
}
