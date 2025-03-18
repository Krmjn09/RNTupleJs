"use strict"

import { ReadBuffer } from "./buffer.mjs"
import { simpleHash } from "./hash.mjs"

// `buf` is an ArrayBuffer containing a binary DummyNTuple
function deserializeNTuple(buf) {
  const readBuf = new ReadBuffer(buf)

  // Parse HEADER section
  console.log("Starting HEADER parsing...")
  const magicBytes = readBuf.getByteView(0, 4) // Read first 4 bytes for Magic Number
  console.log("Magicc Bytes:", magicBytes)

  // Validate Magic Number
  if (String.fromCharCode(...magicBytes) !== "DMMY") {
    throw new Error("Invalid Magic Number: Expected 'DMMY'")
  }
  readBuf.seek(4) // Skip past the Magic Number

  // Read and validate Version
  const version = readBuf.readU16()
  console.log("Version:", version)
  if (version !== 10001) {
    throw new Error(`Unsupported Version: ${version}`)
  }

  // Extract Name and Description
  const name = readBuf.readString()
  const description = readBuf.readString()
  const footerOffset = readBuf.readU32()
  const headerChecksum = readBuf.readU32()

  console.log("Header Details:", { name, description, footerOffset })

  // Verify HEADER checksum
  const headerBytes = readBuf.getByteView(0, readBuf.off - 4) // Exclude checksum bytes
  const computedHeaderChecksum = simpleHash(headerBytes)
  console.log(
    "Computed Header Checksum:",
    computedHeaderChecksum,
    "Stored:",
    headerChecksum
  )

  if (computedHeaderChecksum !== headerChecksum) {
    throw new Error("Header Checksum Mismatch")
  }
  console.log("Header Checksum Verified Successfully!")

  // Parse FOOTER section
  console.log("Starting FOOTER parsing...")
  readBuf.seek(footerOffset) // Jump to the FOOTER offset
  const numPages = readBuf.readU32()
  console.log("Number of Pages:", numPages)

  const pageInfos = []
  for (let i = 0; i < numPages; i++) {
    const pageInfo = {
      pageOffset: readBuf.readU32(),
      pageSize: readBuf.readU32(),
      numElements: readBuf.readU32(),
    }
    pageInfos.push(pageInfo)
  }
  console.log("Page Infos:", pageInfos)

  const footerChecksum = readBuf.readU32()

  // Verify FOOTER checksum
  const footerBytes = readBuf.getByteView(footerOffset, readBuf.off - 4) // Exclude checksum bytes
  const computedFooterChecksum = simpleHash(footerBytes)
  console.log(
    "Computed Footer Checksum:",
    computedFooterChecksum,
    "Stored:",
    footerChecksum
  )

  if (computedFooterChecksum !== footerChecksum) {
    throw new Error("Footer Checksum Mismatch")
  }
  console.log("Footer Checksum Verified Successfully!")

  // Parse PAGES section
  console.log("Starting PAGE parsing...")
  const pages = pageInfos.map((info, pageIndex) => {
    console.log(`Parsing Page ${pageIndex + 1}:`, info)
    readBuf.seek(info.pageOffset)

    const elements = []
    for (let i = 0; i < info.numElements; i++) {
      elements.push(readBuf.readF32())
    }
    console.log(`Page ${pageIndex + 1} Elements:`, elements)

    const pageChecksum = readBuf.readU32()

    // Verify PAGE checksum
    const pageBytes = readBuf.getByteView(info.pageOffset, readBuf.off - 4) // Exclude checksum bytes
    const computedPageChecksum = simpleHash(pageBytes)
    console.log(
      `Page ${pageIndex + 1} Computed Checksum:`,
      computedPageChecksum,
      "Stored:",
      pageChecksum
    )

    if (computedPageChecksum !== pageChecksum) {
      throw new Error(`Page ${pageIndex + 1} Checksum Mismatch`)
    }
    console.log(`Page ${pageIndex + 1} Checksum Verified Successfully!`)

    return elements
  })

  console.log("All Pages Parsed Successfully!")
  return { name, description, pages }
}

export { deserializeNTuple }
