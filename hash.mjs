// accepts an array of bytes.
// returns a 32-bit integer.
function simpleHash(bytes) {
  let hash = 5381;
  for (let byte of bytes)
    hash = hash * 33 ^ byte;
  return hash >>> 0;
}

export { simpleHash };
