export const time = (t: number | undefined = 0) => {
    //if (t <= 0) return `00'00:00`;
    if (t <= 0) return `00:00.000`;

    const ms = `${t % 1000}`.padStart(3, "0");
    const ss = `${Math.floor(t / 1000) % 60}`.padStart(2, "0");
    const mm = `${Math.floor(t / 1000 / 60)}`;

    //return `${mm}'${ss}.${ms}`;
    return `${mm}:${ss}.${ms}`;
}

export const int = (f: number | undefined) => {
    if (f === undefined) return "";
    else return ~~f;
}

export const kmh = (f: number | undefined) => {
    if (f === undefined) return "0";
    else return ~~(f * 3.6);
}

export const rpmPercent = (f: number | undefined, max: number | undefined) => {
    if (f === undefined || max === undefined) return 0;
    else return (100 / max * f);
}

export const rpmPercentInt = (f: number | undefined, max: number | undefined) => {
    console.log(~~rpmPercent(f, max))
    if (f === undefined || max === undefined) return 0;
    else return ~~rpmPercent(f, max);
}

export const percent = (f: number | undefined) => {
    if (f === undefined) return "0";
    else return 100 / 255 * f;
}

export const gear = (g: number | undefined) => {
    if (g === undefined || g === -1) return "N";
    else if (g === 0) return "R";
    else return g;
}

export const totalLapCount = (l: number | undefined) => {
    if (l === undefined) return "";
    else if (l === 0) return "\u221E"; // Infinity
    else return l;
}
