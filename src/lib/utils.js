export function textToBits(str) {
  return (
    str
      .split("")
      .map((c) => c.codePointAt(0).toString(2).padStart(8, "0"))
      .join("") + "00000000"
  );
}

export function bitsToText(bits) {
  let chars = [];
  for (let i = 0; i < bits.length; i += 8) {
    const byte = bits.slice(i, i + 8);
    if (byte === "00000000") break;
    chars.push(String.fromCharCode(parseInt(byte, 2)));
  }
  return chars.join("");
}

export function embedMessage(imageData, msg) {
  const bits = textToBits(msg);
  const data = imageData.data;
  if (bits.length > data.length / 4)
    throw new Error("Message too long for image");
  let bitIdx = 0;
  for (let i = 0; i < data.length && bitIdx < bits.length; i += 4) {
    data[i + 2] = (data[i + 2] & 0xfe) | Number(bits[bitIdx]);
    bitIdx++;
  }
  return imageData;
}

export function extractMessage(imageData) {
  const data = imageData.data;
  let bits = "";
  for (let i = 0; i < data.length; i += 4) {
    bits += (data[i + 2] & 1).toString();
  }
  return bitsToText(bits);
}
