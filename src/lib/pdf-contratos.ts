// src/lib/pdf-contratos.ts

import type { Contrato } from '@/services/contratos'

// =====================================================
// TIPOS PARA GENERACIÓN DE PDFs
// =====================================================

interface DatosContratoPDF {
  // Empresa
  razonSocial: string
  rutEmpresa: string
  representanteLegal: string
  rutRepresentante: string
  domicilioEmpresa: string
  
  // Trabajador
  nombreTrabajador: string
  rutTrabajador: string
  nacionalidad: string
  fechaNacimiento: string
  estadoCivil: string
  domicilioTrabajador: string
  
  // Obra
  nombreObra: string
  ubicacionObra: string
  ciudadContrato: string
  
  // Cargo y remuneración
  cargo: string
  salarioBase: number
  salarioPalabras: string
  supleQuincenal: number
  suplePalabras: string
  
  // Previsión
  afp: string
  prevision: string
  isapre?: string
  
  // Jornada
  jornada: 'estandar' | 'especial'
  jornadaDetalle?: string
  
  // Fechas y duración
  fechaContrato: string
  fechaInicio: string
  fechaTermino?: string
  tipoContrato: 'indefinido' | 'plazo-fijo'
  
  // Número de contrato
  numeroContrato: string
}

interface DatosAnexoExtensionPDF {
  // Contrato padre
  numeroContratoPadre: string
  fechaContratoPadre: string
  
  // Trabajador
  nombreTrabajador: string
  rutTrabajador: string
  
  // Obra
  nombreObra: string
  
  // Nueva fecha
  nuevaFechaTermino: string
  
  // Metadata
  ciudadAnexo: string
  fechaAnexo: string
  numeroAnexo: string
}

// =====================================================
// GENERADOR DE PDF - CONTRATO COMPLETO
// =====================================================

export async function generarPDFContrato(datos: DatosContratoPDF): Promise<Blob> {
  const { jsPDF } = await import('jspdf')
  
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'letter' // 215.9 x 279.4 mm
  })
  
  const pageWidth = doc.internal.pageSize.getWidth()
  const marginLeft = 20
  const marginRight = 20
  const contentWidth = pageWidth - marginLeft - marginRight
  let y = 20
  
  // ===== TÍTULO =====
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  const titulo = 'Contrato de Trabajo para la Construcción'
  const tituloWidth = doc.getTextWidth(titulo)
  doc.text(titulo, (pageWidth - tituloWidth) / 2, y)
  y += 10
  
  // ===== ENCABEZADO =====
  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  
  const encabezado = `En ${datos.ciudadContrato}, a ${formatearFechaTexto(datos.fechaContrato)}. entre la Empresa Constructora ${datos.razonSocial}, R.U.T. ${datos.rutEmpresa}, representada legalmente para estos efectos por Don ${datos.representanteLegal} R.U.T. ${datos.rutRepresentante}, en delante el Empleador, con domicilio en ${datos.domicilioEmpresa}, y el señor ${datos.nombreTrabajador}, R.U.T. ${datos.rutTrabajador}, de nacionalidad ${datos.nacionalidad}, fecha de nacimiento ${datos.fechaNacimiento}, estado civil ${datos.estadoCivil}, con domicilio para estos efectos en ${datos.domicilioTrabajador}, en adelante el trabajador, quienes vienen a celebrar el presente contrato de trabajo:`
  
  const lineasEncabezado = doc.splitTextToSize(encabezado, contentWidth)
  doc.text(lineasEncabezado, marginLeft, y)
  y += lineasEncabezado.length * 5 + 5
  
  // ===== CLÁUSULA PRIMERA =====
  doc.setFont('helvetica', 'bold')
  doc.text('PRIMERO:', marginLeft, y)
  doc.setFont('helvetica', 'normal')
  
  const clausula1 = ` El trabajador se desempeñará como ${datos.cargo.toUpperCase()} en la obra denominada ${datos.nombreObra}, ubicada en ${datos.ubicacionObra}.`
  const lineas1 = doc.splitTextToSize(clausula1, contentWidth - 30)
  doc.text(lineas1, marginLeft + 30, y)
  y += lineas1.length * 5 + 5
  
  // ===== CLÁUSULA SEGUNDA =====
  doc.setFont('helvetica', 'bold')
  doc.text('SEGUNDO:', marginLeft, y)
  doc.setFont('helvetica', 'normal')
  
  const clausula2 = ` El Empleador cancelará la prestación de servicios del trabajador, en la siguiente forma:\n\nSueldo Base Imponible: $${formatearNumero(datos.salarioBase)}. (${datos.salarioPalabras}).`
  const lineas2 = doc.splitTextToSize(clausula2, contentWidth - 30)
  doc.text(lineas2, marginLeft + 30, y)
  y += lineas2.length * 5 + 5
  
  // ===== CLÁUSULA TERCERA =====
  doc.setFont('helvetica', 'bold')
  doc.text('TERCERO:', marginLeft, y)
  doc.setFont('helvetica', 'normal')
  
  const clausula3 = ` En la remuneración señalada en la cláusula Segunda, se incluye lo siguiente:\n\nGratificación del 25% con tope de la gratificación legal vigente.\n\nValores que serán proporcionales a los días trabajados efectivamente.`
  const lineas3 = doc.splitTextToSize(clausula3, contentWidth - 30)
  doc.text(lineas3, marginLeft + 30, y)
  y += lineas3.length * 5 + 5
  
  // ===== CLÁUSULA CUARTA =====
  doc.setFont('helvetica', 'bold')
  doc.text('CUARTO:', marginLeft, y)
  doc.setFont('helvetica', 'normal')
  
  const clausula4 = ` La remuneración acordada será cancelada a más tardar al tercer día hábil del mes siguiente; antes de esa fecha, el trabajador recibirá un "Suple" o adelanto cuyo valor máximo no puede superar los $${formatearNumero(datos.supleQuincenal)} (${datos.suplePalabras}) en la quincena de cada mes, de acuerdo a calendario vigente.`
  const lineas4 = doc.splitTextToSize(clausula4, contentWidth - 30)
  doc.text(lineas4, marginLeft + 30, y)
  y += lineas4.length * 5 + 5
  
  // ===== CLÁUSULA QUINTA - JORNADA =====
  doc.setFont('helvetica', 'bold')
  doc.text('QUINTO:', marginLeft, y)
  doc.setFont('helvetica', 'normal')
  
  let clausula5 = ` La jornada de trabajo será la que se indica:`
  
  if (datos.jornada === 'estandar') {
    clausula5 += `\n\nMañana: De 08.00 hasta las 13:00 horas.\n\nTarde: De 14:00 hasta las 18:00 horas.\n\nEsta jornada se distribuirá de Lunes a Jueves y el día Viernes de 08:00 a 17:00 horas, la que será interrumpida por un descanso de una hora destinado a la colación del trabajador.`
  } else {
    clausula5 += `\n\n${datos.jornadaDetalle}`
  }
  
  clausula5 += `\n\nDeja constancia que el trabajador está afiliado a:\n\nAFP: ${datos.afp}\n\nSalud: ${datos.prevision}${datos.isapre ? ` - ${datos.isapre}` : ''}\n\nPara estos efectos se declara que la empresa para el cálculo de su sueldo líquido solo se considera el 7% legal y obligatorio de salud, todo plan contratado que supere dicho monto será de cargo exclusivo del trabajador.`
  
  const lineas5 = doc.splitTextToSize(clausula5, contentWidth - 30)
  doc.text(lineas5, marginLeft + 30, y)
  y += lineas5.length * 5 + 5
  
  // Verificar si necesitamos nueva página
  if (y > 240) {
    doc.addPage()
    y = 20
  }
  
  // ===== CLÁUSULA SEXTA =====
  doc.setFont('helvetica', 'bold')
  doc.text('SEXTO:', marginLeft, y)
  doc.setFont('helvetica', 'normal')
  
  const clausula6 = ` Las horas extraordinarias se pagarán con el cincuenta por ciento de recargo (50%), no se considerarán horas extras bajo ningún concepto el ingreso o firma de libro de asistencia antes del horario de entrada a la obra o si estas no están autorizadas expresamente por el encargado de la Obra.`
  const lineas6 = doc.splitTextToSize(clausula6, contentWidth - 30)
  doc.text(lineas6, marginLeft + 30, y)
  y += lineas6.length * 5 + 5
  
  // ===== CLÁUSULA SÉPTIMA - DURACIÓN =====
  doc.setFont('helvetica', 'bold')
  doc.text('SEPTIMO:', marginLeft, y)
  doc.setFont('helvetica', 'normal')
  
  let clausula7 = ' El presente contrato de trabajo '
  if (datos.tipoContrato === 'indefinido') {
    clausula7 += 'es de duración indefinida.'
  } else {
    clausula7 += `tendrá una duración hasta el día ${formatearFechaTexto(datos.fechaTermino!)}.`
  }
  
  const lineas7 = doc.splitTextToSize(clausula7, contentWidth - 30)
  doc.text(lineas7, marginLeft + 30, y)
  y += lineas7.length * 5 + 5
  
  // ===== CLÁUSULA OCTAVA =====
  doc.setFont('helvetica', 'bold')
  doc.text('OCTAVO:', marginLeft, y)
  doc.setFont('helvetica', 'normal')
  
  const clausula8 = ` El trabajador se compromete y obliga expresamente a cumplir las instrucciones que le sean impartidas por su jefe inmediato o por la gerencia de la empresa, en relación a su trabajo, y acatar en todas sus partes las normas del Reglamento Interno de Orden, Higiene y Seguridad, las que declara conocer y que forman parte integrante del presente contrato, reglamento del cual se le entrega un ejemplar. Tecnycon podrá alterar la naturaleza de los servicios, el sitio o recinto en que el trabajador deba presentarse y según consta en el Artículo 11 del Reglamento Interno, y de conformidad al Artículo 12 del Código del Trabajo.`
  const lineas8 = doc.splitTextToSize(clausula8, contentWidth - 30)
  doc.text(lineas8, marginLeft + 30, y)
  y += lineas8.length * 5 + 5
  
  // ===== CLÁUSULA NOVENA =====
  doc.setFont('helvetica', 'bold')
  doc.text('NOVENO:', marginLeft, y)
  doc.setFont('helvetica', 'normal')
  
  const clausula9 = ` Se deja constancia que el trabajador ingresó al servicio en esta Obra con fecha ${formatearFechaTexto(datos.fechaInicio)}.`
  const lineas9 = doc.splitTextToSize(clausula9, contentWidth - 30)
  doc.text(lineas9, marginLeft + 30, y)
  y += lineas9.length * 5 + 5
  
  // ===== CLÁUSULA DÉCIMA =====
  doc.setFont('helvetica', 'bold')
  doc.text('DECIMO:', marginLeft, y)
  doc.setFont('helvetica', 'normal')
  
  const clausula10 = ` El presente contrato de trabajo se firma en tres ejemplares quedando uno de ellos en poder del trabajador, uno en poder del encargado de la Obra y uno en poder del Departamento de Personal de la empresa.`
  const lineas10 = doc.splitTextToSize(clausula10, contentWidth - 30)
  doc.text(lineas10, marginLeft + 30, y)
  y += lineas10.length * 5 + 15
  
  // Verificar si necesitamos nueva página para firmas
  if (y > 220) {
    doc.addPage()
    y = 20
  }
  
  // ===== FIRMAS =====
  const espacioFirma = 60
  const lineaY = y + 30
  
  // Línea y texto EMPLEADOR
  doc.line(marginLeft, lineaY, marginLeft + espacioFirma, lineaY)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('EMPLEADOR', marginLeft + 15, lineaY + 5)
  doc.setFont('helvetica', 'normal')
  doc.text(`${datos.razonSocial}`, marginLeft + 5, lineaY + 10)
  doc.text(`RUT ${datos.rutEmpresa}`, marginLeft + 10, lineaY + 15)
  
  // Línea y texto TRABAJADOR
  const trabajadorX = pageWidth - marginRight - espacioFirma
  doc.line(trabajadorX, lineaY, trabajadorX + espacioFirma, lineaY)
  doc.setFont('helvetica', 'bold')
  doc.text('TRABAJADOR', trabajadorX + 10, lineaY + 5)
  doc.setFont('helvetica', 'normal')
  doc.text(`RUT ${datos.rutTrabajador}`, trabajadorX + 15, lineaY + 10)
  
  // ===== PIE DE PÁGINA - NÚMERO DE CONTRATO =====
  doc.setFontSize(8)
  doc.setTextColor(100)
  doc.text(`Contrato N° ${datos.numeroContrato}`, marginLeft, doc.internal.pageSize.getHeight() - 10)
  
  return doc.output('blob')
}

// =====================================================
// GENERADOR DE PDF - ANEXO DE EXTENSIÓN
// =====================================================

export async function generarPDFAnexoExtension(datos: DatosAnexoExtensionPDF): Promise<Blob> {
  const { jsPDF } = await import('jspdf')
  
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'letter'
  })
  
  const pageWidth = doc.internal.pageSize.getWidth()
  const marginLeft = 20
  const marginRight = 20
  const contentWidth = pageWidth - marginLeft - marginRight
  let y = 30
  
  // ===== TÍTULO CON SUBRAYADO =====
  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  const titulo = 'ANEXO A CONTRATO DE TRABAJO'
  const tituloWidth = doc.getTextWidth(titulo)
  const tituloX = (pageWidth - tituloWidth) / 2
  doc.text(titulo, tituloX, y)
  
  // Línea de subrayado
  doc.setLineWidth(0.5)
  doc.line(tituloX, y + 1, tituloX + tituloWidth, y + 1)
  y += 15
  
  // ===== CUERPO DEL ANEXO =====
  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  
  const cuerpo = `En ${datos.ciudadAnexo}, a ${formatearFechaTexto(datos.fechaAnexo)}, entre la empresa TECNYCON SERVICIOS SPA., RUT 77.181.404-2 y ${datos.nombreTrabajador}, R.U.T. ${datos.rutTrabajador}, se acuerda en modificar la cláusula SEPTIMA del contrato de trabajo, suscrito con fecha ${formatearFechaTexto(datos.fechaContratoPadre)}, en la obra denominada ${datos.nombreObra}, relación laboral que se mantiene al día de hoy, modificándose su fecha de terminación indicada en la cláusula Séptima:`
  
  const lineasCuerpo = doc.splitTextToSize(cuerpo, contentWidth)
  doc.text(lineasCuerpo, marginLeft, y)
  y += lineasCuerpo.length * 5 + 10
  
  // ===== CLÁUSULA MODIFICADA =====
  doc.setFont('helvetica', 'bold')
  const clausulaModificada = `"SEPTIMO: "............ Venciendo este el día ${formatearFechaTexto(datos.nuevaFechaTermino)}."`
  const lineasClausula = doc.splitTextToSize(clausulaModificada, contentWidth)
  doc.text(lineasClausula, marginLeft, y)
  y += lineasClausula.length * 5 + 10
  
  // ===== TEXTO FINAL =====
  doc.setFont('helvetica', 'normal')
  doc.text('Las demás cláusulas se mantienen sin modificación.', marginLeft, y)
  y += 20
  
  // ===== FIRMAS =====
  const espacioFirma = 60
  const lineaY = y + 30
  
  // Línea y texto EMPLEADOR
  doc.line(marginLeft, lineaY, marginLeft + espacioFirma, lineaY)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('EMPLEADOR', marginLeft + 15, lineaY + 5)
  doc.setFont('helvetica', 'normal')
  doc.text('TECNYCON SERVICIOS SPA', marginLeft + 2, lineaY + 10)
  doc.text('RUT 77.181.404-2', marginLeft + 10, lineaY + 15)
  
  // Línea y texto TRABAJADOR
  const trabajadorX = pageWidth - marginRight - espacioFirma
  doc.line(trabajadorX, lineaY, trabajadorX + espacioFirma, lineaY)
  doc.setFont('helvetica', 'bold')
  doc.text('TRABAJADOR', trabajadorX + 10, lineaY + 5)
  doc.setFont('helvetica', 'normal')
  doc.text(`RUT ${datos.rutTrabajador}`, trabajadorX + 15, lineaY + 10)
  
  // ===== PIE DE PÁGINA =====
  doc.setFontSize(8)
  doc.setTextColor(100)
  doc.text(`Anexo N° ${datos.numeroAnexo}`, marginLeft, doc.internal.pageSize.getHeight() - 10)
  doc.text(`Ref. Contrato N° ${datos.numeroContratoPadre}`, pageWidth / 2 - 20, doc.internal.pageSize.getHeight() - 10)
  
  return doc.output('blob')
}

// =====================================================
// FUNCIONES AUXILIARES
// =====================================================

/**
 * Formatea un número con separadores de miles
 */
function formatearNumero(numero: number): string {
  return numero.toLocaleString('es-CL')
}

/**
 * Formatea una fecha ISO a texto legible en español
 * Ejemplo: "2025-07-14" -> "14 de julio del 2025"
 */
function formatearFechaTexto(fechaISO: string): string {
  const [año, mes, dia] = fechaISO.split('-')
  
  const meses = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
  ]
  
  const mesTexto = meses[parseInt(mes) - 1]
  
  return `${parseInt(dia)} de ${mesTexto} del ${año}`
}

/**
 * Capitaliza la primera letra de un string
 */
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

// =====================================================
// FUNCIÓN PARA SUBIR PDF A SUPABASE STORAGE
// =====================================================

export async function subirPDFStorage(
  blob: Blob,
  nombreArchivo: string,
  carpeta: 'contratos' | 'anexos' | 'finiquitos'
): Promise<string> {
  const { supabase } = await import('@/lib/supabase')
  
  // Construir path: contratos/2025/CNT-14635405-001.pdf
  const año = new Date().getFullYear()
  const path = `${carpeta}/${año}/${nombreArchivo}.pdf`
  
  // Subir archivo
  const { error } = await supabase.storage
    .from('documentos')
    .upload(path, blob, {
      contentType: 'application/pdf',
      upsert: false
    })

  if (error) throw error
  
  // Obtener URL pública
  const { data: urlData } = supabase.storage
    .from('documentos')
    .getPublicUrl(path)
  
  return urlData.publicUrl
}

// =====================================================
// FUNCIÓN HELPER PARA GENERAR CONTRATO COMPLETO
// =====================================================

export async function generarYGuardarContrato(contrato: Contrato): Promise<string> {
  const { supabase } = await import('@/lib/supabase')
  
  // Obtener datos completos del trabajador y obra
  const { data: trabajador } = await supabase
    .from('trabajadores')
    .select('*')
    .eq('id', contrato.trabajador_id)
    .single()
  
  const { data: obra } = await supabase
    .from('obras')
    .select('*')
    .eq('id', contrato.obra_id)
    .single()
  
  if (!trabajador || !obra) {
    throw new Error('No se encontraron datos del trabajador u obra')
  }
  
  // Preparar datos para el PDF
  const datosPDF: DatosContratoPDF = {
    razonSocial: 'Tecnycon Servicios Spa',
    rutEmpresa: '77.181.404-2',
    representanteLegal: 'Pablo Álvarez Parker',
    rutRepresentante: '18.639.078-4',
    domicilioEmpresa: 'Badajoz 130 oficina 1204, comuna de Las Condes',
    
    nombreTrabajador: trabajador.nombre,
    rutTrabajador: trabajador.rut,
    nacionalidad: trabajador.nacionalidad === 'chilena' ? 'Chileno' : 'Extranjero',
    fechaNacimiento: trabajador.fecha_nacimiento || 'No especificada',
    estadoCivil: capitalize(trabajador.estado_civil || 'Soltero'),
    domicilioTrabajador: trabajador.direccion || 'No especificado',
    
    nombreObra: obra.nombre,
    ubicacionObra: obra.ubicacion,
    ciudadContrato: contrato.ciudad_contrato,
    
    cargo: contrato.cargo,
    salarioBase: contrato.salario_base,
    salarioPalabras: contrato.salario_palabras,
    supleQuincenal: contrato.suple_quincenal,
    suplePalabras: contrato.suple_palabras,
    
    afp: contrato.afp || 'No especificada',
    prevision: contrato.prevision || 'Fonasa',
    isapre: contrato.isapre,
    
    jornada: contrato.jornada_tipo,
    jornadaDetalle: contrato.jornada_detalle,
    
    fechaContrato: contrato.created_at.split('T')[0],
    fechaInicio: contrato.fecha_inicio,
    fechaTermino: contrato.fecha_termino,
    tipoContrato: contrato.tipo_contrato,
    
    numeroContrato: contrato.numero_contrato
  }
  
  // Generar PDF
  const pdfBlob = await generarPDFContrato(datosPDF)
  
  // Subir a Storage
  const pdfUrl = await subirPDFStorage(pdfBlob, contrato.numero_contrato, 'contratos')
  
  // Actualizar contrato con URL
  await supabase
    .from('contratos')
    .update({ pdf_url: pdfUrl })
    .eq('id', contrato.id)
  
  return pdfUrl
}

// =====================================================
// FUNCIÓN HELPER PARA GENERAR ANEXO DE EXTENSIÓN
// =====================================================

export async function generarYGuardarAnexoExtension(anexo: Contrato): Promise<string> {
  const { supabase } = await import('@/lib/supabase')
  
  if (!anexo.contrato_padre_id) {
    throw new Error('El anexo debe tener un contrato padre')
  }
  
  // Obtener contrato padre
  const { data: contratoPadre } = await supabase
    .from('contratos')
    .select('*')
    .eq('id', anexo.contrato_padre_id)
    .single()
  
  // Obtener datos del trabajador
  const { data: trabajador } = await supabase
    .from('trabajadores')
    .select('*')
    .eq('id', anexo.trabajador_id)
    .single()
  
  // Obtener datos de la obra
  const { data: obra } = await supabase
    .from('obras')
    .select('*')
    .eq('id', anexo.obra_id)
    .single()
  
  if (!contratoPadre || !trabajador || !obra) {
    throw new Error('No se encontraron datos necesarios')
  }
  
  // Preparar datos para el PDF
  const datosPDF: DatosAnexoExtensionPDF = {
    numeroContratoPadre: contratoPadre.numero_contrato,
    fechaContratoPadre: contratoPadre.fecha_inicio,
    nombreTrabajador: trabajador.nombre,
    rutTrabajador: trabajador.rut,
    nombreObra: obra.nombre,
    nuevaFechaTermino: anexo.fecha_termino!,
    ciudadAnexo: anexo.ciudad_contrato,
    fechaAnexo: anexo.created_at.split('T')[0],
    numeroAnexo: anexo.numero_contrato
  }
  
  // Generar PDF
  const pdfBlob = await generarPDFAnexoExtension(datosPDF)
  
  // Subir a Storage
  const pdfUrl = await subirPDFStorage(pdfBlob, anexo.numero_contrato, 'anexos')
  
  // Actualizar anexo con URL
  await supabase
    .from('contratos')
    .update({ pdf_url: pdfUrl })
    .eq('id', anexo.id)
  
  return pdfUrl
}