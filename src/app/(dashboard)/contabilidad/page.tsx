import EnDesarrollo from "@/components/EnDesarrollo"

export default function ContabilidadPage() {
  return (
    <EnDesarrollo
      modulo="Contabilidad"
      descripcion="Sistema contable completo con plan de cuentas, libros y reportes tributarios."
      caracteristicas={[
        "Libro diario y mayor",
        "Plan de cuentas personalizable",
        "Conciliaciones bancarias",
        "Declaraciones tributarias (F29, F50)",
        "Centralizaciones por obra",
        "Balance y Estado de Resultados",
        "Integración con SII"
      ]}
    />
  )
}
