import EnDesarrollo from "@/components/EnDesarrollo"

export default function FinanzasPage() {
  return (
    <EnDesarrollo
      modulo="Finanzas"
      descripcion="Control financiero integral de obras, flujo de caja y rentabilidad del negocio."
      caracteristicas={[
        "Dashboard financiero con KPIs",
        "Flujo de caja por obra",
        "Estados de pago y cobranzas",
        "Análisis de rentabilidad",
        "Presupuesto vs Real",
        "Proyecciones financieras",
        "Reportes contables"
      ]}
    />
  )
}
