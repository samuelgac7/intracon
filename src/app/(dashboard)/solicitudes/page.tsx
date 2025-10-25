import EnDesarrollo from "@/components/EnDesarrollo"

export default function SolicitudesPage() {
  return (
    <EnDesarrollo
      modulo="Solicitudes"
      descripcion="Sistema de gestión de solicitudes internas, aprobaciones y workflow de documentos."
      caracteristicas={[
        "Solicitudes de materiales",
        "Permisos y autorizaciones",
        "Workflow de aprobaciones",
        "Solicitudes de vacaciones",
        "Requerimientos de obra",
        "Estado y seguimiento",
        "Notificaciones automáticas"
      ]}
    />
  )
}
