// Import types and APIs from graph-ts
import { BigInt, ByteArray, Bytes, crypto, ens } from "@graphprotocol/graph-ts";

import {
  byteArrayFromHex,
  checkValidLabel,
  concat,
  createEventID, EMPTY_ADDRESS, ROOT_NODE,
  uint256ToByteArray,
} from "./utils";

// Import event types from the registry contract ABI
import {
  NameRegistered as NameRegisteredEvent,
  NameRenewed as NameRenewedEvent,
  Transfer as TransferEvent,
} from "./types/BaseRegistrar/BaseRegistrar";

// import { NameRegistered as ControllerNameRegisteredEventOld } from "./types/EthRegistrarControllerOld/EthRegistrarControllerOld";

import {
  NameRegistered as ControllerNameRegisteredEvent,
  NameRenewed as ControllerNameRenewedEvent,
} from "./types/EthRegistrarController/EthRegistrarController";

// Import entity types generated from the GraphQL schema
import {
  Account,
  Domain,
  NameRegistered,
  NameRenewed,
  NameTransferred,
  Registration, WrappedDomain
} from './types/schema';

var rootNode: ByteArray = byteArrayFromHex(
  "c0ae3fe48f09fde4a60d1b2e3f2c5d1f8dd5922c3ab88ca76377c5fd10816e49"
);

export function handleNameRegistered(event: NameRegisteredEvent): void {
  let account = new Account(event.params.owner.toHex());
  account.save();

  let label = uint256ToByteArray(event.params.id);
  let registration = new Registration(label.toHex());
  let domain = Domain.load(crypto.keccak256(concat(rootNode, label)).toHex());
  if(!domain) {
    return;
  }

  registration.domain = domain.id;
  registration.registrationDate = event.block.timestamp;
  registration.expiryDate = event.params.expires;
  registration.registrant = account.id;

  let labelName = domain.labelName
  if (labelName != null) {
    domain.labelName = labelName;
    domain.name = labelName! + ".mxc";
    registration.labelName = labelName;
  }
  domain.save();
  registration.save();

  let registrationEvent = new NameRegistered(createEventID(event));
  registrationEvent.registration = registration.id;
  registrationEvent.blockNumber = event.block.number.toI32();
  registrationEvent.transactionID = event.transaction.hash;
  registrationEvent.registrant = account.id;
  registrationEvent.expiryDate = event.params.expires;
  registrationEvent.save();
}

// export function handleNameRegisteredByControllerOld(
//   event: ControllerNameRegisteredEventOld
// ): void {
//   setNamePreimage(event.params.name, event.params.label, event.params.cost);
// }

export function handleNameRegisteredByController(
  event: ControllerNameRegisteredEvent
): void {
  setNamePreimage(
    event.params.name,
    event.params.label,
    event.params.baseCost.plus(event.params.premium)
  );
}

export function handleNameRenewedByController(
  event: ControllerNameRenewedEvent
): void {
  setNamePreimage(event.params.name, event.params.label, event.params.cost);
}

function setNamePreimage(name: string, label: Bytes, cost: BigInt): void {
  if (!checkValidLabel(name)) {
    return;
  }

  let domain = Domain.load(crypto.keccak256(concat(rootNode, label)).toHex())!;
  if (domain.labelName !== name) {
    domain.labelName = name;
    domain.name = name + ".mxc";
    domain.save();
  }

  let registration = Registration.load(label.toHex());
  if (registration == null) return;
  registration.labelName = name;
  registration.cost = cost;
  registration.save();
}

export function handleNameRenewed(event: NameRenewedEvent): void {
  let label = uint256ToByteArray(event.params.id);
  let registration = Registration.load(label.toHex())!;
  registration.expiryDate = event.params.expires;
  registration.save();

  let registrationEvent = new NameRenewed(createEventID(event));
  registrationEvent.registration = registration.id;
  registrationEvent.blockNumber = event.block.number.toI32();
  registrationEvent.transactionID = event.transaction.hash;
  registrationEvent.expiryDate = event.params.expires;
  registrationEvent.save();
}

export function handleNameTransferred(event: TransferEvent): void {
  let account = new Account(event.params.to.toHex());
  account.save();

  let label = uint256ToByteArray(event.params.tokenId);
  let registration = Registration.load(label.toHex());
  if (registration == null) return;

  registration.registrant = account.id;
  registration.save();

  let transferEvent = new NameTransferred(createEventID(event));
  transferEvent.registration = label.toHex();
  transferEvent.blockNumber = event.block.number.toI32();
  transferEvent.transactionID = event.transaction.hash;
  transferEvent.newOwner = account.id;
  transferEvent.save();
}
