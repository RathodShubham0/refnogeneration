 
import { useState } from 'react'
import { useDropzone } from 'react-dropzone'
import Tesseract from 'tesseract.js'
import * as pdfjsLib from 'pdfjs-dist'

  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.js`

function FileUpload() {
  const [ocrResult, setOcrResult] = useState('')
  const { getRootProps, getInputProps } = useDropzone({
    accept: 'image/*,application/pdf',
    onDrop: (acceptedFiles) => {
      const file = acceptedFiles[0]
      if (file.type === 'application/pdf') {
        const reader = new FileReader()
        reader.onload = async function () {
          const typedArray = new Uint8Array(this.result)
          const pdf = await pdfjsLib.getDocument(typedArray).promise
          let text = ''
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i)
            const viewport = page.getViewport({ scale: 1.5 })
            const canvas = document.createElement('canvas')
            const context = canvas.getContext('2d')
            canvas.height = viewport.height
            canvas.width = viewport.width
            await page.render({ canvasContext: context, viewport: viewport }).promise
            const dataUrl = canvas.toDataURL()
            const result = await Tesseract.recognize(dataUrl, 'eng')
            text += result.data.text
          }
          setOcrResult(text)
        }
        reader.readAsArrayBuffer(file)
      } else {
        Tesseract.recognize(
          file,
          'eng',
          {
            logger: (m) => console.log(m),
          }
        ).then(({ data: { text } }) => {
          setOcrResult(text)
        })
      }
    },
  })

  return (
    <div>
      <div {...getRootProps({ className: 'dropzone' })}>
        <input {...getInputProps()} />
        <p>Drag 'n' drop some files here, or click to select files</p>
      </div>
      <div>
        <h3>OCR Result:</h3>
        <p>{ocrResult}</p>
      </div>
    </div>
  )
}

export default FileUpload