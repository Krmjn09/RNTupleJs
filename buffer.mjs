/*

This file contains a micro-library for reading and writing binary files.
It exports 2 classes: ReadBuffer and WriteBuffer.

Both accept as an input an ArrayBuffer and provide, respectively, read* and put* methods
for reading and writing basic types and strings from/to that buffer.

Sample usage of ReadBuffer:

```
// get the ArrayBuffer from some source
let rawBuffer = getBufferFromSomeSource();

// construct the ReadBuffer
let readBuf = new ReadBuffer(rawBuffer);

// read values from it
let x1 = readBuf.readU32();
let x2 = readBuf.readU16();

// seek to a (absolute) position within the buffer
readBuf.seek(42);
// read a string from that position
let str = readBuf.readString();
```

The usage of WriteBuffer is equivalent.

In addition, both buffers have a `getByteView()` method that returns a view over a range of bytes:
```
// This is a Uint8Array
let subRangeOfBytes = readBuf.getByteView(begin, end);
```
*/

'use strict';

const LITTLE_ENDIAN = true;

class Buffer {
  // Constructs a Buffer object from ArrayBuffer `buf`.
  constructor(buf) {
    this.buf = buf;
    this.view = new DataView(this.buf);
    this.off = 0;
  }

  // Sets the internal cursor's position to `off`, making it so that the next
  // put* or get* call will write or read at that position.
  seek(off) {
    this.off = off;
  }

  // Returns the slice [start, end) of the underlying buffer as a byte view
  // (i.e. an array of UInt8). This does not modify the current buffer position.
  getByteView(start, end) {
    console.assert(end >= start);
    return new Uint8Array(this.buf, start, end - start);
  }
}

class WriteBuffer extends Buffer {
  constructor(capacity) {
    super(new ArrayBuffer(capacity));
    this.textEncoder = new TextEncoder();
    // How many bytes we've written out.
    this.size = 0;
  }
  
  putU8(x) {
    this.view.setUint8(this.off, x, LITTLE_ENDIAN);
    this.size += 1;
    this.off += 1;
  }
  
  putU16(x) {
    this.view.setUint16(this.off, x, LITTLE_ENDIAN);
    this.size += 2;
    this.off += 2;
  }

  putU32(x) {
    this.view.setUint32(this.off, x, LITTLE_ENDIAN);
    this.size += 4;
    this.off += 4;
  }

  putF32(x) {
    this.view.setFloat32(this.off, x, LITTLE_ENDIAN);
    this.size += 4;
    this.off += 4;
  }

  putString(str) {
    this.putU32(str.length);
    let enc = this.textEncoder.encode(str);
    for (let i = 0; i < str.length; ++i)    
      this.putU8(enc[i]);
  }
}

class ReadBuffer extends Buffer {
  readU8() {
    let x = this.view.getUint8(this.off, LITTLE_ENDIAN);
    this.off += 1;
    return x;
  }
  
  readU16() {
    let x = this.view.getUint16(this.off, LITTLE_ENDIAN);
    this.off += 2;
    return x;
  }

  readU32() {
    let x = this.view.getUint32(this.off, LITTLE_ENDIAN);
    this.off += 4;
    return x;
  }

  readF32() {
    let x = this.view.getFloat32(this.off, LITTLE_ENDIAN);
    this.off += 4;
    return x;
  }

  readString() {
    let len = this.readU32();
    let s = "";
    for (let i = 0; i < len; ++i)    
      s += String.fromCharCode(this.readU8());
    return s;
  }
}

export  {
  ReadBuffer, WriteBuffer
};
