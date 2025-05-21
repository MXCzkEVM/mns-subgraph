// Import types and APIs from graph-ts
import { BigInt, ByteArray, ethereum, log } from "@graphprotocol/graph-ts";
import { Account, Domain } from "./types/schema";

export function createEventID(event: ethereum.Event): string {
  return event.block.number
    .toString()
    .concat("-")
    .concat(event.logIndex.toString());
}

export const ETH_NODE =
  "c0ae3fe48f09fde4a60d1b2e3f2c5d1f8dd5922c3ab88ca76377c5fd10816e49";
export const ROOT_NODE =
  "0x0000000000000000000000000000000000000000000000000000000000000000";
export const EMPTY_ADDRESS = "0x0000000000000000000000000000000000000000";

// Helper for concatenating two byte arrays
export function concat(a: ByteArray, b: ByteArray): ByteArray {
  let out = new Uint8Array(a.length + b.length);
  for (let i = 0; i < a.length; i++) {
    out[i] = a[i];
  }
  for (let j = 0; j < b.length; j++) {
    out[a.length + j] = b[j];
  }
  // return out as ByteArray
  return changetype<ByteArray>(out);
}

export function byteArrayFromHex(s: string): ByteArray {
  if (s.length % 2 !== 0) {
    throw new TypeError("Hex string must have an even number of characters");
  }
  let out = new Uint8Array(s.length / 2);
  for (var i = 0; i < s.length; i += 2) {
    out[i / 2] = parseInt(s.substring(i, i + 2), 16) as u32;
  }
  return changetype<ByteArray>(out);
}

export function uint256ToByteArray(i: BigInt): ByteArray {
  let hex = i
    .toHex()
    .slice(2)
    .padStart(64, "0");
  return byteArrayFromHex(hex);
}

export function createOrLoadAccount(address: string): Account {
  let account = Account.load(address);
  if (account == null) {
    account = new Account(address);
    account.save();
  }

  return account;
}

export function createOrLoadDomain(node: string): Domain {
  let domain = Domain.load(node);
  if (domain == null) {
    domain = new Domain(node);
    domain.subdomainCount = 0;
    domain.save();
  }

  return domain;
}

export function checkValidLabel(name: string): boolean {
  for (let i = 0; i < name.length; i++) {
    let c = name.charCodeAt(i);
    if (c === 0) {
      log.warning("Invalid label '{}' contained null byte. Skipping.", [name]);
      return false;
    } else if (c === 46) {
      log.warning(
        "Invalid label '{}' contained separator char '.'. Skipping.",
        [name]
      );
      return false;
    }
  }

  return true;
}

// Custom implementation of nameByHash function
export function nameByHash(hash: string): string | null {
  // This is a placeholder implementation
  // In a real implementation, you would:
  // 1. Look up the hash in a mapping or database
  // 2. Return the corresponding name if found
  // 3. Return null if not found

  // For now, just log that this function was called and return null
  log.debug("nameByHash called with hash: {}", [hash]);

  // Here you would implement your custom logic to resolve names from hashes
  // This might involve maintaining a mapping of known hash-to-name pairs
  // or integrating with another system that can provide this mapping

  return null;
}
