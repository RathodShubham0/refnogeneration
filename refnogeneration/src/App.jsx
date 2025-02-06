import React, { useState } from "react";
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist";
import pdfWorker from "./pdfjs-dist/build/pdf.worker.mjs";
import Tesseract from "tesseract.js";

// Set the worker path for PDF.js using a local worker file
GlobalWorkerOptions.workerSrc = URL.createObjectURL(
  new Blob([`importScripts('${pdfWorker}');`], { type: 'application/javascript' })
);

export default function App() {
  const [pdfFile, setPdfFile] = useState(null);
  const [textData, setTextData] = useState("");
  const [loading, setLoading] = useState(false);

  const handleFileChange = (event) => {
    setPdfFile(event.target.files[0]);
  };

  const extractTextFromPdf = async () => {
    if (!pdfFile) {
      alert("Please select a PDF file first.");
      return;
    }
    setLoading(true);
    setTextData("");

    try {
      const pdfData = new Uint8Array(await pdfFile.arrayBuffer());
      const pdf = await getDocument(pdfData).promise;
      let combinedText = "";

      for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
        const page = await pdf.getPage(pageNumber);
        const viewport = page.getViewport({ scale: 1 });
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({ canvasContext: context, viewport }).promise;

        // Perform OCR on the canvas image using the default Tesseract worker
        const { data: { text } } = await Tesseract.recognize(
          canvas,
          'eng',
          {
            logger: (m) => console.log(m), // Log progress
          }
        );
        combinedText += `\nPage ${pageNumber}:\n${text}`;
      }

      setTextData(combinedText);
    } catch (error) {
      console.error("Error extracting text from PDF", error);
      alert("Error extracting text. Please try again.");
    }

    setLoading(false);
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">PDF Text Extractor</h1>

      <input type="file" accept="application/pdf" onChange={handleFileChange} />
      <button
        className="bg-blue-500 text-white p-2 rounded mt-2"
        onClick={extractTextFromPdf}
        disabled={loading}
      >
        {loading ? "Extracting..." : "Extract Text"}
      </button>

      {textData && (
        <div className="mt-4 p-4 bg-gray-100 rounded">
          <h2 className="text-xl font-semibold mb-2">Extracted Text:</h2>
          <pre>{textData}</pre>
        </div>
      )}
    </div>
  );
}
