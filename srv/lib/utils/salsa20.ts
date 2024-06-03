export class Salsa20 {
    private rounds: number;
    private sigma: number[];
    private param: number[];
    private block: number[];
    private byteCounter: number;

    constructor(key: Uint8Array, nonce: Uint8Array) {
        if (!(key instanceof Uint8Array) || key.length !== 32) {
            throw new Error("Key should be 32 byte array!");
        }

        if (!(nonce instanceof Uint8Array) || nonce.length !== 8) {
            throw new Error("Nonce should be 8 byte array!");
        }

        this.rounds = 20;
        this.sigma = [0x61707865, 0x3320646e, 0x79622d32, 0x6b206574];
        this.param = [
            // Constant
            this.sigma[0],
            // Key
            this.get32(key, 0),
            this.get32(key, 4),
            this.get32(key, 8),
            this.get32(key, 12),
            this.sigma[1],
            // Nonce
            this.get32(nonce, 0),
            this.get32(nonce, 4),
            // Counter
            0,
            0,
            // Constant
            this.sigma[2],
            // Key
            this.get32(key, 16),
            this.get32(key, 20),
            this.get32(key, 24),
            this.get32(key, 28),
            // Const
            this.sigma[3],
        ];

        // init block 64 bytes //
        this.block = [
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        ];

        // internal byte counter //
        this.byteCounter = 0;
    }

    private update(data: Uint8Array): Uint8Array {
        if (!(data instanceof Uint8Array) || data.length === 0) {
            throw new Error(
                "Data should be type of bytes (Uint8Array) and not empty!"
            );
        }

        var output = new Uint8Array(data.length);

        // core function, build block and xor with input data //
        for (var i = 0; i < data.length; i++) {
            if (this.byteCounter === 0 || this.byteCounter === 64) {
                this.salsa();
                this.counterIncrement();
                this.byteCounter = 0;
            }

            output[i] = data[i] ^ this.block[this.byteCounter++];
        }

        return output;
    }

    encrypt(data: Uint8Array): Uint8Array {
        return this.update(data);
    }

    decrypt(data: Uint8Array): Uint8Array {
        return this.update(data);
    }

    private counterIncrement() {
        // Max possible blocks is 2^64
        this.param[8] = (this.param[8] + 1) >>> 0;
        if (this.param[8] === 0) {
            this.param[9] = (this.param[9] + 1) >>> 0;
        }
    }

    private salsa() {
        var mix = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        var i = 0;
        var b = 0;

        // copy param array to mix //
        for (i = 0; i < 16; i++) {
            mix[i] = this.param[i];
        }

        // mix rounds //
        for (i = 0; i < this.rounds; i += 2) {
            mix[4] = (mix[4] ^ this.rotl(mix[0] + mix[12], 7)) >>> 0;
            mix[8] = (mix[8] ^ this.rotl(mix[4] + mix[0], 9)) >>> 0;
            mix[12] = (mix[12] ^ this.rotl(mix[8] + mix[4], 13)) >>> 0;
            mix[0] = (mix[0] ^ this.rotl(mix[12] + mix[8], 18)) >>> 0;
            mix[9] = (mix[9] ^ this.rotl(mix[5] + mix[1], 7)) >>> 0;
            mix[13] = (mix[13] ^ this.rotl(mix[9] + mix[5], 9)) >>> 0;
            mix[1] = (mix[1] ^ this.rotl(mix[13] + mix[9], 13)) >>> 0;
            mix[5] = (mix[5] ^ this.rotl(mix[1] + mix[13], 18)) >>> 0;
            mix[14] = (mix[14] ^ this.rotl(mix[10] + mix[6], 7)) >>> 0;
            mix[2] = (mix[2] ^ this.rotl(mix[14] + mix[10], 9)) >>> 0;
            mix[6] = (mix[6] ^ this.rotl(mix[2] + mix[14], 13)) >>> 0;
            mix[10] = (mix[10] ^ this.rotl(mix[6] + mix[2], 18)) >>> 0;
            mix[3] = (mix[3] ^ this.rotl(mix[15] + mix[11], 7)) >>> 0;
            mix[7] = (mix[7] ^ this.rotl(mix[3] + mix[15], 9)) >>> 0;
            mix[11] = (mix[11] ^ this.rotl(mix[7] + mix[3], 13)) >>> 0;
            mix[15] = (mix[15] ^ this.rotl(mix[11] + mix[7], 18)) >>> 0;
            mix[1] = (mix[1] ^ this.rotl(mix[0] + mix[3], 7)) >>> 0;
            mix[2] = (mix[2] ^ this.rotl(mix[1] + mix[0], 9)) >>> 0;
            mix[3] = (mix[3] ^ this.rotl(mix[2] + mix[1], 13)) >>> 0;
            mix[0] = (mix[0] ^ this.rotl(mix[3] + mix[2], 18)) >>> 0;
            mix[6] = (mix[6] ^ this.rotl(mix[5] + mix[4], 7)) >>> 0;
            mix[7] = (mix[7] ^ this.rotl(mix[6] + mix[5], 9)) >>> 0;
            mix[4] = (mix[4] ^ this.rotl(mix[7] + mix[6], 13)) >>> 0;
            mix[5] = (mix[5] ^ this.rotl(mix[4] + mix[7], 18)) >>> 0;
            mix[11] = (mix[11] ^ this.rotl(mix[10] + mix[9], 7)) >>> 0;
            mix[8] = (mix[8] ^ this.rotl(mix[11] + mix[10], 9)) >>> 0;
            mix[9] = (mix[9] ^ this.rotl(mix[8] + mix[11], 13)) >>> 0;
            mix[10] = (mix[10] ^ this.rotl(mix[9] + mix[8], 18)) >>> 0;
            mix[12] = (mix[12] ^ this.rotl(mix[15] + mix[14], 7)) >>> 0;
            mix[13] = (mix[13] ^ this.rotl(mix[12] + mix[15], 9)) >>> 0;
            mix[14] = (mix[14] ^ this.rotl(mix[13] + mix[12], 13)) >>> 0;
            mix[15] = (mix[15] ^ this.rotl(mix[14] + mix[13], 18)) >>> 0;
        }

        for (i = 0; i < 16; i++) {
            // add
            mix[i] += this.param[i];

            // store
            this.block[b++] = mix[i] & 0xff;
            this.block[b++] = (mix[i] >>> 8) & 0xff;
            this.block[b++] = (mix[i] >>> 16) & 0xff;
            this.block[b++] = (mix[i] >>> 24) & 0xff;
        }
    }

    private get32(data: Uint8Array, index: number): number {
        return (
            data[index++] ^
            (data[index++] << 8) ^
            (data[index++] << 16) ^
            (data[index] << 24)
        );
    }

    private rotl(data: number, shift: number): number {
        return (data << shift) | (data >>> (32 - shift));
    }
}
