export default class Formatter {

    time = (t: number | undefined = 0) => {
        //if (t <= 0) return `00'00:00`;
        if (t <= 0) {
            return "00:00.000";
        }

        const ms = `${t % 1000}`.padStart(3, "0");
        const ss = `${Math.floor(t / 1000) % 60}`.padStart(2, "0");
        const mm = `${Math.floor(t / 1000 / 60)}`;

        //return `${mm}'${ss}.${ms}`;
        return `${mm}:${ss}.${ms}`;
    };

    timeOfDay = (t: number | undefined = 0) => {
        //if (t <= 0) return `00'00:00`;
        if (t <= 0) {
            return "00:00.000";
        }

        //const ms = `${t % 1000}`.padStart(3, "0");
        const ss = `${Math.floor(t / 1000) % 60}`.padStart(2, "0");
        const mm = `${Math.floor(t / (1000 * 60) % 60)}`.padStart(2, "0");
        const hh = `${Math.floor(t / (1000 * 60 * 60) % 24)}`;

        //return `${hh}:${mm}:${ss}.${ms}`;
        return `${hh}:${mm}:${ss}`;
    };

    int = (f: number | undefined) => {
        if (f === undefined) { return ""; }
        else { return ~~f; }
    };

    kmh = (f: number | undefined) => {
        if (f === undefined) { return "0"; }
        else { return ~~(f * 3.6); }
    };

    km = (f: number | undefined) => {
        if (f === undefined) { return "0"; }
        else { return (f / 1000).toFixed(2); }
    };

    revlimFlag = (flags: number) => {
        return ((flags & 1 << 5) === 1 << 5) ? "REVLIM_ON.svg" : "REVLIM_OFF.svg";
    };

    asmFlag = (flags: number) => {
        return ((flags & 1 << 10) === 1 << 10) ? "ASM_ON.svg" : "ASM_OFF.svg";
    };

    tcsFlag = (flags: number) => {
        return ((flags & 1 << 11) === 1 << 11) ? "TCS_ON.svg" : "TCS_OFF.svg";
    };

    rpmPercent = (f: number | undefined, max: number | undefined) => {
        if (f === undefined || max === undefined) { return 0; }
        else { return (100 / max * f); }
    };

    rpmPercentInt = (f: number | undefined, max: number | undefined) => {
        if (f === undefined || max === undefined) { return 0; }
        else { return ~~this.rpmPercent(f, max); }
    };

    percent = (f: number | undefined) => {
        if (f === undefined) { return "0"; }
        else { return 100 / 255 * f; }
    };

    gasPercent = (f: number | undefined, max: number | undefined) => {
        if (f === undefined || max === undefined) { return 0; }
        else { return ~~(100 / max * f) }
    };

    gear = (g: number | undefined) => {
        if (g === undefined || g === -1) { return "N"; }
        else if (g === 0) { return "R"; }
        else { return g; }
    };

    totalLapCount = (l: number | undefined) => {
        if (l === undefined) { return ""; }
        else if (l === 0) { return "\u221E"; } // Infinity
        else { return l; }
    };

    angleToDegress = (angle: number | undefined) => {
        if (angle === undefined) { return ""; }
        else { return "90"; }
    };

}
