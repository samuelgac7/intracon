/**
 * Servicio de Exportación de Asistencia a Excel
 * Genera archivos Excel con el formato específico de construcción chilena
 */

import ExcelJS from 'exceljs'
import { asistenciaService, asistenciaUtils, DatosExportacionExcel } from './asistencia'

/**
 * Colores exactos del formato de asistencia
 */
const COLORES = {
  OK: { argb: 'FF98FB98' },      // Verde claro
  F: { argb: 'FFFFB6C1' },       // Rosado claro
  J: { argb: 'FFB0E0E6' },       // Celeste pálido
  A: { argb: 'FFFFA07A' },       // Salmón claro
  L: { argb: 'FFFFFACD' },       // Amarillo pálido
  BT: { argb: 'FFE6B0AA' },      // Rosado pastel
  BTR: { argb: 'FFFAE5D3' },     // Beige claro
  R: { argb: 'FFD3D3D3' },       // Gris claro
  HE_50: { argb: 'FFFAB4B4' },   // Rosado pálido para HE 50%
  HE_100: { argb: 'FFD8BFD8' }   // Lila suave para HE 100%
}

/**
 * Generar archivo Excel de asistencia mensual
 */
export async function exportarAsistenciaMensual(
  obraId: number,
  mes: number,
  anio: number,
  nombreObra: string
): Promise<ExcelJS.Buffer> {
  // Obtener datos
  const datos = await asistenciaService.getDatosExcel(obraId, mes, anio)

  if (!datos || datos.length === 0) {
    throw new Error('No hay datos de asistencia para exportar')
  }

  // Crear workbook y worksheet
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet('Asistencia')

  // Configurar página
  worksheet.pageSetup.orientation = 'landscape'
  worksheet.pageSetup.fitToPage = true
  worksheet.pageSetup.fitToWidth = 1
  worksheet.pageSetup.fitToHeight = 0

  // Título
  const nombreMes = asistenciaUtils.getNombreMes(mes)
  worksheet.mergeCells('A1:AP1')
  const tituloCell = worksheet.getCell('A1')
  tituloCell.value = `ASISTENCIA ${nombreMes.toUpperCase()} ${anio} - ${nombreObra.toUpperCase()}`
  tituloCell.font = { bold: true, size: 14 }
  tituloCell.alignment = { horizontal: 'center', vertical: 'middle' }
  worksheet.getRow(1).height = 30

  // Cabeceras principales (fila 2)
  const headerRow = worksheet.getRow(2)
  headerRow.height = 40  // Aumentado para que HE 50% y HE 100% se vean bien

  const headers = ['NOMBRE', 'RUT', 'CARGO']

  // Días del mes
  const diasEnMes = new Date(anio, mes, 0).getDate()
  for (let dia = 1; dia <= diasEnMes; dia++) {
    headers.push(dia.toString().padStart(2, '0'))
  }

  // Totales
  headers.push('OK', 'F', 'J', 'A', 'L', 'BT', 'BTR', 'R', 'HE 50%', 'HE 100%', 'BONO')

  // Aplicar cabeceras
  headers.forEach((header, index) => {
    const cell = headerRow.getCell(index + 1)
    cell.value = header
    cell.font = { bold: true, size: 10 }
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }

    // Índice donde empiezan las columnas de totales (después de días)
    const inicioTotales = 3 + diasEnMes

    // Aplicar color según el tipo de columna
    if (index + 1 > inicioTotales && index + 1 <= inicioTotales + 10) {
      // Es una columna de totales - aplicar color específico
      const estadoKey = header.replace(' ', '_').replace('%', '')
      const colorEstado = COLORES[estadoKey as keyof typeof COLORES]

      if (colorEstado) {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: colorEstado
        }
        cell.font.color = { argb: 'FF000000' } // Texto negro para mejor legibilidad
      } else {
        // Para BONO que no tiene color específico
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF4472C4' }
        }
        cell.font.color = { argb: 'FFFFFFFF' }
      }
    } else {
      // Columnas de información personal y días
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4472C4' }
      }
      cell.font.color = { argb: 'FFFFFFFF' }
    }

    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    }
  })

  // Configurar anchos de columna
  worksheet.getColumn(1).width = 30  // NOMBRE
  worksheet.getColumn(2).width = 12  // RUT
  worksheet.getColumn(3).width = 20  // CARGO

  // Columnas de días (más estrechas)
  for (let i = 4; i <= 3 + diasEnMes; i++) {
    worksheet.getColumn(i).width = 4
  }

  // Columnas de totales
  for (let i = 4 + diasEnMes; i <= headers.length; i++) {
    worksheet.getColumn(i).width = 6
  }

  // Datos de trabajadores
  let currentRow = 3
  datos.forEach(trabajador => {
    const row = worksheet.getRow(currentRow)
    row.height = 20

    // Información del trabajador
    row.getCell(1).value = trabajador.nombre
    row.getCell(2).value = trabajador.rut
    row.getCell(3).value = trabajador.cargo

    // Aplicar estilos a columnas de info
    for (let col = 1; col <= 3; col++) {
      const cell = row.getCell(col)
      cell.alignment = { horizontal: 'left', vertical: 'middle' }
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      }
    }

    // Días del mes
    const diasMap = new Map(trabajador.dias.map(d => [d.dia, d]))

    for (let dia = 1; dia <= diasEnMes; dia++) {
      const diaData = diasMap.get(dia)
      const cell = row.getCell(3 + dia)

      if (diaData && diaData.estado) {
        // Si hay horas extras, mostrar el número
        if (diaData.he_50 > 0) {
          cell.value = diaData.he_50
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: COLORES.HE_50
          }
        } else if (diaData.he_100 > 0) {
          cell.value = diaData.he_100
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: COLORES.HE_100
          }
        } else {
          // Solo mostrar estado
          cell.value = diaData.estado
          const colorEstado = COLORES[diaData.estado as keyof typeof COLORES]
          if (colorEstado) {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: colorEstado
            }
          }
        }

        cell.font = { bold: true, size: 9 }
      }

      cell.alignment = { horizontal: 'center', vertical: 'middle' }
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      }
    }

    // Totales
    const totalesData = [
      trabajador.total_ok,
      trabajador.total_f,
      trabajador.total_j,
      trabajador.total_a,
      trabajador.total_l,
      trabajador.total_bt,
      trabajador.total_btr,
      trabajador.total_r,
      trabajador.total_he_50,
      trabajador.total_he_100,
      0 // BONO - calcular según lógica de negocio
    ]

    totalesData.forEach((valor, index) => {
      const cell = row.getCell(4 + diasEnMes + index)
      cell.value = valor
      cell.alignment = { horizontal: 'center', vertical: 'middle' }
      cell.font = { bold: true }
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      }

      // Color de fondo para columnas de totales
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE7E6E6' }
      }
    })

    currentRow++
  })

  // Leyenda al final
  const leyendaRow = currentRow + 2
  worksheet.mergeCells(`A${leyendaRow}:D${leyendaRow}`)
  const leyendaCell = worksheet.getCell(`A${leyendaRow}`)
  leyendaCell.value = 'LEYENDA:'
  leyendaCell.font = { bold: true, size: 11 }

  const leyendaItems = [
    { estado: 'OK', descripcion: 'Asistencia', color: COLORES.OK },
    { estado: 'F', descripcion: 'Falta', color: COLORES.F },
    { estado: 'J', descripcion: 'Justificativo', color: COLORES.J },
    { estado: 'A', descripcion: 'Accidente Laboral', color: COLORES.A },
    { estado: 'L', descripcion: 'Licencia', color: COLORES.L },
    { estado: 'BT', descripcion: 'Bajada Tomada', color: COLORES.BT },
    { estado: 'BTR', descripcion: 'Bajada Trabajada', color: COLORES.BTR },
    { estado: 'R', descripcion: 'Renuncia', color: COLORES.R },
    { estado: 'HE 50%', descripcion: 'Horas Extra 50%', color: COLORES.HE_50 },
    { estado: 'HE 100%', descripcion: 'Horas Extra 100%', color: COLORES.HE_100 }
  ]

  let leyendaItemRow = leyendaRow + 1
  leyendaItems.forEach(item => {
    const row = worksheet.getRow(leyendaItemRow)

    // Celda con color
    const colorCell = row.getCell(1)
    colorCell.value = item.estado
    colorCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: item.color
    }
    colorCell.font = { bold: true }
    colorCell.alignment = { horizontal: 'center', vertical: 'middle' }
    colorCell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    }

    // Descripción
    worksheet.mergeCells(`B${leyendaItemRow}:D${leyendaItemRow}`)
    const descCell = row.getCell(2)
    descCell.value = item.descripcion
    descCell.alignment = { horizontal: 'left', vertical: 'middle' }

    leyendaItemRow++
  })

  // Nota de horas extras
  const notaHERow = leyendaItemRow + 1
  worksheet.mergeCells(`A${notaHERow}:G${notaHERow}`)
  const notaHECell = worksheet.getCell(`A${notaHERow}`)
  notaHECell.value = 'NOTA: Los números en las celdas indican horas extras trabajadas'
  notaHECell.font = { italic: true, size: 9 }
  notaHECell.alignment = { horizontal: 'left', vertical: 'middle' }

  // Generar buffer
  const buffer = await workbook.xlsx.writeBuffer()
  return buffer as ExcelJS.Buffer
}

/**
 * Exportar y descargar en el navegador
 */
export async function descargarAsistenciaExcel(
  obraId: number,
  mes: number,
  anio: number,
  nombreObra: string
) {
  const buffer = await exportarAsistenciaMensual(obraId, mes, anio, nombreObra)

  // Crear blob y descargar
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  })

  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url

  const nombreMes = asistenciaUtils.getNombreMes(mes)
  link.download = `Asistencia_${nombreObra.replace(/\s+/g, '_')}_${nombreMes}_${anio}.xlsx`

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

export default {
  exportarAsistenciaMensual,
  descargarAsistenciaExcel
}
