import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"

interface PDFData {
  quotation: any
  items: any[]
  settings: any
  user: any
  selectedTerms?: { title: string; text: string }[]
}

export const generateQuotationPDF = async ({ quotation, items, settings, user, selectedTerms }: PDFData) => {

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  })

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 15

  const drawPageBorder = () => {
    // Outer Blue Border
    doc.setDrawColor(0, 82, 156) // Deep Blue
    doc.setLineWidth(1.2)
    doc.rect(5, 5, pageWidth - 10, pageHeight - 10)
    
    // Inner Orange Border
    doc.setDrawColor(255, 102, 0) // Orange
    doc.setLineWidth(0.8)
    doc.rect(7, 7, pageWidth - 14, pageHeight - 14)

    // Footer contact box
    doc.setDrawColor(0, 0, 0)
    doc.setLineWidth(0.3)
    doc.rect(margin + 10, pageHeight - 15, pageWidth - (margin * 2) - 20, 8)
    doc.setFont("helvetica", "bold")
    doc.setFontSize(8)
    doc.setTextColor(0)
    doc.text(`Write us : ${settings?.company_email || "info@raiselabequip.com"}, Contact : ${settings?.company_phone || "+91 91777 70365"}`, pageWidth / 2, pageHeight - 9.5, { align: "center" })
  }

  const drawHeader = (logoBase64: string) => {
    if (logoBase64) {
      doc.addImage(logoBase64, "PNG", margin, 12, 60, 20)
    }

    doc.setFont("helvetica", "normal")
    doc.setFontSize(11)
    doc.setTextColor(0)
    const address = settings?.company_address || "C-2, Industrial Park, Moula-Ali,\nBehind Post Office, Industrial Park Road,\nHyderabad, Medchal Malkajgiri Dist.\nTelangana. PIN 500040. INDIA."
    const splitAddress = doc.splitTextToSize(address, 80)
    doc.text(splitAddress, pageWidth - margin, 15, { align: "right" })

    doc.setDrawColor(0, 82, 156)
    doc.setLineWidth(0.5)
    doc.line(margin, 35, pageWidth - margin, 35)
    doc.setDrawColor(255, 102, 0)
    doc.setLineWidth(0.3)
    doc.line(margin, 36, pageWidth - margin, 36)
  }

  // Pre-load all images
  let logoBase64 = ""
  if (settings?.company_logo) {
    try {
      logoBase64 = await getBase64ImageFromURL(settings.company_logo)
    } catch (e) {
      console.warn("Could not load logo", e)
    }
  }

  const itemImages: Record<string, string> = {}
  await Promise.all(
    items.map(async (item) => {
      if (item.image_url) {
        try {
          const b64 = await getBase64ImageFromURL(item.image_url)
          itemImages[item.id] = b64
        } catch (e) {
          console.warn(`Could not load item image`, e)
        }
      }
    })
  )

  // Start Drawing
  drawPageBorder()
  drawHeader(logoBase64)

  let currentY = 45

  items.forEach((item, index) => {
    if (index > 0) {
      doc.addPage()
      drawPageBorder()
      drawHeader(logoBase64)
      currentY = 45
    }

    // Technical & Commercial Offer Title
    doc.setFont("helvetica", "bold")
    doc.setFontSize(10)
    doc.text("Technical & Commercial Offer", pageWidth / 2, currentY, { align: "center" })
    currentY += 5
    doc.text(`For ${item.name}`, pageWidth / 2, currentY, { align: "center" })
    currentY += 10

    // To and Quote Meta
    doc.setFont("helvetica", "bold")
    doc.setFontSize(9)
    doc.text("To,", margin, currentY)
    doc.text("Quote No:", pageWidth - 70, currentY)
    doc.setFont("helvetica", "normal")
    doc.text(quotation.quotation_number, pageWidth - margin - 35, currentY, { align: "right" })
    currentY += 5

    doc.setFont("helvetica", "bold")
    doc.text(quotation.customer_name, margin, currentY)
    doc.text("Date:", pageWidth - 70, currentY)
    doc.setFont("helvetica", "normal")
    const dateStr = new Date(quotation.created_at || Date.now()).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-')
    doc.text(dateStr, pageWidth - margin - 35, currentY, { align: "right" })
    currentY += 5

    if (quotation.customer_address) {
      const splitCustAddr = doc.splitTextToSize(quotation.customer_address, 80)
      doc.text(splitCustAddr, margin, currentY)
      // Estimate height
      // currentY += (splitCustAddr.length * 4)
    }
    doc.setFont("helvetica", "bold")
    doc.text("Validity:", pageWidth - 70, currentY)
    doc.setFont("helvetica", "normal")
    const validityDate = new Date(quotation.created_at || Date.now())
    validityDate.setDate(validityDate.getDate() + 30)
    const validityStr = validityDate.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-')
    doc.text(validityStr, pageWidth - margin - 35, currentY, { align: "right" })
    currentY += 15

    // Description
    doc.setFont("helvetica", "bold")
    doc.text("Description:", margin, currentY)
    currentY += 6
    doc.setFont("helvetica", "normal")
    const splitDesc = doc.splitTextToSize(item.description || "", pageWidth - (margin * 2))
    doc.text(splitDesc, margin, currentY, { align: "justify" })
    currentY += (splitDesc.length * 5) + 5

    // FEATURES
    doc.setFont("helvetica", "bold")
    doc.text("FEATURE:", margin, currentY)
    currentY += 6
    
    // Feature bullets
    const features = [
      "Accurate method for determining the strength of antibiotic material",
      "Microprocessor based design",
      "Average of Vertical diameter & Horizontal diameter of inhibited zone",
      "Magnified image of inhibited zone is clearly visible on the prism Screen",
      "Calibration facility with certified coins",
      "Inbuilt thermal printer.",
      "Parallel printer port & RS 232 port for taking Test Printer Report",
      "Password protection for Real Time Clock",
      "Membrane Keypad for easy operation",
      "Complies to cGMP (MOC-stainless steel -304 & Stainless Steel-316)",
      "IQ/OQ Documentation"
    ]

    doc.setFont("helvetica", "normal")
    let featureY = currentY
    features.forEach(f => {
      doc.text(">", margin + 5, featureY)
      doc.text(f, margin + 10, featureY)
      featureY += 4.5
    })

    // Image on the right
    const itemB64 = itemImages[item.id]
    if (itemB64) {
      doc.addImage(itemB64, "PNG", pageWidth - margin - 65, currentY, 60, 45)
    }

    currentY = Math.max(featureY + 5, currentY + 50)

    // Specification
    doc.setFont("helvetica", "bold")
    doc.text("Specification:-", margin, currentY)
    currentY += 6
    doc.setFont("helvetica", "normal")
    const specs = item.specs || [
      { key: "Zone Diameter Range", value: ": 0.01 To 35.00 mm" },
      { key: "Accuracy", value: ": 0.05 mm" },
      { key: "Resolution", value: ": 0.01 mm" },
      { key: "Illumination Lamp", value: ": 12 VAc" },
      { key: "Power", value: ": 2.5Amp / 230V Ac/ 50Hz/1P (2.5 Amp/110v AC/60 Hz/ 1P)" }
    ]

    specs.forEach(s => {
      doc.text(">", margin + 5, currentY)
      doc.text(s.key, margin + 10, currentY)
      doc.text(s.value.startsWith(":") ? s.value : `: ${s.value}`, margin + 55, currentY)
      currentY += 4.5
    })

    currentY += 10

    // Commercial Offer
    doc.setFont("helvetica", "bold")
    doc.text("Commercial Offer:", margin, currentY)
    currentY += 4

    const tableRows = []
    
    // Main Product Row
    const unitPrice = item.price + (item.selectedAddons?.reduce((s: number, a: any) => s + a.price, 0) || 0)
    
    // Description Cell Content
    let descContent = `${item.name}\nStandard Accessories:`
    if (item.selectedAddons && item.selectedAddons.length > 0) {
      item.selectedAddons.forEach(addon => {
        descContent += `\n- ${addon.name}`
      })
    }

    tableRows.push([
      { content: "01", styles: { halign: "center" } },
      { content: descContent, styles: { halign: "left" } },
      { content: `${unitPrice.toLocaleString()}/-`, styles: { halign: "right", fontStyle: "bold", valign: "middle" } }
    ])

    autoTable(doc, {
      startY: currentY,
      head: [["S.No", "Description", "Price in INR"]],
      body: tableRows,
      theme: "grid",
      headStyles: {
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        lineColor: [0, 0, 0],
        lineWidth: 0.3,
        fontStyle: "bold",
        halign: "center"
      },
      bodyStyles: {
        textColor: [0, 0, 0],
        lineColor: [0, 0, 0],
        lineWidth: 0.3,
        fontSize: 9
      },
      columnStyles: {
        0: { cellWidth: 15 },
        1: { cellWidth: "auto" },
        2: { cellWidth: 40 }
      },
      margin: { left: margin, right: margin }
    })

    currentY = (doc as any).lastAutoTable.finalY + 20
  })

  // Second Page: Terms & Conditions
  doc.addPage()
  drawPageBorder()
  drawHeader(logoBase64)

  currentY = 45
  doc.setFont("helvetica", "bold")
  doc.setFontSize(11)
  doc.text("Terms And Conditions:", margin, currentY)
  currentY += 8

  doc.setFontSize(9)
  doc.text("HSN CODE", margin, currentY)
  currentY += 5
  doc.setFont("helvetica", "normal")
  doc.text("84799031", margin + 5, currentY)
  currentY += 8

  const termsToDisplay = selectedTerms && selectedTerms.length > 0 ? selectedTerms : [
    { title: "1. Taxes", text: "18% GST extra applicable" },
    { title: "2. Packaging & Forwarding", text: "Extra As Applicable" },
    { title: "3. Fright", text: "T0 Pay / Extra as applicable" },
    { title: "4. DELIVERY", text: "We deliver the order in 3-4 Weeks from the date of receipt of purchase order" },
    { title: "5. INSTALLATION", text: "Fees extra as applicable" },
    { title: "6. PAYMENT", text: "100% payment at the time of proforma invoice prior to dispatch." },
    { title: "7. WARRANTY", text: "One year warranty from the date of dispatch" },
    { title: "8. GOVERNING LAW", text: "These Terms and Conditions and any action related hereto shall be governed, controlled, interpreted and defined by and under the laws of the State of Telangana" },
    { title: "9. MODIFICATION", text: "Any modification of these Terms and Conditions shall be valid only if it is in writing and signed by the authorized representatives of both Supplier and Customer." }
  ]

  termsToDisplay.forEach(t => {
    doc.setFont("helvetica", "bold")
    doc.text(t.title, margin, currentY)
    currentY += 5
    doc.setFont("helvetica", "italic")
    const splitT = doc.splitTextToSize(t.text, pageWidth - (margin * 2) - 10)
    doc.text(splitT, margin + 5, currentY)
    currentY += (splitT.length * 4.5) + 2
  })

  currentY += 10
  doc.setFont("helvetica", "bold")
  doc.text(`From ${settings?.company_name || "Raise Lab Equipment"}`, pageWidth - margin, currentY, { align: "right" })
  currentY += 5
  doc.text(user?.full_name?.toUpperCase() || "RAHUL D", pageWidth - margin, currentY, { align: "right" })
  currentY += 5
  doc.text(user?.phone || "9177770516", pageWidth - margin, currentY, { align: "right" })

  const pdfName = `${quotation.quotation_number}_Quotation.pdf`
  doc.save(pdfName)
  
  return doc.output("blob")
}

const getBase64ImageFromURL = (url: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.setAttribute("crossOrigin", "anonymous")
    img.onload = () => {
      const canvas = document.createElement("canvas")
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext("2d")
      ctx?.drawImage(img, 0, 0)
      const dataURL = canvas.toDataURL("image/png")
      resolve(dataURL)
    }
    img.onerror = (error) => {
      reject(error)
    }
    img.src = url
  })
}
