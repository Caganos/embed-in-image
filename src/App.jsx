import { useRef, useState } from "react";
import { embedMessage, extractMessage } from "./lib/utils";

function App() {
  const [mode, setMode] = useState("embed");
  const [msg, setMsg] = useState("");
  const [outMsg, setOutMsg] = useState("");
  const fileRef = useRef();
  const canvasRef = useRef();

  // draw uploaded image onto hidden canvas
  const drawImageOnCanvas = (file) =>
    new Promise((res, rej) => {
      const img = new Image();
      img.onload = () => {
        const c = canvasRef.current;
        c.width = img.width;
        c.height = img.height;
        c.getContext("2d").drawImage(img, 0, 0);
        res();
      };
      img.onerror = rej;
      img.src = URL.createObjectURL(file);
    });

  const handleEmbed = async () => {
    const file = fileRef.current.files[0];
    if (!file) return alert("Upload an image first");
    await drawImageOnCanvas(file);

    const ctx = canvasRef.current.getContext("2d");
    const imgData = ctx.getImageData(
      0,
      0,
      canvasRef.current.width,
      canvasRef.current.height
    );
    try {
      const stegoData = embedMessage(imgData, msg);
      ctx.putImageData(stegoData, 0, 0);

      // trigger download
      const link = document.createElement("a");
      link.download = "stego.png";
      link.href = canvasRef.current.toDataURL("image/png");
      link.click();
    } catch (e) {
      alert(e.message);
    }
  };

  const handleExtract = async () => {
    const file = fileRef.current.files[0];
    if (!file) return alert("Upload your stego-image");
    await drawImageOnCanvas(file);

    const ctx = canvasRef.current.getContext("2d");
    const imgData = ctx.getImageData(
      0,
      0,
      canvasRef.current.width,
      canvasRef.current.height
    );
    const extracted = extractMessage(imgData);
    setOutMsg(extracted || "[no hidden text found]");
  };

  return (
    <div className="p-6 max-w-xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold">
        {mode === "embed" ? "Embed Message" : "Extract Message"}
      </h1>

      <div className="flex space-x-2">
        <button
          onClick={() => {
            setMode("embed");
            setOutMsg("");
          }}
          className={`px-3 py-1 rounded ${
            mode === "embed" ? "bg-blue-600 text-white" : "bg-gray-200"
          }`}
        >
          Embed
        </button>
        <button
          onClick={() => {
            setMode("extract");
            setOutMsg("");
          }}
          className={`px-3 py-1 rounded ${
            mode === "extract" ? "bg-blue-600 text-white" : "bg-gray-200"
          }`}
        >
          Extract
        </button>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/png, image/jpeg"
        className="block"
      />

      {mode === "embed" && (
        <>
          <textarea
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
            placeholder="Type secret message…"
            className="w-full p-2 border rounded"
          />
          <button
            onClick={handleEmbed}
            className="px-4 py-2 bg-green-600 text-white rounded"
          >
            Embed & Download
          </button>
        </>
      )}

      {mode === "extract" && (
        <>
          <button
            onClick={handleExtract}
            className="px-4 py-2 bg-yellow-500 text-white rounded"
          >
            Extract
          </button>
          {outMsg && (
            <div className="mt-2 p-2 bg-gray-100 rounded">
              <strong>Hidden:</strong> {outMsg}
            </div>
          )}
        </>
      )}

      {/* hidden canvas */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}

export default App;
