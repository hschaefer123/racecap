import { TextEncoder } from 'util';
import { Salsa20 } from "./salsa20";

export const decrypt: (data: Buffer) => Buffer = (data: Buffer) => {
    const encoder: TextEncoder = new TextEncoder();
    const key: Uint8Array = encoder.encode(
        "Simulator Interface Packet GT7 ver 0.0"
    ); // 32 bytes key

    const nonce1: number = data.readInt32LE(64);
    const nonce2: number = nonce1 ^ 0xdeadbeaf;

    const nonce: Buffer = Buffer.alloc(8);
    nonce.writeInt32LE(nonce2);
    nonce.writeInt32LE(nonce1, 4);

    const message: Uint8Array = new Salsa20(key.slice(0, 32), nonce).decrypt(data);
    const newBuffer: Buffer = Buffer.alloc(message.byteLength);
    for (var i = 0; i < message.length; i++) newBuffer[i] = message[i];

    return newBuffer;
};